export interface ExtractedEventRaw {
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

function sanitizeModelName(model?: string): string {
  if (!model || model.includes('2.5') || model === 'gemini-2.5-flash') {
    return 'gemini-3.8-flash';
  }
  return model;
}

/**
 * Intelligent room & location extractor and cleaner.
 * Ensures classroom numbers, lecture halls, buildings, and zoom links
 * are extracted into the `location` field and not lost or buried in the title.
 */
export function normalizeAndExtractRooms(events: ExtractedEventRaw[]): ExtractedEventRaw[] {
  return events.map((ev) => {
    let title = (ev.title || '').trim();
    let location = (ev.location || '').trim();
    let description = (ev.description || '').trim();

    // Pattern 1: Title ends with room notation in parentheses/brackets or after dash/colon
    // e.g., "Linear Algebra (Hörsaal 2)", "Math - Raum B104", "CS 101 [Room 304]", "Physik | HS 1"
    const titleRoomMatch = title.match(
      /(.*?)\s*[\(\[\-–•|]\s*(?:in\s+)?(Raum|Room|Rm\.?|Hörsaal|HS|Audimax|Gebäude|Geb\.|SR|Seminarraum|Labor|Lab|Bldg|Building)\s*[:#.]?\s*([A-Za-z0-9.\-\/ ]+?)[\)\]]?$/i
    );

    if (titleRoomMatch) {
      const cleanTitle = titleRoomMatch[1].trim();
      const detectedRoomPrefix = titleRoomMatch[2].trim();
      const detectedRoomCode = titleRoomMatch[3].trim();
      const detectedRoom = `${detectedRoomPrefix} ${detectedRoomCode}`.replace(/\s+/g, ' ');

      if (cleanTitle) {
        title = cleanTitle;
      }
      if (!location) {
        location = detectedRoom;
      }
    }

    // Pattern 2: Title has inline room code without brackets (e.g. "Mathe I HS 3", "Physik Raum 101")
    if (!location) {
      const inlineMatch = title.match(
        /(.*?)\s+(Raum|Room|Rm\.?|Hörsaal|HS|Audimax|Gebäude|Geb\.|SR|Seminarraum|Labor|Lab)\s*[:#.]?\s*([A-Za-z0-9.\-\/]+)$/i
      );
      if (inlineMatch && inlineMatch[1].trim()) {
        title = inlineMatch[1].trim();
        location = `${inlineMatch[2]} ${inlineMatch[3]}`.trim();
      }
    }

    // Pattern 3: Description has room notation
    if (!location && description) {
      const descMatch = description.match(
        /(?:(?:in|at|room|raum|hörsaal|hs|audimax|geb\.|gebäude|sr|seminarraum)\s*[:#.]?\s*([A-Za-z0-9.\-\/ ]+))/i
      );
      if (descMatch) {
        location = descMatch[0].trim();
      }
    }

    // Clean up excessive whitespace
    title = title.replace(/\s+/g, ' ');
    location = location.replace(/\s+/g, ' ');

    return {
      ...ev,
      title,
      location,
      description,
    };
  });
}

export async function parseScheduleWithGemini(
  base64Data: string,
  mimeType: string = 'image/png',
  apiKey?: string,
  modelName: string = 'gemini-3.8-flash',
  referenceDate?: string
): Promise<{ events: ExtractedEventRaw[]; rawSummary?: string; isDemo?: boolean }> {
  // If no API key is provided, return simulated demo extraction
  if (!apiKey || apiKey.trim() === '') {
    const today = referenceDate || new Date().toISOString().slice(0, 10);
    const d = new Date(today);
    
    const d1 = new Date(d);
    const d2 = new Date(d);
    d2.setDate(d2.getDate() + 1);
    const d3 = new Date(d);
    d3.setDate(d3.getDate() + 2);

    return {
      isDemo: true,
      rawSummary: 'Demo Mode: No Gemini API Key provided yet. Showing sample schedule extraction.',
      events: [
        {
          title: 'Product Design Sync',
          startDate: d1.toISOString().slice(0, 10),
          startTime: '09:30',
          endDate: d1.toISOString().slice(0, 10),
          endTime: '10:30',
          allDay: false,
          location: 'Conference Room B / Zoom',
          description: 'Weekly review of roadmap and Notion calendar integration UX.',
          category: 'Work',
        },
        {
          title: 'CS 301: Distributed Systems Lecture',
          startDate: d1.toISOString().slice(0, 10),
          startTime: '13:00',
          endDate: d1.toISOString().slice(0, 10),
          endTime: '14:30',
          allDay: false,
          location: 'Auditorium 101',
          description: 'Consensus protocols & Raft algorithm walkthrough.',
          category: 'Lecture',
        },
        {
          title: 'Team Standup & Planning',
          startDate: d2.toISOString().slice(0, 10),
          startTime: '10:00',
          endDate: d2.toISOString().slice(0, 10),
          endTime: '10:45',
          allDay: false,
          location: 'Google Meet',
          description: 'Daily check-in and task distribution.',
          category: 'Work',
        },
        {
          title: 'Gym & Cardio Session',
          startDate: d2.toISOString().slice(0, 10),
          startTime: '18:00',
          endDate: d2.toISOString().slice(0, 10),
          endTime: '19:15',
          allDay: false,
          location: 'Fitness Club',
          description: 'Leg day and 30min steady state cardio.',
          category: 'Health',
        },
        {
          title: 'Strategy & Quarterly Review',
          startDate: d3.toISOString().slice(0, 10),
          startTime: '14:00',
          endDate: d3.toISOString().slice(0, 10),
          endTime: '16:00',
          allDay: false,
          location: 'Executive Room / Remote',
          description: 'Q4 milestones, KPI tracking and deliverables.',
          category: 'Meeting',
        },
      ],
    };
  }

  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
  const refDate = referenceDate || new Date().toISOString().slice(0, 10);
  const targetModel = sanitizeModelName(modelName);

  let effectiveMimeType = mimeType;
  if (mimeType.includes('svg')) {
    effectiveMimeType = 'image/png';
  }

  const systemPrompt = `You are a high-accuracy visual calendar & schedule parser using Gemini 3.8.
Analyze this image (which could be a university/college timetable, school schedule, work shift roster, calendar screenshot, syllabus, conference program, or hand-written/printed schedule).

CURRENT REFERENCE DATE: ${refDate} (Today's date).
If the image references days of the week like "Monday", "Tue", "Wednesday", or month names without a full year, calculate the corresponding ISO date 'YYYY-MM-DD' assuming the closest date starting from or around ${refDate}.

CRITICAL INSTRUCTIONS FOR ROOMS & LOCATIONS:
Timetables and schedule screenshots almost ALWAYS specify a classroom, lecture hall, room code, lab, or building inside each cell or event block.
Examine each cell carefully for room indicators:
- German/European terms: "Raum", "R.", "Zimmer", "Hörsaal", "HS", "Audimax", "Gebäude", "Geb.", "Seminarraum", "SR", "Labor", "Lab" (e.g. "Hörsaal 3", "HS 2", "Raum B.104", "R. 0.12", "Geb. 50.34", "Audimax", "SR 2")
- English terms: "Room", "Rm.", "Classroom", "Hall", "Lecture Hall", "Building", "Bldg", "Auditorium", "Lab" (e.g. "Room 204", "Rm 3B", "Hall C", "Lab 4")
- Alphanumeric room codes: e.g. "A101", "B2.04", "C-01", "H3", "0.12"
- Virtual locations: "Zoom", "Teams", "Google Meet", "Online"

RULES:
1. ALWAYS extract the classroom, lecture hall, or room number into the "location" field. NEVER leave "location" empty if any room or building code appears in the cell.
2. Put the clean subject/event name in "title" (e.g. "Linear Algebra", "Wirtschaftsinformatik", "CS 101").
3. Put the room/building in "location" (e.g. "Hörsaal 2", "Raum B104", "Room 301").
4. If a professor or instructor is listed (e.g. "Prof. Dr. Schmidt", "Dr. Weber"), put them in "description".
5. Ensure times are in 24-hour HH:mm format. If end time is not stated, assume 60 minutes after start time.

Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Brief 1-sentence description of the schedule detected",
  "events": [
    {
      "title": "Clear event or subject name",
      "startDate": "YYYY-MM-DD",
      "startTime": "HH:mm in 24h format (e.g. 09:00, 14:30), or empty string if allDay",
      "endDate": "YYYY-MM-DD",
      "endTime": "HH:mm in 24h format (e.g. 10:15, 17:00), or empty string if allDay",
      "allDay": false,
      "location": "Room, classroom, lecture hall, building, or zoom link (e.g. 'Hörsaal 3', 'Raum B104', 'Room 201')",
      "description": "Professor/instructor, topic, notes, or course code",
      "category": "Lecture | Work | Meeting | Study | Personal | Health | Shift | Other"
    }
  ]
}`;

  const extractAndParseJSON = (text: string) => {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned);
  };

  // 1. Primary: Gemini Interactions API (https://ai.google.dev/gemini-api/docs/get-started)
  try {
    const interactionsUrl = `https://generativelanguage.googleapis.com/v1beta/interactions`;
    const interactionsPayload = {
      model: targetModel,
      input: [
        { type: 'text', text: systemPrompt },
        {
          type: 'image',
          data: cleanBase64,
          mime_type: effectiveMimeType,
        },
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const intResponse = await fetch(interactionsUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-goog-api-key': apiKey.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interactionsPayload),
    });
    clearTimeout(timeoutId);

    if (intResponse.ok) {
      const intResult = (await intResponse.json()) as any;
      let rawText = intResult.output_text;

      if (!rawText && intResult.steps) {
        for (const step of intResult.steps) {
          if (step.content) {
            for (const part of step.content) {
              if (part.text) {
                rawText = part.text;
                break;
              }
            }
          }
        }
      }

      if (!rawText && intResult.outputs?.[0]?.text) {
        rawText = intResult.outputs[0].text;
      }

      if (rawText) {
        const parsed = extractAndParseJSON(rawText);
        const rawEvents: ExtractedEventRaw[] = parsed.events || [];
        const normalizedEvents = normalizeAndExtractRooms(rawEvents);
        return {
          isDemo: false,
          rawSummary: parsed.summary || 'Extracted events with Gemini 3.8 Interactions API',
          events: normalizedEvents,
        };
      }
    }
  } catch (interactionsErr: any) {
    console.warn('Interactions API call note:', interactionsErr.message);
  }

  // 2. High-availability models list for generateContent (target model first, then resilient fast fallback)
  const modelsToTry = [
    targetModel,
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
  ];

  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastErrorMsg = '';

  for (const modelToCall of uniqueModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:generateContent?key=${apiKey.trim()}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inline_data: {
                  mime_type: effectiveMimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = (await response.json()) as any;
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = extractAndParseJSON(text);
          const rawEvents: ExtractedEventRaw[] = parsed.events || [];
          const normalizedEvents = normalizeAndExtractRooms(rawEvents);
          return {
            isDemo: false,
            rawSummary: parsed.summary || 'Extracted events from schedule',
            events: normalizedEvents,
          };
        }
      }

      const errorBody = await response.json().catch(() => ({}));
      lastErrorMsg = errorBody.error?.message || `Gemini API HTTP ${response.status}: ${response.statusText}`;

      // If 429 quota or 503 high demand, try the next model in the chain
      if (response.status === 429 || response.status === 503) {
        continue;
      } else {
        break;
      }
    } catch (e: any) {
      lastErrorMsg = e.message;
    }
  }

  throw new Error(lastErrorMsg || 'Failed to extract schedule with Gemini');
}
