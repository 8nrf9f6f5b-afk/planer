import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, X, Calendar, ArrowRight, Loader2, Clipboard } from 'lucide-react';

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [referenceDate, setReferenceDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle global paste (Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageName(file.name || 'Pasted Schedule Screenshot');
      onImageSelected(result, file.type, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setRelativeDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setReferenceDate(d.toISOString().slice(0, 10));
  };

  const setNextMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day + 1) % 7 || 7;
    d.setDate(d.getDate() + diff);
    setReferenceDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Top Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
              1. Drop or Paste Your Schedule
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Supports screenshots, photos of printed timetables, syllabus calendars, or shift rosters.
            </p>
          </div>

          {/* Reference Date Picker */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
              <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Reference date:</span>
            </div>
            <input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-fuchsia-500 font-mono"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRelativeDate(0)}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setRelativeDate(1)}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={setNextMonday}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Next Mon
              </button>
            </div>
          </div>
        </div>

        {/* Dropzone Container */}
        {!imagePreview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-fuchsia-500 bg-fuchsia-500/10 scale-[1.005]'
                : 'border-slate-700/80 hover:border-fuchsia-500/60 bg-slate-950/40 hover:bg-slate-950/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 group-hover:scale-105 transition">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1.5 max-w-md">
              <p className="text-base font-semibold text-slate-200">
                Drag &amp; drop schedule image here, or{' '}
                <span className="text-fuchsia-400 underline underline-offset-4">browse</span>
              </p>
              <p className="text-xs text-slate-400">
                Or press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[11px]">Cmd + V</kbd> to paste a screenshot directly from your clipboard
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> PNG, JPG, WebP
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clipboard className="w-3.5 h-3.5" /> Direct Clipboard Paste
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            {/* Thumbnail Preview */}
            <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 max-h-72 flex items-center justify-center lg:w-1/2">
              <img
                src={imagePreview}
                alt="Schedule Preview"
                className="max-h-72 w-full object-contain"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/80 hover:bg-red-500/90 text-white backdrop-blur border border-slate-700 transition"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Extraction Action Area */}
            <div className="lg:w-1/2 flex flex-col justify-between p-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Ready to Extract
                  </span>
                  <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
                    {imageName}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Vision Model:</span>
                    <span className="font-mono text-fuchsia-400 font-medium">Gemini 2.5 Flash</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Calendar Baseline:</span>
                    <span className="font-mono text-slate-200">{referenceDate}</span>
                  </div>
                  {!hasGeminiKey && (
                    <div className="pt-1 border-t border-slate-800 text-[11px] text-amber-300 flex items-center justify-between">
                      <span>No Gemini key set (demo mode)</span>
                      <button
                        onClick={onOpenSettings}
                        className="underline hover:text-amber-200 font-medium ml-2"
                      >
                        Set API Key
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onExtract(referenceDate)}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                    isLoading
                      ? 'bg-fuchsia-600/50 text-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-fuchsia-600/25 hover:shadow-fuchsia-600/40 hover:scale-[1.01]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Gemini is reading schedule events...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>Instantly Extract Calendar Events</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-500">
                  Extracts dates, start/end hours, subjects, locations, and descriptions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
