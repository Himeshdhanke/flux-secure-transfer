import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, FileText, Share2, Activity, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'OVERVIEW', shortName: 'OVERVIEW', path: '/dashboard', icon: Shield },
    { name: 'DOCUMENTS', shortName: 'DOCS', path: '/documents', icon: FileText },
    { name: 'ACTIVE SHARES', shortName: 'SHARES', path: '/shares', icon: Share2 },
    { name: 'AUDIT TRAIL', shortName: 'AUDIT', path: '/activity', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#171e19]/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 sm:gap-3 group">
          <span className="font-anton text-2xl sm:text-3xl uppercase tracking-normal text-[#171e19] leading-none">
            FLUX<span className="text-[#ffe17c] group-hover:scale-125 inline-block transition-transform">.</span>
          </span>
          <span className="hidden sm:inline-block rounded bg-[#171e19]/5 px-2.5 py-1 text-[10px] font-mono font-bold text-[#171e19] border border-[#171e19]/10 uppercase tracking-wider">
            AES-256 VAULT
          </span>
        </Link>

        {/* Navigation Items (Desktop / Tablet) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-anton uppercase tracking-wider transition-all brutalist-transition ${
                    isActive
                      ? 'bg-[#ffe17c] text-[#171e19] shadow-sm font-bold scale-[1.02]'
                      : 'text-[#171e19]/70 hover:text-[#171e19] hover:bg-[#171e19]/5'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#171e19]' : 'text-[#171e19]/50'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Status & Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-anton uppercase tracking-wide text-[#171e19]">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-[#171e19]/50 font-mono truncate max-w-[150px]">
                  {user?.email}
                </span>
              </div>
              
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[#171e19] text-[#ffe17c] border border-black/10 flex items-center justify-center font-anton text-xs sm:text-sm font-bold shadow-sm shrink-0">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>

              <button
                onClick={handleLogout}
                className="h-8 sm:h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-anton uppercase tracking-wider text-[#171e19]/70 hover:text-rose-600 hover:bg-rose-50 border border-[#171e19]/10 hover:border-rose-200 transition-all cursor-pointer shrink-0"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">EXIT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/login"
                className="font-satoshi text-xs sm:text-sm font-medium text-[#171e19] hover:opacity-75 transition-colors px-2 py-1"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-[#171e19] text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full font-satoshi text-xs sm:text-sm font-medium hover:bg-black transition-all shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on phone screens < md) */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#171e19]/15 px-2 py-1 flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#171e19] font-bold bg-[#ffe17c] shadow-sm'
                    : 'text-[#171e19]/60 hover:text-[#171e19]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#171e19]' : 'text-[#171e19]/70'}`} />
                <span className="font-anton text-[9px] uppercase tracking-wider mt-0.5">{link.shortName || link.name}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
