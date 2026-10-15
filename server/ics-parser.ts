import { CalendarEvent } from '../src/types/index.js';

/**
 * Parses an iCalendar (.ics / webcal) string into CalendarEvent objects
 */
export function parseICSContent(icsText: string): Partial<CalendarEvent>[] {
  const events: Partial<CalendarEvent>[] = [];
  
  // Normalize line folding (lines beginning with whitespace are continuations)
  const unfolded = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  let currentEvent: any = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (currentEvent && (currentEvent.title || currentEvent.summary)) {
        events.push(formatParsedEvent(currentEvent));
      }
      currentEvent = null;
      continue;
    }

    if (!currentEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const propHeader = line.substring(0, colonIdx);
    const propValue = line.substring(colonIdx + 1).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
    const propName = propHeader.split(';')[0].toUpperCase();

    switch (propName) {
      case 'SUMMARY':
        currentEvent.title = propValue;
        break;
      case 'LOCATION':
        currentEvent.location = propValue;
        break;
      case 'DESCRIPTION':
        currentEvent.description = propValue;
        break;
      case 'CATEGORIES':
        currentEvent.category = propValue.split(',')[0].trim();
        break;
      case 'DTSTART':
        currentEvent.dtstart = propValue;
        currentEvent.dtstartParams = propHeader;
        break;
      case 'DTEND':
        currentEvent.dtend = propValue;
        currentEvent.dtendParams = propHeader;
        break;
    }
  }

  return events;
}

function parseIcsDate(rawDateStr?: string): { date: string; time: string; allDay: boolean } {
  if (!rawDateStr) {
    const today = new Date().toISOString().slice(0, 10);
    return { date: today, time: '09:00', allDay: false };
  }

  const clean = rawDateStr.trim().replace(/Z$/, '');
  
  // Format: YYYYMMDD (all day)
  if (clean.length === 8 && /^\d{8}$/.test(clean)) {
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    return { date: `${y}-${m}-${d}`, time: '00:00', allDay: true };
  }

  // Format: YYYYMMDDTHHMMSS
  if (clean.includes('T')) {
    const [datePart, timePart] = clean.split('T');
    const y = datePart.slice(0, 4);
    const m = datePart.slice(4, 6);
    const d = datePart.slice(6, 8);
    const hh = timePart.slice(0, 2);
    const mm = timePart.slice(2, 4);
    return {
      date: `${y}-${m}-${d}`,
      time: `${hh}:${mm}`,
      allDay: false,
    };
  }

  return { date: clean.slice(0, 10), time: '09:00', allDay: false };
}

function formatParsedEvent(raw: any): Partial<CalendarEvent> {
  const start = parseIcsDate(raw.dtstart);
  const end = parseIcsDate(raw.dtend || raw.dtstart);

  let title = raw.title || 'Untitled Lecture';
  let location = (raw.location || '').trim();

  // If location is empty, check description or title for German room identifiers (CI10, Hörsaal, Raum, etc.)
  if (!location) {
    const combined = `${title} ${raw.description || ''}`;
    const roomMatch = combined.match(/(?:Raum|Room|Hörsaal|HS|Audimax|Gebäude|Geb\.|SR|CI\d+|W\d+|HF\d+)[ :.\-]*([A-Za-z0-9._\- ]{2,20})/i);
    if (roomMatch) {
      location = roomMatch[0].trim();
    }
  }

  return {
    id: `ics-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    allDay: start.allDay,
    location,
    description: raw.description || '',
    category: raw.category || 'Lecture',
    selected: true,
  };
}
