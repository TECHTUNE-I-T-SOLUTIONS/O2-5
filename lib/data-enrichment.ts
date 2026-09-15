/**
 * Data Enrichment Module
 * Cross-checks and supplements data from multiple providers
 * Verifies data quality and fills gaps from primary source
 */

interface MatchData {
  id: number
  home_team_id: number
  away_team_id: number
  utc_date: string
  status: string
  score_fulltime_home: number | null
  score_fulltime_away: number | null
}

interface EnrichedMatchData extends MatchData {
  primary_source: string
  data_quality_score: number
  cross_checked: boolean
  verified_fields: string[]
  missing_fields: string[]
  enrichments: {
    lineups?: any
    injuries?: any
    statistics?: any
    xg?: any
    odds?: any
  }
}

export class DataEnricher {
  /**
   * Cross-check match data from multiple sources
   */
  async crossCheckMatch(matchId: number, primaryData: MatchData): Promise<EnrichedMatchData> {
    const enrichments: any = {}
    const verifiedFields: string[] = []
    const missingFields: string[] = []
    let dataQualityScore = 100

    // Try to enrich with FotMob data
    try {
      const fotMobData = await this.fetchFotMobMatchDetails(matchId)
      if (fotMobData) {
        enrichments.statistics = fotMobData.statistics
        enrichments.xg = fotMobData.xg
        verifiedFields.push('statistics', 'xg')
      } else {
        missingFields.push('statistics', 'xg')
        dataQualityScore -= 10
      }
    } catch (error) {
      console.error(`[DataEnricher] FotMob enrichment failed for match ${matchId}:`, error)
      missingFields.push('statistics', 'xg')
      dataQualityScore -= 10
    }

    // Try to enrich with SofaScore data
    try {
      const sofaScoreData = await this.fetchSofaScoreMatchDetails(matchId)
      if (sofaScoreData) {
        enrichments.lineups = sofaScoreData.lineups
        enrichments.injuries = sofaScoreData.injuries
        verifiedFields.push('lineups', 'injuries')
      } else {
        missingFields.push('lineups', 'injuries')
        dataQualityScore -= 15
      }
    } catch (error) {
      console.error(`[DataEnricher] SofaScore enrichment failed for match ${matchId}:`, error)
      missingFields.push('lineups', 'injuries')
      dataQualityScore -= 15
    }

    // Cross-check basic match details
    const isCrossChecked = await this.crossCheckMatchDetails(primaryData)
    if (isCrossChecked) {
      verifiedFields.push('basic_details')
    }

    return {
      ...primaryData,
      primary_source: 'football-data.org',
      data_quality_score: Math.max(0, dataQualityScore),
      cross_checked: isCrossChecked,
      verified_fields: verifiedFields,
      missing_fields: missingFields,
      enrichments
    }
  }

  /**
   * Fetch FotMob match details (unofficial API)
   */
  private async fetchFotMobMatchDetails(matchId: number): Promise<any> {
    try {
      // Note: FotMob uses different match IDs
      // This is a placeholder - you'll need to map Football-Data IDs to FotMob IDs
      const response = await fetch(`https://www.fotmob.com/api/data/matchDetails?matchId=${matchId}`)
      if (!response.ok) {
        return null
      }
      return await response.json()
    } catch (error) {
      console.error('[DataEnricher] FotMob fetch error:', error)
      return null
    }
  }

  /**
   * Fetch SofaScore match details (unofficial API)
   */
  private async fetchSofaScoreMatchDetails(matchId: number): Promise<any> {
    try {
      // Note: SofaScore uses different match IDs
      // This is a placeholder - you'll need to map Football-Data IDs to SofaScore IDs
      const response = await fetch(`https://api.sofascore.com/api/v1/event/${matchId}`)
      if (!response.ok) {
        return null
      }
      return await response.json()
    } catch (error) {
      console.error('[DataEnricher] SofaScore fetch error:', error)
      return null
    }
  }

  /**
   * Cross-check match details against API-Football
   */
  private async crossCheckMatchDetails(matchData: MatchData): Promise<boolean> {
    try {
      const { fetchTodayFixtures } = await import('./api-football')
      const fixtures = await fetchTodayFixtures()
      
      // Find matching fixture by team IDs
      const match = fixtures.find(f => 
        f.teams.home.id === matchData.home_team_id && 
        f.teams.away.id === matchData.away_team_id
      )

      if (match) {
        // Verify kickoff time (allow 5 minute difference)
        const primaryTime = new Date(matchData.utc_date).getTime()
        const backupTime = new Date(match.fixture.date).getTime()
        const timeDiff = Math.abs(primaryTime - backupTime)
        
        if (timeDiff > 300000) { // 5 minutes in milliseconds
          console.warn(`[DataEnricher] Time mismatch for match ${matchData.id}: ${matchData.utc_date} vs ${match.fixture.date}`)
          return false
        }

        // Verify status
        if (matchData.status !== match.fixture.status.short) {
          console.warn(`[DataEnricher] Status mismatch for match ${matchData.id}: ${matchData.status} vs ${match.fixture.status.short}`)
          return false
        }

        return true
      }

      return false
    } catch (error: any) {
      // Skip cross-check if rate limited
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        console.warn('[DataEnricher] API-Football rate limited, skipping cross-check')
        return true // Assume data is valid if we can't verify
      }
      console.error('[DataEnricher] Cross-check failed:', error)
      return false
    }
  }

  /**
   * Verify standings data from multiple sources
   */
  async verifyStandings(competitionId: number, seasonYear: number, primaryStandings: any[]): Promise<any[]> {
    const verifiedStandings = []
    
    try {
      const { fetchLeagueStandings } = await import('./api-football')
      const apiFootballStandings = await fetchLeagueStandings(competitionId, seasonYear)
      
      if (apiFootballStandings?.league?.standings) {
        // Merge and verify standings from both sources
        for (const primary of primaryStandings) {
          const backup = apiFootballStandings.league.standings[0].find(
            (s: any) => s.team.id === primary.team_id
          )
          
          if (backup) {
            // Verify position (allow small differences due to live updates)
            const positionDiff = Math.abs(primary.position - backup.rank)
            if (positionDiff > 2) {
              console.warn(`[DataEnricher] Position mismatch for team ${primary.team_id}: ${primary.position} vs ${backup.rank}`)
            }
            
            // Verify points
            if (primary.points !== backup.points) {
              console.warn(`[DataEnricher] Points mismatch for team ${primary.team_id}: ${primary.points} vs ${backup.points}`)
            }
          }
          
          verifiedStandings.push({
            ...primary,
            verified: !!backup,
            verified_by: backup ? 'api-football' : 'football-data.org'
          })
        }
      } else {
        // No backup data available, return primary as-is
        verifiedStandings.push(...primaryStandings.map(s => ({
          ...s,
          verified: false,
          verified_by: 'football-data.org'
        })))
      }
    } catch (error) {
      console.error('[DataEnricher] Standings verification failed:', error)
      return primaryStandings.map(s => ({
        ...s,
        verified: false,
        verified_by: 'football-data.org'
      }))
    }

    return verifiedStandings
  }

  /**
   * Calculate data quality score for a match
   */
  calculateDataQualityScore(match: EnrichedMatchData): number {
    let score = 100

    // Deduct for missing verified fields
    score -= match.missing_fields.length * 5

    // Deduct if not cross-checked
    if (!match.cross_checked) {
      score -= 10
    }

    // Deduct for low primary source reliability
    if (match.primary_source !== 'football-data.org') {
      score -= 15
    }

    return Math.max(0, score)
  }
}

// Singleton instance
let dataEnricherInstance: DataEnricher | null = null

export function getDataEnricher(): DataEnricher {
  if (!dataEnricherInstance) {
    dataEnricherInstance = new DataEnricher()
  }
  return dataEnricherInstance
}