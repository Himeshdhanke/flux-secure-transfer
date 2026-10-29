import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentService, shareService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { copyToClipboard } from '../utils/clipboard';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';
import {
  FileText,
  Share2,
  Trash2,
  Plus,
  Search,
  Lock,
  Calendar,
  Layers,
  ShieldCheck,
  Eye,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Copy,
  Check
} from 'lucide-react';

export default function Documents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'vault'
  const [documents, setDocuments] = useState([]);
  const [receivedShares, setReceivedShares] = useState([]);
  const [search, setSearch] = useState('');
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
      const [docsRes, receivedRes] = await Promise.all([
        documentService.list(),
        shareService.listReceived(),
      ]);
      const docs = docsRes.data.documents || [];
      const shares = receivedRes.data.shares || [];
      setDocuments(docs);
      setReceivedShares(shares);

      // Auto-select tab if user has no received documents but has uploaded ones
      if (shares.length === 0 && docs.length > 0) {
        setActiveTab('vault');
      } else if (shares.length > 0 && docs.length === 0) {
        setActiveTab('received');
      }
    } catch (err) {
      console.error('Failed to load documents data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDocuments([]);
    setReceivedShares([]);
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

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${filename}"? All active recipient shares will also be revoked.`)) {
      return;
    }

    try {
      await documentService.delete(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete document.');
    }
  };

  const filteredVaultDocs = documents.filter((d) =>
    d.originalFilename.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReceivedShares = receivedShares.filter((s) =>
    (s.documentId?.originalFilename || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.ownerEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#171e19]/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe17c]"></span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#171e19]/60">
              ZERO-TRUST ENCRYPTED DOCUMENTS
            </span>
          </div>
          <h1 className="font-anton text-4xl sm:text-5xl uppercase tracking-normal text-[#171e19] flex items-center gap-3">
            DOCUMENT LIBRARY
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#171e19] text-[#ffe17c] tracking-normal">
              {activeTab === 'received' ? `${receivedShares.length} RECEIVED` : `${documents.length} VAULT`}
            </span>
          </h1>
          <p className="font-satoshi text-xs sm:text-sm text-[#171e19]/70 mt-1 font-medium">
            View confidential documents shared with your account or manage your sealed AES-256 vault.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-anton text-base uppercase tracking-wider bg-[#ffe17c] text-[#171e19] shadow-md hover:brightness-105 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-5 w-5 text-[#171e19]" />
          <span>Upload PDF</span>
        </button>
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
            <span>Shared With Me</span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'received' ? 'bg-[#ffe17c] text-[#171e19]' : 'bg-[#171e19]/10 text-[#171e19]'
            }`}>
              {receivedShares.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-[#171e19] text-[#ffe17c] shadow-md font-bold'
                : 'text-[#171e19]/70 hover:text-[#171e19] hover:bg-black/5'
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>My Vault</span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'vault' ? 'bg-[#ffe17c] text-[#171e19]' : 'bg-[#171e19]/10 text-[#171e19]'
            }`}>
              {documents.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
          <input
            type="text"
            placeholder={activeTab === 'received' ? "Search shared documents or sender..." : "Search vault documents..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-2.5 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-satoshi font-medium"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-[#171e19]/10 text-center font-satoshi text-sm text-[#171e19]/60">
          Loading encrypted documents and recipient access rights...
        </div>
      ) : activeTab === 'received' ? (
        /* TAB 1: SHARED WITH ME (RECEIVER VIEW) */
        filteredReceivedShares.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl text-center border-2 border-dashed border-[#171e19]/15">
            <div className="h-14 w-14 rounded-2xl bg-[#171e19]/5 flex items-center justify-center text-[#171e19] mx-auto mb-3">
              <Eye className="h-7 w-7" />
            </div>
            <h3 className="font-anton text-xl uppercase text-[#171e19]">
              {search ? 'No matching shared documents found' : 'No documents shared with you yet'}
            </h3>
            <p className="font-satoshi text-xs text-[#171e19]/60 mt-1 max-w-md mx-auto">
              When senders grant viewing access to <strong className="text-[#171e19]">{user?.email}</strong>, they will be listed here with a direct "View Document" option.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReceivedShares.map((share) => (
              <div
                key={share._id}
                className="bg-white rounded-2xl p-6 flex flex-col justify-between border border-[#171e19]/10 brutalist-card-light shadow-sm group hover:border-[#171e19]/30 transition-all"
              >
                <div>
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-200">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span>AUTHORIZED RECIPIENT</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#171e19]/60">
                      {share.documentId?.pageCount || 1} {share.documentId?.pageCount === 1 ? 'PAGE' : 'PAGES'}
                    </span>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex items-start gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-[#ffe17c] text-[#171e19] flex items-center justify-center font-bold shrink-0 shadow-sm">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-satoshi text-base font-bold text-[#171e19] truncate group-hover:text-black transition-colors" title={share.documentId?.originalFilename}>
                        {share.documentId?.originalFilename || 'Protected Document'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-[#171e19]/60 truncate">
                        <span>From: <strong className="text-[#171e19]">{share.ownerEmail || 'Sender'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Expiration & Policy Details */}
                  <div className="mt-4 pt-3 border-t border-[#171e19]/10 space-y-2">
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#171e19]/70">
                      <span className="flex items-center gap-1 text-[#171e19]/50">
                        <Clock className="h-3 w-3" />
                        Valid Until:
                      </span>
                      <span className="font-semibold text-[#171e19]">
                        {new Date(share.expiresAt).toLocaleDateString()} {new Date(share.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-emerald-700 bg-emerald-50/60 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      <span>Protected viewing with dynamic forensic watermark</span>
                    </div>
                  </div>
                </div>

                {/* Primary Actions: COPY LINK & VIEW DOCUMENT */}
                <div className="mt-6 pt-4 border-t border-[#171e19]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyLink(share._id)}
                    className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-3 rounded-xl font-anton text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      copiedId === share._id
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#171e19]/5 hover:bg-[#171e19]/10 text-[#171e19]'
                    }`}
                    title="Copy share link"
                  >
                    {copiedId === share._id ? (
                      <Check className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <Copy className="h-4 w-4 text-[#171e19]/70" />
                    )}
                    <span>{copiedId === share._id ? 'COPIED' : 'COPY'}</span>
                  </button>

                  <Link
                    to={`/view/${share._id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-[#ffe17c] hover:brightness-105 active:scale-95 text-[#171e19] font-anton text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Document</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TAB 2: MY VAULT (UPLOADED DOCUMENTS) */
        filteredVaultDocs.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl text-center border-2 border-dashed border-[#171e19]/15">
            <div className="h-14 w-14 rounded-2xl bg-[#171e19]/5 flex items-center justify-center text-[#171e19] mx-auto mb-3">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="font-anton text-xl uppercase text-[#171e19]">
              {search ? 'No matching documents found' : 'Your vault is currently empty'}
            </h3>
            <p className="font-satoshi text-xs text-[#171e19]/60 mt-1 mb-5">
              {search ? 'Try clearing your search query.' : 'Upload a confidential PDF to seal it with AES-256-GCM.'}
            </p>
            {!search && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-6 py-3 rounded-xl font-anton text-sm uppercase tracking-wider bg-[#ffe17c] text-[#171e19] hover:brightness-105 shadow-md transition-all cursor-pointer"
              >
                Upload PDF Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVaultDocs.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-2xl p-6 flex flex-col justify-between border border-[#171e19]/10 brutalist-card-light shadow-sm group hover:border-[#171e19]/30 transition-all"
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#171e19] text-[#ffe17c] text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Lock className="h-3 w-3" />
                      <span>AES-256-GCM</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#171e19]/60">
                      {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex items-start gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-[#171e19] text-[#ffe17c] flex items-center justify-center font-bold shrink-0 shadow-sm">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-satoshi text-base font-bold text-[#171e19] truncate group-hover:text-black transition-colors" title={doc.originalFilename}>
                        {doc.originalFilename}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-[#171e19]/60">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-[#171e19]/40" />
                          {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#171e19]/40" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Storage Key Reference */}
                  <div className="mt-4 pt-3 border-t border-[#171e19]/10">
                    <div className="font-mono text-[10px] text-[#171e19]/50 truncate">
                      Storage Object: <span className="text-[#171e19] font-semibold">{doc.storageKey}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: View, Create Share, Delete */}
                <div className="mt-6 pt-4 border-t border-[#171e19]/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <button
                      onClick={() => handlePreviewDoc(doc._id)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-lg bg-[#171e19] hover:bg-black text-[#ffe17c] font-anton text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                      title="View document"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => setShareDoc(doc)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-lg bg-[#ffe17c] hover:brightness-105 text-[#171e19] font-anton text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(doc._id, doc.originalFilename)}
                    className="p-2 sm:p-2 rounded-lg text-[#171e19]/40 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Delete encrypted document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

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
