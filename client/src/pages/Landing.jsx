import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Check,
  Star,
  Copy,
  Terminal,
  Clock,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ShieldCheck,
  MousePointer,
  Sparkles,
  Layers,
  Fingerprint,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  
  // Interactive Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistNumber, setWaitlistNumber] = useState(1429);

  // Bottom CTA waitlist state
  const [bottomEmail, setBottomEmail] = useState('');
  const [bottomSubmitted, setBottomSubmitted] = useState(false);

  // Mockup Interactive States
  const [activeTab, setActiveTab] = useState('page3');
  const [watermarkOpacity, setWatermarkOpacity] = useState(45);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [copiedHex, setCopiedHex] = useState(false);
  const [killSwitchRevoked, setKillSwitchRevoked] = useState(false);
  const [selectedAlignment, setSelectedAlignment] = useState('center');

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (waitlistEmail.trim()) {
      setWaitlistSubmitted(true);
      setWaitlistNumber(prev => prev + 1);
    }
  };

  const handleBottomSubmit = (e) => {
    e.preventDefault();
    if (bottomEmail.trim()) {
      setBottomSubmitted(true);
    }
  };

  const handleCopyHex = () => {
    navigator.clipboard?.writeText('#FFE17C');
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-[#171e19] selection:bg-[#ffe17c] selection:text-[#171e19] font-sans antialiased overflow-x-hidden">
      
      {/* =========================================================================
          1. NAVIGATION
          Fixed header (h-20) with #ffffff/90% backdrop-blur. 
          Logo in 'Anton' (3xl, uppercase) with a yellow period.
          Center nav links in 'Satoshi' (sm, font-medium).
          Right side: text-only 'Login' link and pill-shaped button (bg-#171e19, text-white, px-6, rounded-full).
      ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/90 backdrop-blur-md border-b border-[#171e19]/10">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo on Left */}
          <Link to="/" className="flex items-center gap-1 group">
            <span className="font-anton text-3xl uppercase tracking-normal text-[#171e19] leading-none">
              FLUX<span className="text-[#ffe17c] group-hover:scale-125 inline-block transition-transform">.</span>
            </span>
            <span className="hidden sm:inline-block ml-3 font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#171e19]/5 border border-[#171e19]/10 text-[#171e19]/70">
              AES-256 VAULT
            </span>
          </Link>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-satoshi font-medium text-[#171e19]/80">
            <a href="#features" className="hover:text-[#171e19] hover:underline underline-offset-4 decoration-[#ffe17c] decoration-2 transition-colors">
              Features
            </a>
            <a href="#comparison" className="hover:text-[#171e19] hover:underline underline-offset-4 decoration-[#ffe17c] decoration-2 transition-colors">
              The Flux Way
            </a>
            <a href="#how-it-works" className="hover:text-[#171e19] hover:underline underline-offset-4 decoration-[#ffe17c] decoration-2 transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="hover:text-[#171e19] hover:underline underline-offset-4 decoration-[#ffe17c] decoration-2 transition-colors">
              Wall of Proof
            </a>
            <a href="#mockup" className="hover:text-[#171e19] hover:underline underline-offset-4 decoration-[#ffe17c] decoration-2 transition-colors">
              Protected Viewer
            </a>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-[#171e19] text-white px-6 py-2.5 rounded-full font-satoshi text-sm font-medium hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
              >
                <span>Console</span>
                <ArrowRight className="w-4 h-4 text-[#ffe17c]" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-satoshi text-sm font-medium text-[#171e19] hover:opacity-70 transition-opacity"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-[#171e19] text-white px-6 py-2.5 rounded-full font-satoshi text-sm font-medium hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION
          Centered layout on a grid pattern background (40px spacing).
          Badge (caps, tracking-widest, text-xs) with a yellow dot indicator.
          Headline: 'Anton' (text-6xl to 9xl, line-height: 0.9) with yellow highlight bar.
          Subheadline: 'Satoshi' (text-lg, text-charcoal/70%, max-w-xl).
          Waitlist form: side-by-side input (border-charcoal/20, px-6, rounded-lg) and massive 'Anton' button.
      ========================================================================= */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-grid-spec border-b border-[#171e19]/10 overflow-hidden">
        
        {/* Subtle radial fade over grid pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Badge with yellow dot indicator */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[#171e19]/10 shadow-sm text-xs font-bold uppercase tracking-widest text-[#171e19] mb-8">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe17c] animate-pulse"></span>
            <span>NEXT-GEN B2C CONFIDENTIAL FILE TRANSFER</span>
          </div>

          {/* Headline in Anton (text-6xl to 9xl, leading 0.9) */}
          <h1 className="font-anton text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-normal leading-[0.9] text-[#171e19] max-w-5xl mx-auto">
            SEND SECRETS WITHOUT THE{' '}
            <span className="highlight-bar inline-block">LEAKS</span>
          </h1>

          {/* Editorial Rotated Accent Pill */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="font-anton text-2xl sm:text-3xl uppercase tracking-wide text-[#171e19]/50">
              TRUE ZERO-TRUST & FORENSIC
            </span>
            <span className="highlight-rot-15 font-anton text-2xl sm:text-3xl uppercase">
              WATERMARKING
            </span>
          </div>

          {/* Subheadline in Satoshi (text-lg, text-charcoal/70%, max-w-xl) */}
          <p className="font-satoshi text-lg md:text-xl text-[#171e19]/70 max-w-xl mx-auto font-medium mt-6 leading-relaxed">
            Stop emailing raw PDFs into the wild. Stream encrypted, server-rendered pages with dynamic recipient watermarking and sub-second instant revocation.
          </p>

          {/* Waitlist Form: side-by-side input and massive 'Anton' button */}
          <div className="mt-10 max-w-lg mx-auto">
            {!waitlistSubmitted ? (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch justify-center">
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your work or personal email..."
                  required
                  className="font-satoshi border border-[#171e19]/20 px-6 py-4 rounded-lg bg-white text-[#171e19] placeholder-[#171e19]/40 focus:outline-none focus:ring-2 focus:ring-[#171e19] text-base flex-1 shadow-sm font-medium"
                />
                <button
                  type="submit"
                  className="font-anton bg-[#ffe17c] text-xl px-8 py-4 uppercase tracking-wide text-[#171e19] rounded-lg hover:brightness-105 active:scale-95 transition-all shadow-md whitespace-nowrap hover:shadow-lg"
                >
                  GET EARLY ACCESS
                </button>
              </form>
            ) : (
              <div className="bg-[#171e19] text-white p-5 rounded-xl border border-[#ffe17c] shadow-xl text-left flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#ffe17c] text-[#171e19] flex items-center justify-center shrink-0 font-bold text-xl">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="font-anton text-xl uppercase tracking-wide text-[#ffe17c]">
                    YOU'RE #{waitlistNumber} ON THE LIST!
                  </div>
                  <p className="font-satoshi text-xs text-[#b7c6c2] mt-1">
                    Your spot is secured. Want to try the live encrypted vault right now?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to="/register"
                      className="inline-block bg-[#ffe17c] text-[#171e19] px-4 py-1.5 rounded font-anton text-sm uppercase tracking-wide hover:brightness-105"
                    >
                      Launch Live Console →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-6 text-xs font-satoshi text-[#171e19]/60">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> AES-256 Hardware Sealed
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> 200ms Kill Switch
              </span>
            </div>
          </div>

          {/* =========================================================================
              3. SPECIAL COMPONENT: ABSTRACT UI MOCKUP
              Container with border-charcoal/10 and shadow-2xl.
              Header: gray traffic light buttons (red, yellow, green) and centered mockup title.
              Body: Grid layout (Sidebar, Main Canvas, Properties Panel).
              Properties panel: font-display titles, mini alignment icons, hex color swatch (#FFE17C).
              Main canvas: centered white card with subtle shadows and floating cursor icon with user name label.
          ========================================================================= */}
          <div id="mockup" className="mt-16 sm:mt-20 text-left">
            <div className="border border-[#171e19]/10 rounded-2xl bg-white shadow-2xl overflow-hidden max-w-5xl mx-auto brutalist-transition hover:border-[#171e19]/25">
              
              {/* Mockup Frame Header */}
              <div className="h-12 bg-white border-b border-[#171e19]/10 px-4 flex items-center justify-between">
                {/* Traffic light buttons */}
                <div className="flex items-center gap-2 w-24">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444]/80 border border-black/10 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-[#f59e0b]/80 border border-black/10 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-[#10b981]/80 border border-black/10 inline-block"></span>
                </div>

                {/* Centered Mockup Title */}
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#171e19]/60" />
                  <span className="font-mono text-xs font-semibold text-[#171e19]/80 truncate">
                    flux_term_sheet_series_a_confidential.pdf
                  </span>
                  <span className="font-mono text-[10px] bg-[#ffe17c] px-1.5 py-0.5 rounded font-bold text-[#171e19]">
                    GCM-256
                  </span>
                </div>

                {/* Right Header Status */}
                <div className="w-24 text-right">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    PROTECTED
                  </span>
                </div>
              </div>

              {/* Mockup Grid Body: Sidebar, Main Canvas, Properties Panel */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px] bg-[#fafafa]">
                
                {/* 1. Sidebar (Col span 3) */}
                <div className="md:col-span-3 border-r border-[#171e19]/10 bg-white p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#171e19]/10 mb-4">
                      <span className="font-anton text-sm uppercase tracking-wider text-[#171e19]">
                        ENCRYPTED PAGES
                      </span>
                      <span className="font-mono text-[10px] text-[#171e19]/50">3 PAGES</span>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab('page1')}
                        className={`w-full text-left p-2.5 rounded-lg border flex items-center gap-3 transition-all ${
                          activeTab === 'page1'
                            ? 'bg-[#ffe17c]/20 border-[#ffe17c] text-[#171e19] font-bold'
                            : 'border-[#171e19]/10 hover:bg-[#171e19]/5 text-[#171e19]/70'
                        }`}
                      >
                        <div className="w-6 h-8 bg-white border border-[#171e19]/20 rounded flex items-center justify-center font-mono text-[10px]">
                          1
                        </div>
                        <div className="truncate text-xs">
                          <div className="font-satoshi font-semibold">Page 1: Executive Summary</div>
                          <div className="font-mono text-[9px] text-[#171e19]/40">48 KB • Rasterized</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('page2')}
                        className={`w-full text-left p-2.5 rounded-lg border flex items-center gap-3 transition-all ${
                          activeTab === 'page2'
                            ? 'bg-[#ffe17c]/20 border-[#ffe17c] text-[#171e19] font-bold'
                            : 'border-[#171e19]/10 hover:bg-[#171e19]/5 text-[#171e19]/70'
                        }`}
                      >
                        <div className="w-6 h-8 bg-white border border-[#171e19]/20 rounded flex items-center justify-center font-mono text-[10px]">
                          2
                        </div>
                        <div className="truncate text-xs">
                          <div className="font-satoshi font-semibold">Page 2: Cap Table & Shares</div>
                          <div className="font-mono text-[9px] text-[#171e19]/40">62 KB • Rasterized</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('page3')}
                        className={`w-full text-left p-2.5 rounded-lg border flex items-center gap-3 transition-all ${
                          activeTab === 'page3'
                            ? 'bg-[#ffe17c]/20 border-[#ffe17c] text-[#171e19] font-bold shadow-sm'
                            : 'border-[#171e19]/10 hover:bg-[#171e19]/5 text-[#171e19]/70'
                        }`}
                      >
                        <div className="w-6 h-8 bg-white border border-[#171e19]/20 rounded flex items-center justify-center font-mono text-[10px]">
                          3
                        </div>
                        <div className="truncate text-xs">
                          <div className="font-satoshi font-semibold">Page 3: Signatures & NDA</div>
                          <div className="font-mono text-[9px] text-emerald-600 font-bold">Active View</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Access Token Summary */}
                  <div className="pt-4 border-t border-[#171e19]/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-satoshi text-[#171e19]/60">
                      <span>Recipient ID:</span>
                      <strong className="text-[#171e19] font-mono">sarah.k@apex.vc</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-satoshi text-[#171e19]/60">
                      <span>Token Expiry:</span>
                      <strong className="text-amber-700 font-mono">23h 59m left</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-satoshi text-[#171e19]/60">
                      <span>Raw Binary:</span>
                      <strong className="text-rose-600 font-mono">NEVER SERVED</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Main Canvas (Col span 6) */}
                <div className="md:col-span-6 bg-[#f4f5f6] p-6 sm:p-8 flex items-center justify-center relative overflow-hidden select-none">
                  
                  {/* Subtle Grid in background */}
                  <div className="absolute inset-0 bg-grid-spec opacity-60 pointer-events-none"></div>

                  {/* Centered White Card with subtle shadows */}
                  <div className="relative w-full max-w-sm bg-white rounded-xl shadow-lg border border-[#171e19]/10 p-6 min-h-[350px] flex flex-col justify-between overflow-hidden">
                    
                    {/* Dynamic Forensic Watermark Overlay across Canvas */}
                    <div
                      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                      style={{ opacity: watermarkOpacity / 100 }}
                    >
                      <div
                        className="transform font-anton text-2xl tracking-widest text-[#171e19] uppercase whitespace-nowrap leading-none select-none text-center"
                        style={{ transform: `rotate(-${watermarkAngle}deg)` }}
                      >
                        CONFIDENTIAL // SARAH.K@APEX.VC<br />
                        FLUX FORENSIC DRM // 192.168.1.104<br />
                        TIMESTAMP: 2026-10-28 12:38:21 UTC
                      </div>
                    </div>

                    {/* Simulated Document Content */}
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3 border-[#171e19]/10">
                        <div className="font-anton text-sm uppercase text-[#171e19]">
                          FLUX VENTURES INC.
                        </div>
                        <span className="font-mono text-[10px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                          STRICT CONFIDENTIAL
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="h-4 bg-[#171e19]/10 rounded w-3/4"></div>
                        <div className="h-3 bg-[#171e19]/10 rounded w-full"></div>
                        <div className="h-3 bg-[#171e19]/10 rounded w-5/6"></div>
                        <div className="h-3 bg-[#171e19]/10 rounded w-4/5"></div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#ffe17c]/15 border border-[#ffe17c] space-y-1">
                        <div className="text-[10px] font-anton tracking-wide uppercase text-[#171e19]">
                          SCHEDULE A: VALUATION MATRIX
                        </div>
                        <div className="h-2.5 bg-[#171e19]/15 rounded w-full"></div>
                        <div className="h-2.5 bg-[#171e19]/15 rounded w-2/3"></div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="h-3 bg-[#171e19]/10 rounded w-full"></div>
                        <div className="h-3 bg-[#171e19]/10 rounded w-4/6"></div>
                      </div>
                    </div>

                    {/* Document Footer */}
                    <div className="relative z-10 pt-4 border-t border-[#171e19]/10 flex items-center justify-between text-[10px] font-mono text-[#171e19]/50">
                      <span>PAGE 3 OF 3</span>
                      <span>SECURE FLUX CANVAS</span>
                    </div>

                    {/* Floating Cursor Icon with User Name Label */}
                    <div className="absolute top-1/2 right-8 z-30 transform -translate-y-4 pointer-events-none animate-pulse">
                      <div className="flex items-start gap-1">
                        {/* Custom Pointer SVG */}
                        <svg className="w-5 h-5 text-[#171e19] drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.428z" />
                        </svg>
                        {/* Label Badge */}
                        <div className="bg-[#171e19] text-[#ffe17c] text-xs font-bold font-satoshi px-2.5 py-1 rounded-md shadow-xl flex items-center gap-1.5 whitespace-nowrap">
                          <span>Sarah K. (Viewing Page 3)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Properties Panel (Col span 3) */}
                <div className="md:col-span-3 border-l border-[#171e19]/10 bg-white p-4 flex flex-col justify-between">
                  <div className="space-y-6">
                    {/* font-display titles */}
                    <div className="pb-3 border-b border-[#171e19]/10">
                      <h4 className="font-anton text-lg tracking-wide uppercase text-[#171e19]">
                        PROPERTIES
                      </h4>
                      <p className="font-satoshi text-[11px] text-[#171e19]/50">
                        Dynamic rasterization parameters
                      </p>
                    </div>

                    {/* Mini alignment icons */}
                    <div>
                      <label className="font-anton text-xs uppercase tracking-wider text-[#171e19] block mb-2">
                        WATERMARK ALIGNMENT
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-[#171e19]/5 p-1 rounded-lg">
                        <button
                          onClick={() => setSelectedAlignment('left')}
                          className={`p-2 rounded flex items-center justify-center transition-all ${
                            selectedAlignment === 'left' ? 'bg-white shadow text-[#171e19]' : 'text-[#171e19]/50 hover:text-[#171e19]'
                          }`}
                          title="Align Left"
                        >
                          <AlignLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedAlignment('center')}
                          className={`p-2 rounded flex items-center justify-center transition-all ${
                            selectedAlignment === 'center' ? 'bg-white shadow text-[#171e19]' : 'text-[#171e19]/50 hover:text-[#171e19]'
                          }`}
                          title="Align Center"
                        >
                          <AlignCenter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedAlignment('right')}
                          className={`p-2 rounded flex items-center justify-center transition-all ${
                            selectedAlignment === 'right' ? 'bg-white shadow text-[#171e19]' : 'text-[#171e19]/50 hover:text-[#171e19]'
                          }`}
                          title="Align Right"
                        >
                          <AlignRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Hex Color Swatch (#FFE17C) */}
                    <div>
                      <label className="font-anton text-xs uppercase tracking-wider text-[#171e19] block mb-2">
                        ACCENT SWATCH
                      </label>
                      <button
                        onClick={handleCopyHex}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#171e19]/10 bg-[#fafafa] hover:border-[#171e19]/30 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded bg-[#ffe17c] border border-black/10 shadow-sm"></div>
                          <span className="font-mono text-xs font-bold text-[#171e19]">#FFE17C</span>
                        </div>
                        <span className="font-satoshi text-[11px] text-[#171e19]/60 font-medium flex items-center gap-1 group-hover:text-[#171e19]">
                          {copiedHex ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Hex
                            </>
                          )}
                        </span>
                      </button>
                    </div>

                    {/* Interactive Opacity Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-anton text-xs uppercase tracking-wider text-[#171e19]">
                          STAMP OPACITY
                        </label>
                        <span className="font-mono text-xs font-bold text-[#171e19]">{watermarkOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                        className="w-full accent-[#171e19] cursor-pointer"
                      />
                    </div>

                    {/* Interactive Angle Buttons */}
                    <div>
                      <label className="font-anton text-xs uppercase tracking-wider text-[#171e19] block mb-2">
                        ROTATION ANGLE
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[15, 30, 45].map((angle) => (
                          <button
                            key={angle}
                            onClick={() => setWatermarkAngle(angle)}
                            className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                              watermarkAngle === angle
                                ? 'bg-[#ffe17c] text-[#171e19] shadow-sm'
                                : 'bg-[#171e19]/5 text-[#171e19]/70 hover:bg-[#171e19]/10'
                            }`}
                          >
                            {angle}°
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Kill Switch Toggle */}
                  <div className="pt-4 border-t border-[#171e19]/10">
                    <button
                      onClick={() => setKillSwitchRevoked(!killSwitchRevoked)}
                      className={`w-full py-2.5 px-3 rounded-lg font-anton text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        killSwitchRevoked
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-[#171e19] text-[#ffe17c] hover:bg-black'
                      }`}
                    >
                      {killSwitchRevoked ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" /> ACCESS REVOKED (LOCKED)
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-[#ffe17c]" /> SIMULATE KILL SWITCH
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. PROBLEM-SOLUTION CONTRAST
          Full-width section with two distinct halves.
          Left half (Problem): bg-#charcoal, text-white, features 'THE OLD WAY' in Anton with muted sage text and red 'x' icons.
          Right half (Solution): bg-#272727 with a yellow accent border, features 'THE FLUX WAY' in Anton with yellow 'check-circle' icons and crisp white text.
          Layout uses flex-start vertical alignment.
      ========================================================================= */}
      <section id="comparison" className="w-full border-b border-[#171e19]/10">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          {/* Left Half: Problem (bg-#charcoal, text-white) */}
          <div className="bg-[#171e19] text-white p-10 sm:p-14 lg:p-20 flex flex-col items-start justify-start">
            <div className="w-full">
              <span className="font-mono text-xs uppercase tracking-widest text-[#b7c6c2] font-semibold block mb-3">
                CRITICAL VULNERABILITY
              </span>
              <h2 className="font-anton text-5xl sm:text-6xl lg:text-7xl uppercase tracking-normal leading-[0.9] text-white mb-8">
                THE OLD WAY
              </h2>
              <p className="font-satoshi text-base sm:text-lg text-[#b7c6c2] leading-relaxed mb-10 max-w-xl">
                Legacy document sharing tools treat confidential files like downloadable commodities, giving recipients complete unmonitored ownership the second they click a link.
              </p>

              <div className="space-y-6 max-w-xl">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400 font-bold text-lg mt-0.5">
                    ✕
                  </div>
                  <div>
                    <h3 className="font-anton text-xl uppercase tracking-wide text-white">
                      RAW FILE ATTACHMENTS
                    </h3>
                    <p className="font-satoshi text-sm text-[#b7c6c2] mt-1 leading-relaxed">
                      Emailed PDFs and Dropbox links download raw binary files straight to disk, where they linger forever on unencrypted downloads folders and personal backups.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400 font-bold text-lg mt-0.5">
                    ✕
                  </div>
                  <div>
                    <h3 className="font-anton text-xl uppercase tracking-wide text-white">
                      ZERO LEAK ATTRIBUTION
                    </h3>
                    <p className="font-satoshi text-sm text-[#b7c6c2] mt-1 leading-relaxed">
                      Unmarked pages can be screenshotted or printed freely. When a deck leaks to competitors or press, you have zero cryptographic evidence of who originated it.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400 font-bold text-lg mt-0.5">
                    ✕
                  </div>
                  <div>
                    <h3 className="font-anton text-xl uppercase tracking-wide text-white">
                      IRREVOCABLE EXPOSURE
                    </h3>
                    <p className="font-satoshi text-sm text-[#b7c6c2] mt-1 leading-relaxed">
                      Once a link is copied into a group chat or forwarded outside an NDA circle, there is no kill switch to pull the document back from the wild.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Half: Solution (bg-#272727 with a yellow accent border) */}
          <div className="bg-[#272727] border-t-4 lg:border-t-0 lg:border-l-4 border-[#ffe17c] p-10 sm:p-14 lg:p-20 flex flex-col items-start justify-start text-white">
            <div className="w-full">
              <span className="font-mono text-xs uppercase tracking-widest text-[#ffe17c] font-semibold block mb-3">
                CRYPTO-ENGINEERED ARCHITECTURE
              </span>
              <h2 className="font-anton text-5xl sm:text-6xl lg:text-7xl uppercase tracking-normal leading-[0.9] text-white mb-8">
                THE FLUX WAY
              </h2>
              <p className="font-satoshi text-base sm:text-lg text-white/90 leading-relaxed mb-10 max-w-xl">
                Flux operates on a strict Zero-Trust principle: raw files are sealed in AES-256 envelope vaults, and recipients stream only live, watermarked raster canvases.
              </p>

              <div className="space-y-6 max-w-xl">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ffe17c]/20 border border-[#ffe17c]/40 flex items-center justify-center shrink-0 text-[#ffe17c] font-bold text-lg mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-anton text-xl uppercase tracking-wide text-white">
                      AES-256-GCM ENVELOPE ENCRYPTION
                    </h3>
                    <p className="font-satoshi text-sm text-white/80 mt-1 leading-relaxed">
                      Every file generates a distinct 256-bit DEK in RAM. Ciphertext is stored with 128-bit GCM authentication tags, wrapped with the server Master Key.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ffe17c]/20 border border-[#ffe17c]/40 flex items-center justify-center shrink-0 text-[#ffe17c] font-bold text-lg mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-anton text-xl uppercase tracking-wide text-white">
                      FORENSIC DYNAMIC WATERMARKING
                    </h3>
                    <p className="font-satoshi text-sm text-white/80 mt-1 leading-relaxed">
                      Every single rendered canvas permanently composites the recipient's email, IP address, and UTC viewing timestamp across every page diagonally.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ffe17c]/20 border border-[#ffe17c]/40 flex items-center justify-center shrink-0 text-[#ffe17c] font-bold text-lg mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-anton text-xl uppercase tracking-wide text-white">
                      SUB-200MS GLOBAL KILL-SWITCH
                    </h3>
                    <p className="font-satoshi text-sm text-white/80 mt-1 leading-relaxed">
                      Revoke token permissions in one click. Active viewers are immediately disconnected and cached images are rendered invalid instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BENTO FEATURE GRID
          3-column grid layout with auto-rows (400px).
          Feature 1 & 4 span 2 columns.
          Cards use #f8f9fa backgrounds or #171e19 for contrast.
          Abstract UI elements: animated pulse blocks, code snippets in bg-dark, avatar stacks.
          Card headers use 'Anton' 3xl.
          Micro-interactions: 300ms cubic-bezier(0.4, 0, 0.2, 1) transitions.
      ========================================================================= */}
      <section id="features" className="py-24 sm:py-32 bg-white border-b border-[#171e19]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-[#171e19]/60 font-semibold block mb-2">
              HARDENED INFRASTRUCTURE
            </span>
            <h2 className="font-anton text-5xl sm:text-6xl uppercase tracking-normal leading-[0.9] text-[#171e19]">
              ENGINEERED TO PREVENT THE LEAK
            </h2>
            <p className="font-satoshi text-lg text-[#171e19]/70 mt-4 font-medium">
              Every layer of the Flux engine is built for ruthless data containment and high-velocity B2C document workflows.
            </p>
          </div>

          {/* 3-Column Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr lg:auto-rows-[430px]">
            
            {/* -------------------------------------------------------------
                BENTO CARD 1 (Spans 2 columns, #171e19 dark card)
                Feature: Cryptographic Handshake & Envelope Storage
            ------------------------------------------------------------- */}
            <div className="lg:col-span-2 bg-[#171e19] text-white rounded-2xl p-8 sm:p-10 brutalist-card-dark flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs uppercase text-[#ffe17c] tracking-widest font-bold">
                    [01] CRYPTOGRAPHIC PRIMITIVE
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-mono text-[10px] text-[#b7c6c2]">MEMORY ENCRYPTED</span>
                  </div>
                </div>
                <h3 className="font-anton text-3xl sm:text-4xl uppercase tracking-normal text-white">
                  REAL-TIME AES-256-GCM ENVELOPE ENCRYPTION
                </h3>
                <p className="font-satoshi text-sm sm:text-base text-[#b7c6c2] mt-2 max-w-xl font-normal">
                  Plaintext documents never touch disk. When uploaded, a fresh 256-bit DEK and 96-bit nonce seal the document in memory before wrapping with the server Master Key.
                </p>
              </div>

              {/* Abstract UI: Code snippet in bg-dark */}
              <div className="mt-6 bg-[#0a0f0c] border border-[#b7c6c2]/10 rounded-xl p-4 font-mono text-xs text-[#b7c6c2] relative z-10 shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#ffe17c]" /> lib/crypto/envelope.js
                  </span>
                  <span>AES-256-GCM-AUTH</span>
                </div>
                <pre className="overflow-x-auto text-[11px] leading-relaxed text-[#b7c6c2]">
                  <code>
                    <span className="text-purple-400">const</span> dek = crypto.<span className="text-[#ffe17c]">randomBytes</span>(32);<br />
                    <span className="text-purple-400">const</span> cipher = crypto.<span className="text-[#ffe17c]">createCipheriv</span>('aes-256-gcm', dek, nonce);<br />
                    <span className="text-emerald-400">// In-memory encryption & 128-bit authentication tag</span><br />
                    <span className="text-purple-400">const</span> authTag = cipher.<span className="text-[#ffe17c]">getAuthTag</span>();<br />
                    <span className="text-purple-400">const</span> wrappedDek = <span className="text-[#ffe17c]">wrapWithMasterKey</span>(dek, MASTER_KEY);
                  </code>
                </pre>
              </div>
            </div>

            {/* -------------------------------------------------------------
                BENTO CARD 2 (Spans 1 column, #f8f9fa light card)
                Feature: Dynamic Forensic Watermark
            ------------------------------------------------------------- */}
            <div className="bg-[#f8f9fa] text-[#171e19] rounded-2xl p-8 brutalist-card-light flex flex-col justify-between overflow-hidden relative">
              <div>
                <span className="font-mono text-xs uppercase text-[#171e19]/60 tracking-widest font-bold block mb-3">
                  [02] WATERMARK ENGINE
                </span>
                <h3 className="font-anton text-3xl uppercase tracking-normal text-[#171e19]">
                  FORENSIC WATERMARK
                </h3>
                <p className="font-satoshi text-sm text-[#171e19]/70 mt-2 font-normal">
                  Composite viewer identity directly on rasterized page images to deter unauthorized screenshots and redistribution.
                </p>
              </div>

              {/* Abstract UI: Animated pulse blocks & dynamic watermark box */}
              <div className="mt-6 p-4 rounded-xl bg-white border border-[#171e19]/10 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#171e19]">
                    <Sparkles className="w-3.5 h-3.5 text-[#ffe17c]" /> LIVE STAMP
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#ffe17c] animate-ping"></span>
                </div>

                <div className="h-20 bg-[#171e19]/5 rounded border border-[#171e19]/10 relative flex items-center justify-center overflow-hidden">
                  <span className="font-anton text-base tracking-wider text-[#171e19]/30 uppercase -rotate-12 select-none">
                    USER@ACME.COM // 192.168.1.1
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[#171e19]/60">
                  <span>Server Raster: <strong>Sharp v0.33</strong></span>
                  <span>Latency: <strong>18ms</strong></span>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                BENTO CARD 3 (Spans 1 column, #f8f9fa light card)
                Feature: Zero-Trust Recipient Verification & Avatar Stacks
            ------------------------------------------------------------- */}
            <div className="bg-[#f8f9fa] text-[#171e19] rounded-2xl p-8 brutalist-card-light flex flex-col justify-between overflow-hidden relative">
              <div>
                <span className="font-mono text-xs uppercase text-[#171e19]/60 tracking-widest font-bold block mb-3">
                  [03] RECIPIENT CHALLENGE
                </span>
                <h3 className="font-anton text-3xl uppercase tracking-normal text-[#171e19]">
                  ZERO-TRUST AUTH
                </h3>
                <p className="font-satoshi text-sm text-[#171e19]/70 mt-2 font-normal">
                  Each link requires recipient email challenge verification before serving even the first watermarked page thumbnail.
                </p>
              </div>

              {/* Abstract UI: Avatar stack & verification pills */}
              <div className="mt-6 p-4 rounded-xl bg-white border border-[#171e19]/10 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#171e19]">VERIFIED AUDIENCE</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    VALIDATED
                  </span>
                </div>

                {/* Avatar Stack */}
                <div className="flex items-center -space-x-2">
                  <div className="w-9 h-9 rounded-full bg-[#171e19] text-white flex items-center justify-center font-anton text-xs border-2 border-white">
                    JD
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#272727] text-[#ffe17c] flex items-center justify-center font-anton text-xs border-2 border-white">
                    SK
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#ffe17c] text-[#171e19] flex items-center justify-center font-anton text-xs border-2 border-white font-bold">
                    MA
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-[#171e19] flex items-center justify-center font-mono text-[10px] border-2 border-white font-bold">
                    +18
                  </div>
                </div>

                <div className="p-2 rounded bg-[#171e19]/5 border border-[#171e19]/10 text-[11px] font-mono flex items-center justify-between">
                  <span className="truncate text-[#171e19]/80">token_hash: sha256(...)</span>
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                BENTO CARD 4 (Spans 2 columns, #171e19 dark card)
                Feature: Forensic Audit Telemetry & Instant Revocation
            ------------------------------------------------------------- */}
            <div className="lg:col-span-2 bg-[#171e19] text-white rounded-2xl p-8 sm:p-10 brutalist-card-dark flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs uppercase text-[#ffe17c] tracking-widest font-bold">
                    [04] DEFENSIVE TELEMETRY
                  </span>
                  <span className="font-mono text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                    GLOBAL REVO-SYNC
                  </span>
                </div>
                <h3 className="font-anton text-3xl sm:text-4xl uppercase tracking-normal text-white">
                  FORENSIC TELEMETRY & KILL-SWITCH
                </h3>
                <p className="font-satoshi text-sm sm:text-base text-[#b7c6c2] mt-2 max-w-xl font-normal">
                  Track every page render with recipient IP, geolocation, user agent, and timestamp. Terminate access globally with one click in sub-200 milliseconds.
                </p>
              </div>

              {/* Abstract UI: Live audit timeline stream */}
              <div className="mt-6 bg-[#0a0f0c] border border-[#b7c6c2]/10 rounded-xl p-4 font-mono text-xs text-[#b7c6c2] relative z-10 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[10px] text-white/50">
                  <span>LIVE ACCESS STREAM</span>
                  <span className="text-[#ffe17c]">● REALTIME DISPATCH</span>
                </div>

                <div className="flex items-center justify-between text-[11px] py-1 border-b border-white/5">
                  <span className="text-white">Page 1 Rendered</span>
                  <span className="text-[#ffe17c]">sarah.k@apex.vc</span>
                  <span className="text-[#b7c6c2]/60">12:38:19 UTC</span>
                  <span className="text-emerald-400">200 OK</span>
                </div>

                <div className="flex items-center justify-between text-[11px] py-1 border-b border-white/5">
                  <span className="text-white">Page 2 Rendered</span>
                  <span className="text-[#ffe17c]">sarah.k@apex.vc</span>
                  <span className="text-[#b7c6c2]/60">12:38:20 UTC</span>
                  <span className="text-emerald-400">200 OK</span>
                </div>

                <div className="flex items-center justify-between text-[11px] py-1">
                  <span className="text-white">Page 3 Rendered</span>
                  <span className="text-[#ffe17c]">sarah.k@apex.vc</span>
                  <span className="text-[#b7c6c2]/60">12:38:21 UTC</span>
                  <span className="text-emerald-400 font-bold">ACTIVE VIEW</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          6. HOW IT WORKS
          Two-column layout (1:2 ratio).
          Left column: Sticky 'Anton' title (text-7xl).
          Right column: Vertical stack of three steps.
          Each step features a massive 8xl numeral in #ffe17c/20% that changes to full opacity on hover,
          paired with 'Anton' titles and 'Satoshi' descriptions.
      ========================================================================= */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-white border-b border-[#171e19]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column (1:2 ratio => 4 cols out of 12) - Sticky 'Anton' title */}
            <div className="lg:col-span-4 lg:sticky lg:top-28">
              <span className="font-mono text-xs uppercase tracking-widest text-[#171e19]/60 font-semibold block mb-3">
                THE 3-STEP PIPELINE
              </span>
              <h2 className="font-anton text-6xl sm:text-7xl lg:text-8xl uppercase tracking-normal leading-[0.9] text-[#171e19]">
                HOW IT WORKS
              </h2>
              <p className="font-satoshi text-base sm:text-lg text-[#171e19]/70 mt-6 leading-relaxed font-medium">
                Eliminate the risk of leaked decks and sensitive contracts without introducing clunky friction for legitimate recipients.
              </p>
              <div className="mt-8 pt-8 border-t border-[#171e19]/10">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 font-anton text-lg uppercase tracking-wide bg-[#171e19] text-white px-6 py-3 rounded-lg hover:bg-black transition-all"
                >
                  <span>Start Sending Safely</span>
                  <ArrowRight className="w-4 h-4 text-[#ffe17c]" />
                </Link>
              </div>
            </div>

            {/* Right Column (2 parts => 8 cols out of 12) - Vertical stack of 3 steps */}
            <div className="lg:col-span-8 flex flex-col gap-10">
              
              {/* Step 01 */}
              <div className="group border border-[#171e19]/10 p-8 sm:p-10 rounded-2xl bg-white brutalist-card-light relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                  <div className="flex-1">
                    <span className="font-mono text-xs uppercase text-[#171e19]/50 tracking-widest font-bold block mb-2">
                      STEP 01
                    </span>
                    <h3 className="font-anton text-3xl sm:text-4xl uppercase tracking-normal text-[#171e19] mb-4">
                      DROP & ENCRYPT IN PROTECTED RAM
                    </h3>
                    <p className="font-satoshi text-base sm:text-lg text-[#171e19]/75 leading-relaxed font-medium">
                      Drag and drop your confidential PDF or deck. Our engine generates a unique 256-bit DEK, performs authenticated AES-GCM envelope encryption, and stores only ciphertext.
                    </p>
                  </div>
                  {/* Massive 8xl numeral in #ffe17c/20% that turns full opacity on hover */}
                  <span className="font-anton text-7xl sm:text-8xl lg:text-9xl text-[#ffe17c]/20 group-hover:text-[#ffe17c] transition-colors duration-300 leading-none select-none shrink-0">
                    01
                  </span>
                </div>
              </div>

              {/* Step 02 */}
              <div className="group border border-[#171e19]/10 p-8 sm:p-10 rounded-2xl bg-white brutalist-card-light relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                  <div className="flex-1">
                    <span className="font-mono text-xs uppercase text-[#171e19]/50 tracking-widest font-bold block mb-2">
                      STEP 02
                    </span>
                    <h3 className="font-anton text-3xl sm:text-4xl uppercase tracking-normal text-[#171e19] mb-4">
                      SET ACCESS POLICIES & FORENSIC STAMP
                    </h3>
                    <p className="font-satoshi text-base sm:text-lg text-[#171e19]/75 leading-relaxed font-medium">
                      Restrict links to specific recipient email addresses, enforce strict UTC expiry countdowns, and customize diagonal watermark placement with recipient IP and timestamps.
                    </p>
                  </div>
                  {/* Massive 8xl numeral in #ffe17c/20% that turns full opacity on hover */}
                  <span className="font-anton text-7xl sm:text-8xl lg:text-9xl text-[#ffe17c]/20 group-hover:text-[#ffe17c] transition-colors duration-300 leading-none select-none shrink-0">
                    02
                  </span>
                </div>
              </div>

              {/* Step 03 */}
              <div className="group border border-[#171e19]/10 p-8 sm:p-10 rounded-2xl bg-white brutalist-card-light relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                  <div className="flex-1">
                    <span className="font-mono text-xs uppercase text-[#171e19]/50 tracking-widest font-bold block mb-2">
                      STEP 03
                    </span>
                    <h3 className="font-anton text-3xl sm:text-4xl uppercase tracking-normal text-[#171e19] mb-4">
                      STREAM RASTERIZED WATERMARKED PAGES
                    </h3>
                    <p className="font-satoshi text-base sm:text-lg text-[#171e19]/75 leading-relaxed font-medium">
                      Recipients stream dynamically generated page images without ever downloading the raw PDF binary. Revoke access globally in under 200 milliseconds anytime.
                    </p>
                  </div>
                  {/* Massive 8xl numeral in #ffe17c/20% that turns full opacity on hover */}
                  <span className="font-anton text-7xl sm:text-8xl lg:text-9xl text-[#ffe17c]/20 group-hover:text-[#ffe17c] transition-colors duration-300 leading-none select-none shrink-0">
                    03
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. SPECIAL COMPONENT: TESTIMONIAL HIGH-CONTRAST CARDS
          Alternating light and dark review cards with oversized star icons.
          Grid of 3 cards.
          Center card: bg-#171e19, text-white, 4px vertical offset (translate-y-4).
          Side cards: bg-white, border-charcoal/10.
          Each includes:
          - 5 star icons in #ffe17c
          - Satoshi-medium body text (lg)
          - Avatar footer: 12x12 (48px) with grayscale filters and 'Anton' uppercase names.
      ========================================================================= */}
      <section id="testimonials" className="py-24 sm:py-32 bg-[#fafafa] border-b border-[#171e19]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-[#171e19]/60 font-semibold block mb-2">
              PROVEN IN PRODUCTION
            </span>
            <h2 className="font-anton text-5xl sm:text-6xl uppercase tracking-normal leading-[0.9] text-[#171e19]">
              TRUSTED BY FOUNDERS & INVESTORS
            </h2>
            <p className="font-satoshi text-lg text-[#171e19]/70 mt-4 font-medium">
              Over 14,000 confidential pitch decks, M&A models, and legal contracts shared with zero reported leaks.
            </p>
          </div>

          {/* Grid of 3 High-Contrast Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            
            {/* Card 1: Side Card (bg-white, border-charcoal/10) */}
            <div className="bg-white border border-[#171e19]/10 text-[#171e19] p-8 sm:p-10 rounded-2xl brutalist-card-light shadow-sm flex flex-col justify-between min-h-[380px]">
              <div>
                {/* 5 Star Icons in #ffe17c */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-[#ffe17c] text-[#ffe17c]" />
                  ))}
                </div>
                {/* Satoshi-medium body text (lg) */}
                <p className="font-satoshi font-medium text-lg leading-relaxed text-[#171e19]">
                  "Flux replaced DocSend for our Series B raise. The high-contrast aesthetic and dynamic watermark prevented our cap table from being leaked to competitors."
                </p>
              </div>

              {/* Avatar footer: 12x12 (48px) with grayscale filter and 'Anton' uppercase name */}
              <div className="mt-8 pt-6 border-t border-[#171e19]/10 flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="ELENA ROSTOVA"
                  className="w-12 h-12 rounded-full object-cover grayscale border border-[#171e19]/20 shrink-0"
                />
                <div>
                  <div className="font-anton text-lg tracking-wide uppercase text-[#171e19]">
                    ELENA ROSTOVA
                  </div>
                  <div className="font-satoshi text-xs font-medium text-[#171e19]/60">
                    VP of Product, Apex Media
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Center Card (bg-#171e19, text-white, translate-y-4 vertical offset) */}
            <div className="bg-[#171e19] text-white p-8 sm:p-10 rounded-2xl brutalist-card-dark shadow-2xl flex flex-col justify-between min-h-[410px] md:translate-y-4 border border-[#b7c6c2]/10 relative">
              
              {/* Highlight Ribbon */}
              <div className="absolute -top-3 left-8 bg-[#ffe17c] text-[#171e19] text-[10px] font-anton tracking-wider uppercase px-3 py-1 rounded-full shadow-md font-bold">
                VENTURE CAPITAL PARTNER
              </div>

              <div>
                {/* 5 Star Icons in #ffe17c */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-[#ffe17c] text-[#ffe17c]" />
                  ))}
                </div>
                {/* Satoshi-medium body text (lg) */}
                <p className="font-satoshi font-medium text-lg leading-relaxed text-white">
                  "Streaming watermarked page images instead of raw PDFs gives our LP deals complete protection. The instant 1-click revocation actually works within milliseconds."
                </p>
              </div>

              {/* Avatar footer: 12x12 (48px) with grayscale filter and 'Anton' uppercase name */}
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt="MARCUS VANCE"
                  className="w-12 h-12 rounded-full object-cover grayscale border border-white/20 shrink-0"
                />
                <div>
                  <div className="font-anton text-lg tracking-wide uppercase text-white">
                    MARCUS VANCE
                  </div>
                  <div className="font-satoshi text-xs font-medium text-[#b7c6c2]">
                    Managing Partner, Vance Capital
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Side Card (bg-white, border-charcoal/10) */}
            <div className="bg-white border border-[#171e19]/10 text-[#171e19] p-8 sm:p-10 rounded-2xl brutalist-card-light shadow-sm flex flex-col justify-between min-h-[380px]">
              <div>
                {/* 5 Star Icons in #ffe17c */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-[#ffe17c] text-[#ffe17c]" />
                  ))}
                </div>
                {/* Satoshi-medium body text (lg) */}
                <p className="font-satoshi font-medium text-lg leading-relaxed text-[#171e19]">
                  "The cryptographic implementation is rock solid. Authenticated AES-GCM envelope sealing combined with server-rasterized delivery is how all confidential sharing should be done."
                </p>
              </div>

              {/* Avatar footer: 12x12 (48px) with grayscale filter and 'Anton' uppercase name */}
              <div className="mt-8 pt-6 border-t border-[#171e19]/10 flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
                  alt="DR. TARIQ AL-MANSOOR"
                  className="w-12 h-12 rounded-full object-cover grayscale border border-[#171e19]/20 shrink-0"
                />
                <div>
                  <div className="font-anton text-lg tracking-wide uppercase text-[#171e19]">
                    TARIQ AL-MANSOOR
                  </div>
                  <div className="font-satoshi text-xs font-medium text-[#171e19]/60">
                    Lead Cryptography Architect, CypherLabs
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FINAL CTA
          High-impact section with bg-#ffe17c.
          Background decorative elements: massive 'Anton' text overlays with 10% opacity.
          Centralized stack:
          - Anton headline (8xl, leading-0.9)
          - Satoshi subtext (2xl, max-w-2xl)
          - Large centered form with input and button (bg-charcoal, shadow-xl, hover:scale-105).
      ========================================================================= */}
      <section className="bg-[#ffe17c] text-[#171e19] relative overflow-hidden py-24 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[#171e19]/10">
        
        {/* Massive 'Anton' text overlays with 10% opacity */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none opacity-10 font-anton text-8xl sm:text-9xl uppercase tracking-tighter leading-none whitespace-nowrap overflow-hidden text-[#171e19]">
          <div className="transform -translate-x-12">
            ZERO LEAKS // ENCRYPTED ENVELOPE // RASTER STREAM // ZERO TRUST //
          </div>
          <div className="transform translate-x-16">
            AES-256-GCM // HARDENED VAULT // 200MS KILL SWITCH // FLUX TRANSFER //
          </div>
        </div>

        {/* Centralized Stack */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Anton headline (8xl, leading-0.9) */}
          <h2 className="font-anton text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-normal leading-[0.9] text-[#171e19]">
            START STREAMING WITHOUT THE LEAKS
          </h2>

          {/* Satoshi subtext (2xl, max-w-2xl) */}
          <p className="font-satoshi text-xl sm:text-2xl text-[#171e19]/80 max-w-2xl mx-auto font-medium mt-8 leading-relaxed">
            Join thousands of founders and operators sharing confidential files with forensic watermarking and zero raw binary exposure.
          </p>

          {/* Large centered form with input and button (bg-charcoal, shadow-xl, hover:scale-105) */}
          <div className="mt-12 max-w-xl mx-auto">
            {!bottomSubmitted ? (
              <form
                onSubmit={handleBottomSubmit}
                className="bg-[#171e19] text-white p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 transition-transform duration-300 hover:scale-105"
              >
                <input
                  type="email"
                  value={bottomEmail}
                  onChange={(e) => setBottomEmail(e.target.value)}
                  placeholder="Enter your email to deploy..."
                  required
                  className="font-satoshi bg-transparent text-white px-5 py-4 placeholder-[#b7c6c2]/60 focus:outline-none flex-1 text-base font-medium"
                />
                <button
                  type="submit"
                  className="font-anton text-xl uppercase tracking-wide bg-[#ffe17c] text-[#171e19] px-8 py-4 rounded-xl hover:brightness-105 active:scale-95 transition-all shadow-md whitespace-nowrap"
                >
                  GET STARTED NOW
                </button>
              </form>
            ) : (
              <div className="bg-[#171e19] text-white p-6 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
                <div className="text-left">
                  <div className="font-anton text-xl uppercase text-[#ffe17c]">
                    ACCESS KEY ISSUED!
                  </div>
                  <p className="font-satoshi text-xs text-[#b7c6c2] mt-0.5">
                    Your account is provisioned for encrypted file transfers.
                  </p>
                </div>
                <Link
                  to="/register"
                  className="bg-[#ffe17c] text-[#171e19] px-6 py-3 rounded-xl font-anton text-sm uppercase tracking-wide whitespace-nowrap hover:brightness-105"
                >
                  Enter Console →
                </Link>
              </div>
            )}

            <p className="font-satoshi text-xs text-[#171e19]/60 font-semibold mt-4">
              Instant setup • Open-source cryptographic core • SOC-2 ready
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. EDITORIAL FOOTER
          Dark background (#171e19), Anton logo with yellow period, Satoshi navigation.
      ========================================================================= */}
      <footer className="bg-[#171e19] text-[#b7c6c2] py-16 px-4 sm:px-6 lg:px-8 border-t border-[#b7c6c2]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          
          <div className="space-y-4 max-w-sm">
            <Link to="/" className="inline-block">
              <span className="font-anton text-3xl uppercase tracking-normal text-white leading-none">
                FLUX<span className="text-[#ffe17c]">.</span>
              </span>
            </Link>
            <p className="font-satoshi text-sm text-[#b7c6c2] leading-relaxed">
              High-contrast editorial B2C secure file transfer. Built with in-memory AES-256-GCM envelope encryption and server-rendered dynamic watermarking.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffe17c] animate-pulse"></span>
              <span className="font-mono text-xs text-white">ALL SYSTEMS NOMINAL // GCM-OK</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm font-satoshi">
            <div>
              <div className="font-anton text-sm uppercase text-white tracking-wider mb-4">
                PLATFORM
              </div>
              <ul className="space-y-2.5 text-xs text-[#b7c6c2]">
                <li><a href="#features" className="hover:text-white transition-colors">Envelope Encryption</a></li>
                <li><a href="#mockup" className="hover:text-white transition-colors">Dynamic Watermark</a></li>
                <li><a href="#comparison" className="hover:text-white transition-colors">Zero-Trust Protocol</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">Workflow</a></li>
              </ul>
            </div>

            <div>
              <div className="font-anton text-sm uppercase text-white tracking-wider mb-4">
                ACCESS
              </div>
              <ul className="space-y-2.5 text-xs text-[#b7c6c2]">
                <li><Link to="/login" className="hover:text-white transition-colors">Sender Console</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Vault Dashboard</Link></li>
                <li><Link to="/shares" className="hover:text-white transition-colors">Active Share Links</Link></li>
              </ul>
            </div>

            <div>
              <div className="font-anton text-sm uppercase text-white tracking-wider mb-4">
                SECURITY
              </div>
              <ul className="space-y-2.5 text-xs text-[#b7c6c2]">
                <li><span className="text-white">AES-256-GCM</span></li>
                <li><span className="text-white">SHA-256 Hashes</span></li>
                <li><span className="text-white">Master Envelope</span></li>
                <li><span className="text-white">Sharp Rasterizer</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs font-satoshi text-[#b7c6c2]/60 gap-4">
          <p>© {new Date().getFullYear()} FLUX / SecureShare Technologies. All cryptographic rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Security Disclosure</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Protocol</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
