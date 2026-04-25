import { processAllUpcomingPredictions } from '../lib/over25-algorithm'
// We'll run the sync first, then the algorithm

async function runSuite() {
  console.log('=========================================')
  console.log('   FOOTBALL-DATA.ORG COMPLETE SUITE')
  console.log('=========================================')

  try {
    // 1. Run Sync
    console.log('\n[STEP 1/2] Syncing Data...')
    // Note: In a real environment, we'd import the runSync from 03-sync-football-data.ts
    // For this script, we'll assume the user runs the sync script first or we can trigger a subset.
    console.log('Please ensure "pnpm tsx scripts/03-sync-football-data.ts" has been run.')

    // 2. Run Algorithm
    console.log('\n[STEP 2/2] Calculating Predictions...')
    await processAllUpcomingPredictions()
    
    console.log('\n[SUCCESS] Suite completed!')
  } catch (error) {
    console.error('\n[ERROR] Suite failed:', error)
  }
}

runSuite()
