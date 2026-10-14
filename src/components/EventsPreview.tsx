import React from 'react';
import { CalendarEvent } from '../types';
import { 
  Calendar, Clock, MapPin, AlignLeft, Trash2, Plus, 
  CheckSquare, Square, CheckCircle2, AlertCircle, RefreshCw, Tag
} from 'lucide-react';

interface EventsPreviewProps {
  events: CalendarEvent[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onAddEvent: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Lecture: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Meeting: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Study: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  Health: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Shift: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  Social: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Personal: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  Other: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
};

export const EventsPreview: React.FC<EventsPreviewProps> = ({
  events,
  onToggleSelect,
  onToggleSelectAll,
  onUpdateEvent,
  onDeleteEvent,
  onAddEvent,
}) => {
  const selectedCount = events.filter(e => e.selected).length;
  const allSelected = events.length > 0 && selectedCount === events.length;

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">
              2. Review &amp; Edit Extracted Schedule
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review event dates and times. Click any field to edit before porting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-fuchsia-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{allSelected ? 'Deselect All' : `Select All (${selectedCount}/${events.length})`}</span>
          </button>

          <button
            type="button"
            onClick={onAddEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-fuchsia-300 border border-fuchsia-500/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event, index) => {
          const catClass = CATEGORY_COLORS[event.category || 'Other'] || CATEGORY_COLORS.Other;

          return (
            <div
              key={event.id}
              className={`rounded-xl border transition-all duration-150 p-4 ${
                event.selected
                  ? 'bg-slate-950/70 border-slate-700/80 shadow-md'
                  : 'bg-slate-950/30 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Select Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleSelect(event.id)}
                  className="mt-1 text-slate-400 hover:text-fuchsia-400 transition"
                >
                  {event.selected ? (
                    <CheckSquare className="w-5 h-5 text-fuchsia-400" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                {/* Event Details Form */}
                <div className="flex-1 space-y-3">
                  {/* Title & Category Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="text"
                      value={event.title}
                      onChange={(e) => onUpdateEvent(event.id, { title: e.target.value })}
                      placeholder="Event Title..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-100 focus:outline-none focus:border-fuchsia-500"
                    />

                    {/* Category input/selector */}
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={event.category || ''}
                        onChange={(e) => onUpdateEvent(event.id, { category: e.target.value })}
                        placeholder="Category"
                        className={`text-xs px-2.5 py-1 rounded-md border font-medium ${catClass} bg-opacity-20 max-w-[120px] focus:outline-none`}
                      />
                    </div>
                  </div>

                  {/* Date, Time, and All-Day Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Start Date */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">Start:</span>
                      <input
                        type="date"
                        value={event.startDate}
                        onChange={(e) => onUpdateEvent(event.id, { startDate: e.target.value })}
                        className="bg-transparent text-slate-200 font-mono focus:outline-none w-full"
                      />
                    </div>

                    {/* Start Time */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">From:</span>
                      <input
                        type="time"
                        value={event.startTime || ''}
                        disabled={event.allDay}
                        onChange={(e) => onUpdateEvent(event.id, { startTime: e.target.value })}
                        className={`bg-transparent text-slate-200 font-mono focus:outline-none w-full ${
                          event.allDay ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    {/* End Time */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">To:</span>
                      <input
                        type="time"
                        value={event.endTime || ''}
                        disabled={event.allDay}
                        onChange={(e) => onUpdateEvent(event.id, { endTime: e.target.value })}
                        className={`bg-transparent text-slate-200 font-mono focus:outline-none w-full ${
                          event.allDay ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    {/* All-Day toggle */}
                    <label className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={event.allDay}
                        onChange={(e) => onUpdateEvent(event.id, { allDay: e.target.checked })}
                        className="rounded border-slate-700 text-fuchsia-600 focus:ring-fuchsia-500"
                      />
                      <span className="text-slate-300 font-medium">All-day event</span>
                    </label>
                  </div>

                  {/* Location & Notes Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Location */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={event.location || ''}
                        onChange={(e) => onUpdateEvent(event.id, { location: e.target.value })}
                        placeholder="Location, Room or URL..."
                        className="bg-transparent text-slate-200 focus:outline-none w-full"
                      />
                    </div>

                    {/* Description */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                      <AlignLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={event.description || ''}
                        onChange={(e) => onUpdateEvent(event.id, { description: e.target.value })}
                        placeholder="Notes, professor, description..."
                        className="bg-transparent text-slate-200 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  {/* Sync Status Badges */}
                  {(event.syncStatus?.apple !== 'idle' || event.syncStatus?.notion !== 'idle') && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      {/* Apple Status */}
                      {event.syncStatus?.apple === 'syncing' && (
                        <span className="inline-flex items-center gap-1 text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Apple Cal syncing...
                        </span>
                      )}
                      {event.syncStatus?.apple === 'success' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" /> Synced to Apple Calendar
                        </span>
                      )}
                      {event.syncStatus?.apple === 'error' && (
                        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                          <AlertCircle className="w-3 h-3" /> Apple Cal: {event.syncStatus.appleMessage || 'Failed'}
                        </span>
                      )}

                      {/* Notion Status */}
                      {event.syncStatus?.notion === 'syncing' && (
                        <span className="inline-flex items-center gap-1 text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Notion syncing...
                        </span>
                      )}
                      {event.syncStatus?.notion === 'success' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" /> Synced to Notion
                        </span>
                      )}
                      {event.syncStatus?.notion === 'error' && (
                        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                          <AlertCircle className="w-3 h-3" /> Notion: {event.syncStatus.notionMessage || 'Failed'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteEvent(event.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Remove this event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
