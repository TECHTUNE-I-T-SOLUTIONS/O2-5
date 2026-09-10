import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  fetchCompetitions, 
  fetchCompetitionMatches, 
  fetchCompetitionStandings,
  FdMatch
} from '@/lib/football-data'
import { 
  fetchTodayFixtures, 
  fetchCurrentLeagues,
  fetchLeagueStandings,
  ApiFixture 
} from '@/lib/api-football'
import { processAllUpcomingPredictions } from '@/lib/over25-algorithm'
import { processAllWinDrawPredictions } from '@/lib/win-draw-algorithm-enhanced'
import { processAllGGPredictions } from '@/lib/gg-algorithm-enhanced'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const TIER_1_COMPETITIONS = ['PL', 'ELC', 'BL1', 'SA', 'PD', 'FL1', 'DED', 'PPL', 'CL', 'WC']

// Strict delay to respect 10 calls/minute (60s / 10 = 6s per call)
// We use 7 seconds for safety.
async function apiDelay() {
  console.log('[SYNC] Waiting 7 seconds to respect rate limits...')
  return new Promise(resolve => setTimeout(resolve, 7000))
}

export async function POST() {
  try {
    console.log('--- STARTING FOOTBALL DATA SYNC VIA API ---')
    
    // Get current date in Nigerian time (UTC+1)
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const nigeriaTime = new Date(utc + (3600000 * 1))
    const today = new Date(nigeriaTime)
    today.setUTCHours(0, 0, 0, 0)
    const todayDate = today.toISOString().split('T')[0]
    
    // Get end of today (midnight tomorrow)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    
    // Check sync status for today
    const { data: syncStatus } = await supabase
      .from('fd_sync_status')
      .select('*')
      .eq('sync_date', todayDate)
      .single()
    
    if (syncStatus) {
      const completedTypes = syncStatus.prediction_types_generated || []
      console.log(`[SYNC] Today's sync already completed. Generated types: ${completedTypes.join(', ')}`)
      
      // If all types are already generated, return early
      const allTypes = ['OVER_2_5', 'WIN_DRAW', 'GG']
      const isComplete = allTypes.every(type => completedTypes.includes(type))
      
      if (isComplete) {
        return NextResponse.json({ 
          success: true, 
          message: 'All predictions already generated for today',
          alreadyComplete: true,
          syncStatus
        })
      }
    }
    
    const { count: matchCount } = await supabase
      .from('fd_matches')
      .select('id', { count: 'exact', head: true })
      .in('status', ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'])
      .gte('utc_date', today.toISOString())
      .lt('utc_date', tomorrow.toISOString())
    
    const hasTodayData = matchCount > 0
    
    if (hasTodayData) {
      console.log(`[SYNC] Found ${matchCount} existing matches for today, skipping data sync`)
    } else {
      console.log('[SYNC] No existing data for today, starting data sync...')
    }
    
    let useFallback = false
    let footballDataSuccess = false
    let syncMessage = ''

    // Only sync data if we don't have today's data
    if (!hasTodayData) {
      // Try Football-Data.org first
      try {
        // 1. Sync Competitions
        const competitionsData = await fetchCompetitions()
        await apiDelay() // Delay after first call

        const filtered = competitionsData.filter((c: any) => TIER_1_COMPETITIONS.includes(c.code))
        
        const compRecords = filtered.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          type: c.type,
          emblem: c.emblem,
          plan: c.plan,
          area_name: c.area.name,
          area_code: c.area.code,
          area_flag: c.area.flag,
          last_updated: c.lastUpdated
        }))

        await supabase.from('fd_competitions').upsert(compRecords, { onConflict: 'id' })

        // 2. Sync Matches and Standings for all Tier 1 competitions
        for (const comp of filtered) {
          try {
            console.log(`[SYNC] Fetching matches for ${comp.name}...`)
            
            // CALL 1: Matches
            const matches = await fetchCompetitionMatches(comp.code)
            const teamRecords: any[] = []
            const matchRecords = matches.map((m: FdMatch) => {
              if (m.homeTeam?.id) {
                teamRecords.push({
                  id: m.homeTeam.id,
                  name: m.homeTeam.name,
                  short_name: m.homeTeam.shortName,
                  tla: m.homeTeam.tla,
                  crest: m.homeTeam.crest,
                  last_updated: m.lastUpdated
                })
              }
              if (m.awayTeam?.id) {
                teamRecords.push({
                  id: m.awayTeam.id,
                  name: m.awayTeam.name,
                  short_name: m.awayTeam.shortName,
                  tla: m.awayTeam.tla,
                  crest: m.awayTeam.crest,
                  last_updated: m.lastUpdated
                })
              }
              return {
                id: m.id,
                competition_id: comp.id,
                season_year: new Date(m.season.startDate).getFullYear(),
                utc_date: m.utcDate,
                status: m.status,
                matchday: m.matchday,
                stage: m.stage,
                group_name: m.group,
                home_team_id: m.homeTeam.id,
                away_team_id: m.awayTeam.id,
                score_fulltime_home: m.score.fullTime.home,
                score_fulltime_away: m.score.fullTime.away,
                score_halftime_home: m.score.halfTime.home,
                score_halftime_away: m.score.halfTime.away,
                score_extratime_home: m.score.extraTime?.home,
                score_extratime_away: m.score.extraTime?.away,
                score_penalties_home: m.score.penalties?.home,
                score_penalties_away: m.score.penalties?.away,
                winner: m.score.winner,
                last_updated: m.lastUpdated
              }
            })

            const uniqueTeams = Array.from(new Map(teamRecords.map(item => [item.id, item])).values())
            await supabase.from('fd_teams').upsert(uniqueTeams, { onConflict: 'id' })
            await supabase.from('fd_matches').upsert(matchRecords, { onConflict: 'id' })

            await apiDelay() // Delay after match fetch

            // CALL 2: Standings
            console.log(`[SYNC] Fetching standings for ${comp.name}...`)
            try {
              const standings = await fetchCompetitionStandings(comp.code)
              const standingRecords: any[] = []
              for (const table of standings) {
                if (!table.table) continue
                for (const row of table.table) {
                  standingRecords.push({
                    competition_id: comp.id,
                    season_year: new Date(comp.last_updated).getFullYear(),
                    type: table.type,
                    team_id: row.team.id,
                    position: row.position,
                    played_games: row.playedGames,
                    won: row.won,
                    draw: row.draw,
                    lost: row.lost,
                    points: row.points,
                    goals_for: row.goalsFor,
                    goals_against: row.goalsAgainst,
                    goals_difference: row.goalsDifference
                  })
                }
              }
              if (standingRecords.length > 0) {
                await supabase.from('fd_standings').upsert(standingRecords, { onConflict: 'competition_id,season_year,team_id,type' })
              }
            } catch (standingsError: any) {
              console.warn(`[SYNC] Failed to fetch standings for ${comp.name}:`, standingsError.message)
              // Continue even if standings fail
            }
            
            await apiDelay() // Delay after standings fetch
            footballDataSuccess = true
          } catch (compError: any) {
            console.warn(`[SYNC] Failed to sync ${comp.name}:`, compError.message)
            // Continue with other competitions
          }
        }

        if (footballDataSuccess) {
          console.log('[SYNC] Football-Data.org sync completed successfully')
          syncMessage = 'Football-Data.org sync completed'
        }
      } catch (error: any) {
        console.warn('[SYNC] Football-Data.org failed, falling back to API-Football:', error.message)
        useFallback = true
      }

      // Use API-Football fallback if Football-Data failed or had no success
      if (useFallback || !footballDataSuccess) {
        console.log('[SYNC] Starting API-Football fallback sync...')

        try {
          // Fallback: Use API-Football for today's fixtures
          const todayFixtures = await fetchTodayFixtures()
          console.log(`[SYNC] Fetched ${todayFixtures.length} fixtures from API-Football`)

          // Map API-Football data to fd_matches structure
          const matchRecords = todayFixtures.map((f: ApiFixture) => ({
            id: f.fixture.id,
            competition_id: f.league.id,
            season_year: f.league.season,
            utc_date: f.fixture.date,
            status: f.fixture.status.short,
            home_team_id: f.teams.home.id,
            away_team_id: f.teams.away.id,
            score_fulltime_home: f.score.fulltime.home,
            score_fulltime_away: f.score.fulltime.away,
            score_halftime_home: f.score.halftime.home,
            score_halftime_away: f.score.halftime.away,
            score_extratime_home: f.score.extratime.home,
            score_extratime_away: f.score.extratime.away,
            score_penalties_home: f.score.penalty.home,
            score_penalties_away: f.score.penalty.away,
            winner: f.teams.home.winner ? 'HOME_TEAM' : f.teams.away.winner ? 'AWAY_TEAM' : null,
            last_updated: new Date().toISOString()
          }))

          // Upsert teams
          const teamRecords: any[] = []
          for (const f of todayFixtures) {
            teamRecords.push({
              id: f.teams.home.id,
              name: f.teams.home.name,
              crest: f.teams.home.logo,
              last_updated: new Date().toISOString()
            })
            teamRecords.push({
              id: f.teams.away.id,
              name: f.teams.away.name,
              crest: f.teams.away.logo,
              last_updated: new Date().toISOString()
            })
          }
          const uniqueTeams = Array.from(new Map(teamRecords.map(item => [item.id, item])).values())
          await supabase.from('fd_teams').upsert(uniqueTeams, { onConflict: 'id' })

          // Upsert matches
          await supabase.from('fd_matches').upsert(matchRecords, { onConflict: 'id' })

          // Try to fetch standings for leagues in today's fixtures
          const leagueIds = [...new Set(todayFixtures.map(f => f.league.id))]
          for (const leagueId of leagueIds) {
            try {
              const season = todayFixtures.find(f => f.league.id === leagueId)?.league.season
              if (!season) continue

              const standings = await fetchLeagueStandings(leagueId, season)
              const standingRecords: any[] = []
              
              if (standings.league.standings) {
                for (const table of standings.league.standings) {
                  standingRecords.push({
                    competition_id: leagueId,
                    season_year: season,
                    type: 'TOTAL',
                    team_id: table.team.id,
                    position: table.rank,
                    played_games: table.all.played,
                    won: table.all.win,
                    draw: table.all.draw,
                    lost: table.all.lose,
                    points: table.points,
                    goals_for: table.all.goals.for,
                    goals_against: table.all.goals.against,
                    goals_difference: table.goalsDiff
                  })
                }
              }
              
              if (standingRecords.length > 0) {
                await supabase.from('fd_standings').upsert(standingRecords, { onConflict: 'competition_id,season_year,team_id,type' })
              }
            } catch (standingsError) {
              console.warn(`[SYNC] Failed to fetch standings for league ${leagueId}:`, standingsError)
            }
          }

          console.log('[SYNC] API-Football fallback sync completed')
          syncMessage = 'API-Football fallback sync completed'
          useFallback = true
        } catch (fallbackError: any) {
          console.error('[SYNC] API-Football fallback also failed:', fallbackError.message)
          syncMessage = 'Data sync failed, attempting predictions with existing data'
          // Continue to predictions anyway
        }
      }
    } else {
      syncMessage = 'Using existing synced data'
    }

    // 3. Run All Prediction Algorithms (only if data sync succeeded or we have existing data)
    console.log('[ALGO] Starting probability engines...')
    
    let predictionResults = { over25: 0, winDraw: 0, gg: 0, over25Failed: 0, winDrawFailed: 0, ggFailed: 0 }
    
    try {
      // Over 2.5 / Under 2.5 predictions
      console.log('[ALGO] Running Over/Under 2.5 predictions...')
      await processAllUpcomingPredictions()
      predictionResults.over25 = 1
    } catch (error: any) {
      console.error('[ALGO] Over/Under 2.5 predictions failed:', error.message)
      predictionResults.over25Failed = 1
    }
    
    try {
      // Win/Draw predictions
      console.log('[ALGO] Running Win/Draw predictions...')
      await processAllWinDrawPredictions()
      predictionResults.winDraw = 1
    } catch (error: any) {
      console.error('[ALGO] Win/Draw predictions failed:', error.message)
      predictionResults.winDrawFailed = 1
    }
    
    try {
      // GG (Both Teams to Score) predictions
      console.log('[ALGO] Running GG predictions...')
      await processAllGGPredictions()
      predictionResults.gg = 1
    } catch (error: any) {
      console.error('[ALGO] GG predictions failed:', error.message)
      predictionResults.ggFailed = 1
    }

    console.log('[SYNC] Summary:')
    console.log(`- ${syncMessage}`)
    console.log(`- Predictions: Over 2.5 (${predictionResults.over25 ? '✓' : '✗'}), Win/Draw (${predictionResults.winDraw ? '✓' : '✗'}), GG (${predictionResults.gg ? '✓' : '✗'})`)

    const successfulPredictions = predictionResults.over25 + predictionResults.winDraw + predictionResults.gg
    const totalPredictions = 3

    // Update sync status
    const completedTypes = []
    if (predictionResults.over25) completedTypes.push('OVER_2_5')
    if (predictionResults.winDraw) completedTypes.push('WIN_DRAW')
    if (predictionResults.gg) completedTypes.push('GG')

    if (syncStatus) {
      // Update existing sync status
      await supabase
        .from('fd_sync_status')
        .update({
          prediction_types_generated: [...(syncStatus.prediction_types_generated || []), ...completedTypes],
          matches_synced: matchCount || 0
        })
        .eq('sync_date', todayDate)
    } else {
      // Create new sync status
      await supabase
        .from('fd_sync_status')
        .insert({
          sync_date: todayDate,
          prediction_types_generated: completedTypes,
          matches_synced: matchCount || 0
        })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${syncMessage}. ${successfulPredictions}/${totalPredictions} prediction types completed.`,
      usedFallback: useFallback,
      predictions: predictionResults,
      successRate: `${successfulPredictions}/${totalPredictions}`,
      alreadyComplete: false
    })
  } catch (error: any) {
    console.error('API Sync Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
