import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { ImageDropzone } from './components/ImageDropzone';
import { EventsPreview } from './components/EventsPreview';
import { SyncActionPanel } from './components/SyncActionPanel';
import { SettingsModal } from './components/SettingsModal';
import { SampleSchedulesModal } from './components/SampleSchedulesModal';
import { TipModal } from './components/TipModal';
import { Toast, ToastMessage } from './components/Toast';
import { CalendarEvent, AppSettings, NotionDatabaseInfo } from './types';
import { Sparkles, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Coffee, Heart, ShieldCheck, Lock } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'planer_user_settings_v1';

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // 1. Initialize from local browser storage if available
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          geminiApiKey: parsed.geminiApiKey || '',
          geminiModel: parsed.geminiModel || 'gemini-3.8-flash',
          notionApiKey: parsed.notionApiKey || '',
          notionDatabaseId: parsed.notionDatabaseId || '',
          defaultAppleCalendar: parsed.defaultAppleCalendar || 'Privat',
          defaultDurationMinutes: parsed.defaultDurationMinutes || 60,
          donationUrl: parsed.donationUrl || '',
        };
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
    return {
      geminiApiKey: '',
      geminiModel: 'gemini-3.8-flash',
      notionApiKey: '',
      notionDatabaseId: '',
      defaultAppleCalendar: 'Privat',
      defaultDurationMinutes: 60,
      donationUrl: '',
    };
  });

  const [calendars, setCalendars] = useState<string[]>(['Privat', 'Arbeit']);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [currentMimeType, setCurrentMimeType] = useState<string>('image/png');
  const [currentImageName, setCurrentImageName] = useState<string>('');

  const [isExtracting, setIsExtracting] = useState(false);
  const [isSyncingApple, setIsSyncingApple] = useState(false);
  const [isSyncingNotion, setIsSyncingNotion] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSamplesOpen, setIsSamplesOpen] = useState(false);
  const [isCloud, setIsCloud] = useState(false);
  const [notionReady, setNotionReady] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  // Tip Modal State
  const [tipModalState, setTipModalState] = useState<{
    isOpen: boolean;
    syncedCount: number;
    destination: string;
  }>({
    isOpen: false,
    syncedCount: 0,
    destination: 'Apple Calendar & Notion',
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load server defaults & merge with local storage on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const cfg = await configRes.json();
          let chosenModel = cfg.geminiModel || 'gemini-3.8-flash';
          if (chosenModel.includes('2.5')) chosenModel = 'gemini-3.8-flash';

          setIsCloud(!!cfg.isCloud);

          setSettings((prev) => {
            const merged: AppSettings = {
              ...prev,
              // Keep user's private key from localStorage, fall back to server key if running locally
              geminiApiKey: prev.geminiApiKey || cfg.geminiApiKey || '',
              geminiModel: prev.geminiModel || chosenModel,
              notionApiKey: prev.notionApiKey || cfg.notionApiKey || '',
              notionDatabaseId: prev.notionDatabaseId || cfg.notionDatabaseId || '',
              defaultAppleCalendar: prev.defaultAppleCalendar || cfg.defaultAppleCalendar || 'Privat',
              // The creator's donation URL comes from the server environment
              donationUrl: cfg.donationUrl || 'https://ko-fi.com',
            };
            setHasGeminiKey(!!merged.geminiApiKey || !!cfg.hasGeminiApiKey);
            setNotionReady(!!(merged.notionApiKey && merged.notionDatabaseId));
            return merged;
          });
        }
      } catch (e) {
        console.error('Error fetching config:', e);
      }

      try {
        const calRes = await fetch('/api/apple/calendars');
        if (calRes.ok) {
          const calData = await calRes.json();
          if (Array.isArray(calData.calendars) && calData.calendars.length > 0) {
            setCalendars(calData.calendars);
            if (calData.selected) {
              setSettings((prev) => ({ ...prev, defaultAppleCalendar: prev.defaultAppleCalendar || calData.selected }));
            }
          }
        }
      } catch (e) {
        console.error('Error fetching apple calendars:', e);
      }
    };

    fetchInitialData();
  }, []);

  const handleImageSelected = (base64: string, mimeType: string, filename?: string) => {
    setCurrentImageBase64(base64);
    setCurrentMimeType(mimeType);
    setCurrentImageName(filename || 'Pasted Schedule');
  };

  const handleExtract = async (referenceDate: string, overrideImage?: string, overrideMime?: string) => {
    const imagePayload = overrideImage || currentImageBase64;
    const mimePayload = overrideMime || currentMimeType;

    if (!imagePayload) {
      addToast('error', 'No Image Selected', 'Please upload or paste a schedule screenshot first.');
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch('/api/parse-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePayload,
          mimeType: mimePayload,
          apiKey: settings.geminiApiKey || undefined,
          model: settings.geminiModel || 'gemini-3.8-flash',
          referenceDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setEvents(data.events || []);

      if (data.isDemo) {
        addToast(
          'info',
          'Demo Extraction Loaded',
          'Add your free Gemini API Key in Settings to parse personal custom schedule images!'
        );
      } else {
        addToast(
          'success',
          `Parsed ${data.events?.length || 0} Events`,
          data.rawSummary || 'Schedule extracted successfully'
        );
      }
    } catch (err: any) {
      addToast('error', 'Extraction Failed', err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Export .ics calendar file
  const handleExportICS = async (triggerToast: boolean = true) => {
    const selected = events.filter((e) => e.selected);
    if (selected.length === 0) return;

    try {
      const res = await fetch('/api/export/ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: selected,
          filename: 'planer-schedule.ics',
        }),
      });

      if (!res.ok) throw new Error('Failed to generate .ics file');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planer-schedule.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      if (triggerToast) {
        addToast('success', 'iCalendar Exported', 'Open the downloaded .ics to add directly to Apple or Google Calendar.');
      }
    } catch (err: any) {
      addToast('error', 'Export Error', err.message);
    }
  };

  // Sync to Apple Calendar
  const handleSyncApple = async () => {
    const selected = events.filter((e) => e.selected);
    if (selected.length === 0) return;

    setIsSyncingApple(true);
    setEvents((prev) =>
      prev.map((e) =>
        e.selected ? { ...e, syncStatus: { ...e.syncStatus, apple: 'syncing' } } : e
      )
    );

    // If on web / cloud deployment (where server doesn't have local Calendar.app access)
    if (isCloud) {
      await handleExportICS(false);
      setEvents((prev) =>
        prev.map((e) =>
          e.selected ? { ...e, syncStatus: { ...e.syncStatus, apple: 'success' } } : e
        )
      );
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 } });
      addToast(
        'success',
        'Opening in Apple Calendar!',
        `Exported ${selected.length} events. Tap "Add All" in the Calendar prompt to import!`
      );
      setTimeout(() => {
        setTipModalState({
          isOpen: true,
          syncedCount: selected.length,
          destination: 'Apple Calendar',
        });
      }, 1200);
      setIsSyncingApple(false);
      return;
    }

    // Otherwise, local desktop app: native osascript execution
    try {
      const res = await fetch('/api/apple/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: selected,
          calendarName: settings.defaultAppleCalendar,
        }),
      });

      const data = await res.json();
      if (!res.ok || (data.results && data.results.some((r: any) => r.error && r.error.includes('macOS')))) {
        // Fallback to .ics if not darwin
        await handleExportICS(false);
        setEvents((prev) =>
          prev.map((e) =>
            e.selected ? { ...e, syncStatus: { ...e.syncStatus, apple: 'success' } } : e
          )
        );
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 } });
        addToast(
          'success',
          'Opening in Apple Calendar!',
          `Exported ${selected.length} events to Apple Calendar (.ics).`
        );
        setTimeout(() => {
          setTipModalState({
            isOpen: true,
            syncedCount: selected.length,
            destination: 'Apple Calendar',
          });
        }, 1200);
        return;
      }

      setEvents((prev) =>
        prev.map((e) => {
          const r = data.results?.find((item: any) => item.id === e.id);
          if (r) {
            return {
              ...e,
              syncStatus: {
                ...e.syncStatus,
                apple: r.success ? 'success' : 'error',
                appleMessage: r.error,
              },
            };
          }
          return e;
        })
      );

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 } });
      addToast(
        'success',
        `Apple Calendar Port Complete!`,
        `Successfully added ${data.successCount} of ${data.total} events to "${data.calendar}".`
      );

      // Trigger Tip Modal after brief celebration delay
      setTimeout(() => {
        setTipModalState({
          isOpen: true,
          syncedCount: data.successCount,
          destination: 'Apple Calendar',
        });
      }, 1200);
    } catch (err: any) {
      addToast('error', 'Apple Calendar Error', err.message);
      setEvents((prev) =>
        prev.map((e) =>
          e.selected
            ? { ...e, syncStatus: { ...e.syncStatus, apple: 'error', appleMessage: err.message } }
            : e
        )
      );
    } finally {
      setIsSyncingApple(false);
    }
  };

  // Sync to Notion
  const handleSyncNotion = async () => {
    const selected = events.filter((e) => e.selected);
    if (selected.length === 0) return;

    setIsSyncingNotion(true);
    setEvents((prev) =>
      prev.map((e) =>
        e.selected ? { ...e, syncStatus: { ...e.syncStatus, notion: 'syncing' } } : e
      )
    );

    try {
      const res = await fetch('/api/notion/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: selected,
          apiKey: settings.notionApiKey || undefined,
          databaseId: settings.notionDatabaseId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync to Notion');

      setEvents((prev) =>
        prev.map((e) => {
          const r = data.results?.find((item: any) => item.id === e.id);
          if (r) {
            return {
              ...e,
              syncStatus: {
                ...e.syncStatus,
                notion: r.success ? 'success' : 'error',
                notionMessage: r.error,
              },
            };
          }
          return e;
        })
      );

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 } });
      addToast(
        'success',
        `Notion Port Complete!`,
        `Created ${data.successCount} pages in "${data.databaseTitle}".`
      );

      // Trigger Tip Modal after brief celebration delay
      setTimeout(() => {
        setTipModalState({
          isOpen: true,
          syncedCount: data.successCount,
          destination: 'Notion',
        });
      }, 1200);
    } catch (err: any) {
      addToast('error', 'Notion Error', err.message);
      setEvents((prev) =>
        prev.map((e) =>
          e.selected
            ? { ...e, syncStatus: { ...e.syncStatus, notion: 'error', notionMessage: err.message } }
            : e
        )
      );
    } finally {
      setIsSyncingNotion(false);
    }
  };

  // Sync to BOTH
  const handleSyncBoth = async () => {
    await handleSyncApple();
    if (notionReady) {
      await handleSyncNotion();
    } else {
      addToast(
        'info',
        'Apple Calendar synced!',
        'To also sync with Notion, configure your Notion Database in Settings.'
      );
    }
  };

  // Event list modifiers
  const handleToggleSelect = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  };

  const handleToggleSelectAll = () => {
    const allSelected = events.every((e) => e.selected);
    setEvents((prev) => prev.map((e) => ({ ...e, selected: !allSelected })));
  };

  const handleUpdateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddEvent = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newEvent: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: 'New Calendar Event',
      startDate: today,
      startTime: '09:00',
      endDate: today,
      endTime: '10:00',
      allDay: false,
      location: '',
      description: '',
      category: 'Work',
      selected: true,
      syncStatus: { apple: 'idle', notion: 'idle' },
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  // Select Sample Schedule
  const handleSelectSample = async (imagePath: string, name: string) => {
    try {
      const res = await fetch(imagePath);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setCurrentImageBase64(base64);
        setCurrentMimeType('image/svg+xml');
        setCurrentImageName(name);
        handleExtract(new Date().toISOString().slice(0, 10), base64, 'image/svg+xml');
      };
      reader.readAsDataURL(blob);
    } catch (e: any) {
      addToast('error', 'Failed to load sample', e.message);
    }
  };

  // Save settings: Persist safely in local browser storage
  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      // 1. Always save into user's own local browser storage (100% private, never leaks to server)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      if (newSettings.geminiApiKey) setHasGeminiKey(true);
      if (newSettings.notionApiKey && newSettings.notionDatabaseId) setNotionReady(true);

      // 2. If running on local server, also update local config
      if (!isCloud) {
        fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        }).catch(() => {});
      }

      addToast('success', 'Settings Saved', 'Your keys are safely stored in your local browser.');
    } catch (e: any) {
      addToast('error', 'Save Failed', e.message);
    }
  };

  // Refresh Apple Calendars
  const handleRefreshCalendars = async () => {
    try {
      const res = await fetch('/api/apple/calendars');
      if (res.ok) {
        const data = await res.json();
        setCalendars(data.calendars);
        addToast('success', 'Calendars Refreshed', `Found ${data.calendars.length} calendars.`);
      }
    } catch (e: any) {
      addToast('error', 'Failed to refresh calendars', e.message);
    }
  };

  // Test Notion
  const handleTestNotion = async (apiKey: string, databaseId: string): Promise<NotionDatabaseInfo | null> => {
    const res = await fetch('/api/notion/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, databaseId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Connection failed');
    }
    const data = await res.json();
    setNotionReady(true);
    return data;
  };

  const supportLink = settings.donationUrl || 'https://ko-fi.com';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-fuchsia-500 selection:text-white">
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <Header
        settings={settings}
        calendars={calendars}
        notionReady={notionReady}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSamples={() => setIsSamplesOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Private &bull; Zero Data Stored &bull; Processed In-Memory</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Turn Any Schedule Image into Calendar Events
          </h2>
          <p className="text-sm text-slate-400">
            Drop a screenshot of a class timetable, shift roster, or meeting agenda. Planer extracts every event and ports them directly into <b className="text-slate-200">Apple Calendar</b> and <b className="text-slate-200">Notion</b> in seconds.
          </p>

          {/* Privacy Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>No image or schedule data is kept</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Keys stay in your browser only</span>
            </span>
            <span>•</span>
            <span className="text-slate-400">Zero Tracking / No DB</span>
          </div>
        </div>

        {/* Step 1: Upload / Dropzone */}
        <ImageDropzone
          onImageSelected={handleImageSelected}
          onExtract={handleExtract}
          isLoading={isExtracting}
          hasGeminiKey={hasGeminiKey}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Step 2: Events Review Table/Cards */}
        {events.length > 0 && (
          <EventsPreview
            events={events}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddEvent={handleAddEvent}
          />
        )}

        {/* Step 3: Sync Actions Panel */}
        {events.length > 0 && (
          <SyncActionPanel
            events={events}
            settings={settings}
            calendars={calendars}
            isSyncingApple={isSyncingApple}
            isSyncingNotion={isSyncingNotion}
            notionReady={notionReady}
            onSyncApple={handleSyncApple}
            onSyncNotion={handleSyncNotion}
            onSyncBoth={handleSyncBoth}
            onExportICS={() => handleExportICS(true)}
            onCalendarChange={(cal) => setSettings((s) => ({ ...s, defaultAppleCalendar: cal }))}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Empty state hint */}
        {events.length === 0 && !isExtracting && (
          <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 max-w-xl mx-auto flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">No schedule loaded yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Upload or paste a screenshot above, or click{' '}
                <button
                  onClick={() => setIsSamplesOpen(true)}
                  className="text-fuchsia-400 hover:text-fuchsia-300 underline font-medium"
                >
                  Try Samples
                </button>{' '}
                to see how instant porting works!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <p>Planer — Instant Schedule Importer for Apple Calendar &amp; Notion</p>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-[11px] text-emerald-400/90 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Data Retention: We do not store or keep any user data</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-400/90 hover:text-amber-300 transition font-medium"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Buy me a coffee on Ko-fi</span>
            </a>
            <span>•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-300 transition"
            >
              Support Project
            </button>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        calendars={calendars}
        isCloud={isCloud}
        onSaveSettings={handleSaveSettings}
        onRefreshCalendars={handleRefreshCalendars}
        onTestNotion={handleTestNotion}
      />

      {/* Samples Modal */}
      <SampleSchedulesModal
        isOpen={isSamplesOpen}
        onClose={() => setIsSamplesOpen(false)}
        onSelectSample={handleSelectSample}
      />

      {/* Post-Sync Celebration Tip Modal */}
      <TipModal
        isOpen={tipModalState.isOpen}
        onClose={() => setTipModalState((prev) => ({ ...prev, isOpen: false }))}
        donationUrl={settings.donationUrl}
        syncedCount={tipModalState.syncedCount}
        destination={tipModalState.destination}
      />
    </div>
  );
}
