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
Analyze this image (which could be a timetable, calendar screenshot, work shift schedule, syllabus, conference program, or hand-written/printed schedule).

CURRENT REFERENCE DATE: ${refDate} (Today's date).
If the image references days of the week like "Monday", "Tue", "Wednesday", or month names without a full year, calculate the corresponding ISO date 'YYYY-MM-DD' assuming the closest date starting from or around ${refDate}.

Extract all individual events, classes, meetings, shifts, or appointments from the image.
Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Brief 1-sentence description of the schedule detected",
  "events": [
    {
      "title": "Clear event name/summary",
      "startDate": "YYYY-MM-DD",
      "startTime": "HH:mm in 24h format (e.g. 09:00, 14:30), or empty string if allDay",
      "endDate": "YYYY-MM-DD",
      "endTime": "HH:mm in 24h format (e.g. 10:15, 17:00), or empty string if allDay",
      "allDay": false,
      "location": "Room, zoom link, address, building, or empty string",
      "description": "Additional notes, professor/speaker, topic, or preparation details",
      "category": "Work | Lecture | Meeting | Study | Personal | Health | Shift | Other"
    }
  ]
}
Ensure times are always in 24-hour HH:mm format. If end time is not stated, assume 60 minutes after start time.`;

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
        return {
          isDemo: false,
          rawSummary: parsed.summary || 'Extracted events with Gemini 3.8 Interactions API',
          events: parsed.events || [],
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
          return {
            isDemo: false,
            rawSummary: parsed.summary || 'Extracted events from schedule',
            events: parsed.events || [],
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
