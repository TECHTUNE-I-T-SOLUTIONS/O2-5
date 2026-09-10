# Daily Automation Setup Guide

## Overview
The O2-5 Prediction Platform now supports automated daily analysis that runs all prediction algorithms (Over 2.5, Win/Draw, and GG) on a schedule.

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

1. **Create a cron job in Vercel:**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Cron Jobs
   - Add a new cron job with the following configuration:
     - **Name**: Daily Predictions
     - **Schedule**: `0 8 * * *` (runs daily at 8:00 AM UTC)
     - **URL**: `/api/cron/daily-sync`
     - **HTTP Method**: GET
     - **Headers**: 
       - `Authorization`: `Bearer YOUR_CRON_SECRET`

2. **Set environment variable:**
   - Add `CRON_SECRET` to your Vercel environment variables
   - Generate a secure random string for the secret

### Option 2: External Cron Services

For deployments not on Vercel, you can use external cron services:

#### Using cron-job.org
1. Visit https://cron-job.org
2. Create a new job with:
   - **URL**: `https://your-domain.com/api/cron/daily-sync`
   - **Method**: GET
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`
   - **Schedule**: Daily at your preferred time

#### Using EasyCron
1. Visit https://www.easycron.com
2. Create a new cron job with similar configuration

### Option 3: Server Cron (Linux/Unix)

If you have server access, add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 8:00 AM UTC)
0 8 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/daily-sync
```

## Manual Testing

To test the daily sync manually:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/daily-sync
```

Expected response:
```json
{
  "success": true,
  "message": "Daily predictions completed successfully",
  "timestamp": "2026-09-10T08:00:00.000Z"
}
```

## Monitoring

Check sync status in the database:

```sql
SELECT * FROM sync_status WHERE endpoint = 'daily_predictions' ORDER BY last_sync DESC LIMIT 1;
```

## Environment Variables Required

- `CRON_SECRET`: A secure secret to authenticate cron requests
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `GEMINI_API_KEY`: Your Google Gemini API key (for AI analysis)

## Notes

- The cron job runs all three prediction algorithms: Over 2.5, Win/Draw, and GG
- It processes matches for the current day and upcoming fixtures
- Sync status is logged to the `sync_status` table
- Failed runs are logged with status 'failed' for troubleshooting
- Adjust the schedule time based on your target audience's timezone