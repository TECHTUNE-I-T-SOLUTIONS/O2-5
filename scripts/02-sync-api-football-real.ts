import { createClient } from '@supabase/supabase-js'
import { 
  fetchUpcomingFixtures, 
  fetchFinishedFixtures, 
  fetchLeagues, 
  fetchCurrentLeagues,
  fetchTeams, 
  fetchLeagueStandings, 
  getApiStatus, 
  fetchOdds 
} from '../lib/api-football'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const apiKey = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Configurable delay based on API plan
let DELAY_MS = 1000 
const POPULAR_LEAGUE_IDS = [39, 40, 78, 140, 135, 61, 203]

interface SyncResult {
  endpoint: string
  recordsSync: number
  status: string
  timestamp: string
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function syncLeagues(): Promise<SyncResult> {
  try {
    console.log('[SYNC] Fetching all leagues from API-SPORTS...')
    const leagues = await fetchLeagues()
    
    // Also fetch current leagues to mark them
    console.log('[SYNC] Fetching current active leagues...')
    const currentLeagues = await fetchCurrentLeagues()
    const currentIds = new Set(currentLeagues.map(l => l.league.id))

    console.log(`[SYNC] Found ${leagues.length} total leagues, inserting into database...`)

    const leagueRecords = leagues.map((l: any) => ({
      id: l.league.id,
      name: l.league.name,
      country: l.country?.name || l.league.country,
      flag: l.country?.flag,
      logo: l.league.logo,
      type: l.league.type,
      is_current: currentIds.has(l.league.id)
    }))

    const { error: leagueError } = await supabase
      .from('leagues')
      .upsert(leagueRecords, { onConflict: 'id' })

    if (leagueError) throw leagueError

    return {
      endpoint: 'leagues',
      recordsSync: leagues.length,
      status: 'success',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[ERROR] Failed to sync leagues:', error)
    return { endpoint: 'leagues', recordsSync: 0, status: 'error', timestamp: new Date().toISOString() }
  }
}

async function syncFixtures(): Promise<SyncResult> {
  try {
    console.log('[SYNC] Fetching upcoming fixtures for active leagues...')
    
    // Get currently active leagues from our database
    const { data: activeLeagues } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('is_current', true)
    
    if (!activeLeagues) throw new Error('No active leagues found in database')

    const leaguesToSync = activeLeagues.filter(l => POPULAR_LEAGUE_IDS.includes(Number(l.id)) || Math.random() < 0.05) // All popular + some random ones
    
    console.log(`[SYNC] Syncing fixtures for ${leaguesToSync.length} active leagues...`)

    const currentYear = new Date().getFullYear()
    const seasonsToTry = [currentYear, currentYear - 1, 2024]
    
    let totalSynced = 0

    for (const league of leaguesToSync) {
      const leagueId = Number(league.id)
      for (const season of seasonsToTry) {
        try {
          console.log(`[SYNC] Fetching fixtures for ${league.name} (${leagueId}) season ${season}...`)
          const fixtures = await fetchUpcomingFixtures(leagueId, season, 30)

          if (fixtures && fixtures.length > 0) {
            const fixtureRecords = fixtures.map((f: any) => ({
              id: f.fixture.id,
              league_id: f.league.id,
              season: f.league.season,
              fixture_date: f.fixture.date,
              round: f.league.round,
              status: f.fixture.status.long,
              status_short: f.fixture.status.short,
              status_elapsed: f.fixture.status.elapsed,
              home_team_id: f.teams.home.id,
              away_team_id: f.teams.away.id,
              home_goals: f.goals.home,
              away_goals: f.goals.away,
              home_goals_halftime: f.score.halftime.home,
              away_goals_halftime: f.score.halftime.away,
              home_goals_extra: f.score.extratime.home,
              away_goals_extra: f.score.extratime.away,
              home_goals_penalty: f.score.penalty.home,
              away_goals_penalty: f.score.penalty.away,
              venue_id: f.fixture.venue.id,
              venue_name: f.fixture.venue.name,
              venue_city: f.fixture.venue.city,
              referee: f.fixture.referee,
              extra_time: f.fixture.status.extra,
            }))

            const { error } = await supabase.from('fixtures').upsert(fixtureRecords, { onConflict: 'id' })
            if (!error) totalSynced += fixtures.length
            break 
          }
        } catch (err: any) {
           if (err.message.includes('Plan Restricted')) continue
           if (err.message.includes('Rate Limit')) await delay(DELAY_MS * 2)
        }
        await delay(DELAY_MS)
      }
    }

    return { endpoint: 'fixtures', recordsSync: totalSynced, status: 'success', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('[ERROR] Failed to sync fixtures:', error)
    return { endpoint: 'fixtures', recordsSync: 0, status: 'error', timestamp: new Date().toISOString() }
  }
}

async function syncResults(): Promise<SyncResult> {
  try {
    console.log('[SYNC] Fetching recently finished matches for active leagues...')
    const { data: activeLeagues } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('is_current', true)
    
    if (!activeLeagues) throw new Error('No active leagues found in database')
    
    const leaguesToSync = activeLeagues.filter(l => POPULAR_LEAGUE_IDS.includes(Number(l.id)) || Math.random() < 0.05)

    const currentYear = new Date().getFullYear()
    const seasonsToTry = [currentYear, currentYear - 1, 2024]
    
    let totalSynced = 0

    for (const league of leaguesToSync) {
      const leagueId = Number(league.id)
      for (const season of seasonsToTry) {
        try {
          console.log(`[SYNC] Fetching results for ${league.name} (${leagueId}) season ${season}...`)
          const fixtures = await fetchFinishedFixtures(leagueId, season, 7)

          if (fixtures && fixtures.length > 0) {
            const fixtureRecords = fixtures.map((f: any) => ({
              id: f.fixture.id,
              league_id: f.league.id,
              season: f.league.season,
              fixture_date: f.fixture.date,
              round: f.league.round,
              status: f.fixture.status.long,
              status_short: f.fixture.status.short,
              status_elapsed: f.fixture.status.elapsed,
              home_team_id: f.teams.home.id,
              away_team_id: f.teams.away.id,
              home_goals: f.goals.home,
              away_goals: f.goals.away,
              home_goals_halftime: f.score.halftime.home,
              away_goals_halftime: f.score.halftime.away,
              home_goals_extra: f.score.extratime.home,
              away_goals_extra: f.score.extratime.away,
              home_goals_penalty: f.score.penalty.home,
              away_goals_penalty: f.score.penalty.away,
              venue_id: f.fixture.venue.id,
              venue_name: f.fixture.venue.name,
              venue_city: f.fixture.venue.city,
              referee: f.fixture.referee,
              extra_time: f.fixture.status.extra,
            }))

            const { error } = await supabase.from('fixtures').upsert(fixtureRecords, { onConflict: 'id' })
            if (!error) totalSynced += fixtures.length
            break 
          }
        } catch (err: any) {
           if (err.message.includes('Plan Restricted')) continue
        }
        await delay(DELAY_MS)
      }
    }

    return { endpoint: 'results', recordsSync: totalSynced, status: 'success', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('[ERROR] Failed to sync results:', error)
    return { endpoint: 'results', recordsSync: 0, status: 'error', timestamp: new Date().toISOString() }
  }
}

async function syncTeams(): Promise<SyncResult> {
  try {
    console.log('[SYNC] Fetching teams from API-SPORTS...')
    const currentYear = new Date().getFullYear()
    const seasonsToTry = [currentYear, currentYear - 1, 2024]
    
    let totalSynced = 0

    for (const leagueId of POPULAR_LEAGUE_IDS) {
      for (const season of seasonsToTry) {
        try {
          console.log(`[SYNC] Fetching teams for league ${leagueId} season ${season}...`)
          const teams = await fetchTeams(leagueId, season)
          if (teams && teams.length > 0) {
            console.log(`[SYNC] Found ${teams.length} teams for league ${leagueId} (${season})`)
            
            const teamRecords = teams.map((t: any) => ({
              id: t.team.id,
              name: t.team.name,
              code: t.team.code,
              country: t.team.country,
              founded: t.team.founded,
              national: t.team.national,
              logo: t.team.logo,
              venue_id: t.venue?.id,
              venue_name: t.venue?.name,
              venue_city: t.venue?.city,
              venue_capacity: t.venue?.capacity,
            }))

            const { error } = await supabase.from('teams').upsert(teamRecords, { onConflict: 'id' })
            if (!error) totalSynced += teams.length
            break
          }
        } catch (err: any) {
           if (err.message.includes('Plan Restricted')) continue
        }
        await delay(DELAY_MS)
      }
    }

    return { endpoint: 'teams', recordsSync: totalSynced, status: 'success', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('[ERROR] Failed to sync teams:', error)
    return { endpoint: 'teams', recordsSync: 0, status: 'error', timestamp: new Date().toISOString() }
  }
}

async function syncStandings(): Promise<SyncResult> {
  try {
    console.log('[SYNC] Fetching standings from API-SPORTS...')
    const currentYear = new Date().getFullYear()
    const seasonsToTry = [currentYear, currentYear - 1, 2024]
    let totalSynced = 0

    for (const leagueId of POPULAR_LEAGUE_IDS) {
      for (const season of seasonsToTry) {
        try {
          console.log(`[SYNC] Fetching standings for league ${leagueId} season ${season}...`)
          const standings = await fetchLeagueStandings(leagueId, season)

          if (standings && standings[0] && standings[0].league && standings[0].league.standings) {
            const leagueStandings = standings[0].league.standings
            const flattened = []
            for (const group of leagueStandings) {
              for (const standing of group) {
                flattened.push({
                  league_id: leagueId,
                  season,
                  team_id: standing.team.id,
                  rank: standing.rank,
                  group_name: standing.group || null,
                  played: standing.all.played,
                  win: standing.all.win,
                  draw: standing.all.draw,
                  lose: standing.all.lose,
                  goals_for: standing.all.goals.for,
                  goals_against: standing.all.goals.against,
                  goals_diff: standing.goalsDiff,
                  points: standing.points,
                })
              }
            }
            
            const { error } = await supabase.from('standings').upsert(flattened, { onConflict: 'league_id,season,team_id' })
            if (!error) totalSynced += flattened.length
            break
          }
        } catch (err: any) {
           if (err.message.includes('Plan Restricted')) continue
        }
        await delay(DELAY_MS)
      }
    }

    return { endpoint: 'standings', recordsSync: totalSynced, status: 'success', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('[ERROR] Failed to sync standings:', error)
    return { endpoint: 'standings', recordsSync: 0, status: 'error', timestamp: new Date().toISOString() }
  }
}

async function syncOdds(): Promise<SyncResult> {
  try {
    console.log('[SYNC] Fetching odds for upcoming matches...')
    const { data: fixtures, error } = await supabase
      .from('fixtures')
      .select('id')
      .eq('status_short', 'NS')
      .gte('fixture_date', new Date().toISOString())
    
    if (error) throw error
    
    let oddsCount = 0
    if (fixtures && fixtures.length > 0) {
      console.log(`[SYNC] Found ${fixtures.length} matches to fetch odds for...`)
      for (const fixture of fixtures) {
        try {
          const oddsData = await fetchOdds(fixture.id)
          if (oddsData && oddsData.bookmakers) {
            const mainBookmaker = oddsData.bookmakers[0]
            const matchWinnerMarket = mainBookmaker.markets.find((m: any) => m.id === 1 || m.name === 'Match Winner')
            
            if (matchWinnerMarket) {
              const homeWin = matchWinnerMarket.values.find((v: any) => v.value === 'Home')
              const draw = matchWinnerMarket.values.find((v: any) => v.value === 'Draw')
              const awayWin = matchWinnerMarket.values.find((v: any) => v.value === 'Away')
              
              if (homeWin && draw && awayWin) {
                await supabase.from('odds').upsert({
                  fixture_id: fixture.id,
                  bookmaker: mainBookmaker.name,
                  home_win_odds: parseFloat(homeWin.odd),
                  draw_odds: parseFloat(draw.odd),
                  away_win_odds: parseFloat(awayWin.odd),
                  updated_at: new Date()
                }, { onConflict: 'fixture_id,bookmaker' })
                oddsCount++
              }
            }
          }
          await delay(DELAY_MS)
        } catch (err: any) {
           if (err.message.includes('Rate Limit')) await delay(DELAY_MS * 2)
        }
      }
    }

    return { endpoint: 'odds', recordsSync: oddsCount, status: 'success', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('[ERROR] Failed to sync odds:', error)
    return { endpoint: 'odds', recordsSync: 0, status: 'error', timestamp: new Date().toISOString() }
  }
}

async function runSync() {
  console.log('\n=================================')
  console.log('   O2-5 API-SPORTS SYNC SCRIPT')
  console.log('=================================\n')

  try {
    const statusData = await getApiStatus()
    console.log(`[INFO] API Plan: ${statusData.subscription.plan}`)
    console.log(`[INFO] Daily Requests: ${statusData.requests.current} / ${statusData.requests.limit_day}`)
    
    if (statusData.subscription.plan === 'Free') {
      console.log('[INFO] Free plan detected. Using 7.5s delay and retries.')
      DELAY_MS = 7500
    }

    const results: SyncResult[] = []

    results.push(await syncLeagues())
    await delay(DELAY_MS)

    results.push(await syncTeams())
    await delay(DELAY_MS)

    results.push(await syncFixtures())
    await delay(DELAY_MS)

    results.push(await syncResults())
    await delay(DELAY_MS)

    results.push(await syncStandings())
    await delay(DELAY_MS)

    results.push(await syncOdds())

    console.log('\n=================================')
    console.log('        SYNC SUMMARY')
    console.log('=================================\n')

    results.forEach(result => {
      console.log(`${result.endpoint.padEnd(10)}: ${result.recordsSync.toString().padStart(5)} records synced [${result.status}]`)
    })

    console.log('\n[SUCCESS] Sync completed successfully!')
  } catch (error) {
    console.error('[CRITICAL ERROR] Sync failed:', error)
    process.exit(1)
  }
}

runSync().catch(error => {
  console.error(error)
  process.exit(1)
})
