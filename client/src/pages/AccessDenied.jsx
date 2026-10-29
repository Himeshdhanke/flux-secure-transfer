import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Lock, Clock, XCircle, UserX, AlertOctagon, ArrowLeft, LogOut } from 'lucide-react';

export default function AccessDenied({ reason = 'UNAUTHORIZED', details = {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSwitchAccount = () => {
    logout();
    navigate('/login', {
      state: {
        from: { pathname: window.location.pathname },
      },
    });
  };

  const getReasonConfig = () => {
    switch (reason) {
      case 'UNAUTHORIZED_RECIPIENT':
        return {
          title: 'UNAUTHORIZED RECIPIENT',
          badge: 'Access Denied',
          description: details.message || 'This document is restricted to an authorized recipient. Your current account does not have permission to view it.',
          subtext: user
            ? `You are currently authenticated as ${user.email}. Please switch to the authorized recipient account.`
            : 'Please authenticate with the authorized recipient email address.',
          icon: UserX,
          color: 'rose',
        };
      case 'EXPIRED':
        return {
          title: 'DOCUMENT SHARE EXPIRED',
          badge: 'Time-to-Live (TTL) Expired',
          description: details.message || 'This document share link has expired and can no longer be accessed.',
          subtext: details.expiresAt ? `Link expired on ${new Date(details.expiresAt).toLocaleString()}` : 'The link duration has elapsed.',
          icon: Clock,
          color: 'amber',
        };
      case 'REVOKED':
        return {
          title: 'ACCESS REVOKED BY OWNER',
          badge: 'Instant Revocation Enforced',
          description: details.message || 'The sender has revoked this sharing link. Access is immediately terminated.',
          subtext: 'Contact the document owner if you require renewed access.',
          icon: XCircle,
          color: 'rose',
        };
      case 'MAX_SESSIONS_EXCEEDED':
        return {
          title: 'VIEWING LIMIT REACHED',
          badge: 'Session Limit Exceeded',
          description: details.message || 'The maximum allowed viewing sessions for this document link has been reached.',
          subtext: 'The owner configured a strict view count limit on this share.',
          icon: AlertOctagon,
          color: 'amber',
        };
      default:
        return {
          title: 'ACCESS FORBIDDEN',
          badge: 'Zero-Trust Verification Failed',
          description: details.message || 'You do not have permission to view this protected document.',
          subtext: user ? `Current user: ${user.email}. Every page request requires valid recipient authorization.` : 'Every page request requires valid authorization and cryptographic verification.',
          icon: ShieldAlert,
          color: 'rose',
        };
    }
  };

  const config = getReasonConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-grid-spec font-sans text-[#171e19]">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#171e19]/10 p-8 sm:p-10 shadow-2xl text-center brutalist-transition">
        {/* Icon */}
        <div className={`h-16 w-16 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-md ${
          config.color === 'amber'
            ? 'bg-amber-50 border border-amber-200 text-amber-600'
            : 'bg-rose-50 border border-rose-200 text-rose-600'
        }`}>
          <Icon className="h-8 w-8" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-3 bg-[#171e19]/5 border border-[#171e19]/10 text-[#171e19]">
          <Lock className="h-3.5 w-3.5 text-rose-600" />
          <span>{config.badge}</span>
        </div>

        {/* Title & Description */}
        <h2 className="font-anton text-3xl sm:text-4xl uppercase tracking-normal text-[#171e19]">
          {config.title}
        </h2>
        <p className="mt-3 font-satoshi text-sm text-[#171e19]/80 font-medium leading-relaxed">
          {config.description}
        </p>
        <p className="mt-1 font-mono text-xs text-[#171e19]/50">
          {config.subtext}
        </p>

        {/* Cryptographic Assurance Box */}
        <div className="mt-6 rounded-xl bg-[#fafafa] border border-[#171e19]/10 p-4 text-left font-satoshi text-xs text-[#171e19]/70 space-y-1.5">
          <div className="flex items-center gap-1.5 font-anton uppercase text-[#171e19]">
            <ShieldAlert className="h-4 w-4 text-[#171e19]" />
            <span>FLUX DEFENSE POLICY:</span>
          </div>
          <p>• Zero-trust authorization checks are enforced on every single page request.</p>
          <p>• The original PDF binary is never delivered unencrypted or stored in browser cache.</p>
          <p>• All unauthorized access attempts are recorded in structured audit logs.</p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleSwitchAccount}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider bg-[#171e19] hover:bg-black text-[#ffe17c] border border-[#171e19] transition-all cursor-pointer shadow-md"
          >
            <LogOut className="h-4 w-4" />
            <span>Switch Account</span>
          </button>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-anton text-sm uppercase tracking-wider bg-[#ffe17c] text-[#171e19] shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Console</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
