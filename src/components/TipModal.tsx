import React from 'react';
import { Coffee, Heart, X, Sparkles, ExternalLink } from 'lucide-react';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  donationUrl?: string;
  syncedCount: number;
  destination: string;
}

export const TipModal: React.FC<TipModalProps> = ({
  isOpen,
  onClose,
  donationUrl,
  syncedCount,
  destination,
}) => {
  if (!isOpen) return null;

  const url = donationUrl && donationUrl.trim() !== '' ? donationUrl : 'https://ko-fi.com/f312s';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 sm:p-7 relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Floating Coffee Icon Glow */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-xl shadow-amber-500/25 mb-4 animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Coffee className="w-8 h-8 text-amber-400 fill-amber-400/20" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{syncedCount} Events Ported to {destination}!</span>
        </div>

        <h3 className="text-xl font-extrabold text-slate-100 tracking-tight">
          Saved you 30 minutes of typing? ☕
        </h3>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          Planer is 100% free and open-source. If it saved you the hassle of entering your schedule manually, consider buying me a coffee to support future updates!
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Coffee className="w-4 h-4 fill-slate-950" />
            <span>Buy Me a Coffee on Ko-fi</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
          >
            Maybe next time
          </button>
        </div>
      </div>
    </div>
  );
};
