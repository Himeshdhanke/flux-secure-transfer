const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const app = require('../src/app');
const config = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Document = require('../src/models/Document');
const Share = require('../src/models/Share');
const ViewSession = require('../src/models/ViewSession');

// Helper to generate a small PDF buffer
async function createTestPdf() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 200]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('CONFIDENTIAL ENGINEERING DOCUMENT', { x: 30, y: 150, size: 14, font });
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

test('End-to-End API Security & Access Control Flow', async (t) => {
  let senderToken = '';
  let senderSub = '';
  let receiverToken = '';
  let intruderToken = '';
  let documentId = '';
  let rawShareToken = '';
  let shareId = '';

  t.before(async () => {
    await connectDB();
    // Clean test collections
    await User.deleteMany({ email: { $regex: /@secureshare-test\.com$/ } });
    await Document.deleteMany({ ownerEmail: { $regex: /@secureshare-test\.com$/ } });
    await Share.deleteMany({});
    await ViewSession.deleteMany({});
  });

  t.after(async () => {
    await User.deleteMany({ email: { $regex: /@secureshare-test\.com$/ } });
    await Document.deleteMany({ ownerEmail: { $regex: /@secureshare-test\.com$/ } });
    await Share.deleteMany({});
    await ViewSession.deleteMany({});
    await disconnectDB();
  });

  await t.test('1. Authentication - Register Sender, Authorized Receiver, and Intruder', async () => {
    // Register Sender
    const senderRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@secureshare-test.com', password: 'Password123!', name: 'Alice Sender' })
      .expect(201);
    senderToken = senderRes.body.data.token;
    senderSub = senderRes.body.data.user.cognitoSub;
    assert.ok(senderToken);

    // Register Authorized Receiver
    const receiverRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bob@secureshare-test.com', password: 'Password123!', name: 'Bob Receiver' })
      .expect(201);
    receiverToken = receiverRes.body.data.token;
    assert.ok(receiverToken);

    // Register Intruder (Unauthorized third party)
    const intruderRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'eve@secureshare-test.com', password: 'Password123!', name: 'Eve Intruder' })
      .expect(201);
    intruderToken = intruderRes.body.data.token;
    assert.ok(intruderToken);
  });

  await t.test('2. Document Upload - Encrypted storage and metadata saved', async () => {
    const pdfBuf = await createTestPdf();

    const uploadRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${senderToken}`)
      .attach('document', pdfBuf, 'q3_financial_report.pdf')
      .expect(201);

    assert.equal(uploadRes.body.success, true);
    documentId = uploadRes.body.data.document.id;
    assert.ok(documentId);
    assert.equal(uploadRes.body.data.document.pageCount, 1);

    // Verify document in DB has encrypted attributes
    const savedDoc = await Document.findById(documentId);
    assert.ok(savedDoc.nonce, 'Nonce must be stored');
    assert.ok(savedDoc.authTag, 'AuthTag must be stored');
    assert.ok(savedDoc.wrappedDek, 'Wrapped DEK must be stored');
    assert.notEqual(savedDoc.storageKey, 'q3_financial_report.pdf', 'Storage key must be randomized');
  });

  await t.test('3. Document Isolation - Other users cannot view or delete sender document', async () => {
    // Intruder attempts to view sender's document metadata
    await request(app)
      .get(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .expect(404);

    // Intruder attempts to delete sender's document
    await request(app)
      .delete(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .expect(404);
  });

  await t.test('4. Share Creation - Generate recipient-restricted link for Bob', async () => {
    const shareRes = await request(app)
      .post(`/api/v1/documents/${documentId}/shares`)
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientEmail: 'bob@secureshare-test.com',
        expiryHours: 2,
        maxViewSessions: 3,
      })
      .expect(201);

    assert.equal(shareRes.body.success, true);
    rawShareToken = shareRes.body.data.rawToken;
    shareId = shareRes.body.data.share.id;

    assert.ok(rawShareToken, 'Raw token must be returned once');

    // Verify that the raw token is NOT in MongoDB
    const shareInDb = await Share.findById(shareId);
    assert.ok(shareInDb.tokenHash, 'tokenHash must exist');
    assert.notEqual(shareInDb.tokenHash, rawShareToken, 'Raw token must NEVER be saved in database');
  });

  await t.test('5. Access Control - Intruder (Eve) is rejected by recipient policy', async () => {
    // Eve tries to create a viewing session with Bob's share token
    const res = await request(app)
      .post(`/api/v1/public/shares/${rawShareToken}/sessions`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .expect(403);

    assert.equal(res.body.error.code, 'UNAUTHORIZED_RECIPIENT');
  });

  await t.test('6. Access Control - Authorized Receiver (Bob) creates viewing session', async () => {
    const sessionRes = await request(app)
      .post(`/api/v1/public/shares/${rawShareToken}/sessions`)
      .set('Authorization', `Bearer ${receiverToken}`)
      .expect(201);

    assert.equal(sessionRes.body.success, true);
    assert.ok(sessionRes.body.data.sessionId);
    assert.equal(sessionRes.body.data.pageCount, 1);
  });

  await t.test('7. Protected Viewing - Bob receives watermarked PNG, NOT raw PDF', async () => {
    const pageRes = await request(app)
      .get(`/api/v1/public/shares/${rawShareToken}/pages/1`)
      .set('Authorization', `Bearer ${receiverToken}`)
      .expect(200);

    // Check DRM Headers
    assert.equal(pageRes.headers['content-type'], 'image/png');
    assert.ok(pageRes.headers['cache-control'].includes('no-store'));
    assert.equal(pageRes.headers['referrer-policy'], 'no-referrer');

    // Verify body is a PNG image (starts with PNG signature: 89 50 4E 47)
    const buf = pageRes.body;
    assert.ok(buf.length > 100);
    assert.equal(buf[0], 0x89);
    assert.equal(buf[1], 0x50);
    assert.equal(buf[2], 0x4e);
    assert.equal(buf[3], 0x47);
  });

  await t.test('8. Instant Revocation - Sender revokes share, receiver is immediately blocked', async () => {
    // Alice revokes the share
    await request(app)
      .post(`/api/v1/shares/${shareId}/revoke`)
      .set('Authorization', `Bearer ${senderToken}`)
      .expect(200);

    // Bob tries to fetch page 1 again
    const deniedRes = await request(app)
      .get(`/api/v1/public/shares/${rawShareToken}/pages/1`)
      .set('Authorization', `Bearer ${receiverToken}`)
      .expect(403);

    assert.equal(deniedRes.body.error.code, 'REVOKED');
  });

  await t.test('9. Expiry Enforcement - Expired share is rejected on backend', async () => {
    // Create an already-expired share for Bob
    const { rawToken } = await (require('../src/services/shareService')).createShare({
      documentId,
      ownerSub: senderSub,
      recipientEmail: 'bob@secureshare-test.com',
      expiryHours: 1,
    });

    // Manually push expiresAt into the past
    const hash = require('../src/utils/cryptoUtils').hashToken(rawToken);
    await Share.updateOne({ tokenHash: hash }, { expiresAt: new Date(Date.now() - 3600000) });

    const expiredRes = await request(app)
      .get(`/api/v1/public/shares/${rawToken}/pages/1`)
      .set('Authorization', `Bearer ${receiverToken}`)
      .expect(403);

    assert.equal(expiredRes.body.error.code, 'EXPIRED');
  });
});
