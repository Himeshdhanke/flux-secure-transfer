const test = require('node:test');
const assert = require('node:assert/strict');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const sharp = require('sharp');
const pdfRenderingService = require('../src/services/pdfRenderingService');
const watermarkService = require('../src/services/watermarkService');
const { ValidationError } = require('../src/utils/errors');

// Helper to generate a valid mock PDF in memory
async function createTestPdf(pageCount = 2) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([500, 300]);
    page.drawText(`Confidential Page ${i}`, { x: 50, y: 250, size: 20, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`SecureShare test document page content.`, { x: 50, y: 200, size: 12, font });
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

test('PDF Inspection & Parsing', async (t) => {
  await t.test('Successfully inspects valid multi-page PDF', async () => {
    const pdfBuf = await createTestPdf(3);
    const meta = await pdfRenderingService.inspectPdf(pdfBuf);

    assert.equal(meta.pageCount, 3, 'Must detect 3 pages');
  });

  await t.test('Rejects non-PDF files without standard PDF header', async () => {
    const garbageBuf = Buffer.from('This is a text file pretending to be PDF.');

    await assert.rejects(
      async () => await pdfRenderingService.inspectPdf(garbageBuf),
      ValidationError,
      'Must reject invalid PDF header'
    );
  });
});

test('Page Rendering & Dynamic Watermarking', async (t) => {
  const pdfBuf = await createTestPdf(2);

  await t.test('Renders page 1 to an image buffer', async () => {
    const rendered = await pdfRenderingService.renderPage(pdfBuf, 1);

    assert.ok(rendered.imageBuffer, 'Must return image buffer');
    assert.ok(rendered.width > 0, 'Must have positive width');
    assert.ok(rendered.height > 0, 'Must have positive height');
    assert.equal(rendered.totalPages, 2, 'Total pages must be 2');
  });

  await t.test('Rejects page number out of range', async () => {
    await assert.rejects(
      async () => await pdfRenderingService.renderPage(pdfBuf, 99),
      ValidationError,
      'Must reject page 99 for a 2-page document'
    );
  });

  await t.test('Applies watermarks with sender and recipient identities into image buffer', async () => {
    const rendered = await pdfRenderingService.renderPage(pdfBuf, 1);
    const watermarked = await watermarkService.applyWatermark({
      imageBuffer: rendered.imageBuffer,
      width: rendered.width,
      height: rendered.height,
      senderIdentity: 'alice@corp.security',
      recipientIdentity: 'bob@partner.security',
      sessionId: 'sess_123456789',
      timestamp: new Date(),
    });

    assert.ok(Buffer.isBuffer(watermarked), 'Must return a Buffer');
    assert.ok(watermarked.length > 0, 'Buffer must not be empty');

    // Verify it is a valid PNG with Sharp
    const metadata = await sharp(watermarked).metadata();
    assert.equal(metadata.format, 'png', 'Resulting watermarked image must be PNG');
    assert.equal(metadata.width, rendered.width);
    assert.equal(metadata.height, rendered.height);
  });

  await t.test('User-provided identities cannot inject SVG/XML tags', async () => {
    const rendered = await pdfRenderingService.renderPage(pdfBuf, 1);

    // Malicious SVG injection payload in recipient email
    const maliciousRecipient = 'attacker<script>alert(1)</script>" onclick="evil()';

    // Must not throw an XML parsing or rendering error, it should be cleanly escaped
    const watermarked = await watermarkService.applyWatermark({
      imageBuffer: rendered.imageBuffer,
      width: rendered.width,
      height: rendered.height,
      senderIdentity: 'legit-sender@corp.com',
      recipientIdentity: maliciousRecipient,
      sessionId: 'sess_injection_test',
    });

    assert.ok(Buffer.isBuffer(watermarked));
  });
});
