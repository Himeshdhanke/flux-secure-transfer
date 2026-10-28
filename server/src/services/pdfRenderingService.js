const path = require('path');
const canvasPkg = require('@napi-rs/canvas');
const { createCanvas, Path2D, ImageData, DOMMatrix } = canvasPkg;
const { PDFDocument } = require('pdf-lib');
const { ValidationError, AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Polyfill globals needed by PDF.js in Node.js environment
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = Path2D;
}
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = ImageData;
}
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = DOMMatrix;
}

// Path to PDF.js standard fonts
const standardFontsDir = path.resolve(__dirname, '../../node_modules/pdfjs-dist/standard_fonts/');
const standardFontsUrl = standardFontsDir.replace(/\\/g, '/') + '/';

// Dynamically load pdfjs-dist legacy build for Node.js compatibility
let pdfjsLib = null;
async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}

class PdfRenderingService {
  /**
   * Validate PDF structure and extract page count and basic metadata.
   * Uses pdf-lib for strict structural verification.
   * 
   * @param {Buffer} pdfBuffer - Plaintext PDF buffer in memory
   * @returns {Promise<{ pageCount: number, title?: string, author?: string }>}
   */
  async inspectPdf(pdfBuffer) {
    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new ValidationError('Uploaded file is empty or invalid.');
    }

    // Verify PDF Magic Bytes (%PDF- is 0x25 0x50 0x44 0x46)
    if (pdfBuffer.length < 5 || pdfBuffer.subarray(0, 4).toString('ascii') !== '%PDF') {
      throw new ValidationError('File header does not match standard PDF specification (%PDF).');
    }

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: false });
      const pageCount = pdfDoc.getPageCount();

      if (pageCount < 1) {
        throw new ValidationError('PDF contains no readable pages.');
      }

      return {
        pageCount,
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
      };
    } catch (err) {
      logger.warn('Failed to parse PDF document', { error: err.message });
      throw new ValidationError(`Malformed, password-protected, or corrupted PDF document: ${err.message}`);
    }
  }

  /**
   * Render a specific page of a PDF document to an image buffer in memory.
   * The original PDF is parsed in memory and never written to permanent disk.
   * 
   * @param {Buffer} pdfBuffer - Decrypted plaintext PDF bytes in backend memory
   * @param {number} pageNumber - 1-indexed page number
   * @param {number} scale - Render DPI scaling factor (default 1.5 for crisp display)
   * @returns {Promise<{ imageBuffer: Buffer, width: number, height: number, totalPages: number }>}
   */
  async renderPage(pdfBuffer, pageNumber, scale = 1.5) {
    const pdfjs = await getPdfJs();

    let doc = null;
    try {
      const uint8 = new Uint8Array(pdfBuffer);
      const loadingTask = pdfjs.getDocument({
        data: uint8,
        standardFontDataUrl: standardFontsUrl,
      });

      doc = await loadingTask.promise;
      const totalPages = doc.numPages;

      if (pageNumber < 1 || pageNumber > totalPages) {
        throw new ValidationError(`Invalid page number ${pageNumber}. Document has ${totalPages} pages.`);
      }

      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);

      let canvas, ctx;
      if (doc.canvasFactory) {
        const cc = doc.canvasFactory.create(width, height);
        canvas = cc.canvas;
        ctx = cc.context;
      } else {
        canvas = createCanvas(width, height);
        ctx = canvas.getContext('2d');
      }

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const imageBuffer = typeof canvas.toBuffer === 'function'
        ? canvas.toBuffer('image/png')
        : await canvas.encode('png');

      return {
        imageBuffer,
        width,
        height,
        totalPages,
      };
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      logger.error('Failed to render PDF page to image', { pageNumber, error: err.message });
      throw new AppError(`PDF page rendering failed: ${err.message}`, 500);
    } finally {
      if (doc) {
        try {
          await doc.destroy();
        } catch (_) {}
      }
    }
  }
}

module.exports = new PdfRenderingService();
