import React, { useState, useEffect } from 'react';
import { auditService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Activity as ActivityIcon,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Share2,
  Eye,
  RefreshCw,
  Clock,
  Globe,
  Filter
} from 'lucide-react';

export default function Activity() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await auditService.list(100);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLogs([]);
    loadLogs();
  }, [user?.email, user?.cognitoSub]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    if (filter === 'DENIED') return log.eventType.includes('DENIED');
    if (filter === 'VIEWS') return log.eventType.includes('VIEW') || log.eventType === 'PAGE_RENDERED';
    if (filter === 'LIFECYCLE') return log.eventType.includes('DOCUMENT') || log.eventType.includes('SHARE_CREATED');
    return true;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#171e19]/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe17c] animate-pulse"></span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#171e19]/60">
              TAMPER-EVIDENT FORENSIC TELEMETRY
            </span>
          </div>
          <h1 className="font-anton text-4xl sm:text-5xl uppercase tracking-normal text-[#171e19] flex items-center gap-3">
            SECURITY AUDIT TRAIL
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#171e19] text-[#ffe17c] tracking-normal">
              LIVE MONITOR
            </span>
          </h1>
          <p className="font-satoshi text-xs sm:text-sm text-[#171e19]/70 mt-1 font-medium">
            Structured tamper-evident logging of all cryptographic operations, accesses, and denied requests.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider bg-[#171e19] hover:bg-black text-white border border-[#171e19] transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#ffe17c] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['ALL', 'VIEWS', 'DENIED', 'LIFECYCLE'].map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-lg font-anton text-xs uppercase tracking-wider transition-all cursor-pointer ${
              filter === category
                ? 'bg-[#ffe17c] text-[#171e19] shadow-sm font-bold scale-[1.02]'
                : 'bg-[#fafafa] text-[#171e19]/60 hover:text-[#171e19] border border-[#171e19]/10'
            }`}
          >
            {category === 'ALL' ? 'ALL EVENTS' : category}
          </button>
        ))}
      </div>

      {/* Logs Feed */}
      {loading && logs.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#171e19]/10 text-center font-satoshi text-sm text-[#171e19]/60">
          Streaming audit log events from database...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl text-center border-2 border-dashed border-[#171e19]/15 font-satoshi text-sm text-[#171e19]/60">
          No audit records found matching selected filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden border border-[#171e19]/10 shadow-sm divide-y divide-[#171e19]/10">
          {filteredLogs.map((log) => {
            const isDenied = log.eventType.includes('DENIED');
            const isUpload = log.eventType === 'DOCUMENT_UPLOADED';
            const isView = log.eventType === 'PAGE_RENDERED' || log.eventType.includes('VIEW_SUCCESS');

            return (
              <div
                key={log._id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-sm ${
                      isDenied
                        ? 'bg-rose-50 border border-rose-200 text-rose-600'
                        : isUpload
                        ? 'bg-[#171e19] text-[#ffe17c]'
                        : isView
                        ? 'bg-[#ffe17c]/30 text-[#171e19] border border-[#ffe17c]'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {isDenied ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  </div>

                  <div className="space-y-1 font-satoshi">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-anton text-sm tracking-wide uppercase ${
                          isDenied ? 'text-rose-600' : 'text-[#171e19]'
                        }`}
                      >
                        {log.eventType.replace(/_/g, ' ')}
                      </span>
                      {log.actorEmail && (
                        <span className="font-mono text-xs text-[#171e19]/70">
                          by <strong className="text-[#171e19]">{log.actorEmail}</strong>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#171e19]/70 space-y-0.5 font-medium">
                      {log.details?.filename && (
                        <p>File: <span className="text-[#171e19] font-mono font-bold">{log.details.filename}</span></p>
                      )}
                      {log.details?.recipientEmail && (
                        <p>Authorized Recipient: <span className="font-mono text-[#171e19] bg-[#ffe17c]/30 px-1 rounded">{log.details.recipientEmail}</span></p>
                      )}
                      {log.details?.reason && (
                        <p className="text-rose-600 font-semibold">Violation Reason: {log.details.reason}</p>
                      )}
                      {log.details?.pageNumber && (
                        <p>Rendered Canvas: <strong className="text-[#171e19]">Page {log.details.pageNumber}</strong> (Sharp forensic watermarked stream)</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 font-mono text-xs text-[#171e19]/50 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#171e19]/10">
                  <span className="flex items-center gap-1 text-[#171e19] font-bold">
                    <Clock className="h-3.5 w-3.5 text-[#171e19]/50" />
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px]">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
