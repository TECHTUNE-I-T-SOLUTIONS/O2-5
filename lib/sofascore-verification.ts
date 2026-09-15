/**
 * SofaScore Verification Module
 * Unofficial API for additional data verification and enrichment
 * Provides detailed match statistics, lineups, and team form
 */

interface SofaScoreMatchDetails {
  id: number
  tournament: {
    id: number
    name: string
    category: {
      name: string
    }
  }
  homeTeam: {
    id: number
    name: string
    logo: string
  }
  awayTeam: {
    id: number
    name: string
    logo: string
  }
  status: {
    type: string
    description: string
  }
  homeScore: {
    current: number
    period1: number
    normaltime: number
  }
  awayScore: {
    current: number
    period1: number
    normaltime: number
  }
  time: {
    current: number
    added: number
  }
  events: any[]
  statistics: {
    periods: Array<{
      groups: Array<{
        statisticsItems: Array<{
          name: string
          home: number
          away: number
        }>
      }>
    }>
  }
  lineups: {
    home: {
      players: any[]
    }
    away: {
      players: any[]
    }
  }
  injuries: {
    home: any[]
    away: any[]
  }
}

export class SofaScoreVerifier {
  private baseUrl = 'https://api.sofascore.com/api/v1'

  /**
   * Fetch match details from SofaScore
   */
  async getMatchDetails(matchId: number): Promise<SofaScoreMatchDetails | null> {
    try {
      const response = await fetch(`${this.baseUrl}/event/${matchId}`)
      
      if (!response.ok) {
        console.warn(`[SofaScore] Failed to fetch match ${matchId}: ${response.status}`)
        return null
      }

      const data = await response.json()
      return data.event
    } catch (error) {
      console.error(`[SofaScore] Error fetching match ${matchId}:`, error)
      return null
    }
  }

  /**
   * Fetch tournament standings from SofaScore
   */
  async getTournamentStandings(tournamentId: number, seasonId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/tournament/${tournamentId}/standings/season/${seasonId}`)
      
      if (!response.ok) {
        console.warn(`[SofaScore] Failed to fetch standings for tournament ${tournamentId}: ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error(`[SofaScore] Error fetching standings:`, error)
      return null
    }
  }

  /**
   * Extract match statistics from SofaScore data
   */
  extractMatchStatistics(sofaScoreData: SofaScoreMatchDetails) {
    if (!sofaScoreData?.statistics?.periods) {
      return null
    }

    const allStats: any[] = []
    
    for (const period of sofaScoreData.statistics.periods) {
      for (const group of period.groups) {
        for (const stat of group.statisticsItems) {
          allStats.push({
            title: stat.name,
            home: stat.home,
            away: stat.away
          })
        }
      }
    }

    return allStats
  }

  /**
   * Extract lineups from SofaScore data
   */
  extractLineups(sofaScoreData: SofaScoreMatchDetails) {
    if (!sofaScoreData?.lineups) {
      return null
    }

    return {
      home: sofaScoreData.lineups.home?.players || [],
      away: sofaScoreData.lineups.away?.players || []
    }
  }

  /**
   * Extract injuries from SofaScore data
   */
  extractInjuries(sofaScoreData: SofaScoreMatchDetails) {
    if (!sofaScoreData?.injuries) {
      return null
    }

    return {
      home: sofaScoreData.injuries.home || [],
      away: sofaScoreData.injuries.away || []
    }
  }

  /**
   * Extract match events (goals, cards, substitutions)
   */
  extractMatchEvents(sofaScoreData: SofaScoreMatchDetails) {
    if (!sofaScoreData?.events) {
      return null
    }

    return sofaScoreData.events.map(event => ({
      id: event.id,
      type: event.type,
      time: event.time,
      homeTeam: event.homeTeam,
      player: event.player,
      assistPlayer: event.assistPlayer,
      description: event.description
    }))
  }

  /**
   * Verify match status and score
   */
  verifyMatchStatus(sofaScoreData: SofaScoreMatchDetails, expectedStatus: string, expectedHomeScore: number | null, expectedAwayScore: number | null): boolean {
    if (!sofaScoreData?.status) {
      return false
    }

    const sofaScoreStatus = this.normalizeStatus(sofaScoreData.status.type)
    const normalizedExpectedStatus = this.normalizeStatus(expectedStatus)

    // Status verification
    const statusMatch = sofaScoreStatus === normalizedExpectedStatus

    // Score verification (only for finished/live matches)
    let scoreMatch = true
    if (expectedHomeScore !== null && expectedAwayScore !== null) {
      scoreMatch = sofaScoreData.homeScore.current === expectedHomeScore && 
                   sofaScoreData.awayScore.current === expectedAwayScore
    }

    return statusMatch && scoreMatch
  }

  /**
   * Normalize status strings for comparison
   */
  private normalizeStatus(status: string): string {
    const normalized = status.toLowerCase()
    if (normalized.includes('live') || normalized.includes('inprogress')) return 'IN_PLAY'
    if (normalized.includes('finished') || normalized.includes('ended')) return 'FINISHED'
    if (normalized.includes('notstarted') || normalized.includes('scheduled')) return 'SCHEDULED'
    if (normalized.includes('postponed')) return 'POSTPONED'
    if (normalized.includes('cancelled') || normalized.includes('canceled')) return 'CANCELLED'
    return status.toUpperCase()
  }

  /**
   * Calculate team form from recent matches
   */
  async getTeamForm(teamId: number, limit: number = 5): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/team/${teamId}/matches/last/${limit}`)
      
      if (!response.ok) {
        console.warn(`[SofaScore] Failed to fetch form for team ${teamId}: ${response.status}`)
        return null
      }

      const data = await response.json()
      const matches = data.events || []

      const form = matches.map((match: any) => {
        if (match.winnerCode === 1) return 'W'
        if (match.winnerCode === 2) return 'L'
        return 'D'
      }).join('-')

      return form
    } catch (error) {
      console.error(`[SofaScore] Error fetching team form:`, error)
      return null
    }
  }

  /**
   * Get H2H data between two teams
   */
  async getHeadToHead(team1Id: number, team2Id: number, limit: number = 10): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/team/${team1Id}/events/last/${limit}/vs/${team2Id}`)
      
      if (!response.ok) {
        console.warn(`[SofaScore] Failed to fetch H2H for teams ${team1Id} and ${team2Id}: ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error(`[SofaScore] Error fetching H2H:`, error)
      return null
    }
  }
}

// Singleton instance
let sofaScoreVerifierInstance: SofaScoreVerifier | null = null

export function getSofaScoreVerifier(): SofaScoreVerifier {
  if (!sofaScoreVerifierInstance) {
    sofaScoreVerifierInstance = new SofaScoreVerifier()
  }
  return sofaScoreVerifierInstance
}