const bcrypt = require('bcryptjs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const User = require('../models/User');
const Document = require('../models/Document');
const Share = require('../models/Share');
const encryptionService = require('../services/encryptionService');
const s3StorageService = require('../services/s3StorageService');
const shareService = require('../services/shareService');
const logger = require('./logger');

async function createSamplePdf() {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1: Executive Summary
  const page1 = doc.addPage([600, 420]);
  page1.drawText('PROJECT AEGIS — SECURE ARCHITECTURE OVERVIEW', {
    x: 50,
    y: 360,
    size: 16,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.25),
  });
  page1.drawText('Classification: STRICTLY CONFIDENTIAL // RESTRICTED DISTRIBUTION', {
    x: 50,
    y: 335,
    size: 10,
    font: fontBold,
    color: rgb(0.8, 0.1, 0.1),
  });
  page1.drawText('This document contains proprietary cryptographic specifications and engineering details', {
    x: 50,
    y: 300,
    size: 11,
    font: fontReg,
    color: rgb(0.2, 0.2, 0.2),
  });
  page1.drawText('for the SecureShare zero-trust encrypted document dissemination platform.', {
    x: 50,
    y: 280,
    size: 11,
    font: fontReg,
    color: rgb(0.2, 0.2, 0.2),
  });

  page1.drawText('1. Encryption Standard: AES-256-GCM (Authenticated Encryption with Associated Data)', {
    x: 50,
    y: 240,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page1.drawText('• Every document receives a fresh 32-byte DEK and random 12-byte nonce.', {
    x: 70,
    y: 220,
    size: 10,
    font: fontReg,
  });
  page1.drawText('• DEKs are wrapped using the server Master Key before metadata persistence.', {
    x: 70,
    y: 200,
    size: 10,
    font: fontReg,
  });
  page1.drawText('• Raw cryptographic keys are strictly ephemeral and never committed to disk.', {
    x: 70,
    y: 180,
    size: 10,
    font: fontReg,
  });

  // Page 2: Access & Watermarking
  const page2 = doc.addPage([600, 420]);
  page2.drawText('DYNAMIC WATERMARKING & THREAT ATTRIBUTION POLICY', {
    x: 50,
    y: 360,
    size: 16,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.25),
  });
  page2.drawText('2. Leak Deterrence & Attribution', {
    x: 50,
    y: 320,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page2.drawText('• The original unwatermarked PDF file is NEVER transmitted to the client browser.', {
    x: 70,
    y: 290,
    size: 10,
    font: fontReg,
  });
  page2.drawText('• Pages are decrypted strictly in server memory, rasterized to high-DPI images,', {
    x: 70,
    y: 270,
    size: 10,
    font: fontReg,
  });
  page2.drawText('  and composited with dynamic diagonal watermarks displaying verified identities.', {
    x: 70,
    y: 250,
    size: 10,
    font: fontReg,
  });
  page2.drawText('• Watermarks contain verified sender email, receiver email, UTC timestamp, and session ID.', {
    x: 70,
    y: 230,
    size: 10,
    font: fontReg,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

async function seedDemoData() {
  try {
    const existingAlice = await User.findOne({ email: 'alice@secureshare.corp' });
    if (existingAlice) {
      return; // Already seeded
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 1. Create Alice (Sender)
    const alice = await User.create({
      cognitoSub: 'usr_alice_sender_001',
      email: 'alice@secureshare.corp',
      name: 'Alice Sender (Security Lead)',
      emailVerified: true,
      enabled: true,
      passwordHash,
      authProvider: 'local',
    });

    // 2. Create Bob (Authorized Receiver)
    const bob = await User.create({
      cognitoSub: 'usr_bob_receiver_002',
      email: 'bob@secureshare.corp',
      name: 'Bob Receiver (Auditor)',
      emailVerified: true,
      enabled: true,
      passwordHash,
      authProvider: 'local',
    });

    // 3. Create Eve (Unauthorized Intruder)
    const eve = await User.create({
      cognitoSub: 'usr_eve_intruder_003',
      email: 'eve@secureshare.corp',
      name: 'Eve Intruder (Third Party)',
      emailVerified: true,
      enabled: true,
      passwordHash,
      authProvider: 'local',
    });

    // 4. Create Sample PDF and Encrypt
    const pdfBuf = await createSamplePdf();
    const encResult = await encryptionService.encryptDocument(pdfBuf);
    const storageKey = 'doc_sample_project_aegis.enc';

    await s3StorageService.putEncryptedObject(storageKey, encResult.ciphertext);

    const doc = await Document.create({
      ownerSub: alice.cognitoSub,
      ownerEmail: alice.email,
      originalFilename: 'Project_Aegis_Security_Architecture.pdf',
      storageKey,
      mimeType: 'application/pdf',
      sizeBytes: pdfBuf.length,
      pageCount: 2,
      nonce: encResult.nonce,
      authTag: encResult.authTag,
      wrappedDek: encResult.wrappedDek,
      keyVersion: 1,
    });

    // 5. Create Active Share for Bob
    const { share, rawToken } = await shareService.createShare({
      documentId: doc._id,
      ownerSub: alice.cognitoSub,
      recipientEmail: bob.email,
      expiryHours: 72,
      maxViewSessions: 10,
    });

    console.log('[SEED] Demo accounts and sample encrypted document seeded successfully:');
    console.log('       Sender:   alice@secureshare.corp / Password123!');
    console.log('       Receiver: bob@secureshare.corp   / Password123!');
    console.log('       Intruder: eve@secureshare.corp   / Password123!');
    console.log(`       Active Bob Share URL: /view/${rawToken}`);
  } catch (err) {
    console.warn('[SEED WARNING] Failed to seed demo data:', err.message);
  }
}

module.exports = seedDemoData;
