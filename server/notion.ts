export interface NotionSyncEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate?: string;   // YYYY-MM-DD
  endTime?: string;   // HH:mm
  allDay?: boolean;
  location?: string;
  description?: string;
  category?: string;
}

export function cleanDatabaseId(rawId: string): string {
  if (!rawId) return '';
  let id = rawId.trim();
  // If it's a URL, extract the ID before query params or last slug
  if (id.includes('notion.so/')) {
    const parts = id.split('/');
    const lastPart = parts[parts.length - 1].split('?')[0];
    id = lastPart;
  }
  // Remove hyphens first to normalize, then re-format or use 32 hex chars
  const hex32 = id.replace(/-/g, '');
  if (hex32.length === 32) {
    return `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-${hex32.slice(12, 16)}-${hex32.slice(16, 20)}-${hex32.slice(20)}`;
  }
  return id;
}

export async function testNotionConnection(apiKey: string, databaseId: string) {
  const dbId = cleanDatabaseId(databaseId);
  if (!apiKey) throw new Error('Notion API key is missing');
  if (!dbId) throw new Error('Notion Database ID is missing');

  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Notion API error (${res.status}): ${res.statusText}`);
  }

  const data = (await res.json()) as any;
  const properties = data.properties || {};

  // Auto-detect title and date property names
  let titleKey: string | undefined;
  let dateKey: string | undefined;
  let notesKey: string | undefined;
  let locationKey: string | undefined;
  let categoryKey: string | undefined;

  for (const [key, prop] of Object.entries<any>(properties)) {
    if (prop.type === 'title' && !titleKey) {
      titleKey = key;
    }
    if (prop.type === 'date' && !dateKey) {
      dateKey = key;
    }
    if (prop.type === 'rich_text') {
      const lower = key.toLowerCase();
      if (!notesKey && (lower.includes('desc') || lower.includes('note') || lower.includes('detail'))) {
        notesKey = key;
      } else if (!locationKey && (lower.includes('loc') || lower.includes('room') || lower.includes('place'))) {
        locationKey = key;
      }
    }
    if ((prop.type === 'select' || prop.type === 'multi_select' || prop.type === 'status') && !categoryKey) {
      categoryKey = key;
    }
  }

  // Fallbacks if specific names weren't found
  if (!notesKey) {
    notesKey = Object.keys(properties).find(k => properties[k].type === 'rich_text');
  }

  return {
    success: true,
    title: data.title?.[0]?.plain_text || 'Notion Database',
    matchedProperties: {
      titleKey,
      dateKey,
      notesKey,
      locationKey,
      categoryKey,
    },
    totalProperties: Object.keys(properties),
  };
}

export async function addEventToNotion(
  apiKey: string,
  databaseId: string,
  event: NotionSyncEvent,
  matchedProps?: {
    titleKey?: string;
    dateKey?: string;
    notesKey?: string;
    locationKey?: string;
    categoryKey?: string;
  }
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const dbId = cleanDatabaseId(databaseId);
    let titleKey = matchedProps?.titleKey || 'Name';
    let dateKey = matchedProps?.dateKey || 'Date';
    let notesKey = matchedProps?.notesKey || 'Notes';
    let locationKey = matchedProps?.locationKey;

    // Format ISO date strings
    let startDateStr = event.startDate;
    let endDateStr = event.endDate || event.startDate;

    if (!event.allDay && event.startTime) {
      startDateStr = `${event.startDate}T${event.startTime}:00`;
      if (event.endTime) {
        endDateStr = `${endDateStr}T${event.endTime}:00`;
      } else {
        endDateStr = undefined as any;
      }
    } else {
      // All day: if same day, Notion only takes start date
      if (startDateStr === endDateStr) {
        endDateStr = undefined as any;
      }
    }

    const propertiesPayload: any = {
      [titleKey]: {
        title: [
          {
            text: {
              content: event.title || 'Untitled Event',
            },
          },
        ],
      },
      [dateKey]: {
        date: {
          start: startDateStr,
          ...(endDateStr ? { end: endDateStr } : {}),
        },
      },
    };

    if (notesKey && event.description) {
      propertiesPayload[notesKey] = {
        rich_text: [
          {
            text: {
              content: event.description.slice(0, 2000),
            },
          },
        ],
      };
    }

    if (locationKey && event.location) {
      propertiesPayload[locationKey] = {
        rich_text: [
          {
            text: {
              content: event.location.slice(0, 2000),
            },
          },
        ],
      };
    }

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: propertiesPayload,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || `Notion error: ${res.status}` };
    }

    const pageData = (await res.json()) as any;
    return { success: true, pageId: pageData.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addBatchEventsToNotion(
  apiKey: string,
  databaseId: string,
  events: NotionSyncEvent[],
  matchedProps?: any
) {
  const results = [];
  for (const event of events) {
    const res = await addEventToNotion(apiKey, databaseId, event, matchedProps);
    results.push({
      id: event.id,
      ...res,
    });
    // Brief sleep to avoid hitting Notion rate limit
    await new Promise(r => setTimeout(r, 250));
  }
  return results;
}
