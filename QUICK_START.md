# O2-5 Quick Start Guide

Get O2-5 up and running in **5 minutes**.

## 1️⃣ Get Your Keys (2 min)

### Supabase Keys
Go to https://supabase.com → Create project → Settings → API

Copy these 3 values:
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY = eyJxxxxx...
```

### API-SPORTS Key
Go to https://www.api-football.com → Dashboard

Copy this value:
```
NEXT_PUBLIC_API_FOOTBALL_KEY = 6a42be9d6322fb7d55bc8b0e1a0815df
```

## 2️⃣ Create `.env.local` (1 min)

Create file in project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...
NEXT_PUBLIC_API_FOOTBALL_KEY=your_api_key
```

## 3️⃣ Create Database (1 min)

Go to Supabase project → SQL Editor → New Query

Copy entire content from: `scripts/01-init-schema-v2.sql`

Paste into editor → Click Run

Done! ✓

## 4️⃣ Sync Real Data (1 min)

```bash
pnpm install
pnpm tsx scripts/02-sync-api-football-real.ts
```

Watch console. Should see:
```
✅ [SYNC] Found 30 leagues...
✅ [SYNC] Found 200 teams...
✅ [SYNC] Found 150 fixtures...
✅ [SYNC] Found 500 standings...
✅ [SUCCESS] Sync completed successfully!
```

## 5️⃣ Run App (1 min)

```bash
pnpm dev
```

Open: http://localhost:3000

**Done! 🎉 Your app is now running with real football data!**

---

## Testing

### Test Matches
http://localhost:3000/api/matches

Should return real fixture data.

### Test Leaderboard
http://localhost:3000/api/leaderboard

Should return empty (no predictions yet).

### View Application
http://localhost:3000

Should show:
- ✅ Stats cards
- ✅ Dark/light theme toggle
- ✅ Brand color #fe00c5
- ✅ Navigation working

---

## What's Next

1. **Make Predictions** - Click "Make Prediction" on a match
2. **Check Leaderboard** - Your predictions will appear
3. **Deploy** - Push to GitHub → Connect to Vercel
4. **Setup Auto-Sync** - Configure cron job to sync daily

---

## Troubleshooting

### "API Key is not valid"
→ Check your API key at https://dashboard.api-football.com

### "Table does not exist"
→ Make sure SQL ran successfully in Supabase

### "No data in database"
→ Run: `SELECT COUNT(*) FROM fixtures;` in SQL Editor

---

## Documentation

- **Full Setup**: `SETUP_INSTRUCTIONS.md`
- **Checklist**: `SETUP_CHECKLIST.md`
- **Technical**: `README_REAL_API.md`
- **Complete**: `INTEGRATION_COMPLETE.md`

---

That's it! Questions? Check the full documentation files.
