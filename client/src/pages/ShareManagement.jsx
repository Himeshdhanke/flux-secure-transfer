import React, { useState, useEffect } from 'react';
import { shareService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Share2,
  Lock,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  ShieldAlert,
  FileText,
  Search,
  ExternalLink
} from 'lucide-react';

export default function ShareManagement() {
  const { user } = useAuth();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState('');

  const loadShares = async () => {
    try {
      const res = await shareService.list();
      setShares(res.data.shares || []);
    } catch (err) {
      console.error('Failed to load shares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShares([]);
    setLoading(true);
    loadShares();
  }, [user?.email, user?.cognitoSub]);

  const handleRevoke = async (id, recipient) => {
    if (!window.confirm(`Are you sure you want to immediately revoke access for ${recipient}? The receiver will no longer be able to load or view pages.`)) {
      return;
    }

    try {
      await shareService.revoke(id);
      loadShares();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to revoke share link.');
    }
  };

  const filteredShares = shares.filter((s) =>
    s.recipientEmail.toLowerCase().includes(search.toLowerCase()) ||
    s.documentId?.originalFilename?.toLowerCase().includes(search.toLowerCase())
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
              {shares.length} LINKS
            </span>
          </h1>
          <p className="font-satoshi text-xs sm:text-sm text-[#171e19]/70 mt-1 font-medium">
            Real-time recipient authorization policy, expiration countdowns, and sub-200ms instant kill-switch.
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
        <input
          type="text"
          placeholder="Filter by recipient email or document..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-3 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-satoshi font-medium"
        />
      </div>

      {/* Share List / Table */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-[#171e19]/10 text-center font-satoshi text-sm text-[#171e19]/60">
          Loading active shares from authorization database...
        </div>
      ) : filteredShares.length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-satoshi">
              <thead className="bg-[#171e19] text-[#b7c6c2] font-anton text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">DOCUMENT</th>
                  <th className="px-6 py-4">RESTRICTED RECIPIENT</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4">SESSIONS</th>
                  <th className="px-6 py-4">EXPIRES (UTC)</th>
                  <th className="px-6 py-4 text-right">KILL SWITCH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171e19]/10">
                {filteredShares.map((share) => {
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

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {isActive && (
                          <button
                            onClick={() => handleRevoke(share._id, share.recipientEmail)}
                            className="px-3.5 py-1.5 rounded-lg font-anton text-xs uppercase tracking-wider bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 transition-all shadow-sm cursor-pointer"
                          >
                            Revoke Now
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
