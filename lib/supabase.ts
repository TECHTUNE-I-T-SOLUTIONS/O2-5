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
  // Get today's date at midnight UTC to include all matches for the current day
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  
  let query = supabase
    .from('fd_matches')
    .select(`
      *,
      home_team:fd_teams!home_team_id(id, name, crest),
      away_team:fd_teams!away_team_id(id, name, crest),
      competition:fd_competitions!competition_id(id, name, code)
    `)
    .in('status', ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'])
    .gte('utc_date', today.toISOString())
    .order('utc_date', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  
  // If no matches from Football-Data, try to get from API-Football as fallback
  if (!data || data.length === 0) {
    console.log('[SUPABASE] No matches from Football-Data, trying API-Football fallback')
    try {
      const { fetchTodayFixtures } = await import('./api-football')
      const apiFixtures = await fetchTodayFixtures()
      
      // Transform API-Football format to match our interface
      const transformedMatches = apiFixtures.slice(0, limit || 20).map(f => ({
        id: f.fixture.id,
        utc_date: f.fixture.date,
        status: f.fixture.status.short,
        home_team_id: f.teams.home.id,
        away_team_id: f.teams.away.id,
        score_fulltime_home: f.score.fulltime.home,
        score_fulltime_away: f.score.fulltime.away,
        home_team: {
          id: f.teams.home.id,
          name: f.teams.home.name,
          crest: f.teams.home.logo
        },
        away_team: {
          id: f.teams.away.id,
          name: f.teams.away.name,
          crest: f.teams.away.logo
        },
        competition: {
          id: f.league.id,
          name: f.league.name,
          code: f.league.name.substring(0, 3).toUpperCase()
        }
      }))
      
      return transformedMatches
    } catch (apiError) {
      console.warn('[SUPABASE] API-Football fallback failed:', apiError)
      return []
    }
  }
  
  return data
}

export async function getFdPredictions(limit: number = 20, offset: number = 0, predictionType?: string, date?: string) {
  // Get the target date at midnight UTC (convert Nigerian time to UTC)
  const targetDate = date ? new Date(date) : new Date()
  // Convert Nigerian time (UTC+1) to UTC by subtracting 1 hour
  targetDate.setUTCHours(targetDate.getUTCHours() - 1, 0, 0, 0)
  
  // Get the next day for filtering
  const nextDay = new Date(targetDate)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  
  let query = supabase
    .from('fd_predictions')
    .select(`
      id,
      match_id,
      prediction_type,
      avg_home_goals,
      avg_away_goals,
      h2h_avg_goals,
      predicted_over_2_5,
      over_2_5_prob,
      under_2_5_prob,
      predicted_win_draw,
      win_draw_prob,
      predicted_gg,
      gg_prob,
      home_clean_sheet_pct,
      home_scoring_pct,
      home_form_strength,
      away_form_strength,
      defensive_strength,
      league_position_home,
      league_position_away,
      home_record_last_3,
      away_record_last_3,
      criteria_met,
      confidence_score,
      analysis_explanation,
      ai_explanation,
      ai_enhanced_at,
      ai_model_used,
      match:match_id!inner(
        id,
        utc_date,
        status,
        home_team:fd_teams!home_team_id(name, crest),
        away_team:fd_teams!away_team_id(name, crest),
        competition:fd_competitions!competition_id(name)
      )
    `)
    // Filter by date range (target date to next day)
    .gte('match.utc_date', targetDate.toISOString())
    .lt('match.utc_date', nextDay.toISOString())
    .order('utc_date', { foreignTable: 'match', ascending: true })
    .range(offset, offset + limit - 1)

  // Filter by prediction type if specified
  if (predictionType) {
    query = query.eq('prediction_type', predictionType)
  }

  const { data, error } = await query
  if (error) throw error
  
  // Data Normalization: Ensure all numeric fields are actual numbers and serializable
  const mappedData = (data || []).map(pred => {
    // Handle potential array wrapping from Supabase joins
    const matchData = Array.isArray(pred.match) ? pred.match[0] : pred.match
    if (!matchData) return null

    // Determine probability values with multiple fallback strategies
    const over25 = pred.over_2_5_prob ?? (pred as any).probability ?? 0
    const under25 = pred.under_2_5_prob ?? (pred as any).under_probability ?? 0
    const winDraw = pred.win_draw_prob ?? 0
    const gg = pred.gg_prob ?? 0
    
    // Create a clean, plain object for Next.js serialization
    return {
      id: Number(pred.id),
      match_id: Number(pred.match_id),
      prediction_type: pred.prediction_type || 'OVER_2_5',
      over_2_5_prob: Number(over25),
      under_2_5_prob: Number(under25),
      predicted_over_2_5: pred.predicted_over_2_5 !== undefined ? !!pred.predicted_over_2_5 : (Number(over25) > Number(under25)),
      win_draw_prob: Number(winDraw),
      predicted_win_draw: pred.predicted_win_draw || false,
      gg_prob: Number(gg),
      predicted_gg: pred.predicted_gg || false,
      home_clean_sheet_pct: Number(pred.home_clean_sheet_pct ?? 0),
      home_scoring_pct: Number(pred.home_scoring_pct ?? 0),
      home_form_strength: Number(pred.home_form_strength ?? 0),
      away_form_strength: Number(pred.away_form_strength ?? 0),
      defensive_strength: Number(pred.defensive_strength ?? 0),
      league_position_home: Number(pred.league_position_home ?? 0),
      league_position_away: Number(pred.league_position_away ?? 0),
      home_record_last_3: pred.home_record_last_3 || '',
      away_record_last_3: pred.away_record_last_3 || '',
      criteria_met: pred.criteria_met || [],
      confidence_score: Number(pred.confidence_score ?? 0),
      analysis_explanation: pred.analysis_explanation || '',
      ai_explanation: pred.ai_explanation || null,
      ai_enhanced_at: pred.ai_enhanced_at || null,
      ai_model_used: pred.ai_model_used || null,
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

  // Final sanitization to ensure data is perfectly plain for Next.js RSC serialization
  return JSON.parse(JSON.stringify(mappedData))
}
