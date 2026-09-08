import React, { useState, useEffect } from 'react';
import { isGeminiApiEnabled } from '../config/appConfig';
import { Zap, ShieldAlert } from 'lucide-react';

export const GeminiDebugIndicator: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(() => isGeminiApiEnabled());

  useEffect(() => {
    const handleStatusChange = (e: any) => {
      if (e?.detail?.enabled !== undefined) {
        setEnabled(e.detail.enabled);
      } else {
        setEnabled(isGeminiApiEnabled());
      }
    };
    window.addEventListener('gemini_api_status_changed', handleStatusChange);
    return () => {
      window.removeEventListener('gemini_api_status_changed', handleStatusChange);
    };
  }, []);

  return (
    <div
      className="fixed bottom-4 left-4 z-50 pointer-events-auto"
      title="Gemini API Switch Status"
    >
      <div
        className={`px-3 py-1.5 rounded-full shadow-lg border text-xs font-mono font-bold flex items-center gap-2 backdrop-blur-md transition-all ${
          enabled
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
            : 'bg-slate-900/90 border-amber-500/50 text-amber-300'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            enabled
              ? 'bg-emerald-400 animate-pulse'
              : 'bg-amber-400'
          }`}
        />
        <span className="flex items-center gap-1">
          {enabled ? (
            <>
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Gemini API: ON</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Gemini API: OFF</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

