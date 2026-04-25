# O2-5 Football Prediction Platform - Complete Setup Guide

## Prerequisites

You should have:
- Supabase project created with PostgreSQL database
- API-Football key from API-SPORTS: https://www.api-football.com
- Node.js and pnpm installed

## Environment Variables Setup

Add the following environment variables to your Vercel project or `.env.local`:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API-SPORTS Configuration
NEXT_PUBLIC_API_FOOTBALL_KEY=your_api_football_key_here
```

### How to get these keys:

**Supabase:**
1. Go to https://supabase.com
2. Create a new project or use existing one
3. Go to Project Settings → API
4. Copy the URL and anon/service role keys

**API-SPORTS (API-Football):**
1. Go to https://www.api-football.com
2. Sign up for a free account
3. Go to Dashboard → API Section
4. Your API key will be displayed (replace the one above)

## Database Setup

### 1. Create Tables

The database schema is defined in `scripts/01-init-schema-v2.sql`. To apply it:

```bash
# Option A: Using Supabase SQL Editor (Recommended)
# 1. Go to your Supabase project
# 2. Click "SQL Editor" on the left sidebar
# 3. Click "New Query"
# 4. Copy the entire content from scripts/01-init-schema-v2.sql
# 5. Paste it into the editor
# 6. Click "Run"

# Option B: Using psql command line
psql postgresql://user:password@host:5432/database < scripts/01-init-schema-v2.sql
```

### 2. Sync Real Data from API-SPORTS

Once the tables are created and environment variables are set:

```bash
# Install dependencies first (if not already done)
pnpm install

# Run the sync script
pnpm tsx scripts/02-sync-api-football-real.ts
```

This script will:
- Fetch all available leagues from API-SPORTS
- Fetch teams for major leagues (Premier League, Championship, Bundesliga, La Liga, Ligue 1, Serie A)
- Fetch upcoming fixtures (next 30 days)
- Fetch standings for each league
- Store all data in your Supabase database
- Create/update sync status records

### What Gets Synced

The sync script fetches and stores:

**Leagues:**
- League ID, name, country, flag, logo, type

**Teams:**
- Team ID, name, code, country, founded year, national status, logo, venue info

**Fixtures (Matches):**
- Match ID, league, season, date, time, status, teams, scores, venue, referee

**Standings:**
- League standings with rank, games played, wins/draws/losses, goals, points

## API Endpoints

Once synced, your API is ready to use:

### GET /api/matches
Fetch fixtures with optional filters.

**Query Parameters:**
- `leagueId` - Filter by league ID (e.g., 39 for Premier League)
- `status` - Filter by status (e.g., "Not Started", "Live", "Match Finished")

**Response:**
```json
[
  {
    "id": 910913,
    "league_id": 39,
    "season": 2024,
    "fixture_date": "2025-04-26T12:30:00Z",
    "status": "Not Started",
    "home_team_id": 33,
    "away_team_id": 40,
    "home_goals": null,
    "away_goals": null,
    "home_team": {
      "id": 33,
      "name": "Manchester United",
      "logo": "https://media.api-sports.io/teams/33.png"
    },
    "away_team": {
      "id": 40,
      "name": "Liverpool FC",
      "logo": "https://media.api-sports.io/teams/40.png"
    }
  }
]
```

### GET /api/leaderboard
Get prediction leaderboard ranked by points.

**Response:**
```json
[
  {
    "userId": "user123",
    "wins": 28,
    "totalPoints": 2850,
    "predictions": 45
  },
  {
    "userId": "user456",
    "wins": 26,
    "totalPoints": 2620,
    "predictions": 42
  }
]
```

### GET /api/predictions?userId=user123
Get user's predictions.

**Query Parameters:**
- `userId` - Filter predictions by user ID

### POST /api/predictions
Create a new prediction.

**Request Body:**
```json
{
  "userId": "user123",
  "fixtureId": 910913,
  "predictedResult": "home",
  "homeScore": 2,
  "awayScore": 1,
  "confidence": 75
}
```

### GET /api/teams
Get all teams.

### GET /api/status
Get API status (not a real endpoint but you can add it).

## Major League IDs

Use these IDs when filtering by league:

- **39** - Premier League (England)
- **40** - Championship (England)
- **78** - Bundesliga (Germany)
- **135** - La Liga (Spain)
- **61** - Ligue 1 (France)
- **203** - Serie A (Italy)

## API Rate Limits

API-SPORTS provides:
- **Free Plan**: 100 requests per day
- **Pro Plan**: Unlimited requests

Check your usage in the API-SPORTS dashboard: https://dashboard.api-football.com

## Troubleshooting

### "API Key is not valid"
- Verify your `NEXT_PUBLIC_API_FOOTBALL_KEY` is correct
- Check that the API key is active in your API-SPORTS dashboard

### "Table does not exist"
- Make sure you've run the SQL schema file
- Check that you're using the correct Supabase connection

### "Rate limit exceeded"
- You've exceeded your daily API quota
- Upgrade your API-SPORTS plan or wait for the daily reset

### Sync script fails
- Check environment variables are set correctly
- Verify your Supabase service role key has write permissions
- Check API-SPORTS dashboard to confirm API key is active

## Keeping Data Updated

To regularly sync fresh data:

```bash
# Option 1: Run manually when needed
pnpm tsx scripts/02-sync-api-football-real.ts

# Option 2: Set up a cron job (using Vercel Cron)
# Create a new API route that calls the sync script
# Then set up a Vercel Cron to call it periodically

# Option 3: Use GitHub Actions
# Create a workflow that runs the sync script daily
```

## Testing the Integration

Once everything is set up:

1. **Check Supabase:**
   - Go to SQL Editor → New Query
   - Run: `SELECT COUNT(*) as fixture_count FROM fixtures;`
   - Should show number > 0

2. **Test API Endpoints:**
   ```bash
   curl http://localhost:3000/api/matches
   curl http://localhost:3000/api/leaderboard
   ```

3. **Check Sync Status:**
   ```sql
   SELECT * FROM sync_status;
   ```

## Next Steps

1. Set up user authentication (Supabase Auth)
2. Create user accounts in the `users` table
3. Start making predictions through the prediction form
4. Build additional features like:
   - Prediction accuracy calculations
   - Player statistics integration
   - Betting odds display
   - Real-time match updates

## Support

For API-SPORTS issues: https://dashboard.api-football.com/support
For Supabase issues: https://supabase.com/docs
