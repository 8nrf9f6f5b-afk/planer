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
    donationUrl: config.donationUrl || 'https://ko-fi.com',
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
