<div align="center">
  <img src="assets/icon.svg" width="80" height="80" alt="Planer Logo">
  <h1>Planer — Instant Schedule Port</h1>
  <p><strong>Send your schedule via image and instantly port it into Apple Calendar &amp; Notion</strong></p>
</div>

---

## ✨ Features

- 📸 **Instant Image Drop & Clipboard Paste (`Cmd + V`)**: Just take a screenshot of your schedule (`Cmd + Shift + 4`) and paste directly into Planer.
- 🧠 **Gemini Vision AI Engine**: Extracts dates, start & end times, locations, course codes, and descriptions with high precision.
- 🍏 **Native Apple Calendar Integration**: Uses native macOS EventKit / AppleScript to write events directly into Apple `Calendar.app` without requiring iCloud passwords or third-party bridges.
- 📓 **Notion Database Integration**: Ports events directly into your Notion Calendar or Tasks Database with automatic property detection (`Date`, `Title`, `Location`, `Description`).
- ⚡ **"Port to Both Instantly"**: 1-click button that populates your Apple Calendar and Notion database simultaneously.
- 📅 **iCalendar (.ics) Export**: Download a universal `.ics` file for Google Calendar or other platforms.
- 🧪 **Built-in Sample Schedules**: Includes 3 realistic sample schedules (University Class Timetable, Team Work Shifts, AI Conference Agenda) to test immediately with 1 click.

---

## 🚀 Getting Started

### 1. Run Planer

```bash
npm run dev
```

This launches both the backend API server (`http://127.0.0.1:3001`) and the Vite web interface (`http://127.0.0.1:5173`).

### 2. Configure Your Keys (In Settings Modal or `.env`)

Click **Settings** in the top navigation bar:

1. **Google Gemini Vision API**:
   - Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Enter your key and choose your model (`gemini-2.5-flash` or `gemini-1.5-flash`).
2. **Apple Calendar**:
   - Select your target macOS Calendar (e.g. `Privat`, `Arbeit`) from the auto-detected list.
3. **Notion**:
   - Create an internal integration token at [notion.so/profile/integrations](https://www.notion.so/profile/integrations).
   - Paste your Notion Database ID or URL.
   - In Notion, share your database page with your integration (`...` &rarr; `Connections` &rarr; add integration).
   - Click **Test Connection** to verify.

Alternatively, you can create a `.env` file in the project root:
```env
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=your_database_id_or_url
DEFAULT_APPLE_CALENDAR=Privat
```

---

## 🛠️ Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Canvas Confetti
- **Backend**: Express + Node.js
- **macOS Calendar Engine**: `server/apple-calendar.ts` using `osascript` EventKit bindings
- **Notion Engine**: `server/notion.ts` using official Notion REST API with automatic schema resolution
- **Vision Engine**: `server/gemini.ts` using Gemini multimodal structured JSON extraction
