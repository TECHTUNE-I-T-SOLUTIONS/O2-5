# O2-5 Football Prediction Platform - Real API-SPORTS Integration

## Overview

O2-5 is a fully integrated football prediction platform that uses **real data from API-SPORTS** (formerly API-Football) v3. All mock data has been removed. The platform stores match data, team information, standings, and user predictions in Supabase PostgreSQL database.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   O2-5 Web Application                  │
│              (Next.js with React + Tailwind)            │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   API Routes      API-SPORTS API    Supabase DB
   - /matches      - /fixtures       - fixtures
   - /predictions  - /teams          - teams
   - /leaderboard  - /standings      - leagues
   - /teams        - /leagues        - predictions
                                     - standings
                                     - players
```

## Data Flow

1. **Sync Phase** (Manual or Scheduled):
   - `02-sync-api-football-real.ts` fetches fresh data from API-SPORTS
   - Data is cached in Supabase tables (no refetching needed)
   - Sync status tracked in `sync_status` table

2. **Query Phase** (Application Runtime):
   - Frontend requests data from API routes (`/api/matches`, etc.)
   - Routes query Supabase database (cached data)
   - No direct API-SPORTS calls needed for displaying data

3. **Real-time Updates**:
   - Sync script can be run daily/hourly via cron job
   - Updates match statuses, scores, standings automatically

## Complete Database Schema

The database includes comprehensive tables for:

### Core Data
- **leagues** - Football leagues (EPL, La Liga, Bundesliga, etc.)
- **teams** - Football teams with venue information
- **fixtures** - All match data with scores and status
- **seasons** - League seasons

### Player Data
- **players** - Individual player information
- **team_players** - Squad memberships with positions

### Detailed Match Data
- **fixture_events** - Goals, cards, substitutions
- **fixture_statistics** - Possession, shots, fouls, etc.
- **fixture_lineups** - Team formations and starting XI
- **lineup_players** - Player positions on the field

### Rankings & Betting
- **standings** - League tables with points and goals
- **odds** - Betting odds from various bookmakers (optional)

### Application Data
- **predictions** - User predictions with results
- **users** - User accounts and statistics
- **sync_status** - Tracks last API sync for each endpoint

## Quick Start

### 1. Prerequisites
```bash
# Install dependencies
pnpm install
```

### 2. Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...
NEXT_PUBLIC_API_FOOTBALL_KEY=6a42be9d6322fb7d55bc8b0e1a0815df
```

### 3. Create Database Tables
**Method A: Supabase SQL Editor**
```sql
-- Copy entire content from scripts/01-init-schema-v2.sql
-- Paste into Supabase SQL Editor and run
```

**Method B: Command Line**
```bash
psql postgresql://user:password@host:5432/db < scripts/01-init-schema-v2.sql
```

### 4. Sync Real Data
```bash
# Fetch leagues, teams, fixtures, standings from API-SPORTS
pnpm tsx scripts/02-sync-api-football-real.ts
```

### 5. Run Application
```bash
pnpm dev
# Open http://localhost:3000
```

## API Endpoints

All endpoints query the cached database, no direct API-SPORTS calls:

### GET /api/matches
```bash
curl http://localhost:3000/api/matches?leagueId=39&status=NS
```

Returns fixtures with team and league relationships.

### GET /api/teams
```bash
curl http://localhost:3000/api/teams
```

Returns all teams with venue information.

### GET /api/leaderboard
```bash
curl http://localhost:3000/api/leaderboard
```

Returns user predictions leaderboard ranked by points.

### GET /api/predictions?userId=user123
```bash
curl http://localhost:3000/api/predictions?userId=user123
```

Returns specific user's predictions.

### POST /api/predictions
```bash
curl -X POST http://localhost:3000/api/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "fixtureId": 910913,
    "predictedResult": "home",
    "homeScore": 2,
    "awayScore": 1,
    "confidence": 85
  }'
```

## Database Tables Reference

### fixtures (Main Matches Table)
```sql
SELECT * FROM fixtures 
WHERE fixture_date > NOW() 
ORDER BY fixture_date ASC 
LIMIT 20;
```

Key fields:
- `id` - Unique match ID
- `league_id` - League reference
- `home_team_id`, `away_team_id` - Team references
- `fixture_date` - Match time
- `status` - "Not Started", "Live", "Match Finished", etc.
- `home_goals`, `away_goals` - Final score

### standings (League Tables)
```sql
SELECT 
  t.name, 
  s.rank, 
  s.played, 
  s.win, 
  s.draw, 
  s.lose, 
  s.points 
FROM standings s 
JOIN teams t ON s.team_id = t.id 
WHERE s.league_id = 39 
ORDER BY s.rank;
```

### predictions (User Predictions)
```sql
SELECT 
  p.*, 
  f.fixture_date,
  ht.name as home_team,
  at.name as away_team 
FROM predictions p 
JOIN fixtures f ON p.fixture_id = f.id 
JOIN teams ht ON f.home_team_id = ht.id 
JOIN teams at ON f.away_team_id = at.id 
WHERE p.user_id = 'user123';
```

## Sync Script Details

The sync script (`02-sync-api-football-real.ts`) performs:

1. **Leagues Sync** - Fetches all available leagues
2. **Teams Sync** - Fetches teams from major leagues:
   - Premier League (39)
   - Championship (40)
   - Bundesliga (78)
   - La Liga (135)
   - Ligue 1 (61)
   - Serie A (203)
3. **Fixtures Sync** - Fetches upcoming matches (30 days)
4. **Standings Sync** - Fetches league tables

Each sync operation:
- Uses `upsert` to handle updates gracefully
- Tracks sync status in `sync_status` table
- Implements rate limiting between requests
- Logs progress to console

### Running Syncs

```bash
# Manual sync
pnpm tsx scripts/02-sync-api-football-real.ts

# Scheduled sync with cron
# Add to GitHub Actions or Vercel Cron
```

## Key Features Implemented

✅ **Real API Integration** - All data from API-SPORTS  
✅ **Database Caching** - Matches cached in Supabase  
✅ **No Mock Data** - 100% real football data  
✅ **Automatic Updates** - Sync script keeps data fresh  
✅ **Complete Schema** - All match details captured  
✅ **User Predictions** - Track and score predictions  
✅ **Leaderboard** - Rank users by accuracy  
✅ **Dark/Light Theme** - Beautiful UI with #fe00c5 accent  

## Advanced Features Available

### Real-Time Updates
```bash
# Add live match score updates with WebSocket
# Example: Use supabase realtime
```

### Match Statistics
```sql
SELECT * FROM fixture_statistics 
WHERE fixture_id = 910913;
```

### Player Performance
```sql
SELECT 
  p.name,
  tp.position,
  tp.number,
  fe.type,
  fe.minute
FROM lineup_players lp
JOIN players p ON lp.player_id = p.id
JOIN fixture_events fe ON fe.player_id = p.id
WHERE fe.fixture_id = 910913;
```

### Betting Odds
```sql
SELECT * FROM odds 
WHERE fixture_id = 910913 
ORDER BY updated_at DESC;
```

## Rate Limits & Quotas

**API-SPORTS Free Plan:**
- 100 requests per day
- Peak: ~5 requests per minute

**Sync Script Usage:**
- ~50 requests per full sync
- Recommended: 1-2 syncs per day

**Monitor Usage:**
```bash
# Check your API-SPORTS dashboard
https://dashboard.api-football.com
```

## Troubleshooting

### No data showing up

1. Check env vars are set:
```bash
echo $NEXT_PUBLIC_API_FOOTBALL_KEY
echo $NEXT_PUBLIC_SUPABASE_URL
```

2. Verify sync ran successfully:
```sql
SELECT * FROM sync_status;
```

3. Check fixture count:
```sql
SELECT COUNT(*) FROM fixtures;
```

### API Key errors

- Regenerate key in API-SPORTS dashboard
- Update environment variable
- Wait 5 minutes for changes to propagate

### Database connection issues

- Verify service role key has correct permissions
- Check IP whitelist in Supabase (if using)
- Test connection: `pnpm supabase status`

## Deployment

### Vercel Deployment
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys
# Set environment variables in Vercel Dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_API_FOOTBALL_KEY
```

### Scheduled Syncs on Vercel
Create `/api/cron/sync-fixtures`:
```typescript
export const runtime = 'nodejs'

export async function GET(request: Request) {
  // Only allow from Vercel cron
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Call sync script
  await runSync()
  return Response.json({ success: true })
}
```

Then configure in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-fixtures",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Next Steps

1. **User Authentication** - Set up Supabase Auth
2. **Prediction Scoring** - Implement accuracy calculations
3. **Notifications** - Email/SMS when predictions resolve
4. **Player Stats** - Display individual player performance
5. **Team Analysis** - Head-to-head records, form guides
6. **Mobile App** - React Native or Flutter version

## Documentation

- [API-SPORTS Documentation](https://www.api-football.com/documentation-v3)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Setup Instructions](./SETUP_INSTRUCTIONS.md)

## Support

- API-SPORTS: https://dashboard.api-football.com/support
- Supabase: https://supabase.com/docs
- Issues: Create GitHub issue

---

**O2-5** - Real-time football prediction with live data from API-SPORTS. All data is real, all predictions count! 🎯⚽
