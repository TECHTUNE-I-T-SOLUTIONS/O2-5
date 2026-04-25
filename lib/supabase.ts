import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getFixtures(status?: string, limit?: number) {
  let query = supabase
    .from('fixtures')
    .select(`
      *,
      home_team:home_team_id(id, name, logo),
      away_team:away_team_id(id, name, logo),
      league:league_id(id, name, country)
    `)
    .order('fixture_date', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getFixture(fixtureId: number) {
  const { data, error } = await supabase
    .from('fixtures')
    .select(`
      *,
      home_team:home_team_id(id, name, logo),
      away_team:away_team_id(id, name, logo),
      league:league_id(id, name, country),
      events:fixture_events(*),
      statistics:fixture_statistics(*)
    `)
    .eq('id', fixtureId)
    .single()

  if (error) throw error
  return data
}

export async function getPredictions(userId?: string) {
  let query = supabase
    .from('predictions')
    .select(`
      *,
      fixture:fixture_id(
        id,
        home_goals,
        away_goals,
        status,
        fixture_date,
        home_team:home_team_id(name, logo),
        away_team:away_team_id(name, logo)
      )
    `)
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createPrediction(
  userId: string,
  fixtureId: number,
  predictedResult: string,
  homeScore?: number,
  awayScore?: number,
  confidence: number = 50
) {
  const { data, error } = await supabase
    .from('predictions')
    .insert([
      {
        user_id: userId,
        fixture_id: fixtureId,
        predicted_result: predictedResult,
        home_score: homeScore,
        away_score: awayScore,
        confidence,
        created_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) throw error
  return data?.[0]
}

export async function getLeaderboard(limit = 100) {
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, won, points')
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // Calculate leaderboard from predictions
  if (!data || data.length === 0) return []

  const leaderboard = Object.values(
    data.reduce((acc: any, pred: any) => {
      if (!acc[pred.user_id]) {
        acc[pred.user_id] = {
          userId: pred.user_id,
          wins: 0,
          totalPoints: 0,
          predictions: 0,
        }
      }
      if (pred.won) acc[pred.user_id].wins++
      acc[pred.user_id].totalPoints += pred.points || 0
      acc[pred.user_id].predictions++
      return acc
    }, {})
  ).sort((a: any, b: any) => b.totalPoints - a.totalPoints).slice(0, limit)

  return leaderboard
}

export async function getTeams(leagueId?: number) {
  let query = supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  if (leagueId) {
    query = query.eq('league_id', leagueId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getLeagues() {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function getFdMatches(limit?: number) {
  let query = supabase
    .from('fd_matches')
    .select(`
      *,
      home_team:fd_teams!home_team_id(id, name, crest),
      away_team:fd_teams!away_team_id(id, name, crest),
      competition:fd_competitions!competition_id(id, name, code)
    `)
    .in('status', ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'])
    .gte('utc_date', new Date().toISOString())
    .order('utc_date', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getFdPredictions(limit?: number) {
  let query = supabase
    .from('fd_predictions')
    .select(`
      *,
      match:match_id!inner(
        id,
        utc_date,
        status,
        home_team:fd_teams!home_team_id(name, crest),
        away_team:fd_teams!away_team_id(name, crest),
        competition:fd_competitions!competition_id(name)
      )
    `)
    .gte('match.utc_date', new Date().toISOString())
    .order('over_2_5_prob', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
