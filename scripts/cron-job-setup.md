# Cron-Job.org Setup Guide

## Cron Job Configuration

### Cron Expression
```
1 0 * * *
```
This runs at 00:01 (12:01 AM) every day.

### Cron-Job.org Settings

1. **Create a new cron job**
   - Go to https://cron-job.org
   - Sign in or create an account
   - Click "Create cron job"

2. **Basic Settings**
   - **Title**: O2-5 Daily Predictions
   - **Schedule**: Custom
   - **Cron Expression**: `1 0 * * *` (runs at 00:01 daily)
   - **Timezone**: Select your timezone (e.g., Africa/Lagos for Nigerian time)

3. **Request Settings**
   - **URL**: `https://your-domain.com/api/cron/daily-predictions`
     - Replace `your-domain.com` with your actual domain
     - For local testing: `http://localhost:3000/api/cron/daily-predictions`
   - **Method**: POST
   - **Headers**: 
     ```
     Content-Type: application/json
     ```
   - **Body**: Leave empty (no body needed)

4. **Advanced Settings**
   - **Timeout**: 30 seconds (endpoint returns immediately)
   - **Retry on failure**: Enable (3 retries)
   - **Notifications**: Enable email on failure
   - **Save responses**: Enable for debugging

5. **Save and Test**
   - Click "Save"
   - Click "Run now" to test immediately
   - Check your server logs to confirm it fired

## Important Notes

### Fire-and-Forget Architecture
- The endpoint returns immediately (200 OK)
- The actual prediction process runs in the background
- This prevents cron-job.org timeouts
- The background process has a 5-minute timeout

### Environment Variables
Make sure these are set in your production environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_API_FOOTBALL_KEY`
- `FOOTBALL_DATA_API_KEY`
- `GEMINI_API_KEY` (optional, for AI enhancements)
- `NEXT_PUBLIC_SITE_URL` (your production domain)

### Monitoring
- Check your server logs for `[CRON]` prefixed messages
- The cron job saves responses on cron-job.org
- Enable email notifications for failures
- Monitor prediction generation in your Supabase dashboard

### Testing Locally
To test the cron endpoint locally:
```bash
curl -X POST http://localhost:3000/api/cron/daily-predictions
```

Expected response:
```json
{
  "success": true,
  "message": "Prediction process started in background",
  "triggeredAt": "2026-09-11T00:01:00.000Z"
}
```

### Troubleshooting

**If cron job fails:**
1. Check that your server is running
2. Verify the URL is correct
3. Check environment variables are set
4. Review server logs for errors
5. Test the endpoint manually with curl

**If predictions don't generate:**
1. Check your server logs for `[CRON]` messages
2. Verify the sync endpoint is working
3. Check Supabase for sync status records
4. Ensure database migration was run

**If you need to trigger manually:**
- Go to `/predictions` page
- Click "Generate Predictions" button
- Or call the endpoint directly: `POST /api/cron/daily-predictions`

## Production Deployment

When deploying to production:

1. **Update the cron job URL**:
   - Change from `http://localhost:3000/api/cron/daily-predictions`
   - To `https://your-production-domain.com/api/cron/daily-predictions`

2. **Set environment variables**:
   - Configure all required env vars in your hosting platform
   - `NEXT_PUBLIC_SITE_URL` should be your production domain

3. **Test the production endpoint**:
   ```bash
   curl -X POST https://your-production-domain.com/api/cron/daily-predictions
   ```

4. **Monitor first few runs**:
   - Check logs after first cron execution
   - Verify predictions are generated
   - Check sync status in database
