import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { viewerService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AccessDenied from './AccessDenied';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Lock,
  Clock,
  Eye,
  AlertTriangle,
  UserCheck,
  LogOut,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function ProtectedViewer() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // State
  const [shareInfo, setShareInfo] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [pageImageUrl, setPageImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [denialState, setDenialState] = useState(null); // { reason, details }
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Screenshot & Capture Prevention States
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [isScreenBlanked, setIsScreenBlanked] = useState(false);

  const viewerContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const loadedImgRef = useRef(null);

  const showSecurityNotice = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Synchronously wipe canvas pixels to solid background
  const blankCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#171e19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Draw watermarked image onto canvas with export security guards
  const drawCanvas = (img) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    canvas.toDataURL = () => {
      throw new Error('Security Exception: Canvas export prohibited by DRM policy.');
    };
    canvas.toBlob = () => {
      throw new Error('Security Exception: Canvas export prohibited by DRM policy.');
    };
  };

  // Restore protected document view
  const restoreProtectedView = () => {
    document.body.classList.remove('drm-screen-blanked');
    setIsWindowBlurred(false);
    setIsScreenBlanked(false);
    if (loadedImgRef.current) {
      drawCanvas(loadedImgRef.current);
    }
  };

  // 1. Window Blur & Visibility Shield (Deters Snipping Tool & external capture software)
  useEffect(() => {
    const handleBlur = () => {
      blankCanvas();
      document.body.classList.add('drm-screen-blanked');
      setIsWindowBlurred(true);
    };

    const handleFocus = () => {
      // Keep shield up until deliberate click to restore or restore if no violation
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        blankCanvas();
        document.body.classList.add('drm-screen-blanked');
        setIsWindowBlurred(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.classList.remove('drm-screen-blanked');
    };
  }, []);

  // 2. Keyboard Interception, Clipboard Sanitization, Copy Suppression & Telemetry
  useEffect(() => {
    const triggerViolation = (type, triggerKey) => {
      blankCanvas();
      document.body.classList.add('drm-screen-blanked');
      setIsScreenBlanked(true);
      showSecurityNotice(`⚠️ Security Alert: ${triggerKey} blocked to protect document confidentiality.`);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(
            `⚠️ [FLUX SECURITY ALERT] Capturing or copying this protected document is strictly prohibited under zero-trust DRM policy. Recipient: ${user?.email || 'Authenticated User'}`
          )
          .catch(() => {});
      }

      if (token) {
        viewerService.logEvent(token, {
          violationType: type || 'SCREENSHOT_OR_CAPTURE_ATTEMPT',
          trigger: triggerKey || 'PrintScreen',
          pageNumber: currentPage,
          sessionId: sessionIdRef.current,
        }).catch(() => {});
      }
    };

    const handleKeyDown = (e) => {
      // 1. PrintScreen Key
      if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerViolation('PRINT_SCREEN', 'PrintScreen key');
        return false;
      }

      // 2. Windows Snipping Tool (Win+Shift or Win+Shift+S)
      if (
        (e.metaKey && e.shiftKey) ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key.toLowerCase() === 's' || e.code === 'KeyS')) ||
        (e.metaKey && (e.key.toLowerCase() === 's' || e.code === 'KeyS'))
      ) {
        e.preventDefault();
        triggerViolation('SCREENSHOT_SHORTCUT', 'Screen capture shortcut (Win+Shift+S)');
        return false;
      }

      // 3. macOS Screenshot Shortcuts (Cmd+Shift+3/4/5)
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.code === 'Digit3' || e.code === 'Digit4' || e.code === 'Digit5')) {
        e.preventDefault();
        triggerViolation('MAC_SCREENSHOT', 'macOS Screenshot Shortcut');
        return false;
      }

      // 4. Print Attempt (Ctrl+P / Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'p' || e.code === 'KeyP')) {
        e.preventDefault();
        triggerViolation('PRINT_ATTEMPT', 'Print shortcut (Ctrl+P)');
        return false;
      }

      // 5. Save Attempt (Ctrl+S / Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's' || e.code === 'KeyS')) {
        e.preventDefault();
        triggerViolation('SAVE_ATTEMPT', 'Save shortcut (Ctrl+S)');
        return false;
      }

      // 6. Developer Tools / View Source (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
      if (
        e.key === 'F12' ||
        e.code === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j' || e.code === 'KeyI' || e.code === 'KeyJ')) ||
        ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'u' || e.code === 'KeyU'))
      ) {
        e.preventDefault();
        triggerViolation('DEVTOOLS_INSPECTION', 'Developer tools inspection');
        return false;
      }

      // Arrow navigation
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrevPage();
      }
    };

    const handleKeyUp = (e) => {
      // Catch PrintScreen on Windows 11 where keydown was swallowed by OS shell
      if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerViolation('PRINT_SCREEN', 'PrintScreen key');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('⚠️ [FLUX DRM] Screenshot prohibited. Content redacted.').catch(() => {});
        }
        return false;
      }
    };

    const handleCopy = (e) => {
      e.preventDefault();
      triggerViolation('COPY_EXTRACTION', 'Text extraction / Copy');
      if (e.clipboardData) {
        e.clipboardData.setData(
          'text/plain',
          `⚠️ [FLUX DRM] Document copying prohibited. Recipient: ${user?.email || 'Authenticated User'}`
        );
      }
    };

    // Use capture phase to intercept before OS or browser defaults
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('copy', handleCopy, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('copy', handleCopy, true);
    };
  }, [token, user, currentPage]);

  // Initial metadata verification
  useEffect(() => {
    let isMounted = true;

    const verifyShare = async () => {
      try {
        const res = await viewerService.inspectShare(token);
        if (!isMounted) return;
        const shareData = res.data?.data || res.data || res;
        setShareInfo(shareData);
        setPageCount(shareData.pageCount || 1);

        if (isAuthenticated) {
          await initSession(shareData);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (!isMounted) return;
        let errData = err.response?.data;
        if (errData instanceof Blob) {
          try {
            errData = JSON.parse(await errData.text());
          } catch (_) {}
        }
        const code = errData?.error?.code || 'AUTH_FAILED';
        const message = errData?.error?.message || err.message;
        setDenialState({
          reason: code,
          details: {
            message,
            recipientEmail: shareInfo?.rawRecipientEmail || shareInfo?.recipientEmail,
          },
        });
        setLoading(false);
      }
    };

    verifyShare();

    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated]);

  const sessionIdRef = useRef(null);
  const pageImageUrlRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    pageImageUrlRef.current = pageImageUrl;
  }, [pageImageUrl]);

  // Start viewing session
  const initSession = async (currentShareInfo) => {
    try {
      const res = await viewerService.startSession(token);
      const sessionData = res.data?.data || res.data || res;
      const sessId = sessionData.sessionId || sessionData._id;
      setSessionId(sessId);
      sessionIdRef.current = sessId;
      await loadPage(1, sessId);
    } catch (err) {
      let errData = err.response?.data;
      if (errData instanceof Blob) {
        try {
          errData = JSON.parse(await errData.text());
        } catch (_) {}
      }
      const code = errData?.error?.code || 'AUTH_FAILED';
      const message = errData?.error?.message || 'Access Forbidden.';
      const recipient = currentShareInfo?.rawRecipientEmail || currentShareInfo?.recipientEmail || shareInfo?.rawRecipientEmail || shareInfo?.recipientEmail;
      setDenialState({
        reason: code,
        details: { message, recipientEmail: recipient },
      });
    } finally {
      setLoading(false);
    }
  };

  // Load specific page image
  const loadPage = async (pageNumber, currentSessionId) => {
    const sessId = currentSessionId || sessionIdRef.current || sessionId;
    setPageLoading(true);

    try {
      const url = await viewerService.fetchPageImage(token, pageNumber, sessId);
      setPageImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setCurrentPage(pageNumber);
    } catch (err) {
      let errData = err.response?.data;
      if (errData instanceof Blob) {
        try {
          errData = JSON.parse(await errData.text());
        } catch (_) {}
      }
      const code = errData?.error?.code;
      const message = errData?.error?.message || 'Failed to render page.';
      if (code === 'EXPIRED' || code === 'REVOKED' || code === 'UNAUTHORIZED_RECIPIENT' || code === 'MAX_SESSIONS_EXCEEDED') {
        setDenialState({
          reason: code,
          details: { message, recipientEmail: shareInfo?.rawRecipientEmail || shareInfo?.recipientEmail },
        });
      } else {
        showSecurityNotice(message);
      }
    } finally {
      setPageLoading(false);
    }
  };

  // Close session on unmount
  useEffect(() => {
    return () => {
      if (token && sessionIdRef.current) {
        viewerService.closeSession(token, sessionIdRef.current).catch(() => {});
      }
      if (pageImageUrlRef.current) {
        URL.revokeObjectURL(pageImageUrlRef.current);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && !pageLoading) {
      loadPage(currentPage - 1, sessionId);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pageCount && !pageLoading) {
      loadPage(currentPage + 1, sessionId);
    }
  };

  // Render on canvas
  useEffect(() => {
    if (!pageImageUrl || !canvasRef.current) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImgRef.current = img;
      if (!isWindowBlurred && !isScreenBlanked) {
        drawCanvas(img);
      } else {
        blankCanvas();
      }
    };
    img.src = pageImageUrl;
  }, [pageImageUrl]);

  if (denialState) {
    return <AccessDenied reason={denialState.reason} details={denialState.details} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white bg-grid-spec text-[#171e19] font-sans">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#171e19]/10 border-t-[#171e19] mb-4"></div>
        <p className="font-anton text-lg uppercase tracking-wide">VALIDATING ZERO-TRUST TOKEN...</p>
        <p className="font-satoshi text-xs text-[#171e19]/60 mt-1">Verifying token signature, expiration countdown, and recipient policy</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-grid-spec font-sans text-[#171e19]">
        <div className="w-full max-w-md rounded-2xl bg-white border border-[#171e19]/10 p-8 sm:p-10 shadow-2xl text-center brutalist-transition">
          <div className="h-14 w-14 rounded-2xl bg-[#171e19] text-[#ffe17c] mx-auto flex items-center justify-center mb-5 font-bold shadow-md">
            <Lock className="h-7 w-7" />
          </div>

          <h2 className="font-anton text-3xl uppercase tracking-normal text-[#171e19]">
            AUTHENTICATION REQUIRED
          </h2>
          <p className="font-satoshi text-xs text-[#171e19]/70 mt-2 font-medium">
            This protected document is restricted to <strong className="font-mono text-[#171e19] bg-[#ffe17c]/40 px-1.5 py-0.5 rounded">{shareInfo?.recipientEmail}</strong>.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-[#fafafa] border border-[#171e19]/10 text-xs font-satoshi text-[#171e19]/70 text-left space-y-1">
            <p className="font-anton uppercase text-[#171e19]">ZERO-TRUST RECIPIENT VERIFICATION:</p>
            <p>• You must authenticate to prove ownership of the recipient email.</p>
            <p>• Pages are dynamically watermarked with your verified identity.</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 font-sans">
            <Link
              to="/login"
              state={{ from: { pathname: `/view/${token}` } }}
              className="w-full py-3.5 rounded-xl font-anton text-sm uppercase tracking-wider bg-[#ffe17c] text-[#171e19] shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              Sign In to View Document
            </Link>
            <Link
              to="/register"
              className="w-full py-3 rounded-xl font-anton text-xs uppercase tracking-wider text-[#171e19]/70 hover:text-[#171e19] bg-[#fafafa] hover:bg-[#171e19]/5 border border-[#171e19]/10 transition-colors"
            >
              Register Recipient Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewerContainerRef}
      onContextMenu={(e) => {
        e.preventDefault();
        showSecurityNotice('Context menu and saving are disabled on protected documents.');
      }}
      className="min-h-screen flex flex-col bg-[#171e19] text-white select-none font-sans relative"
    >
      {/* 1. Fullscreen Obscuration Curtain (z-[99999] - Overlays entire screen: Header, Document, Controls, Footer) */}
      {(isWindowBlurred || isScreenBlanked) && (
        <div
          id="fullscreen-drm-shield"
          onClick={restoreProtectedView}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-6 bg-[#171e19]/98 backdrop-blur-3xl text-center cursor-pointer shadow-2xl transition-all select-none"
        >
          <div className="h-20 w-20 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-5 animate-pulse shadow-xl">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h3 className="font-anton text-2xl sm:text-4xl uppercase tracking-wide text-white">
            {isScreenBlanked ? 'SCREEN CAPTURE SHORTCUT INTERCEPTED' : 'SCREEN CAPTURE SHIELD ACTIVE'}
          </h3>
          <p className="font-satoshi text-xs sm:text-sm text-rose-300 max-w-lg mt-3 leading-relaxed font-medium">
            {isScreenBlanked
              ? 'A screenshot or capture shortcut was detected. Document copying is strictly prohibited and forensically attributed to your verified session.'
              : 'Document display is concealed while the window is out of focus to deter Snipping Tool, screen grabbers, and background recording.'}
          </p>
          <div className="mt-8 px-8 py-3.5 rounded-xl bg-white text-[#171e19] font-anton text-xs uppercase tracking-wider hover:bg-[#ffe17c] transition-colors shadow-lg cursor-pointer">
            Click anywhere to restore protected view
          </div>
        </div>
      )}

      {/* Top Security & Control Ribbon */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#171e19]/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Document & Security Badges */}
          <div className="flex items-center gap-3 truncate">
            <Link
              to="/dashboard"
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Return to console"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="truncate font-satoshi">
              <div className="flex items-center gap-2">
                <span className="font-anton text-lg tracking-normal uppercase text-white truncate max-w-xs sm:max-w-md">
                  {shareInfo?.originalFilename}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffe17c] text-[#171e19]">
                  <ShieldCheck className="h-3 w-3" />
                  DRM ACTIVE
                </span>
              </div>
              <div className="text-[10px] text-[#b7c6c2] font-mono truncate">
                Recipient: <strong className="text-white">{user?.email}</strong>
                {sessionId && <span className="ml-2 hidden md:inline text-white/40">| Session: {sessionId.slice(0, 8)}...</span>}
              </div>
            </div>
          </div>

          {/* Page Controls & Zoom */}
          <div className="flex items-center gap-2 sm:gap-3 font-satoshi">
            {/* Page Navigation */}
            <div className="flex items-center gap-1 bg-[#272727] border border-white/10 rounded-xl p-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || pageLoading}
                className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="px-3 font-anton text-sm uppercase text-white">
                PAGE {currentPage} / {pageCount}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= pageCount || pageLoading}
                className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-[#272727] border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 15))}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="px-2 text-xs font-mono font-bold text-white hover:text-[#ffe17c]"
                title="Reset zoom"
              >
                {zoom}%
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 15))}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-[#272727] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Security Toast Warning Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 text-white text-xs font-anton uppercase tracking-wider shadow-2xl animate-bounce">
          <ShieldAlert className="h-4 w-4 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Document Viewing Canvas / Viewport */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 bg-[#0d120f] relative">
        <div className="relative flex items-center justify-center transition-all duration-150">
          {pageLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-[2px] rounded-xl">
              <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-[#171e19] border border-white/10 shadow-2xl">
                <Loader2 className="h-8 w-8 text-[#ffe17c] animate-spin" />
                <span className="font-anton text-xs uppercase tracking-wider text-white">
                  STREAMING WATERMARKED CANVAS {currentPage}...
                </span>
              </div>
            </div>
          )}

          {pageImageUrl ? (
            <div
              id="protected-canvas-wrapper"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
              className={`transition-all duration-150 ease-out shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-white relative ${
                isWindowBlurred || isScreenBlanked ? 'blur-3xl opacity-0 pointer-events-none' : ''
              }`}
            >
              <canvas
                ref={canvasRef}
                className="max-w-[90vw] sm:max-w-4xl h-auto block pointer-events-none select-none protected-canvas"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          ) : (
            <div className="font-satoshi text-white/50 text-sm">No page loaded</div>
          )}
        </div>
      </main>

      {/* Bottom DRM Attribution Ribbon */}
      <footer className="border-t border-white/10 bg-[#171e19] px-6 py-2.5 text-center text-xs font-satoshi text-[#b7c6c2] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#ffe17c] font-bold">
          <ShieldCheck className="h-4 w-4" />
          <span>Dynamic Watermark Active — Forensically Bound to {user?.email}</span>
        </div>

        <div className="text-[#b7c6c2]/70 flex items-center gap-3 font-mono text-[11px]">
          <span>Protected PDF Stream (No Raw Binary)</span>
          <span>•</span>
          <span>AES-256-GCM Hardware Envelope</span>
        </div>
      </footer>
    </div>
  );
}
