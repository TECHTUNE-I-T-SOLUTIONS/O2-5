# O2-5 Prediction Platform ⚽️

O2-5 is a premium football prediction and analysis platform designed to identify high-probability **Over 2.5**, **Win/Draw**, and **Both Teams to Score (GG)** markets using advanced statistical algorithms and AI-driven insights.

![Banner](/public/shots/O2%20(1).jpeg)

## 🚀 Features

- **Multi-Market Prediction Engine**: Custom algorithms that analyze historical scoring patterns, defensive form, and head-to-head records to predict:
  - **Over/Under 2.5 Goals**: Traditional goal markets with probability analysis
  - **Win/Draw**: Match outcome predictions based on team form and league position
  - **Both Teams to Score (GG)**: Whether both teams will score in a match
- **AI Expert Analysis**: Integrated with **free Gemini models** (gemini-2.5-flash, gemini-2.0-flash-exp, etc.) to provide deep-dive explanations and tactical breakdowns for every match.
- **Real-Time Data Sync**: Manual administrative control to sync Tier 1 league data (Premier League, La Liga, Serie A, etc.) directly from Football-Data.org.
- **Daily Automation**: Automated daily analysis via cron jobs to keep predictions up-to-date.
- **Comprehensive Match Center**: Today's matches with advanced filtering and live match status tracking.
- **Tabbed Prediction Interface**: Easy navigation between different prediction types.
- **Community Leaderboard**: Track prediction accuracy and compete with other users.
- **Offline Support**: Full Service Worker integration with a custom offline experience.

## 📸 Screenshots

|| Dashboard | Match Analysis |
||---|---|
|| ![Home](/public/shots/O2%20(2).jpeg) | ![Predictions](/public/shots/O2%20(3).jpeg) |

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini (2.5-flash, 2.0-flash-exp, 1.5-flash, etc.)
- **Styling**: Tailwind CSS & Lucide Icons
- **APIs**: Football-Data.org
- **Offline**: Service Workers (PWA ready)

## 🚦 Getting Started

### 1. Environment Setup
Create a `.env.local` file with the following keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
FOOTBALL_DATA_API_KEY=your_api_key
GEMINI_API_KEY=your_google_ai_key
CRON_SECRET=your_secure_cron_secret
```

### 2. Database Initialization
Visit `/api/db-init` in your browser to set up the necessary table schemas.

### 3. Sync Data & Run Predictions
Go to the admin page to populate the database:
- **Admin Path**: `/admin/sync`
- Click **"Run All Predictions"** to fetch matches and run all prediction algorithms.

### 4. Set Up Daily Automation
Follow the guide in `scripts/setup-cron.md` to configure automated daily predictions.

## 🔗 Page Map

- **Home**: `/` - Today's predictions and platform stats.
- **Matches**: `/matches` - Today's fixture list with filters.
- **Predictions**: `/predictions` - Tabbed interface for Over 2.5, Win/Draw, and GG predictions.
- **Leaderboard**: `/leaderboard` - Community rankings.
- **Admin**: `/admin/sync` - Data management and manual prediction runs.
- **Legal**: `/terms`, `/privacy`, `/contact`.

## 🎯 Prediction Criteria

### Over 2.5 Goals
- Both teams must score at least 2 goals in their last 3 games
- At least 2 of both teams' top scorers must be available for the game
- Both teams must be a goal conceding team in most of their games
- Both teams' best assist player must be available as well

### Win/Draw
- One of the two teams must have beaten at least 2 out of the top 5 teams on the league table
- One of the teams is among the top 4 teams on the league table
- One of the teams must be defensively strong not conceding goal at all in the last 3 to 2 games
- One of the teams is among the last 3 teams on the same league table
- If one of the teams hasn't lost at home in their last 3 games at home as well

### Both Teams to Score (GG)
- Both teams must have scored at least 2 goals in their last 2 to 3 games
- Both teams' top goal scorers must be available for the match
- Both teams' best assist provider must be available as well for the match
- Both teams must be a goal conceding team in their last 3 to 2 matches

---

© 2026 O2-5 Prediction Platform. Built for football analysts and enthusiasts.
Developer: TechTune I.T. Solutions
Idea: Lexy