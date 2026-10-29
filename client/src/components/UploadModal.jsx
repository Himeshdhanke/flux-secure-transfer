import React, { useState, useRef } from 'react';
import { documentService } from '../services/api';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [encryptionStep, setEncryptionStep] = useState('');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setError('Only PDF documents are supported (.pdf).');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File exceeds maximum upload size (20MB).');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(15);
    setEncryptionStep('Generating unique 256-bit Data Encryption Key (DEK)...');
    setError('');

    try {
      setTimeout(() => {
        setProgress(40);
        setEncryptionStep('Performing AES-256-GCM authenticated envelope encryption in memory...');
      }, 400);

      const formData = new FormData();
      formData.append('document', file);

      const res = await documentService.upload(formData, (percent) => {
        setProgress(Math.max(50, Math.min(percent, 90)));
      });

      setProgress(100);
      setEncryptionStep('Master key envelope sealed. Ciphertext written to object vault.');

      setTimeout(() => {
        setUploading(false);
        setFile(null);
        setProgress(0);
        setEncryptionStep('');
        onUploadSuccess?.(res.data.document);
        onClose();
      }, 700);
    } catch (err) {
      setUploading(false);
      setProgress(0);
      setEncryptionStep('');
      setError(err.response?.data?.error?.message || 'Failed to upload and encrypt document.');
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    setError('');
    setProgress(0);
    setEncryptionStep('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#171e19]/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-[#171e19]/10 p-5 sm:p-8 shadow-2xl relative brutalist-transition">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={uploading}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#171e19]/40 hover:text-[#171e19] hover:bg-[#171e19]/5 transition-colors disabled:opacity-30 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#171e19] text-[#ffe17c] flex items-center justify-center font-bold">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-anton text-2xl uppercase tracking-normal text-[#171e19]">
              ENCRYPT & UPLOAD PDF
            </h2>
            <p className="font-satoshi text-xs text-[#171e19]/60 font-medium">
              In-memory AES-256-GCM envelope encryption with per-document DEK
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-satoshi font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Area */}
        {!uploading && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#171e19] bg-[#ffe17c]/20 scale-[1.01]'
                : file
                ? 'border-[#171e19] bg-[#fafafa]'
                : 'border-[#171e19]/20 hover:border-[#171e19] hover:bg-[#fafafa]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-[#171e19] text-[#ffe17c] flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="font-satoshi text-sm font-bold text-[#171e19] max-w-xs truncate">
                  {file.name}
                </p>
                <p className="font-mono text-xs text-[#171e19]/60">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF
                </p>
                <span className="mt-2 text-xs font-anton uppercase text-[#171e19] underline">
                  Click or drag to change file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#171e19]/5 flex items-center justify-center text-[#171e19]">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-anton text-base uppercase tracking-wide text-[#171e19]">
                    CHOOSE A PDF OR DRAG IT HERE
                  </p>
                  <p className="font-satoshi text-xs text-[#171e19]/50 mt-0.5">
                    Maximum file size: 20 MB • Plaintext is never written to disk
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Uploading Progress State */}
        {uploading && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between font-anton text-xs uppercase tracking-wider text-[#171e19]">
              <span>ENCRYPTING & UPLOADING...</span>
              <span className="font-mono font-bold">{progress}%</span>
            </div>
            
            {/* High-Contrast Progress Bar */}
            <div className="h-3 w-full bg-[#171e19]/10 rounded-full overflow-hidden p-0.5 border border-[#171e19]/20">
              <div
                className="h-full bg-[#171e19] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <p className="font-mono text-xs text-[#171e19]/70 animate-pulse text-center">
              {encryptionStep}
            </p>
          </div>
        )}

        {/* Security Assurances */}
        <div className="mt-6 p-4 rounded-xl bg-[#fafafa] border border-[#171e19]/10 space-y-1 text-xs font-satoshi text-[#171e19]/70">
          <div className="flex items-center gap-1.5 font-anton uppercase text-[#171e19]">
            <ShieldCheck className="h-4 w-4 text-[#171e19]" />
            <span>Cryptographic Guarantees:</span>
          </div>
          <p>• Plaintext is destroyed in RAM immediately following GCM encryption.</p>
          <p>• Per-document 256-bit DEK is encrypted using the server Master Key.</p>
          <p>• Recipient views only dynamically watermarked page images.</p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 font-satoshi">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="px-5 py-2.5 rounded-xl text-xs font-anton uppercase tracking-wider text-[#171e19]/70 hover:text-[#171e19] hover:bg-[#171e19]/5 transition-colors disabled:opacity-30 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2.5 rounded-xl font-anton text-sm uppercase tracking-wider bg-[#ffe17c] text-[#171e19] shadow-md hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {uploading ? 'Sealing Vault...' : 'Encrypt & Upload PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
