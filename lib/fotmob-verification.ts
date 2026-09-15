/**
 * FotMob Verification Module
 * Unofficial API for additional data verification and enrichment
 * Provides xG, detailed statistics, and advanced metrics
 */

interface FotMobMatchDetails {
  matchId: string
  general: {
    matchId: string
    leagueId: string
    homeTeamId: string
    awayTeamId: string
    matchTime: string
    status: {
      status: string
      reason: string
    }
  }
  header: {
    teams: {
      home: {
        id: string
        name: string
        imgUrl: string
      }
      away: {
        id: string
        name: string
        imgUrl: string
      }
    }
    status: {
      status: string
      started: boolean
      cancelled: boolean
      finished: boolean
      liveTime: {
        added: number
        addedSeconds: number
        displayTime: string
        seconds: number
      }
    }
  }
  content: {
    stats: {
      stats: Array<{
        title: string
        home: number
        away: number
      }>
    }
    lineups: {
      home: any[]
      away: any[]
    }
    playerStats: {
      home: any[]
      away: any[]
    }
  }
}

export class FotMobVerifier {
  private baseUrl = 'https://www.fotmob.com/api/data'

  /**
   * Fetch match details from FotMob
   */
  async getMatchDetails(matchId: string): Promise<FotMobMatchDetails | null> {
    try {
      const response = await fetch(`${this.baseUrl}/matchDetails?matchId=${matchId}`)
      
      if (!response.ok) {
        console.warn(`[FotMob] Failed to fetch match ${matchId}: ${response.status}`)
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`[FotMob] Error fetching match ${matchId}:`, error)
      return null
    }
  }

  /**
   * Fetch league data from FotMob
   */
  async getLeagueData(leagueId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/leagues?id=${leagueId}`)
      
      if (!response.ok) {
        console.warn(`[FotMob] Failed to fetch league ${leagueId}: ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error(`[FotMob] Error fetching league ${leagueId}:`, error)
      return null
    }
  }

  /**
   * Extract match statistics from FotMob data
   */
  extractMatchStatistics(fotMobData: FotMobMatchDetails) {
    if (!fotMobData?.content?.stats?.stats) {
      return null
    }

    return fotMobData.content.stats.stats.map(stat => ({
      title: stat.title,
      home: stat.home,
      away: stat.away
    }))
  }

  /**
   * Extract lineups from FotMob data
   */
  extractLineups(fotMobData: FotMobMatchDetails) {
    if (!fotMobData?.content?.lineups) {
      return null
    }

    return {
      home: fotMobData.content.lineups.home,
      away: fotMobData.content.lineups.away
    }
  }

  /**
   * Extract player statistics from FotMob data
   */
  extractPlayerStats(fotMobData: FotMobMatchDetails) {
    if (!fotMobData?.content?.playerStats) {
      return null
    }

    return {
      home: fotMobData.content.playerStats.home,
      away: fotMobData.content.playerStats.away
    }
  }

  /**
   * Verify match status and time
   */
  verifyMatchStatus(fotMobData: FotMobMatchDetails, expectedStatus: string, expectedTime: string): boolean {
    if (!fotMobData?.header?.status) {
      return false
    }

    const fotMobStatus = fotMobData.header.status.status
    const fotMobTime = fotMobData.general.matchTime

    // Status verification
    const statusMatch = this.normalizeStatus(fotMobStatus) === this.normalizeStatus(expectedStatus)

    // Time verification (allow 5 minute difference)
    const timeMatch = this.compareTimes(fotMobTime, expectedTime)

    return statusMatch && timeMatch
  }

  /**
   * Normalize status strings for comparison
   */
  private normalizeStatus(status: string): string {
    const normalized = status.toLowerCase()
    if (normalized.includes('live') || normalized.includes('in_play')) return 'IN_PLAY'
    if (normalized.includes('finished') || normalized.includes('end')) return 'FINISHED'
    if (normalized.includes('scheduled') || normalized.includes('timed')) return 'SCHEDULED'
    if (normalized.includes('postponed')) return 'POSTPONED'
    if (normalized.includes('cancelled')) return 'CANCELLED'
    return status.toUpperCase()
  }

  /**
   * Compare match times (allow 5 minute difference)
   */
  private compareTimes(time1: string, time2: string): boolean {
    try {
      const t1 = new Date(time1).getTime()
      const t2 = new Date(time2).getTime()
      const diff = Math.abs(t1 - t2)
      return diff <= 300000 // 5 minutes in milliseconds
    } catch {
      return false
    }
  }

  /**
   * Get xG data if available
   */
  getExpectedGoals(fotMobData: FotMobMatchDetails) {
    // xG data might be in different locations depending on the API version
    // This is a placeholder for where xG data would be extracted
    if (fotMobData?.content?.stats?.stats) {
      const xgStat = fotMobData.content.stats.stats.find((s: any) => 
        s.title.toLowerCase().includes('xg') || s.title.toLowerCase().includes('expected goals')
      )
      if (xgStat) {
        return {
          home: xgStat.home,
          away: xgStat.away
        }
      }
    }
    return null
  }
}

// Singleton instance
let fotMobVerifierInstance: FotMobVerifier | null = null

export function getFotMobVerifier(): FotMobVerifier {
  if (!fotMobVerifierInstance) {
    fotMobVerifierInstance = new FotMobVerifier()
  }
  return fotMobVerifierInstance
}