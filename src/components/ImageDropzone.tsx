import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, 
  Settings as SettingsIcon, Check, Calendar, ArrowRight, Loader2 
} from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (base64: string, mimeType: string, filename?: string) => void;
  onExtract: (referenceDate: string) => void;
  isLoading: boolean;
  hasGeminiKey: boolean;
  onOpenSettings: () => void;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImageSelected,
  onExtract,
  isLoading,
  hasGeminiKey,
  onOpenSettings,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [referenceDate, setReferenceDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP).');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Global paste listener (Cmd + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          processFile(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700/80">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Top bar with quick instructions & reference date picker */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <span>1. Drop or Paste Your Schedule</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports screenshots, photos of printed timetables, syllabus calendars, or shift rosters.
            </p>
          </div>

          {/* Reference Date Control */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-1.5 self-stretch sm:self-auto">
            <Calendar className="w-4 h-4 text-fuchsia-400 ml-2" />
            <span className="text-xs text-slate-400 font-medium">Reference date:</span>
            <input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-fuchsia-500 font-medium"
            />
            <div className="hidden lg:flex items-center gap-1 pl-1">
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
        </div>

        {/* Drop Zone Area */}
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
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          {previewUrl ? (
            <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-2xl">
              <div className="relative group/thumb shrink-0">
                <img
                  src={previewUrl}
                  alt="Schedule preview"
                  className="w-36 h-36 object-cover rounded-2xl border border-slate-700 shadow-md group-hover/thumb:border-fuchsia-500 transition"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/thumb:opacity-100 rounded-2xl flex items-center justify-center transition">
                  <span className="text-xs text-white font-medium">Change Image</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <Check className="w-3 h-3" />
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
                <span>•</span>
                <span>Direct Clipboard Paste</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button & API Notice */}
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
                  <span className="font-mono text-fuchsia-400 font-medium">Gemini 3.8 Flash (Interactions API)</span>
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
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Schedule with Gemini 3.8...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-fuchsia-200" />
                <span>Extract Events from Image</span>
                <ArrowRight className="w-4 h-4 opacity-80" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
