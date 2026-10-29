/**
 * Robust clipboard utility that supports both HTTPS (navigator.clipboard)
 * and plain HTTP / IP address deployments (document.execCommand fallback).
 *
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} - True if copy succeeded
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Try modern Async Clipboard API if supported and in secure context
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] Modern API rejected, falling back to execCommand:', err.message);
    }
  }

  // 2. Cross-browser fallback for HTTP (e.g. AWS EC2 IP address), older browsers, and restricted frames
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('[Clipboard] Fallback execCommand failed:', err);
    return false;
  }
}
