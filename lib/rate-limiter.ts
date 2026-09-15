/**
 * Rate Limiter and Smart Caching
 * Manages API rate limits and implements intelligent caching
 * to minimize API calls and improve performance
 */

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface RateLimitConfig {
  callsPerMinute: number
  callsPerHour: number
  callsPerDay: number
}

interface RateLimitState {
  minuteCalls: number
  hourCalls: number
  dayCalls: number
  minuteReset: number
  hourReset: number
  dayReset: number
}

export class RateLimiter {
  private cache: Map<string, CacheEntry> = new Map()
  private rateLimitState: Map<string, RateLimitState> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = {
    callsPerMinute: 10,
    callsPerHour: 600,
    callsPerDay: 14400
  }) {
    this.config = config
  }

  /**
   * Check if a call is allowed based on rate limits
   */
  async checkRateLimit(provider: string): Promise<boolean> {
    const now = Date.now()
    const state = this.getRateLimitState(provider)

    // Reset counters if time has passed
    if (now >= state.minuteReset) {
      state.minuteCalls = 0
      state.minuteReset = now + 60000 // 1 minute
    }
    if (now >= state.hourReset) {
      state.hourCalls = 0
      state.hourReset = now + 3600000 // 1 hour
    }
    if (now >= state.dayReset) {
      state.dayCalls = 0
      state.dayReset = now + 86400000 // 1 day
    }

    // Check limits
    if (state.minuteCalls >= this.config.callsPerMinute) {
      console.warn(`[RateLimiter] ${provider} minute limit reached`)
      return false
    }
    if (state.hourCalls >= this.config.callsPerHour) {
      console.warn(`[RateLimiter] ${provider} hour limit reached`)
      return false
    }
    if (state.dayCalls >= this.config.callsPerDay) {
      console.warn(`[RateLimiter] ${provider} day limit reached`)
      return false
    }

    // Increment counters
    state.minuteCalls++
    state.hourCalls++
    state.dayCalls++

    this.rateLimitState.set(provider, state)
    return true
  }

  /**
   * Get or create rate limit state for a provider
   */
  private getRateLimitState(provider: string): RateLimitState {
    const now = Date.now()
    let state = this.rateLimitState.get(provider)

    if (!state) {
      state = {
        minuteCalls: 0,
        hourCalls: 0,
        dayCalls: 0,
        minuteReset: now + 60000,
        hourReset: now + 3600000,
        dayReset: now + 86400000
      }
      this.rateLimitState.set(provider, state)
    }

    return state
  }

  /**
   * Get cached data if available and not expired
   */
  getCache(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now >= entry.timestamp + entry.ttl) {
      // Cache expired
      this.cache.delete(key)
      return null
    }

    console.log(`[RateLimiter] Cache hit for key: ${key}`)
    return entry.data
  }

  /**
   * Set cached data with TTL
   */
  setCache(key: string, data: any, ttl: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    }
    this.cache.set(key, entry)
    console.log(`[RateLimiter] Cached data for key: ${key} (TTL: ${ttl}ms)`)
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.timestamp + entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache for a specific key pattern
   */
  clearCachePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get rate limit status for a provider
   */
  getRateLimitStatus(provider: string) {
    const state = this.getRateLimitState(provider)
    const now = Date.now()

    return {
      minuteCalls: state.minuteCalls,
      minuteLimit: this.config.callsPerMinute,
      minuteRemaining: this.config.callsPerMinute - state.minuteCalls,
      minuteResetIn: Math.max(0, state.minuteReset - now),
      hourCalls: state.hourCalls,
      hourLimit: this.config.callsPerHour,
      hourRemaining: this.config.callsPerHour - state.hourCalls,
      hourResetIn: Math.max(0, state.hourReset - now),
      dayCalls: state.dayCalls,
      dayLimit: this.config.callsPerDay,
      dayRemaining: this.config.callsPerDay - state.dayCalls,
      dayResetIn: Math.max(0, state.dayReset - now)
    }
  }

  /**
   * Wait if rate limit is reached
   */
  async waitForRateLimit(provider: string): Promise<void> {
    const state = this.getRateLimitState(provider)
    const now = Date.now()

    if (state.minuteCalls >= this.config.callsPerMinute) {
      const waitTime = state.minuteReset - now
      console.log(`[RateLimiter] Waiting ${waitTime}ms for minute limit reset`)
      await this.sleep(waitTime)
    } else if (state.hourCalls >= this.config.callsPerHour) {
      const waitTime = state.hourReset - now
      console.log(`[RateLimiter] Waiting ${waitTime}ms for hour limit reset`)
      await this.sleep(waitTime)
    } else if (state.dayCalls >= this.config.callsPerDay) {
      const waitTime = state.dayReset - now
      console.log(`[RateLimiter] Waiting ${waitTime}ms for day limit reset`)
      await this.sleep(waitTime)
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance with Football-Data.org rate limits (10 calls/minute)
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter({
      callsPerMinute: 10,
      callsPerHour: 600,
      callsPerDay: 14400
    })
  }
  return rateLimiterInstance
}