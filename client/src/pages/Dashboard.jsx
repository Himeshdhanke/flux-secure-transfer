import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentService, shareService, auditService } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Share2,
  Eye,
  ShieldCheck,
  Plus,
  Trash2,
  Clock,
  ExternalLink,
  Lock,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Copy,
  Check
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [shares, setShares] = useState([]);
  const [receivedShares, setReceivedShares] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [shareDoc, setShareDoc] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = async (shareId) => {
    const shareUrl = `${window.location.origin}/view/${shareId}`;
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const loadData = async () => {
    try {
      const [docsRes, sharesRes, receivedRes, auditRes] = await Promise.all([
        documentService.list(),
        shareService.list(),
        shareService.listReceived(),
        auditService.list(5),
      ]);
      setDocuments(docsRes.data.documents || []);
      setShares(sharesRes.data.shares || []);
      setReceivedShares(receivedRes.data.shares || []);
      setRecentLogs(auditRes.data.logs || []);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDocuments([]);
    setShares([]);
    setReceivedShares([]);
    setRecentLogs([]);
    setLoading(true);
    loadData();
  }, [user?.email, user?.cognitoSub]);

  const handlePreviewDoc = async (id) => {
    try {
      const res = await documentService.preview(id);
      if (res.data?.viewUrl) {
        navigate(res.data.viewUrl);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to open preview.');
    }
  };

  const handleDeleteDoc = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will permanently delete the encrypted ciphertext and all active shares.`)) {
      return;
    }
    try {
      await documentService.delete(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete document.');
    }
  };

  const totalPages = documents.reduce((sum, d) => sum + (d.pageCount || 0), 0);
  const activeSharesCount = shares.filter((s) => !s.revokedAt && new Date(s.expiresAt) > new Date()).length;
  const totalSessionsCount = shares.reduce((sum, s) => sum + (s.viewSessionCount || 0), 0);

  return (
    <div className="space-y-8 font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#171e19]/10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe17c] animate-pulse shrink-0"></span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#171e19]/60 truncate">
              REAL-TIME CRYPTO TELEMETRY
            </span>
          </div>
          <h1 className="font-anton text-3xl sm:text-5xl uppercase tracking-normal text-[#171e19] leading-none">
            SECURITY OVERVIEW
          </h1>
          <p className="font-satoshi text-xs sm:text-sm text-[#171e19]/70 mt-1.5 font-medium">
            Zero-Trust Encrypted Document Vault & Recipient Distribution Manager
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-anton text-sm sm:text-base uppercase tracking-wider bg-[#ffe17c] text-[#171e19] shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-5 w-5 text-[#171e19]" />
          <span>Upload PDF</span>
        </button>
      </div>

      {/* Metrics Cards (4 High-Contrast Brutalist Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl brutalist-card-light flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-anton text-[11px] sm:text-xs uppercase tracking-wider text-[#171e19]/60">
              VAULT DOCUMENTS
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#171e19] text-[#ffe17c] flex items-center justify-center font-bold">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="font-anton text-3xl sm:text-5xl text-[#171e19] leading-none">
              {documents.length}
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-[#171e19]/60 bg-[#171e19]/5 px-1.5 sm:px-2 py-0.5 rounded">
              AES-256
            </span>
          </div>
          <p className="font-satoshi text-[11px] sm:text-xs text-[#171e19]/50 mt-2 font-medium">
            Encrypted at rest in storage
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl brutalist-card-light flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-anton text-[11px] sm:text-xs uppercase tracking-wider text-[#171e19]/60">
              SHARED WITH YOU
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#ffe17c] text-[#171e19] flex items-center justify-center font-bold">
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="font-anton text-3xl sm:text-5xl text-[#171e19] leading-none">
              {receivedShares.length}
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded">
              INBOUND
            </span>
          </div>
          <p className="font-satoshi text-[11px] sm:text-xs text-[#171e19]/50 mt-2 font-medium">
            Available for protected viewing
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl brutalist-card-light flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-anton text-[11px] sm:text-xs uppercase tracking-wider text-[#171e19]/60">
              ACTIVE SHARES
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#171e19] text-[#ffe17c] flex items-center justify-center font-bold">
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="font-anton text-3xl sm:text-5xl text-[#171e19] leading-none">
              {activeSharesCount}
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded">
              OUTBOUND
            </span>
          </div>
          <p className="font-satoshi text-[11px] sm:text-xs text-[#171e19]/50 mt-2 font-medium">
            Restricted to verified receivers
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl brutalist-card-light flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-anton text-[11px] sm:text-xs uppercase tracking-wider text-[#171e19]/60">
              VIEW SESSIONS
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#171e19] text-[#ffe17c] flex items-center justify-center font-bold">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
            <span className="font-anton text-3xl sm:text-5xl text-[#171e19] leading-none">
              {totalSessionsCount}
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-[#171e19]/60 bg-[#171e19]/5 px-1.5 sm:px-2 py-0.5 rounded">
              STREAMS
            </span>
          </div>
          <p className="font-satoshi text-[11px] sm:text-xs text-[#171e19]/50 mt-2 font-medium">
            Forensic watermarked renders
          </p>
        </div>
      </div>

      {/* Main Grid: Received Documents, Vault Documents & Live Activity */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Received Documents + Vault Documents */}
        <div className="lg:col-span-2 space-y-8">

          {/* Section A: Documents Shared With You (Receiver View) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#171e19]/10 gap-2">
              <h2 className="font-anton text-base sm:text-2xl uppercase tracking-normal text-[#171e19] flex items-center gap-2 min-w-0">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-[#171e19] shrink-0" />
                <span className="truncate">DOCUMENTS SHARED WITH YOU</span>
              </h2>
              <span className="font-mono text-[10px] sm:text-xs font-bold text-[#171e19] bg-[#ffe17c] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded shrink-0">
                {receivedShares.length} {receivedShares.length === 1 ? 'FILE' : 'FILES'}
              </span>
            </div>

            {loading ? (
              <div className="bg-white p-8 rounded-2xl border border-[#171e19]/10 text-center font-satoshi text-xs text-[#171e19]/60">
                Checking for inbound shared documents...
              </div>
            ) : receivedShares.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border-2 border-dashed border-[#171e19]/15">
                <div className="h-10 w-10 rounded-xl bg-[#171e19]/5 flex items-center justify-center text-[#171e19] mx-auto mb-2">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="font-anton text-base uppercase text-[#171e19]">No received documents yet</h3>
                <p className="font-satoshi text-xs text-[#171e19]/60 mt-1 max-w-sm mx-auto">
                  When other senders share confidential documents with <span className="font-mono font-semibold text-[#171e19]">{user?.email}</span>, they will appear here with instant view access.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#171e19]/10 overflow-hidden shadow-sm divide-y divide-[#171e19]/10">
                {receivedShares.map((share) => (
                  <div
                    key={share._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#fafafa] transition-colors gap-3 sm:gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 w-full sm:w-auto flex-1">
                      <div className="h-11 w-11 rounded-xl bg-[#ffe17c] text-[#171e19] flex items-center justify-center shrink-0 font-bold shadow-sm">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 truncate">
                        <p className="font-satoshi text-sm font-bold text-[#171e19] truncate" title={share.documentId?.originalFilename}>
                          {share.documentId?.originalFilename || 'Protected Document'}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-mono text-[11px] text-[#171e19]/60">
                          <span>From: <strong className="text-[#171e19]">{share.ownerEmail || 'Sender'}</strong></span>
                          <span>•</span>
                          <span>{share.documentId?.pageCount || 1} pages</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Authorized</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-[#171e19]/5 sm:border-t-0 shrink-0">
                      <button
                        onClick={() => handleCopyLink(share._id)}
                        className={`h-10 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 rounded-xl font-anton text-xs uppercase tracking-wider transition-all cursor-pointer ${
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
                        className="h-10 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 rounded-xl bg-[#ffe17c] hover:brightness-105 active:scale-95 text-[#171e19] font-anton text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Document</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Vault Encrypted Documents (Uploaded) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#171e19]/10 gap-2">
              <h2 className="font-anton text-base sm:text-2xl uppercase tracking-normal text-[#171e19] flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#171e19] shrink-0" />
                <span className="truncate">MY ENCRYPTED VAULT ({documents.length})</span>
              </h2>
              <Link
                to="/documents"
                className="font-satoshi text-xs font-bold text-[#171e19] hover:underline flex items-center gap-1 uppercase tracking-wider shrink-0"
              >
                <span>Manage</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white p-12 rounded-2xl border border-[#171e19]/10 text-center font-satoshi text-sm text-[#171e19]/60">
                Loading encrypted vault records...
              </div>
            ) : documents.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed border-[#171e19]/15">
                <div className="h-14 w-14 rounded-2xl bg-[#171e19]/5 flex items-center justify-center text-[#171e19] mx-auto mb-3">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="font-anton text-lg uppercase text-[#171e19]">No documents uploaded yet</h3>
                <p className="font-satoshi text-xs text-[#171e19]/60 mt-1 mb-4">
                  Upload your first PDF to encrypt it with authenticated AES-256-GCM.
                </p>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-anton text-sm uppercase tracking-wider bg-[#ffe17c] text-[#171e19] hover:brightness-105 shadow-sm transition-all cursor-pointer"
                >
                  Upload Document Now
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#171e19]/10 overflow-hidden shadow-sm divide-y divide-[#171e19]/10">
                {documents.slice(0, 5).map((doc) => (
                  <div
                    key={doc._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#fafafa] transition-colors gap-3 sm:gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 w-full sm:w-auto flex-1">
                      <div className="h-11 w-11 rounded-xl bg-[#171e19] text-[#ffe17c] flex items-center justify-center shrink-0 font-bold shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 truncate">
                        <p className="font-satoshi text-sm font-bold text-[#171e19] truncate" title={doc.originalFilename}>
                          {doc.originalFilename}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-mono text-[11px] text-[#171e19]/60">
                          <span>{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
                          <span>•</span>
                          <span>{(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                          <span>•</span>
                          <span className="text-[#171e19] font-bold bg-[#ffe17c]/40 px-1.5 py-0.2 rounded">
                            AES-GCM
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-[#171e19]/5 sm:border-t-0 shrink-0">
                      <button
                        onClick={() => handlePreviewDoc(doc._id)}
                        className="h-10 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-[#171e19] hover:bg-black text-[#ffe17c] font-anton text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                        title="View document"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => setShareDoc(doc)}
                        className="h-10 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-[#ffe17c] hover:brightness-105 active:scale-95 text-[#171e19] font-anton text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc._id, doc.originalFilename)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Audit / Security Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#171e19]/10 gap-2">
            <h2 className="font-anton text-base sm:text-2xl uppercase tracking-normal text-[#171e19] flex items-center gap-2 min-w-0">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-[#171e19] shrink-0" />
              <span className="truncate">LIVE AUDIT STREAM</span>
            </h2>
            <Link
              to="/activity"
              className="font-satoshi text-xs font-bold text-[#171e19] hover:underline uppercase tracking-wider shrink-0"
            >
              View Feed
            </Link>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#171e19]/10 shadow-sm space-y-3">
            {recentLogs.length === 0 ? (
              <p className="font-satoshi text-xs text-[#171e19]/50 text-center py-6">
                No audit activity recorded yet.
              </p>
            ) : (
              recentLogs.map((log) => {
                const isDenied = log.eventType.includes('DENIED') || log.eventType.includes('VIOLATION');
                const isSuccess = log.eventType.includes('SUCCESS') || log.eventType === 'DOCUMENT_UPLOADED';

                return (
                  <div
                    key={log._id}
                    className="p-3 rounded-xl bg-[#fafafa] border border-[#171e19]/10 text-xs font-satoshi space-y-1 hover:border-[#171e19]/25 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-anton text-xs tracking-wider uppercase ${
                        isDenied ? 'text-rose-600' : isSuccess ? 'text-emerald-700' : 'text-[#171e19]'
                      }`}>
                        {log.eventType.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-[10px] text-[#171e19]/50">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {log.actorEmail && (
                      <p className="text-[11px] text-[#171e19]/70 truncate font-mono">
                        Actor: <strong className="text-[#171e19]">{log.actorEmail}</strong>
                      </p>
                    )}

                    {log.details?.filename && (
                      <p className="text-[11px] text-[#171e19]/70 truncate font-mono">
                        File: {log.details.filename}
                      </p>
                    )}

                    {log.details?.reason && (
                      <p className="text-[11px] text-rose-600 truncate font-semibold font-mono">
                        Alert: {log.details.reason}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => loadData()}
      />

      <ShareModal
        isOpen={Boolean(shareDoc)}
        onClose={() => setShareDoc(null)}
        document={shareDoc}
        onShareCreated={() => loadData()}
      />
    </div>
  );
}
