export interface ICSEvent {
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate?: string;   // YYYY-MM-DD
  endTime?: string;   // HH:mm
  allDay?: boolean;
  location?: string;
  description?: string;
  includeRoomInTitle?: boolean;
}

export interface ICSOptions {
  includeRoomInTitle?: boolean;
}

function formatICSDate(dateStr: string, timeStr?: string, allDay?: boolean): string {
  const [y, m, d] = dateStr.split('-');
  if (allDay || !timeStr) {
    return `${y}${m}${d}`;
  }
  const [hh, mm] = timeStr.split(':');
  return `${y}${m}${d}T${hh || '00'}${mm || '00'}00`;
}

export function generateICS(events: ICSEvent[], options?: ICSOptions): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planer//Schedule Importer//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  for (const ev of events) {
    const uid = `planer-${Math.random().toString(36).substring(2, 11)}@planer.local`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);

    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatICSDate(ev.startDate, undefined, true)}`);
      const endD = ev.endDate || ev.startDate;
      lines.push(`DTEND;VALUE=DATE:${formatICSDate(endD, undefined, true)}`);
    } else {
      lines.push(`DTSTART:${formatICSDate(ev.startDate, ev.startTime || '09:00')}`);
      lines.push(`DTEND:${formatICSDate(ev.endDate || ev.startDate, ev.endTime || '10:00')}`);
    }

    const locTrimmed = (ev.location || '').trim();
    const shouldAddRoomToTitle =
      (options?.includeRoomInTitle ?? ev.includeRoomInTitle ?? true) &&
      locTrimmed !== '' &&
      !ev.title.toLowerCase().includes(locTrimmed.toLowerCase());

    const displayTitle = shouldAddRoomToTitle
      ? `${ev.title} (${locTrimmed})`
      : (ev.title || 'Untitled');

    lines.push(`SUMMARY:${displayTitle.replace(/\n/g, ' ')}`);

    // Description with prominent Room/Location note
    const descParts: string[] = [];
    if (locTrimmed) {
      descParts.push(`📍 Room: ${locTrimmed}`);
    }
    if (ev.description && ev.description.trim()) {
      descParts.push(ev.description.trim());
    }

    if (descParts.length > 0) {
      lines.push(`DESCRIPTION:${descParts.join('\\n\\n').replace(/\n/g, '\\n')}`);
    }

    if (locTrimmed) {
      lines.push(`LOCATION:${locTrimmed.replace(/\n/g, ' ')}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
