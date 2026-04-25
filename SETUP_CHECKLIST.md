# O2-5 Setup Checklist

Complete this checklist to get O2-5 up and running with real API-SPORTS data.

## Phase 1: Prerequisites ✓

- [ ] Node.js 18+ installed
- [ ] pnpm package manager installed
- [ ] GitHub account for version control
- [ ] Supabase account (free tier works)
- [ ] API-SPORTS account with API key

## Phase 2: Environment Setup

### Step 1: Supabase Project
- [ ] Go to https://supabase.com
- [ ] Create new project (choose region closest to you)
- [ ] Wait for project to initialize (2-3 minutes)
- [ ] Go to **Project Settings** → **API**
- [ ] Copy `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
- [ ] Copy `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [ ] Copy `service_role` key (SUPABASE_SERVICE_ROLE_KEY)

### Step 2: API-SPORTS Key
- [ ] Go to https://www.api-football.com
- [ ] Sign up / Log in
- [ ] Go to **Dashboard** → find your API key
- [ ] Copy the API key (NEXT_PUBLIC_API_FOOTBALL_KEY)
- [ ] Verify key is active in dashboard

### Step 3: Local Environment
- [ ] Create `.env.local` in project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...
NEXT_PUBLIC_API_FOOTBALL_KEY=your_api_key_here
```
- [ ] Save file
- [ ] Verify variables loaded: `echo $NEXT_PUBLIC_API_FOOTBALL_KEY`

## Phase 3: Database Setup

### Step 1: Create Tables
Choose one method:

**Method A: Supabase SQL Editor (Recommended)**
- [ ] Go to your Supabase project
- [ ] Click **SQL Editor** (left sidebar)
- [ ] Click **New Query**
- [ ] Open `/scripts/01-init-schema-v2.sql` in text editor
- [ ] Copy entire content
- [ ] Paste into Supabase SQL Editor
- [ ] Click **Run**
- [ ] Wait for confirmation (tables created)

**Method B: Terminal**
- [ ] Have PostgreSQL client installed
- [ ] Run: `psql postgresql://user:pass@host:5432/db < scripts/01-init-schema-v2.sql`

### Step 2: Verify Tables
- [ ] Go to Supabase project
- [ ] Click **Table Editor**
- [ ] Verify tables exist:
  - [ ] `leagues`
  - [ ] `teams`
  - [ ] `fixtures`
  - [ ] `predictions`
  - [ ] `standings`
  - [ ] (and others)

## Phase 4: Data Sync

### Step 1: Install Dependencies
- [ ] Run: `pnpm install`
- [ ] Wait for completion

### Step 2: Run Sync Script
- [ ] Run: `pnpm tsx scripts/02-sync-api-football-real.ts`
- [ ] Watch console output for progress:
  - [ ] `[SYNC] Fetching leagues...`
  - [ ] `[SYNC] Found N leagues...`
  - [ ] `[SYNC] Fetching teams...`
  - [ ] `[SYNC] Fetching upcoming fixtures...`
  - [ ] `[SYNC] Fetching standings...`
  - [ ] `[SUCCESS] Sync completed successfully!`

### Step 3: Verify Data in Database
- [ ] Go to Supabase SQL Editor
- [ ] Run query: `SELECT COUNT(*) FROM fixtures;`
- [ ] Result should show: **count > 0** (e.g., 200+)
- [ ] Run query: `SELECT COUNT(*) FROM teams;`
- [ ] Result should show: **count > 0** (e.g., 200+)
- [ ] Run query: `SELECT COUNT(*) FROM leagues;`
- [ ] Result should show: **count >= 6**

## Phase 5: Application Testing

### Step 1: Start Dev Server
- [ ] Run: `pnpm dev`
- [ ] Open http://localhost:3000
- [ ] See landing page load

### Step 2: Test Home Page
- [ ] Homepage loads successfully
- [ ] Stats cards display (Active Users, Total Predictions, etc.)
- [ ] Theme toggle works (dark/light mode)
- [ ] Brand color #fe00c5 visible in buttons/links

### Step 3: Test Matches Page
- [ ] Click "Matches" in header
- [ ] Page loads: `/matches`
- [ ] Matches display with real data:
  - [ ] Team names visible
  - [ ] Team logos loaded
  - [ ] Match dates correct
  - [ ] League information shows

### Step 4: Test Leaderboard
- [ ] Click "Leaderboard" in header
- [ ] Page loads: `/leaderboard`
- [ ] (Empty until predictions added)

### Step 5: Test Predictions Page
- [ ] Click "My Predictions" in header
- [ ] Page loads: `/predictions`
- [ ] (Empty until predictions added)

### Step 6: Test API Endpoints
Open in browser or use curl:
- [ ] http://localhost:3000/api/matches → Shows fixtures data
- [ ] http://localhost:3000/api/teams → Shows teams data
- [ ] http://localhost:3000/api/leaderboard → Shows leaderboard (empty)

```bash
# In terminal, test endpoints
curl http://localhost:3000/api/matches | jq '.[0]'
curl http://localhost:3000/api/teams | jq '.[0]'
curl http://localhost:3000/api/leaderboard
```

## Phase 6: Deployment Setup

### Step 1: Git Repository
- [ ] Initialize git: `git init`
- [ ] Add files: `git add .`
- [ ] Create commit: `git commit -m "Initial O2-5 commit"`
- [ ] Push to GitHub

### Step 2: Vercel Deployment
- [ ] Go to https://vercel.com
- [ ] Import GitHub repository
- [ ] Set environment variables:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] NEXT_PUBLIC_API_FOOTBALL_KEY
- [ ] Deploy
- [ ] Test deployed app

## Phase 7: Optional - Scheduled Syncs

### Option A: GitHub Actions (Recommended)
- [ ] Create `.github/workflows/sync-fixtures.yml`
- [ ] Add cron schedule (e.g., every 6 hours)
- [ ] Test workflow runs

### Option B: Vercel Cron
- [ ] Create `/app/api/cron/sync.ts`
- [ ] Add to `vercel.json`
- [ ] Deploy

### Option C: External Service
- [ ] Use third-party cron service (EasyCron, etc.)
- [ ] Schedule POST to `/api/cron/sync-fixtures`

## Phase 8: Verification Checklist

### Data Integrity
- [ ] Fixtures table populated with real matches
- [ ] Teams table has correct team information
- [ ] Leagues table shows major European leagues
- [ ] Standings data is current and accurate
- [ ] Sync status table tracks last sync time

### Performance
- [ ] Matches page loads in < 1 second
- [ ] API endpoints respond in < 500ms
- [ ] Database queries use indexes (check EXPLAIN)
- [ ] No N+1 query problems

### UI/UX
- [ ] Dark mode works correctly
- [ ] Light mode works correctly
- [ ] Brand color #fe00c5 applied consistently
- [ ] Responsive design works on mobile
- [ ] All navigation links work

### API Integration
- [ ] No mock data anywhere
- [ ] All data from Supabase (cached from API-SPORTS)
- [ ] Error handling implemented
- [ ] Rate limiting respected

## Phase 9: Going Live

- [ ] Monitor API-SPORTS dashboard for quota usage
- [ ] Set up log monitoring (Vercel logs)
- [ ] Add error tracking (optional: Sentry)
- [ ] Set up alerts for sync failures
- [ ] Monitor database size and growth

## Common Issues & Fixes

### "API Key is not valid"
```bash
# Solution:
# 1. Regenerate key in API-SPORTS dashboard
# 2. Update .env.local
# 3. Restart dev server
# 4. Wait 5 minutes for key propagation
```

### "Table 'fixtures' does not exist"
```bash
# Solution:
# 1. Copy entire SQL from scripts/01-init-schema-v2.sql
# 2. Paste into Supabase SQL Editor
# 3. Run (all at once, don't split)
# 4. Verify in Table Editor
```

### "No data showing after sync"
```bash
# Solution:
# 1. Run: SELECT * FROM sync_status;
# 2. Check last_sync timestamp
# 3. Check status (should be 'success')
# 4. If failed, check error in console output
# 5. Verify API key quota not exceeded
```

### "Fixtures showing but teams missing"
```bash
# Solution:
# 1. Check teams table populated
# 2. Run sync script again
# 3. Check foreign key constraints
```

## Support Resources

- **API-SPORTS Help**: https://dashboard.api-football.com/support
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Setup Guide**: See `SETUP_INSTRUCTIONS.md`
- **API Docs**: See `README_REAL_API.md`

## Completion Status

- [ ] Phase 1: Prerequisites ✓
- [ ] Phase 2: Environment Setup ✓
- [ ] Phase 3: Database Setup ✓
- [ ] Phase 4: Data Sync ✓
- [ ] Phase 5: Application Testing ✓
- [ ] Phase 6: Deployment Setup ✓
- [ ] Phase 7: Optional - Scheduled Syncs ✓
- [ ] Phase 8: Verification Checklist ✓
- [ ] Phase 9: Going Live ✓

**Once all checkboxes are complete, O2-5 is ready for production! 🎉**

---

**Need Help?** Check the documentation files or visit the support links above.
