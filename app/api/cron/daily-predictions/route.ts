import { NextResponse } from 'next/server'

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

// Separate function to run in background
async function triggerPredictions() {
  try {
    console.log('[CRON] Starting background prediction process...')
    
    // Call the main sync endpoint
    const syncUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sync/football-data`
    const response = await fetch(syncUrl, { 
      method: 'POST',
      signal: AbortSignal.timeout(300000) // 5 minute timeout for background process
    })
    
    const data = await response.json()
    console.log('[CRON] Background prediction completed:', data)
    
    // Optionally send notification or log completion
    console.log('[CRON] Daily predictions completed successfully')
  } catch (error) {
    console.error('[CRON] Background prediction failed:', error)
    throw error
  }
}

// Also support GET for cron-job.org (some services use GET)
export async function GET() {
  return POST()
}
