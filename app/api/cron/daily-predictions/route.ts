import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processAllUpcomingPredictions } from '@/lib/over25-algorithm'
import { processAllWinDrawPredictions } from '@/lib/win-draw-algorithm-enhanced'
import { processAllGGPredictions } from '@/lib/gg-algorithm-enhanced'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST() {
  try {
    console.log('[CRON] Daily prediction trigger received at:', new Date().toISOString())
    
    // Fire and forget - start the prediction process in background
    // We don't await it so the response returns immediately
    triggerPredictions().catch(error => {
      console.error('[CRON] Background prediction error:', error)
    })
    
    // Return immediately so cron-job.org doesn't timeout
    return NextResponse.json({ 
      success: true, 
      message: 'Prediction process started in background',
      triggeredAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[CRON] Trigger error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// Separate function to run in background - calls sync functions directly
async function triggerPredictions() {
  try {
    console.log('[CRON] Starting background prediction process...')
    
    // Get current date in Nigerian time (UTC+1)
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const nigeriaTime = new Date(utc + (3600000 * 1))
    const today = new Date(nigeriaTime)
    today.setUTCHours(0, 0, 0, 0)
    const todayDate = today.toISOString().split('T')[0]
    
    // Get end of today (midnight tomorrow)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    
    // Check sync status for today
    const { data: syncStatus } = await supabase
      .from('fd_sync_status')
      .select('*')
      .eq('sync_date', todayDate)
      .single()
    
    if (syncStatus) {
      const completedTypes = syncStatus.prediction_types_generated || []
      console.log(`[CRON] Today's sync already completed. Generated types: ${completedTypes.join(', ')}`)
      
      // If all types are already generated, skip
      const allTypes = ['OVER_2_5', 'WIN_DRAW', 'GG']
      const isComplete = allTypes.every(type => completedTypes.includes(type))
      
      if (isComplete) {
        console.log('[CRON] All predictions already generated for today, skipping')
        return
      }
    }
    
    // Check if we have today's matches
    const { count: matchCount } = await supabase
      .from('fd_matches')
      .select('id', { count: 'exact', head: true })
      .in('status', ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'])
      .gte('utc_date', today.toISOString())
      .lt('utc_date', tomorrow.toISOString())
    
    const hasTodayData = (matchCount || 0) > 0
    
    if (!hasTodayData) {
      console.log('[CRON] No matches found for today, skipping predictions')
      return
    }
    
    console.log(`[CRON] Found ${matchCount} matches for today, starting predictions...`)
    
    // Run all prediction algorithms directly (no HTTP call needed)
    let predictionResults = { over25: 0, winDraw: 0, gg: 0, over25Failed: 0, winDrawFailed: 0, ggFailed: 0 }
    
    try {
      console.log('[CRON] Running Over/Under 2.5 predictions...')
      await processAllUpcomingPredictions()
      predictionResults.over25 = 1
    } catch (error: any) {
      console.error('[CRON] Over/Under 2.5 predictions failed:', error.message)
      predictionResults.over25Failed = 1
    }
    
    try {
      console.log('[CRON] Running Win/Draw predictions...')
      await processAllWinDrawPredictions()
      predictionResults.winDraw = 1
    } catch (error: any) {
      console.error('[CRON] Win/Draw predictions failed:', error.message)
      predictionResults.winDrawFailed = 1
    }
    
    try {
      console.log('[CRON] Running GG predictions...')
      await processAllGGPredictions()
      predictionResults.gg = 1
    } catch (error: any) {
      console.error('[CRON] GG predictions failed:', error.message)
      predictionResults.ggFailed = 1
    }
    
    // Update sync status
    const completedTypes = []
    if (predictionResults.over25) completedTypes.push('OVER_2_5')
    if (predictionResults.winDraw) completedTypes.push('WIN_DRAW')
    if (predictionResults.gg) completedTypes.push('GG')
    
    if (syncStatus) {
      await supabase
        .from('fd_sync_status')
        .update({
          prediction_types_generated: [...(syncStatus.prediction_types_generated || []), ...completedTypes],
          matches_synced: matchCount || 0
        })
        .eq('sync_date', todayDate)
    } else {
      await supabase
        .from('fd_sync_status')
        .insert({
          sync_date: todayDate,
          prediction_types_generated: completedTypes,
          matches_synced: matchCount || 0
        })
    }
    
    console.log('[CRON] Background prediction completed:', {
      over25: predictionResults.over25 ? '✓' : '✗',
      winDraw: predictionResults.winDraw ? '✓' : '✗',
      gg: predictionResults.gg ? '✓' : '✗'
    })
  } catch (error) {
    console.error('[CRON] Background prediction failed:', error)
    throw error
  }
}

// Also support GET for cron-job.org (some services use GET)
export async function GET() {
  return POST()
}
