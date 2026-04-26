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
      id,
      match_id,
      avg_home_goals,
      avg_away_goals,
      h2h_avg_goals,
      predicted_over_2_5,
      over_2_5_prob,
      under_2_5_prob,
      home_clean_sheet_pct,
      home_scoring_pct,
      match:match_id!inner(
        id,
        utc_date,
        status,
        home_team:fd_teams!home_team_id(name, crest),
        away_team:fd_teams!away_team_id(name, crest),
        competition:fd_competitions!competition_id(name)
      )
    `)
    // Filter by date and non-null probabilities
    .gte('match.utc_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .not('over_2_5_prob', 'is', null)
    .order('utc_date', { foreignTable: 'match', ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  
  // Data Normalization: Ensure all numeric fields are actual numbers and serializable
  return (data || []).map(pred => {
    // Handle potential array wrapping from Supabase joins
    const matchData = Array.isArray(pred.match) ? pred.match[0] : pred.match
    if (!matchData) return null

    // Determine probability values with multiple fallback strategies
    const over25 = pred.over_2_5_prob ?? (pred as any).probability ?? 0
    const under25 = pred.under_2_5_prob ?? (pred as any).under_probability ?? 0
    
    // Create a clean, plain object for Next.js serialization
    return {
      id: Number(pred.id),
      match_id: Number(pred.match_id),
      over_2_5_prob: Number(over25),
      under_2_5_prob: Number(under25),
      predicted_over_2_5: pred.predicted_over_2_5 !== undefined ? !!pred.predicted_over_2_5 : (Number(over25) > Number(under25)),
      home_clean_sheet_pct: Number(pred.home_clean_sheet_pct ?? 0),
      home_scoring_pct: Number(pred.home_scoring_pct ?? 0),
      h2h_avg_goals: Number(pred.h2h_avg_goals ?? 0),
      avg_home_goals: Number(pred.avg_home_goals ?? 0),
      avg_away_goals: Number(pred.avg_away_goals ?? 0),
      match: {
        id: Number(matchData.id),
        utc_date: String(matchData.utc_date),
        status: String(matchData.status),
        home_team: {
          name: String(matchData.home_team?.name || 'Unknown'),
          crest: String(matchData.home_team?.crest || '')
        },
        away_team: {
          name: String(matchData.away_team?.name || 'Unknown'),
          crest: String(matchData.away_team?.crest || '')
        },
        competition: {
          name: String(matchData.competition?.name || 'Unknown')
        }
      }
    }
  }).filter(Boolean)
}
