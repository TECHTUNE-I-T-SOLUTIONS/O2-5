import { createClient } from '@supabase/supabase-js'
import { 
  fetchCompetitions, 
  fetchCompetitionMatches, 
  fetchTeams, 
  fetchCompetitionStandings,
  FdMatch
} from '../lib/football-data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Free Tier competition codes for football-data.org
const TIER_1_COMPETITIONS = ['PL', 'ELC', 'BL1', 'SA', 'PD', 'FL1', 'DED', 'PPL', 'CL', 'WC']

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function syncCompetitions() {
  console.log('[SYNC] Fetching competitions from Football-Data.org...')
  const competitions = await fetchCompetitions()
  
  const filtered = competitions.filter((c: any) => TIER_1_COMPETITIONS.includes(c.code))
  
  console.log(`[SYNC] Syncing ${filtered.length} Tier 1 competitions...`)
  
  const records = filtered.map((c: any) => ({
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

  const { error } = await supabase.from('fd_competitions').upsert(records, { onConflict: 'id' })
  if (error) throw error
  
  return filtered
}

async function syncMatches(competition: any) {
  console.log(`[SYNC] Fetching matches for ${competition.code}...`)
  const matches = await fetchCompetitionMatches(competition.code)
  
  console.log(`[SYNC] Found ${matches.length} matches for ${competition.code}`)
  
  const teamRecords: any[] = []
  const matchRecords = matches.map((m: FdMatch) => {
    // Collect team info for upserting into fd_teams
    if (m.homeTeam && m.homeTeam.id) {
      teamRecords.push({
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        short_name: m.homeTeam.shortName,
        tla: m.homeTeam.tla,
        crest: m.homeTeam.crest,
        last_updated: m.lastUpdated
      })
    }
    if (m.awayTeam && m.awayTeam.id) {
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
      competition_id: competition.id,
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
      winner: m.score.winner,
      last_updated: m.lastUpdated
    }
  })

  // Upsert teams first (unique by ID)
  if (teamRecords.length > 0) {
    const uniqueTeams = Array.from(new Map(teamRecords.map(item => [item.id, item])).values())
    const { error: teamError } = await supabase.from('fd_teams').upsert(uniqueTeams, { onConflict: 'id' })
    if (teamError) throw teamError
  }

  // Upsert matches
  if (matchRecords.length > 0) {
    const { error: matchError } = await supabase.from('fd_matches').upsert(matchRecords, { onConflict: 'id' })
    if (matchError) throw matchError
  }
  
  return matches.length
}

async function syncStandings(competition: any) {
  console.log(`[SYNC] Fetching standings for ${competition.code}...`)
  const standingsData = await fetchCompetitionStandings(competition.code)
  
  // The API returns { competition: ..., season: ..., standings: [...] }
  // Our fetchCompetitionStandings helper currently returns data.standings
  // Wait, I'll update the helper to return the whole object or handle it here
  
  const standings = standingsData // This is the array of standing types (TOTAL, HOME, AWAY)
  const records: any[] = []
  
  const seasonYear = new Date(competition.last_updated).getFullYear() // Fallback season year

  for (const table of standings) {
    if (!table.table) continue
    
    for (const row of table.table) {
      records.push({
        competition_id: competition.id,
        season_year: seasonYear,
        type: table.type,
        stage: table.stage || 'REGULAR_SEASON',
        group_name: table.group,
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

  if (records.length > 0) {
    const { error } = await supabase.from('fd_standings').upsert(records, { onConflict: 'competition_id,season_year,team_id,type' })
    if (error) throw error
  }
  
  return records.length
}

async function runSync() {
  try {
    console.log('--- STARTING FOOTBALL-DATA.ORG SYNC ---')
    
    const competitions = await syncCompetitions()
    
    for (const comp of competitions) {
      try {
        await syncMatches(comp)
        await delay(6000) // 10 requests per minute limit on Free tier
        
        await syncStandings(comp)
        await delay(6000)
      } catch (err) {
        console.error(`[ERROR] Failed to sync ${comp.code}:`, err)
        await delay(6000) // Still wait before next competition
      }
    }
    
    console.log('--- SYNC COMPLETED SUCCESSFULLY ---')
  } catch (error) {
    console.error('--- SYNC FAILED ---', error)
  }
}

runSync()
