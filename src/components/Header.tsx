import React from 'react';
import { 
  Calendar as CalendarIcon, Sparkles, Settings as SettingsIcon, 
  CheckCircle2, AlertCircle, Coffee, Heart, ExternalLink 
} from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  calendars: string[];
  notionReady: boolean;
  onOpenSettings: () => void;
  onOpenSamples: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  calendars,
  notionReady,
  onOpenSettings,
  onOpenSamples,
}) => {
  const donationUrl = settings.donationUrl || 'https://ko-fi.com';

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-purple-600 p-[1px] shadow-lg shadow-fuchsia-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-fuchsia-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Planer
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                Instant Port
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Schedule screenshot &rarr; Apple Calendar &amp; Notion
            </p>
          </div>
        </div>

        {/* Status badges & actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Target Status Badges */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            {/* Apple Cal Status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${
                settings.defaultAppleCalendar
                  ? 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                  : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
              }`}
              title={`Target: Apple Calendar (${settings.defaultAppleCalendar})`}
            >
              <span className="text-base leading-none">🍏</span>
              <span className="font-medium">{settings.defaultAppleCalendar || 'Apple Cal'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            </div>

            {/* Notion Status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${
                notionReady
                  ? 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                  : 'bg-slate-800/40 border-dashed border-slate-700 text-slate-400'
              }`}
              title={notionReady ? 'Notion database connected' : 'Notion integration not configured'}
            >
              <span className="text-base leading-none">📓</span>
              <span className="font-medium">Notion</span>
              {notionReady ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
              )}
            </div>
          </div>

          {/* Try Samples Button */}
          <button
            onClick={onOpenSamples}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Try Samples</span>
          </button>

          {/* Ko-fi / Buy Me a Coffee Button */}
          <a
            href={donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            title="Support this project on Ko-fi or Buy Me a Coffee"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span className="hidden sm:inline">Support</span>
            <span className="sm:hidden">☕</span>
          </a>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-fuchsia-600/10 hover:bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/30 transition shadow-sm"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
