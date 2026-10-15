import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, 
  Settings as SettingsIcon, Check, Calendar, ArrowRight, Loader2, ShieldCheck, Lock,
  Link as LinkIcon, ExternalLink, Info
} from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (base64: string, mimeType: string, filename?: string) => void;
  onExtract: (referenceDate: string) => void;
  onExtractUrl?: (url: string) => void;
  isLoading: boolean;
  hasGeminiKey: boolean;
  onOpenSettings: () => void;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImageSelected,
  onExtract,
  onExtractUrl,
  isLoading,
  hasGeminiKey,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'screenshot' | 'url'>('screenshot');
  const [inputUrl, setInputUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [referenceDate, setReferenceDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreviewUrl(base64);
      onImageSelected(base64, file.type, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Support pasting image directly from clipboard anywhere on page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'screenshot') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !onExtractUrl) return;
    onExtractUrl(inputUrl.trim());
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        {/* Top Controls: Mode Switcher & Target Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-600/20 text-fuchsia-400 text-xs font-bold border border-fuchsia-500/30">
              1
            </span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('screenshot')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'screenshot'
                    ? 'bg-fuchsia-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Schedule Screenshot</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'url'
                    ? 'bg-fuchsia-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Campus / Feed URL</span>
              </button>
            </div>
          </div>

          {activeTab === 'screenshot' && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Week Starting:</span>
              </label>
              <input
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-fuchsia-500 font-mono shadow-inner"
              />
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setReferenceDate(new Date().toISOString().slice(0, 10))}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-lg transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tm = new Date();
                    tm.setDate(tm.getDate() + 1);
                    setReferenceDate(tm.toISOString().slice(0, 10));
                  }}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-lg transition"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    const day = d.getDay();
                    const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
                    d.setDate(diff);
                    setReferenceDate(d.toISOString().slice(0, 10));
                  }}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-lg transition"
                >
                  Next Mon
                </button>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'screenshot' ? (
          /* Drop Zone Area */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`group cursor-pointer relative border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-300 ${
              isDragOver
                ? 'border-fuchsia-500 bg-fuchsia-500/10 scale-[1.008]'
                : previewUrl
                ? 'border-fuchsia-500/40 bg-slate-950/40 hover:border-fuchsia-500/70'
                : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
            />

            {previewUrl ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="relative max-h-64 max-w-full overflow-hidden rounded-xl border border-slate-700 shadow-lg">
                  <img
                    src={previewUrl}
                    alt="Schedule preview"
                    className="object-contain max-h-60 rounded-lg mx-auto"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-300 border border-slate-800">
                    Click to replace image
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Image Loaded &amp; Ready</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100">Schedule Screenshot Attached</h4>
                  <p className="text-xs text-slate-400">
                    Ready to parse with Gemini Vision AI. Click below or pick another image anytime.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 p-0.5 shadow-xl group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <UploadCloud className="w-8 h-8 text-fuchsia-400 group-hover:text-fuchsia-300 transition" />
                  </div>
                </div>

                <div>
                  <p className="text-base font-semibold text-slate-200">
                    Drag &amp; drop schedule image here, or <span className="text-fuchsia-400 underline underline-offset-4">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Or press <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">Cmd + V</kbd> to paste a screenshot directly from your clipboard
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-medium">
                  <span>PNG, JPG, WebP</span>
                  <span>&bull;</span>
                  <span>Direct Clipboard Paste</span>
                  <span>&bull;</span>
                  <span className="text-amber-400">Rooms &amp; Hörsäle Detected</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Campus / Calendar Feed URL Tab */
          <div className="space-y-5">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Paste Calendar Feed / Subscription Link (.ics or webcal://):
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="e.g. webcal://neo.hfwu.de/dispatch.php/calendar/export/... or https://..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputUrl.trim() || isLoading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white shadow-lg shadow-fuchsia-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>Fetch &amp; Import Feed</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Step-by-step automatic guide for HfWU NEO / Stud.IP */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-fuchsia-300 font-bold text-sm">
                <Info className="w-4 h-4" />
                <span>How to Get Full 100% Automatic Syncing from NEO (HfWU):</span>
              </div>
              <ol className="space-y-2 text-slate-300 pl-4 list-decimal marker:text-fuchsia-400 leading-relaxed">
                <li>
                  Open <a href="https://neo.hfwu.de/dispatch.php/calendar/calendar" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 underline font-medium">neo.hfwu.de/dispatch.php/calendar/calendar</a>.
                </li>
                <li>
                  In the left sidebar under <b>„Aktionen“</b>, click <b>„Terminkalender abonnieren“</b> (Subscribe to calendar).
                </li>
                <li>
                  Copy the generated <code className="bg-slate-900 px-1.5 py-0.5 rounded text-fuchsia-300 font-mono">webcal://neo.hfwu.de/...</code> link.
                </li>
                <li>
                  <b>For 100% automated real-time syncing forever in Apple Calendar:</b> Open Apple Calendar on Mac &rarr; Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono">Opt + Cmd + S</kbd> &rarr; Paste the link. It will update automatically on your Mac, iPhone, and Apple Watch!
                </li>
                <li>
                  <b>Or paste it into the box above</b> if you want Planer to format your room codes into glanceable titles and port them directly into your <b>Notion</b> database!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Action Button & API Notice (only for screenshot mode) */}
        {activeTab === 'screenshot' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              {!hasGeminiKey ? (
                <div className="flex items-center gap-1.5 text-amber-400/90">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    No API key set. Running in <b>Demo Mode</b> (sample extraction).{' '}
                    <button
                      onClick={onOpenSettings}
                      className="underline text-amber-300 hover:text-white font-medium"
                    >
                      Add Gemini Key
                    </button>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>
                    Multimodal vision enabled with{' '}
                    <span className="font-mono text-fuchsia-400 font-medium">Gemini 3.8 Flash</span>
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!previewUrl || isLoading}
              onClick={() => onExtract(referenceDate)}
              className={`w-full sm:w-auto px-7 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all duration-200 ${
                !previewUrl || isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  : 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white shadow-fuchsia-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Timetable &amp; Rooms...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Schedule &amp; Rooms</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
