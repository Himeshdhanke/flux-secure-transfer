const sharp = require('sharp');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Escape XML special characters to prevent SVG injection vulnerabilities.
 * @param {string} str
 * @returns {string} Sanitized string safe for XML/SVG inclusion
 */
function escapeXml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

class WatermarkService {
  /**
   * Apply dynamic, repeated diagonal watermarks to a rendered page image.
   * Embeds sender identity, receiver identity, session identifier, and server timestamp.
   * 
   * @param {object} params
   * @param {Buffer} params.imageBuffer - Raw PNG buffer of rendered PDF page
   * @param {number} params.width - Page width in pixels
   * @param {number} params.height - Page height in pixels
   * @param {string} params.senderIdentity - Verified sender email/sub
   * @param {string} params.recipientIdentity - Verified receiver email/sub
   * @param {string} [params.sessionId] - Active view session ID
   * @param {Date} [params.timestamp] - Server-generated UTC timestamp
   * @returns {Promise<Buffer>} Watermarked PNG image buffer
   */
  async applyWatermark({
    imageBuffer,
    width,
    height,
    senderIdentity,
    recipientIdentity,
    sessionId = '',
    timestamp = new Date(),
  }) {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      throw new AppError('Invalid image buffer provided to WatermarkService.', 500);
    }

    try {
      // Strictly escape all metadata
      const safeSender = escapeXml(senderIdentity || 'Unknown Sender');
      const safeRecipient = escapeXml(recipientIdentity || 'Authorized Receiver');
      const safeRecipientUpper = escapeXml(String(recipientIdentity || 'Authorized Receiver').toUpperCase());
      const safeSession = escapeXml(sessionId ? `SID: ${sessionId.substring(0, 10)}...` : '');
      const safeTime = escapeXml(new Date(timestamp).toUTCString());

      // Create a grid of repeating diagonal watermarks across the page
      const stepX = Math.max(350, Math.round(width / 2.5));
      const stepY = Math.max(260, Math.round(height / 3.5));

      const textBlocks = [];

      for (let y = -100; y <= height + 200; y += stepY) {
        for (let x = -100; x <= width + 200; x += stepX) {
          textBlocks.push(`
            <g transform="translate(${x}, ${y}) rotate(-32)">
              <text x="0" y="0" class="wm-title">SECURESHARE • RESTRICTED ACCESS</text>
              <text x="0" y="24" class="wm-body">ISSUER: ${safeSender}</text>
              <text x="0" y="44" class="wm-body">RECIPIENT: ${safeRecipient}</text>
              <text x="0" y="64" class="wm-sub">${safeTime}${safeSession ? ' • ' + safeSession : ''}</text>
              <text x="0" y="84" class="wm-warning">LEAK TRACKING ACTIVE • UNAUTHORIZED COPYING PROHIBITED</text>
            </g>
          `);
        }
      }

      // Border and corner security banner
      const topBanner = `
        <rect x="0" y="0" width="${width}" height="28" fill="rgba(15, 23, 42, 0.85)" />
        <text x="${width / 2}" y="19" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#38BDF8" letter-spacing="1.5">
          PROTECTED VIEWING SESSION • LICENSED TO: ${safeRecipientUpper}
        </text>
      `;

      const svgOverlay = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <style>
            .wm-title {
              font-family: 'Arial Black', Arial, sans-serif;
              font-size: 15px;
              font-weight: 900;
              fill: rgba(220, 38, 38, 0.42);
              letter-spacing: 2px;
              text-anchor: middle;
            }
            .wm-body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 13px;
              font-weight: 700;
              fill: rgba(30, 58, 138, 0.40);
              letter-spacing: 0.5px;
              text-anchor: middle;
            }
            .wm-sub {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              font-weight: 600;
              fill: rgba(51, 65, 85, 0.38);
              text-anchor: middle;
            }
            .wm-warning {
              font-family: Arial, sans-serif;
              font-size: 10px;
              font-weight: 800;
              fill: rgba(185, 28, 28, 0.45);
              letter-spacing: 1px;
              text-anchor: middle;
            }
          </style>
          ${textBlocks.join('\n')}
          ${topBanner}
        </svg>
      `);

      // Composite SVG watermark on top of the rendered PDF page image
      const watermarkedBuffer = await sharp(imageBuffer)
        .composite([{ input: svgOverlay, blend: 'over' }])
        .png({ quality: 85, compressionLevel: 6 })
        .toBuffer();

      return watermarkedBuffer;
    } catch (err) {
      logger.error('Failed to apply watermark to page image', { error: err.message });
      throw new AppError('Watermark application failed.', 500);
    }
  }
}

module.exports = new WatermarkService();
