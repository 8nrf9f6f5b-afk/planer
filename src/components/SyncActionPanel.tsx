import React from 'react';
import { CalendarEvent, AppSettings } from '../types';
import { 
  Zap, Download, ExternalLink, Loader2, CheckCircle2, 
  AlertCircle, ShieldCheck
} from 'lucide-react';

interface SyncActionPanelProps {
  events: CalendarEvent[];
  settings: AppSettings;
  calendars: string[];
  isSyncingApple: boolean;
  isSyncingNotion: boolean;
  notionReady: boolean;
  onSyncApple: () => void;
  onSyncNotion: () => void;
  onSyncBoth: () => void;
  onExportICS: () => void;
  onCalendarChange: (cal: string) => void;
  onOpenSettings: () => void;
}

export const SyncActionPanel: React.FC<SyncActionPanelProps> = ({
  events,
  settings,
  calendars,
  isSyncingApple,
  isSyncingNotion,
  notionReady,
  onSyncApple,
  onSyncNotion,
  onSyncBoth,
  onExportICS,
  onCalendarChange,
  onOpenSettings,
}) => {
  const selectedEvents = events.filter(e => e.selected);
  const selectedCount = selectedEvents.length;
  const isSyncingAny = isSyncingApple || isSyncingNotion;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 sticky bottom-6 z-20 backdrop-blur-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left summary & calendar selector */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100">
              3. Port Schedule
            </span>
            <span className="text-xs text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/20 font-medium">
              {selectedCount} of {events.length} events selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            {/* Apple Calendar target dropdown */}
            <div className="flex items-center gap-1.5">
              <span>Target Apple Calendar:</span>
              <select
                value={settings.defaultAppleCalendar}
                onChange={(e) => onCalendarChange(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-fuchsia-500 font-medium"
              >
                {calendars.map((cal) => (
                  <option key={cal} value={cal}>
                    🍏 {cal}
                  </option>
                ))}
              </select>
            </div>

            {/* Notion Target status */}
            <div className="flex items-center gap-1">
              <span>Target Notion:</span>
              {notionReady ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Database Linked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-amber-400 hover:text-amber-300 underline font-medium flex items-center gap-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Connect Notion DB
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right CTA action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Export .ics */}
          <button
            type="button"
            onClick={onExportICS}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download iCalendar file (.ics) compatible with Apple Calendar & Google Calendar"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export .ics</span>
          </button>

          {/* Sync to Apple Calendar */}
          <button
            type="button"
            onClick={onSyncApple}
            disabled={selectedCount === 0 || isSyncingApple}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition shadow-sm ${
              isSyncingApple
                ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600 hover:border-slate-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSyncingApple ? (
              <Loader2 className="w-4 h-4 animate-spin text-fuchsia-400" />
            ) : (
              <span className="text-base leading-none">🍏</span>
            )}
            <span>Port to Apple</span>
          </button>

          {/* Sync to Notion */}
          <button
            type="button"
            onClick={onSyncNotion}
            disabled={selectedCount === 0 || isSyncingNotion || !notionReady}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition shadow-sm ${
              !notionReady
                ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                : isSyncingNotion
                ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600 hover:border-slate-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSyncingNotion ? (
              <Loader2 className="w-4 h-4 animate-spin text-fuchsia-400" />
            ) : (
              <span className="text-base leading-none">📓</span>
            )}
            <span>Port to Notion</span>
          </button>

          {/* Sync to BOTH (Primary CTA!) */}
          <button
            type="button"
            onClick={onSyncBoth}
            disabled={selectedCount === 0 || isSyncingAny}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition-all duration-200 ${
              isSyncingAny
                ? 'bg-fuchsia-800/60 cursor-not-allowed text-slate-300'
                : 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 shadow-fuchsia-600/30 hover:shadow-fuchsia-600/50 hover:scale-[1.02]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSyncingAny ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Porting Schedule...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Port to Apple &amp; Notion</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
