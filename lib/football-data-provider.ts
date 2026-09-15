/**
 * Football-Data.org API Adapter
 * Primary data provider for fixtures, standings, and team data
 * Free tier: 10 calls/minute, generous rate limits
 */

import { getRateLimiter } from './rate-limiter'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'

interface FootballDataConfig {
  apiKey: string
}

interface FootballDataMatch {
  id: number
  utcDate: string
  status: string
  matchday: number
  stage: string
  group: string | null
  homeTeam: {
    id: number
    name: string
    shortName: string
    crest: string
  }
  awayTeam: {
    id: number
    name: string
    shortName: string
    crest: string
  }
  score: {
    fullTime: {
      home: number | null
      away: number | null
    }
    halfTime: {
      home: number | null
      away: number | null
    }
  }
  winner: string | null
}

interface FootballDataStandings {
  position: number
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export class FootballDataProvider {
  private config: FootballDataConfig
  private rateLimiter = getRateLimiter()

  constructor(config: FootballDataConfig) {
    this.config = config
  }

  private async fetchFromAPI(endpoint: string, cacheKey?: string, cacheTTL?: number): Promise<any> {
    // Check cache first
    if (cacheKey) {
      const cached = this.rateLimiter.getCache(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Check rate limit
    const canProceed = await this.rateLimiter.checkRateLimit('football-data.org')
    if (!canProceed) {
      console.warn('[Football-Data] Rate limit reached, returning cached data if available')
      // Try to return any cached data even if expired
      if (cacheKey) {
        const cached = this.rateLimiter.getCache(cacheKey)
        if (cached) {
          console.log('[Football-Data] Using expired cached data due to rate limit')
          return cached
        }
      }
      throw new Error('Rate limit reached and no cached data available')
    }

    const url = `${FOOTBALL_DATA_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': this.config.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Football-Data.org API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Cache the result
    if (cacheKey && cacheTTL) {
      this.rateLimiter.setCache(cacheKey, data, cacheTTL)
    }

    return data
  }

  /**
   * Get all competitions from Football-Data.org
   */
  async getCompetitions() {
    try {
      const cacheKey = 'competitions'
      const cacheTTL = 3600000 // 1 hour
      const data = await this.fetchFromAPI('/competitions', cacheKey, cacheTTL)
      return data.competitions || []
    } catch (error) {
      console.error('[Football-Data] Failed to fetch competitions:', error)
      return []
    }
  }

  /**
   * Get matches for a specific competition
   */
  async getCompetitionMatches(competitionId: number, seasonYear: number) {
    try {
      const cacheKey = `matches_${competitionId}_${seasonYear}`
      const cacheTTL = 1800000 // 30 minutes
      const data = await this.fetchFromAPI(`/competitions/${competitionId}/matches?season=${seasonYear}`, cacheKey, cacheTTL)
      return data.matches || []
    } catch (error) {
      console.error(`[Football-Data] Failed to fetch matches for competition ${competitionId}:`, error)
      return []
    }
  }

  /**
   * Get standings for a competition
   */
  async getCompetitionStandings(competitionId: number, seasonYear: number) {
    try {
      const cacheKey = `standings_${competitionId}_${seasonYear}`
      const cacheTTL = 900000 // 15 minutes
      const data = await this.fetchFromAPI(`/competitions/${competitionId}/standings?season=${seasonYear}`, cacheKey, cacheTTL)
      return data.standings || []
    } catch (error) {
      console.error(`[Football-Data] Failed to fetch standings for competition ${competitionId}:`, error)
      return []
    }
  }

  /**
   * Get matches for a specific team
   */
  async getTeamMatches(teamId: number, seasonYear: number, limit: number = 10) {
    try {
      const data = await this.fetchFromAPI(`/teams/${teamId}/matches?season=${seasonYear}&limit=${limit}`)
      return data.matches || []
    } catch (error) {
      console.error(`[Football-Data] Failed to fetch matches for team ${teamId}:`, error)
      return []
    }
  }

  /**
   * Get head-to-head between two teams
   */
  async getHeadToHead(team1Id: number, team2Id: number, limit: number = 10) {
    try {
      const data = await this.fetchFromAPI(`/teams/${team1Id}/matches/head2head/${team2Id}?limit=${limit}`)
      return data.matches || []
    } catch (error) {
      console.error(`[Football-Data] Failed to fetch H2H for teams ${team1Id} and ${team2Id}:`, error)
      return []
    }
  }

  /**
   * Convert Football-Data.org match to our internal format
   */
  convertMatchToInternalFormat(match: FootballDataMatch, competitionId: number, seasonYear: number) {
    return {
      id: match.id,
      competition_id: competitionId,
      season_year: seasonYear,
      utc_date: match.utcDate,
      status: match.status,
      matchday: match.matchday,
      stage: match.stage,
      group_name: match.group,
      home_team_id: match.homeTeam.id,
      away_team_id: match.awayTeam.id,
      score_fulltime_home: match.score.fullTime.home,
      score_fulltime_away: match.score.fullTime.away,
      score_halftime_home: match.score.halfTime.home,
      score_halftime_away: match.score.halfTime.away,
      score_extratime_home: null,
      score_extratime_away: null,
      score_penalties_home: null,
      score_penalties_away: null,
      winner: match.winner,
      last_updated: new Date().toISOString()
    }
  }

  /**
   * Convert Football-Data.org team to our internal format
   */
  convertTeamToInternalFormat(team: any) {
    return {
      id: team.id,
      name: team.name,
      short_name: team.shortName,
      tla: team.tla,
      crest: team.crest,
      last_updated: new Date().toISOString()
    }
  }

  /**
   * Convert Football-Data.org standings to our internal format
   */
  convertStandingsToInternalFormat(standings: any[], competitionId: number, seasonYear: number) {
    const standingRecords: any[] = []
    
    // Football-Data.org returns standings as an array of tables
    for (const table of standings) {
      if (!table.table || !Array.isArray(table.table)) {
        console.warn('[Football-Data] Invalid standings table structure')
        continue
      }
      
      for (const row of table.table) {
        // Skip if team data is missing
        if (!row.team || !row.team.id) {
          console.warn('[Football-Data] Standing row missing team data:', row)
          continue
        }
        
        standingRecords.push({
          competition_id: competitionId,
          season_year: seasonYear,
          type: table.type || 'TOTAL',
          team_id: row.team.id,
          position: row.position,
          played_games: row.playedGames,
          won: row.won,
          draw: row.draw,
          lost: row.lost,
          points: row.points,
          goals_for: row.goalsFor,
          goals_against: row.goalsAgainst,
          goals_difference: row.goalDifference
        })
      }
    }
    
    return standingRecords
  }
}

// Singleton instance
let footballDataProviderInstance: FootballDataProvider | null = null

export function getFootballDataProvider(): FootballDataProvider {
  if (!footballDataProviderInstance) {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY environment variable is not set')
    }
    footballDataProviderInstance = new FootballDataProvider({ apiKey })
  }
  return footballDataProviderInstance
}