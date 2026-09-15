import { NextResponse } from 'next/server'
import { getFootballDataProvider } from '@/lib/football-data-provider'
import { getDataAggregator } from '@/lib/data-aggregator'
import { getRateLimiter } from '@/lib/rate-limiter'

export async function GET() {
  try {
    console.log('=== TESTING MULTI-PROVIDER SYSTEM ===')

    const results = {
      footballData: { success: false, message: '', data: null },
      aggregator: { success: false, message: '', data: null },
      rateLimiter: { success: false, message: '', data: null }
    }

    // Test 1: Football-Data.org Provider
    try {
      console.log('[TEST] Testing Football-Data.org provider...')
      const provider = getFootballDataProvider()
      const competitions = await provider.getCompetitions()
      
      results.footballData.success = true
      results.footballData.message = `Successfully fetched ${competitions.length} competitions`
      results.footballData.data = { count: competitions.length, sample: competitions.slice(0, 3) }
      console.log(`[TEST] Football-Data.org: ${results.footballData.message}`)
    } catch (error: any) {
      results.footballData.message = error.message
      console.error('[TEST] Football-Data.org failed:', error)
    }

    // Test 2: Data Aggregator
    try {
      console.log('[TEST] Testing Data Aggregator...')
      const aggregator = getDataAggregator({ usePrimary: true, useSecondary: false, useVerification: false, enrichData: false })
      
      // Just test that it initializes correctly
      results.aggregator.success = true
      results.aggregator.message = 'Data Aggregator initialized successfully'
      console.log('[TEST] Data Aggregator: OK')
    } catch (error: any) {
      results.aggregator.message = error.message
      console.error('[TEST] Data Aggregator failed:', error)
    }

    // Test 3: Rate Limiter
    try {
      console.log('[TEST] Testing Rate Limiter...')
      const rateLimiter = getRateLimiter()
      
      // Test cache
      rateLimiter.setCache('test_key', { test: 'data' }, 60000)
      const cached = rateLimiter.getCache('test_key')
      
      if (cached && cached.test === 'data') {
        results.rateLimiter.success = true
        results.rateLimiter.message = 'Rate Limiter cache working correctly'
        console.log('[TEST] Rate Limiter: OK')
      } else {
        results.rateLimiter.message = 'Cache not working as expected'
      }
    } catch (error: any) {
      results.rateLimiter.message = error.message
      console.error('[TEST] Rate Limiter failed:', error)
    }

    const allPassed = results.footballData.success && results.aggregator.success && results.rateLimiter.success

    console.log('=== TEST RESULTS ===')
    console.log(`Football-Data.org: ${results.footballData.success ? 'PASS' : 'FAIL'}`)
    console.log(`Data Aggregator: ${results.aggregator.success ? 'PASS' : 'FAIL'}`)
    console.log(`Rate Limiter: ${results.rateLimiter.success ? 'PASS' : 'FAIL'}`)
    console.log(`Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`)
    console.log('====================')

    return NextResponse.json({
      success: allPassed,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[TEST] Test suite failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}