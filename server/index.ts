import express from 'express';
import cors from 'cors';
import { loadConfig, saveConfig } from './config.js';
import { getAppleCalendars, addBatchEventsToAppleCalendar } from './apple-calendar.js';
import { testNotionConnection, addBatchEventsToNotion } from './notion.js';
import { parseScheduleWithGemini } from './gemini.js';
import { generateICS } from './ics.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
// Allow large base64 payload for high-res schedule images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health / Status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Settings / Config
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  const isCloud = !!process.env.VERCEL;
  res.json({
    geminiApiKey: config.geminiApiKey ? `${config.geminiApiKey.slice(0, 6)}...${config.geminiApiKey.slice(-4)}` : '',
    hasGeminiApiKey: !!config.geminiApiKey,
    geminiModel: config.geminiModel || 'gemini-3.8-flash',
    notionApiKey: config.notionApiKey ? `${config.notionApiKey.slice(0, 7)}...${config.notionApiKey.slice(-4)}` : '',
    hasNotionApiKey: !!config.notionApiKey,
    notionDatabaseId: config.notionDatabaseId,
    defaultAppleCalendar: config.defaultAppleCalendar,
    defaultDurationMinutes: config.defaultDurationMinutes,
    donationUrl: config.donationUrl || 'https://ko-fi.com/f312s',
    isCloud,
  });
});

app.post('/api/config', (req, res) => {
  const { geminiApiKey, geminiModel, notionApiKey, notionDatabaseId, defaultAppleCalendar, defaultDurationMinutes } = req.body;
  const updates: any = {};
  if (geminiApiKey !== undefined) updates.geminiApiKey = geminiApiKey;
  if (geminiModel !== undefined) updates.geminiModel = geminiModel;
  if (notionApiKey !== undefined) updates.notionApiKey = notionApiKey;
  if (notionDatabaseId !== undefined) updates.notionDatabaseId = notionDatabaseId;
  if (defaultAppleCalendar !== undefined) updates.defaultAppleCalendar = defaultAppleCalendar;
  if (defaultDurationMinutes !== undefined) updates.defaultDurationMinutes = defaultDurationMinutes;

  const saved = saveConfig(updates);
  res.json({ success: true, config: saved });
});

// Apple Calendar
app.get('/api/apple/calendars', async (req, res) => {
  try {
    const calendars = await getAppleCalendars();
    const config = loadConfig();
    res.json({
      calendars,
      selected: config.defaultAppleCalendar || calendars[0] || 'Privat',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/apple/sync', async (req, res) => {
  try {
    const { events, calendarName } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'No events provided to sync' });
    }
    const config = loadConfig();
    const targetCalendar = calendarName || config.defaultAppleCalendar || 'Privat';

    const results = await addBatchEventsToAppleCalendar(events, targetCalendar);
    const successCount = results.filter(r => r.success).length;

    res.json({
      success: successCount > 0,
      total: events.length,
      successCount,
      calendar: targetCalendar,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Notion
app.post('/api/notion/test', async (req, res) => {
  try {
    const config = loadConfig();
    const apiKey = req.body.apiKey || config.notionApiKey;
    const databaseId = req.body.databaseId || config.notionDatabaseId;

    if (!apiKey) return res.status(400).json({ error: 'Notion API key required' });
    if (!databaseId) return res.status(400).json({ error: 'Notion Database ID required' });

    const info = await testNotionConnection(apiKey, databaseId);
    res.json(info);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/notion/sync', async (req, res) => {
  try {
    const { events, apiKey: reqApiKey, databaseId: reqDbId } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'No events provided to sync' });
    }
    const config = loadConfig();
    const apiKey = reqApiKey || config.notionApiKey;
    const databaseId = reqDbId || config.notionDatabaseId;

    if (!apiKey) return res.status(400).json({ error: 'Notion API key not configured' });
    if (!databaseId) return res.status(400).json({ error: 'Notion Database ID not configured' });

    // Validate database and get matched properties
    const dbInfo = await testNotionConnection(apiKey, databaseId);
    const results = await addBatchEventsToNotion(apiKey, databaseId, events, dbInfo.matchedProperties);
    const successCount = results.filter(r => r.success).length;

    res.json({
      success: successCount > 0,
      total: events.length,
      successCount,
      databaseTitle: dbInfo.title,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Gemini Parse Schedule
app.post('/api/parse-schedule', async (req, res) => {
  try {
    const { imageBase64, mimeType, apiKey: reqApiKey, model: reqModel, referenceDate } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const config = loadConfig();
    const apiKey = reqApiKey || config.geminiApiKey;
    let model = reqModel || config.geminiModel || 'gemini-3.8-flash';
    if (model.includes('2.5') || model === 'gemini-2.5-flash') {
      model = 'gemini-3.8-flash';
    }

    const result = await parseScheduleWithGemini(
      imageBase64,
      mimeType || 'image/png',
      apiKey,
      model,
      referenceDate
    );

    // Format events with unique local IDs and default selection
    const formattedEvents = result.events.map((ev, index) => ({
      ...ev,
      id: `ev-${Date.now()}-${index}`,
      selected: true,
      syncStatus: {
        apple: 'idle',
        notion: 'idle',
      },
    }));

    res.json({
      events: formattedEvents,
      rawSummary: result.rawSummary,
      isDemo: result.isDemo,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ICS Export
app.post('/api/export/ics', (req, res) => {
  try {
    const { events, filename } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'No events provided' });
    }

    const icsContent = generateICS(events);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'planer-schedule.ics'}"`);
    res.send(icsContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Planer API server running at http://127.0.0.1:${PORT}`);
  });
}

export default app;
