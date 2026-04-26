import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface PredictionResult {
  matchId: number
  avgHomeGoals: number
  avgAwayGoals: number
  h2hAvgGoals: number
  over25Prob: number
  under25Prob: number
  predictedOver25: boolean
  
  // Stats
  homeCleanSheetPct: number
  homeScoringPct: number
  homeLast3Goals: number
  awayLast3Goals: number
  homeLast3Conceded: number
  awayLast3Conceded: number
}

async function getTeamLastMatches(teamId: number, limit: number = 3) {
  const { data, error } = await supabase
    .from('fd_matches')
    .select('*')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .eq('status', 'FINISHED')
    .order('utc_date', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data
}

async function calculateHomeStats(teamId: number) {
  const { data, error } = await supabase
    .from('fd_matches')
    .select('*')
    .eq('home_team_id', teamId)
    .eq('status', 'FINISHED')
    .limit(20)

  if (error || !data || data.length === 0) return { cleanSheetPct: 0, scoringPct: 0 }
  
  const cleanSheets = data.filter(m => m.score_fulltime_away === 0).length
  const scoringGames = data.filter(m => (m.score_fulltime_home || 0) > 0).length
  
  return {
    cleanSheetPct: (cleanSheets / data.length) * 100,
    scoringPct: (scoringGames / data.length) * 100
  }
}

export async function calculateMatchPredictions(matchId: number): Promise<PredictionResult | null> {
  const { data: match, error: matchError } = await supabase
    .from('fd_matches')
    .select('*, home_team:fd_teams!home_team_id(*), away_team:fd_teams!away_team_id(*)')
    .eq('id', matchId)
    .single()

  if (matchError || !match) return null

  const homeTeamId = match.home_team_id
  const awayTeamId = match.away_team_id
  const competitionId = match.competition_id

  // 1. Get Season Stats
  // 1. Get Season Stats (Most recent)
  const { data: homeStats } = await supabase
    .from('fd_standings')
    .select('*')
    .eq('team_id', homeTeamId)
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  const { data: awayStats } = await supabase
    .from('fd_standings')
    .select('*')
    .eq('team_id', awayTeamId)
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  // Fallback Averages if standings are missing (common in cups/early season)
  const homeAvgGoals = homeStats 
    ? (homeStats.goals_for + homeStats.goals_against) / homeStats.played_games 
    : 2.5 // Baseline fallback
  const awayAvgGoals = awayStats 
    ? (awayStats.goals_for + awayStats.goals_against) / awayStats.played_games 
    : 2.5

  // 2. Get Last 3 Matches Stats
  const homeLast3 = await getTeamLastMatches(homeTeamId, 3)
  const awayLast3 = await getTeamLastMatches(awayTeamId, 3)

  const homeLast3Goals = homeLast3.length > 0 
    ? homeLast3.reduce((acc, m) => acc + (m.home_team_id === homeTeamId ? (m.score_fulltime_home || 0) : (m.score_fulltime_away || 0)), 0) / homeLast3.length * 3
    : 0
  const homeLast3Conceded = homeLast3.length > 0 
    ? homeLast3.reduce((acc, m) => acc + (m.home_team_id === homeTeamId ? (m.score_fulltime_away || 0) : (m.score_fulltime_home || 0)), 0) / homeLast3.length * 3
    : 0
  
  const awayLast3Goals = awayLast3.length > 0 
    ? awayLast3.reduce((acc, m) => acc + (m.home_team_id === awayTeamId ? (m.score_fulltime_home || 0) : (m.score_fulltime_away || 0)), 0) / awayLast3.length * 3
    : 0
  const awayLast3Conceded = awayLast3.length > 0 
    ? awayLast3.reduce((acc, m) => acc + (m.home_team_id === awayTeamId ? (m.score_fulltime_away || 0) : (m.score_fulltime_home || 0)), 0) / awayLast3.length * 3
    : 0

  // 3. Home Stats (Clean Sheet & Scoring)
  const homePerformance = await calculateHomeStats(homeTeamId)

  // 4. H2H Avg
  const { data: h2hMatches } = await supabase
    .from('fd_matches')
    .select('*')
    .or(`and(home_team_id.eq.${homeTeamId},away_team_id.eq.${awayTeamId}),and(home_team_id.eq.${awayTeamId},away_team_id.eq.${homeTeamId})`)
    .eq('status', 'FINISHED')
    .limit(5)

  let h2hAvg = (homeAvgGoals + awayAvgGoals) / 2
  if (h2hMatches && h2hMatches.length > 0) {
    h2hAvg = h2hMatches.reduce((acc, m) => acc + (m.score_fulltime_home || 0) + (m.score_fulltime_away || 0), 0) / h2hMatches.length
  }

  // --- CALCULATION LOGIC ---

  // Base Logic (Poisson-like expected goals)
  // If we have standings, use them. If not, use fallback.
  const hGF = homeStats ? (homeStats.goals_for / homeStats.played_games) : (homeLast3Goals / 3)
  const hGA = homeStats ? (homeStats.goals_against / homeStats.played_games) : (homeLast3Conceded / 3)
  const aGF = awayStats ? (awayStats.goals_for / awayStats.played_games) : (awayLast3Goals / 3)
  const aGA = awayStats ? (awayStats.goals_against / awayStats.played_games) : (awayLast3Conceded / 3)

  const expectedGoals = (hGF + aGA + aGF + hGA) / 2
  const weightedAvg = (expectedGoals * 0.7) + (h2hAvg * 0.3)
  
  let over25Base = (weightedAvg / 4.5) * 100
  let under25Base = 100 - over25Base

  // Bonus Points for Over 2.5 (User Criteria)
  let over25Bonus = 0
  if (homeLast3Goals >= 2 && awayLast3Goals >= 2) over25Bonus += 25
  if (homeLast3Conceded >= 1 && awayLast3Conceded >= 1) over25Bonus += 15
  if (homePerformance.scoringPct >= 70) over25Bonus += 20
  
  // Bonus Points for Under 2.5
  let under25Bonus = 0
  if (homeLast3Goals < 2 && awayLast3Goals < 2) under25Bonus += 25
  if (homeLast3Conceded <= 1 && awayLast3Conceded <= 1) under25Bonus += 20
  if (homePerformance.cleanSheetPct >= 70) under25Bonus += 15
  
  let over25Final = over25Base + over25Bonus
  let under25Final = under25Base + under25Bonus
  
  // Normalize and Cap at 0-100
  const total = over25Final + under25Final
  over25Final = Math.min(Math.max((over25Final / total) * 100, 5), 95)
  under25Final = 100 - over25Final

  return {
    matchId,
    avgHomeGoals: homeAvgGoals,
    avgAwayGoals: awayAvgGoals,
    h2hAvgGoals: h2hAvg,
    over25Prob: Math.round(over25Final),
    under25Prob: Math.round(under25Final),
    predictedOver25: over25Final > under25Final,
    homeCleanSheetPct: homePerformance.cleanSheetPct,
    homeScoringPct: homePerformance.scoringPct,
    homeLast3Goals,
    awayLast3Goals,
    homeLast3Conceded,
    awayLast3Conceded
  }
}

export async function processAllUpcomingPredictions() {
  console.log('[ALGO] Processing Over/Under 2.5 predictions...')
  
  const { data: upcomingMatches } = await supabase
    .from('fd_matches')
    .select('id')
    .in('status', ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED', 'FINISHED', 'AWARDED'])
    // Look at matches from the last 24 hours to ensure today's matches are captured
    .gte('utc_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('utc_date', { ascending: true })

  if (!upcomingMatches) return

  for (const m of upcomingMatches) {
    const result = await calculateMatchPredictions(m.id)
    if (result) {
      await supabase.from('fd_predictions').upsert({
        match_id: result.matchId,
        avg_home_goals: result.avgHomeGoals,
        avg_away_goals: result.avgAwayGoals,
        h2h_avg_goals: result.h2hAvgGoals,
        over_2_5_prob: result.over25Prob,
        under_2_5_prob: result.under25Prob,
        predicted_over_2_5: result.predictedOver25,
        home_clean_sheet_pct: result.homeCleanSheetPct,
        home_scoring_pct: result.homeScoringPct,
        home_last_3_goals: result.homeLast3Goals,
        away_last_3_goals: result.awayLast3Goals,
        home_last_3_conceded: result.homeLast3Conceded,
        away_last_3_conceded: result.awayLast3Conceded
      }, { onConflict: 'match_id' })
    }
  }
}
