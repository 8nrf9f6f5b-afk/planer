import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG_FILE = path.join(os.homedir(), '.planer-config.json');

export interface StoredConfig {
  geminiApiKey?: string;
  geminiModel?: string;
  notionApiKey?: string;
  notionDatabaseId?: string;
  defaultAppleCalendar?: string;
  defaultDurationMinutes?: number;
  donationUrl?: string;
}

function sanitizeModel(model?: string): string {
  if (!model || model.includes('2.5') || model === 'gemini-2.5-flash') {
    return 'gemini-3.8-flash';
  }
  return model;
}

export function loadConfig(): StoredConfig {
  const isCloud = !!process.env.VERCEL;

  let fileConfig: StoredConfig = {};
  if (!isCloud && fs.existsSync(CONFIG_FILE)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading config file:', e);
    }
  }

  const rawModel = fileConfig.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const model = sanitizeModel(rawModel);

  return {
    geminiApiKey: isCloud ? '' : (fileConfig.geminiApiKey || process.env.GEMINI_API_KEY || ''),
    geminiModel: model,
    notionApiKey: isCloud ? '' : (fileConfig.notionApiKey || process.env.NOTION_API_KEY || ''),
    notionDatabaseId: isCloud ? '' : (fileConfig.notionDatabaseId || process.env.NOTION_DATABASE_ID || ''),
    defaultAppleCalendar: fileConfig.defaultAppleCalendar || process.env.DEFAULT_APPLE_CALENDAR || 'Privat',
    defaultDurationMinutes: fileConfig.defaultDurationMinutes || 60,
    donationUrl: process.env.DONATION_URL || fileConfig.donationUrl || 'https://ko-fi.com',
  };
}

export function saveConfig(newConfig: Partial<StoredConfig>): StoredConfig {
  const isCloud = !!process.env.VERCEL;
  if (isCloud) {
    // In cloud/serverless, prevent writing to filesystem or persisting visitor credentials
    return loadConfig();
  }

  const current = loadConfig();
  if (newConfig.geminiModel) {
    newConfig.geminiModel = sanitizeModel(newConfig.geminiModel);
  }
  const merged: StoredConfig = {
    ...current,
    ...newConfig,
  };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing config file:', e);
  }
  return merged;
}
