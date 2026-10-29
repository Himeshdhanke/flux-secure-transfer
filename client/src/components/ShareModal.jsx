import React, { useState, useRef } from 'react';
import { shareService } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';
import { X, Share2, Copy, Check, Clock, Users, ShieldAlert, ExternalLink, AlertCircle, Lock } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, document, onShareCreated }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expiryHours, setExpiryHours] = useState('24');
  const [maxViewSessions, setMaxViewSessions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdShare, setCreatedShare] = useState(null);
  const [copied, setCopied] = useState(false);
  const urlInputRef = useRef(null);

  if (!isOpen || !document) return null;

  const handleCreateShare = async (e) => {
    e.preventDefault();
    setError('');

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      setError('Please provide a valid recipient email address.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        recipientEmail: recipientEmail.trim(),
        expiryHours: parseInt(expiryHours, 10) || 24,
        maxViewSessions: maxViewSessions ? parseInt(maxViewSessions, 10) : null,
      };

      const res = await shareService.create(document._id || document.id, payload);
      setCreatedShare(res.data);
      if (onShareCreated) {
        onShareCreated(res.data.share);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create restricted share link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdShare?.shareUrl) return;
    const ok = await copyToClipboard(createdShare.shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      urlInputRef.current?.select();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const resetAndClose = () => {
    setRecipientEmail('');
    setExpiryHours('24');
    setMaxViewSessions('');
    setError('');
    setCreatedShare(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#171e19]/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-[#171e19]/10 p-5 sm:p-8 shadow-2xl relative brutalist-transition">
        
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#171e19]/40 hover:text-[#171e19] hover:bg-[#171e19]/5 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#ffe17c] text-[#171e19] flex items-center justify-center font-bold">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-anton text-2xl uppercase tracking-normal text-[#171e19]">
              CREATE RESTRICTED SHARE
            </h2>
            <p className="font-satoshi text-xs text-[#171e19]/60 font-medium">
              Zero-Trust recipient verification with server-rasterized watermarks
            </p>
          </div>
        </div>

        {/* Target Document Box */}
        <div className="mb-5 p-3.5 rounded-xl bg-[#fafafa] border border-[#171e19]/10 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#171e19] text-[#ffe17c] flex items-center justify-center text-xs font-bold shrink-0">
            PDF
          </div>
          <div className="truncate">
            <span className="font-satoshi text-xs font-bold text-[#171e19] block truncate">
              {document.originalFilename}
            </span>
            <span className="font-mono text-[10px] text-[#171e19]/50">
              {document.pageCount} pages • Sealed with AES-256-GCM
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-satoshi font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Created Share Result */}
        {createdShare ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#ffe17c]/20 border border-[#ffe17c] text-center">
              <span className="font-anton text-lg uppercase text-[#171e19] block">
                SHARE LINK GENERATED!
              </span>
              <p className="font-satoshi text-xs text-[#171e19]/80 mt-1">
                Restricted to <strong className="font-mono">{createdShare.share?.recipientEmail}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-anton uppercase tracking-wider text-[#171e19] mb-1.5">
                SECURE VIEWING URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={urlInputRef}
                  type="text"
                  readOnly
                  value={createdShare.shareUrl}
                  onClick={(e) => e.target.select()}
                  className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 px-3.5 py-2.5 font-mono text-xs text-[#171e19] focus:outline-none cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider bg-[#171e19] text-white hover:bg-black transition-all shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-[#ffe17c]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#171e19]/10 text-xs font-satoshi text-[#171e19]/70 space-y-1">
              <p>• Recipient email must be authenticated to open pages.</p>
              <p>• Expiring on: <strong className="text-[#171e19] font-mono">{new Date(createdShare.share?.expiresAt).toLocaleString()}</strong></p>
              <p>• Dynamic diagonal watermark burns recipient email on every page.</p>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="w-full py-3 rounded-xl font-anton text-sm uppercase tracking-wider bg-[#ffe17c] text-[#171e19] shadow-md hover:brightness-105 transition-all cursor-pointer"
            >
              Done & Return to Library
            </button>
          </div>
        ) : (
          /* Form to Create Share */
          <form onSubmit={handleCreateShare} className="space-y-4 font-satoshi">
            <div>
              <label className="block text-xs font-anton uppercase tracking-wider text-[#171e19] mb-1.5">
                Recipient Email (Access Lock)
              </label>
              <input
                type="email"
                required
                placeholder="investor@partner.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 px-4 py-3 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-medium"
              />
              <p className="mt-1 text-[11px] text-[#171e19]/50">
                Only this exact authenticated recipient can decrypt and stream page images.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-anton uppercase tracking-wider text-[#171e19] mb-1.5">
                  Link Lifespan
                </label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 px-3 py-3 text-xs text-[#171e19] focus:border-[#171e19] focus:outline-none font-medium"
                >
                  <option value="1">1 Hour</option>
                  <option value="6">6 Hours</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="72">72 Hours (3 Days)</option>
                  <option value="168">7 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-anton uppercase tracking-wider text-[#171e19] mb-1.5">
                  Max View Sessions
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Unlimited"
                  value={maxViewSessions}
                  onChange={(e) => setMaxViewSessions(e.target.value)}
                  className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 px-3 py-3 text-xs text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none font-medium"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-anton uppercase tracking-wider text-[#171e19]/70 hover:text-[#171e19] hover:bg-[#171e19]/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-anton text-sm uppercase tracking-wider bg-[#ffe17c] text-[#171e19] shadow-md hover:brightness-105 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
              >
                {loading ? 'Issuing Token...' : 'Generate Protected Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
