import React, { useState, useEffect } from 'react';
import { 
  X, Key, Calendar, Database, CheckCircle2, AlertCircle, 
  ExternalLink, Loader2, RefreshCw, Eye, EyeOff, Sparkles, Coffee, Heart, ShieldCheck 
} from 'lucide-react';
import { AppSettings, NotionDatabaseInfo } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  calendars: string[];
  isCloud?: boolean;
  onSaveSettings: (newSettings: AppSettings) => Promise<void>;
  onRefreshCalendars: () => Promise<void>;
  onTestNotion: (apiKey: string, databaseId: string) => Promise<NotionDatabaseInfo | null>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  calendars,
  isCloud,
  onSaveSettings,
  onRefreshCalendars,
  onTestNotion,
}) => {
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel || 'gemini-3.8-flash');
  const [notionApiKey, setNotionApiKey] = useState(settings.notionApiKey);
  const [notionDatabaseId, setNotionDatabaseId] = useState(settings.notionDatabaseId);
  const [defaultAppleCalendar, setDefaultAppleCalendar] = useState(settings.defaultAppleCalendar);

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showNotionKey, setShowNotionKey] = useState(false);

  const [isTestingNotion, setIsTestingNotion] = useState(false);
  const [notionTestResult, setNotionTestResult] = useState<{
    success: boolean;
    title?: string;
    error?: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'gemini' | 'apple' | 'notion' | 'support'>('gemini');

  useEffect(() => {
    setGeminiApiKey(settings.geminiApiKey);
    setGeminiModel(settings.geminiModel || 'gemini-3.8-flash');
    setNotionApiKey(settings.notionApiKey);
    setNotionDatabaseId(settings.notionDatabaseId);
    setDefaultAppleCalendar(settings.defaultAppleCalendar);
  }, [settings]);

  if (!isOpen) return null;

  const handleTestNotion = async () => {
    setIsTestingNotion(true);
    setNotionTestResult(null);
    try {
      const res = await onTestNotion(notionApiKey, notionDatabaseId);
      if (res) {
        setNotionTestResult({ success: true, title: res.title });
      }
    } catch (e: any) {
      setNotionTestResult({ success: false, error: e.message });
    } finally {
      setIsTestingNotion(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings({
        geminiApiKey,
        geminiModel,
        notionApiKey,
        notionDatabaseId,
        defaultAppleCalendar,
        defaultDurationMinutes: settings.defaultDurationMinutes || 60,
        donationUrl: settings.donationUrl,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const tipUrl = settings.donationUrl || 'https://ko-fi.com/f312s';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Calendar &amp; AI Settings</h3>
              <p className="text-xs text-slate-400">Configure your vision model, Apple Calendar, and Notion integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'gemini'
                ? 'border-fuchsia-500 text-fuchsia-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Gemini Vision AI</span>
          </button>

          <button
            onClick={() => setActiveTab('apple')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'apple'
                ? 'border-fuchsia-500 text-fuchsia-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🍏</span>
            <span>Apple Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('notion')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'notion'
                ? 'border-fuchsia-500 text-fuchsia-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📓</span>
            <span>Notion Database</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'support'
                ? 'border-fuchsia-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>Support Project</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Privacy Note Banner */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <b>Privacy Guarantee:</b> Your API keys and tokens are stored directly in your local browser. They are never saved or logged on our server.
            </span>
          </div>

          {/* TAB 1: GEMINI */}
          {activeTab === 'gemini' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Saved only in your browser. Get a 100% free key from Google AI Studio.</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 font-medium underline"
                  >
                    Get free API Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Vision Model (Interactions API)
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended: Interactions API &amp; fast reasoning)</option>
                  <option value="gemini-3.8-pro">gemini-3.8-pro (Complex handwritten &amp; dense timetables)</option>
                  <option value="gemini-3.5-flash">gemini-3.5-flash (High speed alternative)</option>
                </select>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  Interactions API + Gemini 3.8:
                </p>
                <p>
                  Planer uses Google&rsquo;s <b>Interactions API</b> (<code>/v1beta/interactions</code>) with Gemini 3.8 Flash to parse schedules with high accuracy, structured JSON extraction, and instant speed.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: APPLE CALENDAR */}
          {activeTab === 'apple' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Target macOS Calendar
                  </label>
                  {!isCloud && (
                    <button
                      type="button"
                      onClick={onRefreshCalendars}
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh Calendars</span>
                    </button>
                  )}
                </div>

                <select
                  value={defaultAppleCalendar}
                  onChange={(e) => setDefaultAppleCalendar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500 font-medium"
                >
                  {calendars.length === 0 ? (
                    <option value="Privat">Privat</option>
                  ) : (
                    calendars.map((cal) => (
                      <option key={cal} value={cal}>
                        🍏 {cal}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-slate-400">
                  {isCloud
                    ? 'On the web, clicking "Port to Apple" exports an instant calendar file that opens directly in your Apple Calendar app on Mac or iPhone.'
                    : 'New schedule events will be placed directly into this Apple Calendar on your Mac.'}
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Instant Apple Calendar Sync:
                </p>
                <p>
                  No iCloud password or login needed. On Mac, it writes directly into Calendar.app. On mobile web, tapping Port to Apple opens the native Apple Calendar import prompt with 1 tap.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: NOTION */}
          {activeTab === 'notion' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Notion Internal Integration Token
                </label>
                <div className="relative">
                  <input
                    type={showNotionKey ? 'text' : 'password'}
                    value={notionApiKey}
                    onChange={(e) => setNotionApiKey(e.target.value)}
                    placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxx..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNotionKey(!showNotionKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showNotionKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Stored safely in your browser only.</span>
                  <a
                    href="https://www.notion.so/profile/integrations"
                    target="_blank"
                    rel="noreferrer"
                    className="text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 font-medium underline"
                  >
                    Notion Integrations <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Notion Database ID or URL
                </label>
                <input
                  type="text"
                  value={notionDatabaseId}
                  onChange={(e) => setNotionDatabaseId(e.target.value)}
                  placeholder="https://notion.so/myworkspace/a8aec433... or 32-character ID"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500 font-mono"
                />
                <p className="text-xs text-slate-400">
                  Paste your database URL or ID.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestNotion}
                  disabled={isTestingNotion || !notionApiKey || !notionDatabaseId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTestingNotion ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5 text-fuchsia-400" />
                  )}
                  <span>Test Connection</span>
                </button>

                {notionTestResult?.success && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Connected to &ldquo;{notionTestResult.title}&rdquo;</span>
                  </div>
                )}

                {notionTestResult?.error && (
                  <div className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-sm">{notionTestResult.error}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300">
                  3-Step Notion Database Linking:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Go to your Notion Calendar or Database page.</li>
                  <li>Click the <code>...</code> menu at the top-right &rarr; <b>Connections</b>.</li>
                  <li>Search for and add your integration to grant Planer write access.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT / TIP JAR */}
          {activeTab === 'support' && (
            <div className="space-y-5 text-center sm:text-left">
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-slate-950 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                  <Coffee className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                  <span>Support Planer Development</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Planer is 100% free and open-source. If this tool saves you time importing your weekly schedule into Apple Calendar &amp; Notion, consider buying a coffee to support maintenance and server hosting!
                </p>

                <div className="pt-2">
                  <a
                    href={tipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Coffee className="w-4 h-4 fill-slate-950" />
                    <span>Buy Me a Coffee on Ko-fi</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-300">
                  Hosting Your Own Copy?
                </p>
                <p>
                  To set your own tip jar link when hosting this project, configure the <code>DONATION_URL</code> environment variable in your Vercel project dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl shadow-lg shadow-fuchsia-600/30 transition flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
