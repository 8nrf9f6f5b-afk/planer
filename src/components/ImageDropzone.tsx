import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, 
  Settings as SettingsIcon, Check, Calendar, ArrowRight, Loader2, ShieldCheck, Lock 
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
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        {/* Top Controls: Target Reference Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-fuchsia-600/20 text-fuchsia-400 text-xs font-bold border border-fuchsia-500/30">
                1
              </span>
              <span>Upload Schedule Screenshot</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste or drop a screenshot of any timetable, syllabus, or calendar
            </p>
          </div>

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

        {/* Zero Data Retention Security Assurance */}
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <b className="text-slate-300">Zero Data Retention:</b> We do not keep, log, or store your images or schedule data. Extraction runs strictly in-memory.
          </span>
        </div>
      </div>
    </div>
  );
};
