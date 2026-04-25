import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  fetchCompetitions, 
  fetchCompetitionMatches, 
  fetchCompetitionStandings,
  FdMatch
} from '@/lib/football-data'
import { processAllUpcomingPredictions } from '@/lib/over25-algorithm'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const TIER_1_COMPETITIONS = ['PL', 'ELC', 'BL1', 'SA', 'PD', 'FL1', 'DED', 'PPL', 'CL', 'WC']

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST() {
  try {
    console.log('--- STARTING FOOTBALL-DATA.ORG SYNC VIA API ---')
    
    // 1. Sync Competitions
    const competitionsData = await fetchCompetitions()
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
    const compsToSync = filtered 
    
    for (const comp of compsToSync) {
      // Matches
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
          winner: m.score.winner,
          last_updated: m.lastUpdated
        }
      })

      const uniqueTeams = Array.from(new Map(teamRecords.map(item => [item.id, item])).values())
      await supabase.from('fd_teams').upsert(uniqueTeams, { onConflict: 'id' })
      await supabase.from('fd_matches').upsert(matchRecords, { onConflict: 'id' })

      // Standings
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
      
      await delay(1000)
    }

    // 3. Run Algorithm
    await processAllUpcomingPredictions()

    return NextResponse.json({ success: true, message: 'Sync and predictions completed for top leagues' })
  } catch (error: any) {
    console.error('API Sync Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
