import { NextResponse } from 'next/server'
import { getDataAggregator } from '@/lib/data-aggregator'
import { getDataQualityTracker } from '@/lib/data-quality-tracker'
import { processAllUpcomingPredictions } from '@/lib/over25-algorithm'
import { processAllWinDrawPredictions } from '@/lib/win-draw-algorithm-enhanced'
import { processAllGGPredictions } from '@/lib/gg-algorithm-enhanced'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { seasonYear = 2025, fullSync = false } = body

    console.log('--- STARTING MULTI-PROVIDER DATA SYNC ---')
    console.log(`Season: ${seasonYear}`)
    console.log(`Full Sync: ${fullSync}`)

    // Get data aggregator instance
    const aggregator = getDataAggregator({
      usePrimary: true,
      useSecondary: true,
      useVerification: true,
      enrichData: true
    })

    // Sync data from multiple providers
    const aggregationResult = fullSync 
      ? await aggregator.aggregateData(seasonYear, false) // Full sync for force mode
      : await aggregator.aggregateData(seasonYear, true) // Today only for regular sync

    if (!aggregationResult.success) {
      throw new Error('Data aggregation failed')
    }

    console.log('[SYNC] Data aggregation completed')
    console.log(`[SYNC] Matches synced: ${aggregationResult.matchesSynced}`)
    console.log(`[SYNC] Teams synced: ${aggregationResult.teamsSynced}`)
    console.log(`[SYNC] Standings synced: ${aggregationResult.standingsSynced}`)
    console.log(`[SYNC] Data quality: High ${aggregationResult.dataQuality.high}, Medium ${aggregationResult.dataQuality.medium}, Low ${aggregationResult.dataQuality.low}`)

    // Update sync status
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayDate = today.toISOString().split('T')[0]

    await supabase.from('fd_sync_status').upsert({
      sync_date: todayDate,
      matches_synced: aggregationResult.matchesSynced,
      data_quality: aggregationResult.dataQuality,
      sources_used: aggregationResult.sources,
      last_sync_time: new Date().toISOString()
    }, { onConflict: 'sync_date' })

    // Run prediction algorithms
    console.log('[SYNC] Running prediction algorithms...')
    
    let predictionResults = { over25: 0, winDraw: 0, gg: 0, over25Failed: 0, winDrawFailed: 0, ggFailed: 0 }
    
    try {
      console.log('[SYNC] Running Over/Under 2.5 predictions...')
      await processAllUpcomingPredictions()
      predictionResults.over25 = 1
    } catch (error: any) {
      console.error('[SYNC] Over/Under 2.5 predictions failed:', error.message)
      predictionResults.over25Failed = 1
    }
    
    try {
      console.log('[SYNC] Running Win/Draw predictions...')
      await processAllWinDrawPredictions()
      predictionResults.winDraw = 1
    } catch (error: any) {
      console.error('[SYNC] Win/Draw predictions failed:', error.message)
      predictionResults.winDrawFailed = 1
    }
    
    try {
      console.log('[SYNC] Running GG predictions...')
      await processAllGGPredictions()
      predictionResults.gg = 1
    } catch (error: any) {
      console.error('[SYNC] GG predictions failed:', error.message)
      predictionResults.ggFailed = 1
    }

    const successfulPredictions = predictionResults.over25 + predictionResults.winDraw + predictionResults.gg
    const totalPredictions = 3

    // Update sync status with prediction results
    const completedTypes = []
    if (predictionResults.over25) completedTypes.push('OVER_2_5')
    if (predictionResults.winDraw) completedTypes.push('WIN_DRAW')
    if (predictionResults.gg) completedTypes.push('GG')

    await supabase.from('fd_sync_status').update({
      prediction_types_generated: completedTypes
    }).eq('sync_date', todayDate)

    // Generate and log quality report
    const qualityTracker = getDataQualityTracker()
    const qualityReport = await qualityTracker.getQualityReport(todayDate)
    await qualityTracker.logQualityMetrics(qualityReport)

    console.log('[SYNC] Multi-provider sync completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Multi-provider sync completed successfully',
      aggregation: aggregationResult,
      predictions: predictionResults,
      predictionSuccessRate: `${successfulPredictions}/${totalPredictions}`,
      qualityReport
    })
  } catch (error: any) {
    console.error('[SYNC] Multi-provider sync failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}