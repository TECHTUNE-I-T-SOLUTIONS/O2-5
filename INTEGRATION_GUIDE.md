# O2-5 Integration Guide

## Setup Instructions

### 1. Database Schema Setup

Before running the app, you need to set up the database schema in Supabase:

```bash
# Run the migration script in Supabase SQL Editor:
# Copy the contents of scripts/01-init-schema.sql and run in your Supabase SQL editor
```

**Tables created:**
- `users` - User accounts and authentication
- `teams` - Football teams
- `leagues` - Football leagues
- `matches` - Match fixtures
- `predictions` - User predictions

### 2. Environment Variables

Make sure these are set in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)
- `NEXT_PUBLIC_API_FOOTBALL_KEY` - Your API-Football API key

### 3. API-Football Integration

To sync real match data from API-Football:

```bash
# Set the required environment variables first
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export NEXT_PUBLIC_API_FOOTBALL_KEY="your-api-key"

# Run the sync script (requires Node.js and TypeScript)
npx ts-node scripts/02-sync-api-football.ts
```

This will:
1. Fetch upcoming matches from API-Football
2. Create/update teams in the database
3. Create/update leagues in the database
4. Create/update matches in the database

### 4. Mock Data

If you haven't set up the database yet, the app will serve mock data so you can test the UI:

- **Matches API** (`/api/matches`) - Returns 2 sample matches
- **Leaderboard API** (`/api/leaderboard`) - Returns 5 sample users
- **Predictions API** (`/api/predictions`) - Returns empty array (graceful fallback)

## API Endpoints

### GET /api/matches
Fetch football matches with optional filters:
- `status` - Match status (SCHEDULED, LIVE, FINISHED)
- `leagueId` - Filter by league ID

Response includes:
- Match details (date, status, goals)
- Home and away teams with logos
- League information

### GET /api/leaderboard
Fetch user leaderboard sorted by total points:
- Returns user statistics (wins, predictions, accuracy)

### GET /api/predictions?userId={userId}
Fetch user's prediction history:
- Includes match details
- Shows predicted vs actual results

### POST /api/predictions
Create a new prediction:
```json
{
  "userId": "user-id",
  "matchId": 123,
  "predictedResult": "HOME_WIN",
  "confidence": 75
}
```

## Theming

The app uses Tailwind CSS v4 with custom design tokens:

- **Light Mode**: Stone background (#f5f5f4) with black text (#1c1917)
- **Dark Mode**: Black background (#0a0a0a) with stone text (#f5f5f4)
- **Accent Color**: Hot pink (#fe00c5) for interactive elements

Theme automatically follows system preference (prefers-color-scheme).

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture

- **Frontend**: Next.js 15+ with React Server Components
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (auth structure ready)
- **API Integration**: API-Football v1
- **Styling**: Tailwind CSS v4 with custom design tokens

## Next Steps

1. Set up Supabase project and get credentials
2. Get API-Football API key (https://rapidapi.com/api-sports/api/api-football)
3. Run the database migration script
4. Run the sync script to populate match data
5. Start the development server
6. Begin making predictions!
