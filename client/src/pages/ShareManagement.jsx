import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shareService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { copyToClipboard } from '../utils/clipboard';
import {
  Share2,
  Lock,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

export default function ShareManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'outbound'
  const [shares, setShares] = useState([]);
  const [receivedShares, setReceivedShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const loadData = async () => {
    try {
      const [outboundRes, receivedRes] = await Promise.all([
        shareService.list(),
        shareService.listReceived(),
      ]);
      const outbound = outboundRes.data.shares || [];
      const inbound = receivedRes.data.shares || [];
      setShares(outbound);
      setReceivedShares(inbound);

      // If user has outbound shares and no inbound, default to outbound; otherwise default to received
      if (outbound.length > 0 && inbound.length === 0) {
        setActiveTab('outbound');
      } else if (inbound.length > 0 && outbound.length === 0) {
        setActiveTab('received');
      }
    } catch (err) {
      console.error('Failed to load shares data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShares([]);
    setReceivedShares([]);
    setLoading(true);
    loadData();
  }, [user?.email, user?.cognitoSub]);

  const handleCopyLink = async (shareId) => {
    const shareUrl = `${window.location.origin}/view/${shareId}`;
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleRevoke = async (id, recipient) => {
    if (!window.confirm(`Are you sure you want to immediately revoke access for ${recipient}? The receiver will no longer be able to load or view pages.`)) {
      return;
    }

    try {
      await shareService.revoke(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to revoke share link.');
    }
  };

  const filteredOutboundShares = shares.filter((s) =>
    (s.recipientEmail || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.documentId?.originalFilename || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredReceivedShares = receivedShares.filter((s) =>
    (s.ownerEmail || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.documentId?.originalFilename || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#171e19]/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe17c]"></span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#171e19]/60">
              ZERO-TRUST RECIPIENT AUTHORIZATION
            </span>
          </div>
          <h1 className="font-anton text-4xl sm:text-5xl uppercase tracking-normal text-[#171e19] flex items-center gap-3">
            SHARE MANAGEMENT
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#171e19] text-[#ffe17c] tracking-normal">
              {activeTab === 'received' ? `${receivedShares.length} INBOUND` : `${shares.length} OUTBOUND`}
            </span>
          </h1>
          <p className="font-satoshi text-xs sm:text-sm text-[#171e19]/70 mt-1 font-medium">
            Real-time recipient authorization policy, instant link copying, and sub-200ms kill switches.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#171e19]/5 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'received'
                ? 'bg-[#171e19] text-[#ffe17c] shadow-md font-bold'
                : 'text-[#171e19]/70 hover:text-[#171e19] hover:bg-black/5'
            }`}
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span>Received</span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'received' ? 'bg-[#ffe17c] text-[#171e19]' : 'bg-[#171e19]/10 text-[#171e19]'
            }`}>
              {receivedShares.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('outbound')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'outbound'
                ? 'bg-[#171e19] text-[#ffe17c] shadow-md font-bold'
                : 'text-[#171e19]/70 hover:text-[#171e19] hover:bg-black/5'
            }`}
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span>Outbound Shares</span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'outbound' ? 'bg-[#ffe17c] text-[#171e19]' : 'bg-[#171e19]/10 text-[#171e19]'
            }`}>
              {shares.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
          <input
            type="text"
            placeholder={activeTab === 'received' ? "Filter by document or sender email..." : "Filter by recipient email or document..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-2.5 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-satoshi font-medium"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-[#171e19]/10 text-center font-satoshi text-sm text-[#171e19]/60">
          Loading share authorization data...
        </div>
      ) : activeTab === 'received' ? (
        /* TAB 1: RECEIVED DOCUMENTS (RECEIVER VIEW) */
        filteredReceivedShares.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl text-center border-2 border-dashed border-[#171e19]/15">
            <div className="h-14 w-14 rounded-2xl bg-[#171e19]/5 flex items-center justify-center text-[#171e19] mx-auto mb-3">
              <Eye className="h-7 w-7" />
            </div>
            <h3 className="font-anton text-xl uppercase text-[#171e19]">
              {search ? 'No matching received documents found' : 'No documents shared with you yet'}
            </h3>
            <p className="font-satoshi text-xs text-[#171e19]/60 mt-1">
              Documents shared with <span className="font-mono font-semibold text-[#171e19]">{user?.email}</span> will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden border border-[#171e19]/10 shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-satoshi">
                <thead className="bg-[#171e19] text-[#b7c6c2] font-anton text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">DOCUMENT</th>
                    <th className="px-6 py-4">SHARED BY (SENDER)</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4">EXPIRES</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171e19]/10">
                  {filteredReceivedShares.map((share) => (
                    <tr key={share._id} className="hover:bg-[#fafafa] transition-colors">
                      {/* Document */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 truncate max-w-xs">
                          <div className="w-9 h-9 rounded-xl bg-[#ffe17c] text-[#171e19] flex items-center justify-center shrink-0 font-bold shadow-sm">
                            <Lock className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-[#171e19] truncate text-sm block">
                              {share.documentId?.originalFilename || 'Protected Document'}
                            </span>
                            <span className="font-mono text-[10px] text-[#171e19]/60">
                              {share.documentId?.pageCount || 1} pages
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sender */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-[#171e19] bg-[#171e19]/5 px-2.5 py-1 rounded">
                          {share.ownerEmail || 'Sender'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-anton uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          AUTHORIZED
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-[#171e19]">
                          {new Date(share.expiresAt).toLocaleDateString()}
                        </div>
                        <div className="font-mono text-[10px] text-[#171e19]/50">
                          {new Date(share.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* View & Copy Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyLink(share._id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-anton text-xs uppercase tracking-wider transition-all cursor-pointer ${
                              copiedId === share._id
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-[#171e19]/5 hover:bg-[#171e19]/10 text-[#171e19]'
                            }`}
                            title="Copy protected view link"
                          >
                            {copiedId === share._id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-700" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-[#171e19]/70" />
                            )}
                            <span>{copiedId === share._id ? 'COPIED' : 'COPY'}</span>
                          </button>

                          <Link
                            to={`/view/${share._id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-anton text-xs uppercase tracking-wider bg-[#ffe17c] hover:brightness-105 active:scale-95 text-[#171e19] shadow-sm transition-all cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Document</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-[#171e19]/10">
              {filteredReceivedShares.map((share) => (
                <div key={share._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#ffe17c] text-[#171e19] flex items-center justify-center shrink-0 font-bold shadow-sm">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="font-bold text-[#171e19] text-sm block truncate" title={share.documentId?.originalFilename}>
                          {share.documentId?.originalFilename || 'Protected Document'}
                        </span>
                        <span className="font-mono text-[10px] text-[#171e19]/60">
                          {share.documentId?.pageCount || 1} pages
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-anton uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      AUTHORIZED
                    </span>
                  </div>

                  <div className="bg-[#fafafa] p-3 rounded-xl border border-[#171e19]/10 space-y-1.5 font-mono text-xs text-[#171e19]/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[#171e19]/50">Sender:</span>
                      <span className="font-bold text-[#171e19] truncate max-w-[190px]">{share.ownerEmail || 'Sender'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#171e19]/50">Valid Until:</span>
                      <span className="text-[#171e19] font-semibold">{new Date(share.expiresAt).toLocaleDateString()} {new Date(share.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopyLink(share._id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        copiedId === share._id
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-[#171e19]/5 hover:bg-[#171e19]/10 text-[#171e19]'
                      }`}
                    >
                      {copiedId === share._id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-[#171e19]/70" />
                      )}
                      <span>{copiedId === share._id ? 'COPIED' : 'COPY LINK'}</span>
                    </button>

                    <Link
                      to={`/view/${share._id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider bg-[#ffe17c] hover:brightness-105 active:scale-95 text-[#171e19] shadow-sm transition-all cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Document</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* TAB 2: OUTBOUND SHARES (CREATED BY ME - SENDER VIEW) */
        filteredOutboundShares.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl text-center border-2 border-dashed border-[#171e19]/15">
            <div className="h-14 w-14 rounded-2xl bg-[#171e19]/5 flex items-center justify-center text-[#171e19] mx-auto mb-3">
              <Share2 className="h-7 w-7" />
            </div>
            <h3 className="font-anton text-xl uppercase text-[#171e19]">
              {search ? 'No matching share links found' : 'No share links created yet'}
            </h3>
            <p className="font-satoshi text-xs text-[#171e19]/60 mt-1">
              Navigate to your Document Library and click "Create Share" to issue restricted recipient links.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden border border-[#171e19]/10 shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-satoshi">
                <thead className="bg-[#171e19] text-[#b7c6c2] font-anton text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">DOCUMENT</th>
                    <th className="px-6 py-4">RESTRICTED RECIPIENT</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4">SESSIONS</th>
                    <th className="px-6 py-4">EXPIRES (UTC)</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171e19]/10">
                  {filteredOutboundShares.map((share) => {
                    const isRevoked = Boolean(share.revokedAt);
                    const isExpired = !isRevoked && new Date(share.expiresAt) < new Date();
                    const isActive = !isRevoked && !isExpired;

                    return (
                      <tr key={share._id} className="hover:bg-[#fafafa] transition-colors">
                        {/* Document */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 truncate max-w-xs">
                            <div className="w-8 h-8 rounded-lg bg-[#171e19] text-[#ffe17c] flex items-center justify-center shrink-0 font-bold">
                              <FileText className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-[#171e19] truncate text-sm">
                              {share.documentId?.originalFilename || 'Deleted Document'}
                            </span>
                          </div>
                        </td>

                        {/* Recipient */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-[#171e19] bg-[#171e19]/5 px-2 py-1 rounded">
                            {share.recipientEmail}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {isRevoked ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-anton uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="h-3.5 w-3.5" />
                              REVOKED
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-anton uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="h-3.5 w-3.5" />
                              EXPIRED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-anton uppercase tracking-wider bg-[#ffe17c]/30 text-[#171e19] border border-[#ffe17c] font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ACTIVE
                            </span>
                          )}
                        </td>

                        {/* Sessions */}
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-[#171e19]/70">
                          {share.viewSessionCount} {share.maxViewSessions ? `/ ${share.maxViewSessions}` : 'views'}
                        </td>

                        {/* Expiry */}
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-[#171e19]">
                            {new Date(share.expiresAt).toLocaleDateString()}
                          </div>
                          <div className="font-mono text-[10px] text-[#171e19]/50">
                            {new Date(share.expiresAt).toLocaleTimeString()}
                          </div>
                        </td>

                        {/* Actions: COPY LINK & REVOKE */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isActive ? (
                              <>
                                <button
                                  onClick={() => handleCopyLink(share._id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-anton text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                                    copiedId === share._id
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-[#ffe17c] hover:brightness-105 active:scale-95 text-[#171e19]'
                                  }`}
                                  title="Copy share link to send to recipient"
                                >
                                  {copiedId === share._id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                                      <span>COPIED!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5 text-[#171e19]" />
                                      <span>COPY LINK</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleRevoke(share._id, share.recipientEmail)}
                                  className="px-3 py-1.5 rounded-lg font-anton text-xs uppercase tracking-wider bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 transition-all shadow-sm cursor-pointer"
                                  title="Revoke recipient access immediately"
                                >
                                  Revoke
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleCopyLink(share._id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-anton text-[11px] uppercase tracking-wider bg-[#171e19]/5 hover:bg-[#171e19]/10 text-[#171e19]/60 cursor-pointer"
                                title="Copy inactive link reference"
                              >
                                <Copy className="h-3 w-3" />
                                <span>{copiedId === share._id ? 'COPIED' : 'COPY'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-[#171e19]/10">
              {filteredOutboundShares.map((share) => {
                const isRevoked = Boolean(share.revokedAt);
                const isExpired = !isRevoked && new Date(share.expiresAt) < new Date();
                const isActive = !isRevoked && !isExpired;

                return (
                  <div key={share._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#171e19] text-[#ffe17c] flex items-center justify-center shrink-0 font-bold shadow-sm">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 truncate">
                          <span className="font-bold text-[#171e19] text-sm block truncate" title={share.documentId?.originalFilename}>
                            {share.documentId?.originalFilename || 'Deleted Document'}
                          </span>
                          <span className="font-mono text-[11px] text-[#171e19]/60">
                            {share.viewSessionCount} {share.maxViewSessions ? `/ ${share.maxViewSessions}` : 'views'}
                          </span>
                        </div>
                      </div>

                      {isRevoked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-anton uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          <XCircle className="h-3 w-3" />
                          REVOKED
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-anton uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          <Clock className="h-3 w-3" />
                          EXPIRED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-anton uppercase tracking-wider bg-[#ffe17c]/30 text-[#171e19] border border-[#ffe17c] font-bold shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="bg-[#fafafa] p-3 rounded-xl border border-[#171e19]/10 space-y-1.5 font-mono text-xs text-[#171e19]/70">
                      <div className="flex items-center justify-between">
                        <span className="text-[#171e19]/50">Recipient:</span>
                        <span className="font-bold text-[#171e19] truncate max-w-[200px]">{share.recipientEmail}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#171e19]/50">Expires:</span>
                        <span className="text-[#171e19]">{new Date(share.expiresAt).toLocaleDateString()} {new Date(share.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopyLink(share._id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          copiedId === share._id
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-[#ffe17c] hover:brightness-105 active:scale-95 text-[#171e19] shadow-sm'
                        }`}
                      >
                        {copiedId === share._id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-700" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-[#171e19]" />
                            <span>COPY LINK</span>
                          </>
                        )}
                      </button>

                      {isActive && (
                        <button
                          onClick={() => handleRevoke(share._id, share.recipientEmail)}
                          className="px-4 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 transition-all shadow-sm cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
