# O2-5 Prediction Platform ⚽️

O2-5 is a premium football prediction and analysis platform designed to identify high-probability **Over 2.5** and **Under 2.5** goal markets using advanced statistical algorithms and AI-driven insights.

![Banner](/public/shots/O2%20(1).jpeg)

## 🚀 Features

- **Dual Prediction Engine**: Custom algorithms that analyze historical scoring patterns, defensive form, and head-to-head records to predict Over/Under 2.5 outcomes.
- **AI Expert Analysis**: Integrated with **Gemini 2.0 Flash** to provide deep-dive explanations and tactical breakdowns for every match.
- **Real-Time Data Sync**: Manual administrative control to sync Tier 1 league data (Premier League, La Liga, Serie A, etc.) directly from Football-Data.org.
- **Comprehensive Match Center**: Infinite scroll, advanced filtering, and live match status tracking.
- **Community Leaderboard**: Track prediction accuracy and compete with other users.
- **Offline Support**: Full Service Worker integration with a custom offline experience.

## 📸 Screenshots

| Dashboard | Match Analysis |
|---|---|
| ![Home](/public/shots/O2%20(2).jpeg) | ![Predictions](/public/shots/O2%20(3).jpeg) |

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.0 Flash
- **Styling**: Tailwind CSS & Lucide Icons
- **APIs**: Football-Data.org & API-SPORTS
- **Offline**: Service Workers (PWA ready)

## 🚦 Getting Started

### 1. Environment Setup
Create a `.env.local` file with the following keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
FOOTBALL_DATA_API_KEY=your_api_key
GEMINI_API_KEY=your_google_ai_key
```

### 2. Database Initialization
Visit `/api/db-init` in your browser to set up the necessary table schemas.

### 3. Sync Data & Run Predictions
Go to the secluded admin page to populate the database:
- **Admin Path**: `/admin/sync`
- Click **"Update Predictions Now"** to fetch matches and run the probability engine.

## 🔗 Page Map

- **Home**: `/` - Top predictions and platform stats.
- **Matches**: `/matches` - Full fixture list with search and filters.
- **Predictions**: `/predictions` - All AI-generated Over/Under 2.5 picks.
- **Leaderboard**: `/leaderboard` - Community rankings.
- **Admin**: `/admin/sync` - Secluded data management hub.
- **Legal**: `/terms`, `/privacy`, `/contact`.

---

© 2026 O2-5 Prediction Platform. Built for football analysts and enthusiasts.
Developer: TechTune I.T. Solutions
Idea: Lexy