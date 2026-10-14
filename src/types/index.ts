export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm (24-hour)
  allDay: boolean;
  location?: string;
  description?: string;
  category?: string;
  selected: boolean;
  syncStatus?: {
    apple?: 'idle' | 'syncing' | 'success' | 'error';
    notion?: 'idle' | 'syncing' | 'success' | 'error';
    appleMessage?: string;
    notionMessage?: string;
  };
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  notionApiKey: string;
  notionDatabaseId: string;
  defaultAppleCalendar: string;
  defaultDurationMinutes: number;
  donationUrl?: string;
}

export interface AppleCalendarInfo {
  name: string;
  isDefault?: boolean;
}

export interface NotionDatabaseInfo {
  id: string;
  title: string;
  matchedProperties?: {
    titleKey?: string;
    dateKey?: string;
    locationKey?: string;
    categoryKey?: string;
    notesKey?: string;
  };
}

export interface ParseScheduleResponse {
  events: CalendarEvent[];
  rawSummary?: string;
  detectedTimezone?: string;
}
