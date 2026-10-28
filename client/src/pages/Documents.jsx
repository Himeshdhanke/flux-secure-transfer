import React, { useState, useEffect } from 'react';
import { documentService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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
  Database,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [shareDoc, setShareDoc] = useState(null);

  const loadDocuments = async () => {
    try {
      const res = await documentService.list();
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDocuments([]);
    setLoading(true);
    loadDocuments();
  }, [user?.email, user?.cognitoSub]);

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${filename}"? All active recipient shares will also be revoked.`)) {
      return;
    }

    try {
      await documentService.delete(id);
      loadDocuments();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete document.');
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.originalFilename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#171e19]/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe17c]"></span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#171e19]/60">
              ENVELOPE ENCRYPTED OBJECTS
            </span>
          </div>
          <h1 className="font-anton text-4xl sm:text-5xl uppercase tracking-normal text-[#171e19] flex items-center gap-3">
            DOCUMENT LIBRARY
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#171e19] text-[#ffe17c] tracking-normal">
              {documents.length} FILES
            </span>
          </h1>
          <p className="font-satoshi text-xs sm:text-sm text-[#171e19]/70 mt-1 font-medium">
            Every stored PDF is sealed with a unique 256-bit AES-GCM Data Encryption Key (DEK).
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

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#171e19]/40" />
          <input
            type="text"
            placeholder="Search documents by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[#fafafa] border border-[#171e19]/15 pl-10 pr-4 py-3 text-sm text-[#171e19] placeholder-[#171e19]/40 focus:border-[#171e19] focus:outline-none focus:bg-white transition-all font-satoshi font-medium"
          />
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-[#171e19]/10 text-center font-satoshi text-sm text-[#171e19]/60">
          Loading encrypted documents from vault...
        </div>
      ) : filteredDocs.length === 0 ? (
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
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-2xl p-6 flex flex-col justify-between border border-[#171e19]/10 brutalist-card-light shadow-sm group"
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
                    <h3 className="font-satoshi text-base font-bold text-[#171e19] truncate group-hover:text-black transition-colors">
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
                    Ciphertext Key: <span className="text-[#171e19] font-semibold">{doc.storageKey}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-[#171e19]/10 flex items-center justify-between">
                <button
                  onClick={() => setShareDoc(doc)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ffe17c] hover:brightness-105 text-[#171e19] font-anton text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Create Share</span>
                </button>

                <button
                  onClick={() => handleDelete(doc._id, doc.originalFilename)}
                  className="p-2 rounded-lg text-[#171e19]/40 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete encrypted document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => loadDocuments()}
      />

      <ShareModal
        isOpen={Boolean(shareDoc)}
        onClose={() => setShareDoc(null)}
        document={shareDoc}
        onShareCreated={() => loadDocuments()}
      />
    </div>
  );
}
