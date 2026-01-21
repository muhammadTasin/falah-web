# Falah — Ibadah & Amal Tracker (Ramadan-focused)

Falah is a simple Ibadah & Amal tracker to help Muslims stay consistent—especially during Ramadan—by logging daily worship habits, reflecting on progress, and optionally getting AI-generated daily insights.

## Why I built this
Many of us want to track our amal (salah, dhikr, Qur’an, charity, etc.), particularly in Ramadan. Falah focuses on a clean daily workflow: track → reflect → improve gradually.

## Features
- Daily Ibadah/Amal tracking (Ramadan-focused, usable year-round)
- Secure login + private per-user data storage
- Optional AI “Daily Insight” to summarize progress and suggest next steps
- Optional personalized reminders (user-selected preference: male / female / neutral)

## Tech Stack
- React + TypeScript (Vite)
- Firebase Auth (Google)
- Firestore (per-user daily logs)
- Firebase Hosting
- AI integration for daily insights (optional)

## Data Model
- `users/{uid}/days/{YYYY-MM-DD}`

## AI Disclaimer
AI insights are for motivation and reflection only — not religious rulings (fatwa). Please verify religious references using authentic sources if needed.

## Run locally
```bash
npm install
npm run dev
