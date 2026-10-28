import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { ShieldAlert, ShieldCheck, Lock, Layers } from 'lucide-react';

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white bg-grid-spec">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#171e19]/10 border-t-[#171e19]"></div>
          <span className="font-anton text-sm uppercase tracking-wider text-[#171e19]">
            VALIDATING SECURITY CREDENTIALS...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white bg-grid-spec text-[#171e19] font-sans selection:bg-[#ffe17c] selection:text-[#171e19]">
      <Navbar />

      {/* High-Contrast Security Status Ribbon */}
      <div className="w-full bg-[#171e19] text-[#b7c6c2] border-b border-[#171e19]/10 px-4 py-2 font-satoshi">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#ffe17c]" />
            <span>
              Cryptographic Mode: <strong className="font-anton uppercase tracking-wide text-white">AES-256-GCM + ENVELOPE SEAL</strong>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ffe17c] animate-pulse"></span>
              Vault: <strong className="text-white">ENCRYPTED AT REST</strong>
            </span>
            <span>
              Policy: <strong className="text-[#ffe17c]">ZERO-TRUST RASTER STREAM</strong>
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-[#171e19]/10 bg-white py-6 text-center text-xs font-satoshi text-[#171e19]/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <span className="font-anton text-sm uppercase tracking-normal text-[#171e19]">
              FLUX<span className="text-[#ffe17c]">.</span>
            </span>
            <span className="text-[11px]">Enterprise-Grade Zero-Leak B2C Document Distribution</span>
          </div>
          <p className="text-[11px] font-mono">
            AES-256-GCM • SHA-256 HASH TOKENS • AWS CLOUD ARCHITECTURE
          </p>
        </div>
      </footer>
    </div>
  );
}
