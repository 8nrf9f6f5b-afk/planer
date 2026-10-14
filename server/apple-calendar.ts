import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface AppleSyncEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate?: string;   // YYYY-MM-DD
  endTime?: string;   // HH:mm
  allDay?: boolean;
  location?: string;
  description?: string;
}

function escapeAppleScriptString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

export async function ensureCalendarRunning(): Promise<void> {
  try {
    await execPromise('open -g -a Calendar');
    await new Promise((r) => setTimeout(r, 800));
  } catch (e) {
    // Ignore error if already running
  }
}

export async function getAppleCalendars(): Promise<string[]> {
  await ensureCalendarRunning();
  const script = `tell application "Calendar" to get name of calendars`;
  try {
    const { stdout } = await execPromise(`osascript -e '${script}'`);
    const list = stdout
      .trim()
      .split(', ')
      .map((c) => c.trim())
      .filter(Boolean);
    return list;
  } catch (error: any) {
    console.error('Failed to get Apple Calendars via osascript:', error.message);
    return ['Privat', 'Arbeit', 'Calendar'];
  }
}

export async function addEventToAppleCalendar(
  event: AppleSyncEvent,
  calendarName: string = 'Privat'
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const [startYear, startMonth, startDay] = (
      event.startDate || new Date().toISOString().slice(0, 10)
    )
      .split('-')
      .map(Number);
    const [startH, startM] = (event.startTime || '09:00').split(':').map(Number);

    const endD =
      event.endDate || event.startDate || new Date().toISOString().slice(0, 10);
    const [endYear, endMonth, endDay] = endD.split('-').map(Number);
    const [endH, endM] = (event.endTime || '10:00').split(':').map(Number);

    const titleEscaped = escapeAppleScriptString(event.title || 'Untitled Event');
    const descEscaped = escapeAppleScriptString(event.description || '');
    const locEscaped = escapeAppleScriptString(event.location || '');
    const calEscaped = escapeAppleScriptString(calendarName);

    const isAllDay = !!event.allDay;

    const script = `
tell application "Calendar"
  set targetCal to calendar "${calEscaped}"
  tell targetCal
    set sDate to current date
    set year of sDate to ${startYear}
    set month of sDate to ${startMonth}
    set day of sDate to ${startDay}
    set hours of sDate to ${isAllDay ? 0 : isNaN(startH) ? 9 : startH}
    set minutes of sDate to ${isAllDay ? 0 : isNaN(startM) ? 0 : startM}
    set seconds of sDate to 0

    set eDate to current date
    set year of eDate to ${endYear}
    set month of eDate to ${endMonth}
    set day of eDate to ${endDay}
    set hours of eDate to ${isAllDay ? 23 : isNaN(endH) ? 10 : endH}
    set minutes of eDate to ${isAllDay ? 59 : isNaN(endM) ? 0 : endM}
    set seconds of eDate to 0

    set newEv to make new event with properties {summary:"${titleEscaped}", start date:sDate, end date:eDate, allday event:${isAllDay}, description:"${descEscaped}", location:"${locEscaped}"}
    return id of newEv
  end tell
end tell
    `;

    const { stdout } = await execPromise(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    const eventId = stdout.trim();
    return { success: true, eventId };
  } catch (error: any) {
    console.error('Error adding event to Apple Calendar:', error.message);
    return { success: false, error: error.message };
  }
}

export async function addBatchEventsToAppleCalendar(
  events: AppleSyncEvent[],
  calendarName: string = 'Privat'
): Promise<Array<{ id: string; success: boolean; eventId?: string; error?: string }>> {
  await ensureCalendarRunning();
  const results = [];
  for (const event of events) {
    const res = await addEventToAppleCalendar(event, calendarName);
    results.push({
      id: event.id,
      ...res,
    });
  }
  return results;
}
