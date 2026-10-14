import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface SampleSchedulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (imagePath: string, name: string) => void;
}

export const SampleSchedulesModal: React.FC<SampleSchedulesModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  const samples = [
    {
      title: 'University Class Timetable',
      description: 'Weekly lectures in Algorithms, Linear Algebra, AI Lab, and Database Systems.',
      path: '/samples/class-schedule.svg',
      tag: 'University',
      color: 'from-blue-500/20 to-purple-500/20 border-blue-500/30',
    },
    {
      title: 'Team Work Shift & Roster',
      description: 'Morning standups, DevOps deployments, 1-on-1s, and client demo presentations.',
      path: '/samples/work-shifts.svg',
      tag: 'Work / Shift',
      color: 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30',
    },
    {
      title: 'AI Conference Day Agenda',
      description: 'Full-day itinerary with keynote, multimodal panel, luncheon, and workshops.',
      path: '/samples/conference-agenda.svg',
      tag: 'Conference',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Try a Sample Schedule</h3>
              <p className="text-xs text-slate-400">Test the instant schedule porting flow with one click</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of samples */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {samples.map((sample) => (
            <div
              key={sample.title}
              onClick={() => {
                onSelectSample(sample.path, sample.title);
                onClose();
              }}
              className="group border border-slate-800 hover:border-fuchsia-500/60 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center gap-4"
            >
              {/* Preview image */}
              <div className="w-full sm:w-44 h-28 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900 shrink-0 flex items-center justify-center">
                <img
                  src={sample.path}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              {/* Text details */}
              <div className="flex-1 space-y-1.5 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium border bg-slate-800 text-slate-300 border-slate-700">
                    {sample.tag}
                  </span>
                  <span className="text-xs text-fuchsia-400 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                    Select sample <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-white">
                  {sample.title}
                </h4>
                <p className="text-xs text-slate-400">
                  {sample.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
