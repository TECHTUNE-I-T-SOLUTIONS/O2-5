/**
 * Data Aggregator and Normalizer
 * Combines data from multiple providers into a unified format
 * Handles fallbacks, normalization, and data quality checks
 */

import { getFootballDataProvider } from './football-data-provider'
import { getDataEnricher } from './data-enrichment'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const TIER_1_COMPETITIONS = ['PL', 'ELC', 'BL1', 'SA', 'PD', 'FL1', 'DED', 'PPL', 'CL', 'WC']

interface AggregationConfig {
  usePrimary: boolean
  useSecondary: boolean
  useVerification: boolean
  enrichData: boolean
}

interface AggregationResult {
  success: boolean
  matchesSynced: number
  teamsSynced: number
  standingsSynced: number
  dataQuality: {
    high: number
    medium: number
    low: number
  }
  sources: {
    primary: string
    secondary: string[]
    verification: string[]
  }
  errors: string[]
}

export class DataAggregator {
  private config: AggregationConfig
  private dataEnricher = getDataEnricher()
  private footballDataProvider = getFootballDataProvider()

  constructor(config: AggregationConfig = {
    usePrimary: true,
    useSecondary: true,
    useVerification: true,
    enrichData: true
  }) {
    this.config = config
  }

  /**
   * Main aggregation method - syncs all data from multiple providers
   */
  async aggregateData(seasonYear: number = 2025, todayOnly: boolean = false): Promise<AggregationResult> {
    const result: AggregationResult = {
      success: false,
      matchesSynced: 0,
      teamsSynced: 0,
      standingsSynced: 0,
      dataQuality: { high: 0, medium: 0, low: 0 },
      sources: {
        primary: 'football-data.org',
        secondary: ['api-football'],
        verification: ['fotmob', 'sofascore']
      },
      errors: []
    }

    try {
      console.log('[DataAggregator] Starting data aggregation...')
      console.log(`[DataAggregator] Today only mode: ${todayOnly}`)

      // Step 1: Fetch competitions from primary source
      const competitions = await this.fetchCompetitions()
      console.log(`[DataAggregator] Fetched ${competitions.length} competitions`)

      // Step 2: Filter to Tier 1 competitions
      const tier1Competitions = competitions.filter((c: any) => 
        TIER_1_COMPETITIONS.includes(c.code)
      )
      console.log(`[DataAggregator] Processing ${tier1Competitions.length} Tier 1 competitions`)

      // Step 3: For each competition, sync matches, teams, and standings
      for (const competition of tier1Competitions) {
        try {
          await this.syncCompetitionData(competition, seasonYear, result, todayOnly)
          // Add delay between competitions to respect rate limits
          await this.sleep(1000) // 1 second delay (reduced from 2s)
        } catch (error: any) {
          console.error(`[DataAggregator] Failed to sync competition ${competition.name}:`, error)
          result.errors.push(`Competition ${competition.name}: ${error.message}`)
          // Continue with next competition even if this one fails
        }
      }

      // Step 4: Cross-check and enrich data if enabled (skip for today-only to save time)
      if (this.config.enrichData && !todayOnly) {
        await this.enrichAndVerifyData(result)
      } else if (todayOnly) {
        console.log('[DataAggregator] Skipping cross-check for today-only mode to save time')
        // Set default quality metrics for today-only mode
        result.dataQuality = {
          high: result.matchesSynced, // Assume high quality for fresh data
          medium: 0,
          low: 0
        }
      }

      result.success = true
      console.log('[DataAggregator] Data aggregation completed successfully')
    } catch (error: any) {
      console.error('[DataAggregator] Data aggregation failed:', error)
      result.errors.push(`General error: ${error.message}`)
    }

    return result
  }

  /**
   * Fetch competitions from primary source
   */
  private async fetchCompetitions() {
    if (this.config.usePrimary) {
      return await this.footballDataProvider.getCompetitions()
    }
    return []
  }

  /**
   * Sleep helper for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Sync data for a single competition
   */
  private async syncCompetitionData(competition: any, seasonYear: number, result: AggregationResult, todayOnly: boolean = false) {
    console.log(`[DataAggregator] Syncing ${competition.name}...`)

    // Fetch matches
    const matches = await this.footballDataProvider.getCompetitionMatches(competition.id, seasonYear)
    console.log(`[DataAggregator] Fetched ${matches.length} matches for ${competition.name}`)

    // Filter to today's matches if todayOnly is true
    let matchesToSync = matches
    if (todayOnly) {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      
      matchesToSync = matches.filter((m: any) => {
        const matchDate = new Date(m.utcDate)
        return matchDate >= today && matchDate < tomorrow
      })
      console.log(`[DataAggregator] Filtered to ${matchesToSync.length} today's matches for ${competition.name}`)
      
      // If no matches found for today in this season, try next season
      if (matchesToSync.length === 0 && matches.length > 0) {
        console.log(`[DataAggregator] No today's matches in season ${seasonYear}, trying next season`)
        const nextSeasonMatches = await this.footballDataProvider.getCompetitionMatches(competition.id, seasonYear + 1)
        console.log(`[DataAggregator] Fetched ${nextSeasonMatches.length} matches for ${competition.name} season ${seasonYear + 1}`)
        
        const nextSeasonTodayMatches = nextSeasonMatches.filter((m: any) => {
          const matchDate = new Date(m.utcDate)
          return matchDate >= today && matchDate < tomorrow
        })
        
        if (nextSeasonTodayMatches.length > 0) {
          matchesToSync = nextSeasonTodayMatches
          console.log(`[DataAggregator] Found ${matchesToSync.length} today's matches in season ${seasonYear + 1}`)
        }
      }
    }

    // Convert and upsert matches
    const matchRecords = matchesToSync.map((m: any) => 
      this.footballDataProvider.convertMatchToInternalFormat(m, competition.id, seasonYear)
    )
    
    const { error: matchError } = await supabase.from('fd_matches').upsert(matchRecords, { onConflict: 'id' })
    if (matchError) {
      throw new Error(`Failed to upsert matches: ${matchError.message}`)
    }
    result.matchesSynced += matchRecords.length

    // Extract and upsert teams
    const teamRecords: any[] = []
    for (const match of matches) {
      if (match.homeTeam?.id) {
        teamRecords.push(this.footballDataProvider.convertTeamToInternalFormat(match.homeTeam))
      }
      if (match.awayTeam?.id) {
        teamRecords.push(this.footballDataProvider.convertTeamToInternalFormat(match.awayTeam))
      }
    }
    
    const uniqueTeams = Array.from(new Map(teamRecords.map(item => [item.id, item])).values())
    const { error: teamError } = await supabase.from('fd_teams').upsert(uniqueTeams, { onConflict: 'id' })
    if (teamError) {
      throw new Error(`Failed to upsert teams: ${teamError.message}`)
    }
    result.teamsSynced += uniqueTeams.length

    // Fetch and upsert standings
    try {
      const standings = await this.footballDataProvider.getCompetitionStandings(competition.id, seasonYear)
      console.log(`[DataAggregator] Fetched standings for ${competition.name}`)
      
      if (standings.length > 0) {
        const standingRecords = this.footballDataProvider.convertStandingsToInternalFormat(
          standings, 
          competition.id, 
          seasonYear
        )
        
        if (standingRecords.length > 0) {
          const { error: standingsError } = await supabase.from('fd_standings').upsert(standingRecords, { 
            onConflict: 'competition_id,season_year,team_id,type' 
          })
          if (standingsError) {
            console.warn(`[DataAggregator] Failed to upsert standings: ${standingsError.message}`)
          } else {
            result.standingsSynced += standingRecords.length
          }
        }
      }
    } catch (standingsError: any) {
      console.warn(`[DataAggregator] Failed to fetch standings for ${competition.name}: ${standingsError.message}`)
      // Continue even if standings fail
    }

    // Upsert competition
    const competitionRecord = {
      id: competition.id,
      name: competition.name,
      code: competition.code,
      type: competition.type,
      emblem: competition.emblem,
      plan: competition.plan,
      area_name: competition.area?.name,
      area_code: competition.area?.code,
      area_flag: competition.area?.flag,
      last_updated: competition.lastUpdated
    }
    
    await supabase.from('fd_competitions').upsert(competitionRecord, { onConflict: 'id' })
  }

  /**
   * Enrich and verify data using secondary sources
   */
  private async enrichAndVerifyData(result: AggregationResult) {
    console.log('[DataAggregator] Enriching and verifying data...')

    // Get recent matches to enrich
    const { data: recentMatches } = await supabase
      .from('fd_matches')
      .select('*')
      .in('status', ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'])
      .order('utc_date', { ascending: true })
      .limit(50)

    if (!recentMatches || recentMatches.length === 0) {
      console.log('[DataAggregator] No recent matches to enrich')
      return
    }

    let highQuality = 0
    let mediumQuality = 0
    let lowQuality = 0

    // Enrich each match
    for (const match of recentMatches) {
      try {
        const enriched = await this.dataEnricher.crossCheckMatch(match.id, match)
        const qualityScore = this.dataEnricher.calculateDataQualityScore(enriched)

        if (qualityScore >= 80) {
          highQuality++
        } else if (qualityScore >= 50) {
          mediumQuality++
        } else {
          lowQuality++
        }

        // Store enrichment data (could be added to a separate table)
        // For now, we'll just log it
        console.log(`[DataAggregator] Match ${match.id} quality score: ${qualityScore}`)
      } catch (error) {
        console.error(`[DataAggregator] Failed to enrich match ${match.id}:`, error)
        lowQuality++
      }
    }

    result.dataQuality = { high: highQuality, medium: mediumQuality, low: lowQuality }
    console.log(`[DataAggregator] Data quality: High ${highQuality}, Medium ${mediumQuality}, Low ${lowQuality}`)
  }

  /**
   * Quick sync for today's fixtures only
   */
  async syncTodayFixtures(): Promise<AggregationResult> {
    const result: AggregationResult = {
      success: false,
      matchesSynced: 0,
      teamsSynced: 0,
      standingsSynced: 0,
      dataQuality: { high: 0, medium: 0, low: 0 },
      sources: {
        primary: 'football-data.org',
        secondary: ['api-football'],
        verification: ['fotmob', 'sofascore']
      },
      errors: []
    }

    try {
      console.log('[DataAggregator] Syncing today\'s fixtures...')

      // Get today's date
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

      // Check if we already have today's data
      const { count } = await supabase
        .from('fd_matches')
        .select('id', { count: 'exact', head: true })
        .in('status', ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'])
        .gte('utc_date', today.toISOString())
        .lt('utc_date', tomorrow.toISOString())

      if (count && count > 0) {
        console.log(`[DataAggregator] Already have ${count} matches for today, skipping sync`)
        result.success = true
        result.matchesSynced = count
        return result
      }

      // If no data, do today-only sync
      return await this.aggregateData(2025, true)
    } catch (error: any) {
      console.error('[DataAggregator] Today\'s fixtures sync failed:', error)
      result.errors.push(error.message)
      return result
    }
  }
}

// Singleton instance
let dataAggregatorInstance: DataAggregator | null = null

export function getDataAggregator(config?: AggregationConfig): DataAggregator {
  if (!dataAggregatorInstance) {
    dataAggregatorInstance = new DataAggregator(config)
  }
  return dataAggregatorInstance
}