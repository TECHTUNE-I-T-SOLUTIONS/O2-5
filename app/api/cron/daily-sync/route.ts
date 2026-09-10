import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processAllUpcomingPredictions } from '@/lib/over25-algorithm'
import { processAllWinDrawPredictions } from '@/lib/win-draw-algorithm'
import { processAllGGPredictions } from '@/lib/gg-algorithm'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Simple authentication for cron jobs
const CRON_SECRET = process.env.CRON_SECRET || 'default_secret_change_in_production'

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[CRON] Starting daily sync and predictions...')
    
    // Run all prediction algorithms
    console.log('[CRON] Running Over/Under 2.5 predictions...')
    await processAllUpcomingPredictions()
    
    console.log('[CRON] Running Win/Draw predictions...')
    await processAllWinDrawPredictions()
    
    console.log('[CRON] Running GG predictions...')
    await processAllGGPredictions()

    // Log the sync
    await supabase.from('sync_status').upsert({
      endpoint: 'daily_predictions',
      last_sync: new Date().toISOString(),
      last_sync_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      total_records: 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' })

    console.log('[CRON] Daily sync completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily predictions completed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[CRON] Daily sync failed:', error)
    
    // Log the failure
    await supabase.from('sync_status').upsert({
      endpoint: 'daily_predictions',
      last_sync: new Date().toISOString(),
      last_sync_date: new Date().toISOString().split('T')[0],
      status: 'failed',
      total_records: 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' })

    return NextResponse.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}