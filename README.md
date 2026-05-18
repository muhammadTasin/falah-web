# Falah — Ibadah & Amal Tracker

A personal tracker app for daily worship and good deeds, with optional AI-generated summaries and prayer time integration.

---

## Overview

Falah is a tracking application designed to help users maintain consistent worship habits and charitable actions. Users log daily activities (salah, dhikr, Qur'an reading, charity, etc.) and optionally receive AI-powered daily insights. The app is Ramadan-focused but usable year-round. Prayer times are integrated for the Asia/Dhaka timezone.

---

## Problem It Solves

- Provides a structured way to track daily ibadah and amal
- Creates accountability through logging and reflection
- Offers optional AI summaries to motivate continued practice
- Integrates prayer times so users know current waqt
- Enables per-user private data storage

---

## Key Features

- **Daily Ibadah Tracking:** Log worship activities with timestamps and notes
- **Google Authentication:** Secure login via Firebase Auth
- **Real-Time Sync:** Per-user data stored in Firestore with real-time updates
- **Prayer Times:** Adhan library integration for Asia/Dhaka timezone
- **AI Daily Insights:** Optional Google GenAI-powered summaries of daily progress
- **Timezone-Aware Tracking:** Server-time sync with device-time fallback for accuracy
- **Responsive Design:** Works on desktop, tablet, and mobile

---

## Tech Stack

- **Frontend:** React 19.2.3, TypeScript 5.8.2, Vite 6.2.0
- **Authentication:** Firebase Auth (Google login)
- **Database:** Firestore (real-time NoSQL)
- **Hosting:** Firebase Hosting
- **Prayer Times:** Adhan 4.4.3 library
- **AI Integration:** Google GenAI 1.37.0
- **UI Components:** Lucide React 0.562.0 (icons)

---

## Architecture

```
Frontend (React + TypeScript + Vite)
    ↓
Firebase Auth (Google login)
    ↓
Firestore (users/{uid}/days/{YYYY-MM-DD})
```

**Data Model:**
```
users/{uid}/
  └── days/
      ├── 2026-05-18/
      │   ├── salah: true
      │   ├── dhikr: true
      │   ├── quran_pages: 5
      │   ├── charity: "Helped neighbor"
      │   └── timestamp: 2026-05-18T14:30:00Z
      └── 2026-05-17/
          └── ...
```

**Clock Handling:**
1. Frontend syncs with server time on app load
2. Uses device time as fallback if offline
3. Standardizes date/time around Asia/Dhaka timezone
4. Refreshes waqt (prayer time) when app returns from background

---

## Screenshots

*Screenshot placeholders:*
- [ ] Dashboard with today's tracker items
- [ ] Daily summary with AI insight
- [ ] Prayer times display
- [ ] Activity history view

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (free tier works)

### Installation

```bash
# Clone repository
git clone https://github.com/muhammadTasin/falah-web.git
cd falah-web

# Install dependencies
npm install

# Create a local environment file
touch .env.local
```

Add your Firebase and AI credentials to `.env.local`

### Environment Variables

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GOOGLE_GENAI_API_KEY=your-google-genai-api-key
```

### Running Locally

```bash
npm run dev
```

Visit `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

---

## Features in Detail

### Daily Tracking
- Users log activities (salah, dhikr, Qur'an reading, charity, etc.)
- Each log includes timestamp and optional notes
- Data stored per user in Firestore

### Prayer Times
- Integrated prayer times for current day
- Uses Adhan library (Islamic prayer time calculations)
- Displays current waqt based on Asia/Dhaka timezone
- Updates automatically when switching between active/background states

### AI Insights (Optional)
- Users can opt-in to daily AI summaries
- Uses Google GenAI to generate personalized reflection on daily progress
- Summaries are motivational only, not religious rulings
- Can suggest next steps for spiritual growth

### User Preferences
- Optional personalized reminders (male/female/neutral voice preferences)
- Per-user data isolation in Firestore

---

## Known Limitations

- No offline support (requires internet for Firestore sync)
- Prayer times fixed to Asia/Dhaka timezone (no manual location selection yet)
- AI insights are for motivation only, not religious guidance
- No community or social features
- No export/backup of personal data
- Single Google account authentication (no email/password login)
- Limited customization of tracked activities
- No notification system (reminders not yet implemented)

---

## Recent Updates

### Prayer/Waqt Accuracy Fixes
Fixed an issue where the app could sometimes show incorrect current prayer times. Changes include:

- **Server Time Sync:** Clock now syncs with server time on app startup with device-time fallback
- **Improved Refresh Logic:** Prayer/waqt detection refreshes when app returns from background or locked state
- **Standardized Timezone:** All date/time calculations use Asia/Dhaka timezone to avoid cross-timezone drift
- **After-Midnight Handling:** Fixed boundary issues when tracking logs cross midnight

---

## Future Improvements

- [ ] Add offline data caching with ServiceWorker
- [ ] Support multiple timezone configurations
- [ ] Allow custom tracked activity types
- [ ] Add notification/reminder system
- [ ] Implement data export (JSON, PDF)
- [ ] Add community features (optional sharing, leaderboards)
- [ ] Enhanced AI insights with streak tracking
- [ ] Add dark mode
- [ ] Support email/password authentication

---

## AI Disclaimer

AI-generated insights are for personal motivation and reflection only. They are not religious rulings (fatwa) or religious advice. Please verify religious references using authentic Islamic sources if needed. Always consult qualified Islamic scholars for religious guidance.

---

## License

No license has been added yet. This project is currently shared for portfolio and review purposes.
