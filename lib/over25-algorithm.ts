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
  awayCleanSheetPct: number
  awayScoringPct: number
  homeLast3Goals: number
  awayLast3Goals: number
  homeLast3Conceded: number
  awayLast3Conceded: number
  homeAvgGoalsScored: number
  awayAvgGoalsScored: number
  homeAvgGoalsConceded: number
  awayAvgGoalsConceded: number
  
  // Criteria tracking
  criteriaMet: string[]
  confidenceScore: number
  analysisExplanation: string
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

  if (error || !data || data.length === 0) return { cleanSheetPct: 0, scoringPct: 0, avgGoalsConceded: 0, avgGoalsScored: 0 }
  
  const cleanSheets = data.filter(m => m.score_fulltime_away === 0).length
  const scoringGames = data.filter(m => (m.score_fulltime_home || 0) > 0).length
  const totalGoalsScored = data.reduce((acc, m) => acc + (m.score_fulltime_home || 0), 0)
  const totalGoalsConceded = data.reduce((acc, m) => acc + (m.score_fulltime_away || 0), 0)
  
  return {
    cleanSheetPct: (cleanSheets / data.length) * 100,
    scoringPct: (scoringGames / data.length) * 100,
    avgGoalsScored: totalGoalsScored / data.length,
    avgGoalsConceded: totalGoalsConceded / data.length
  }
}

async function calculateAwayStats(teamId: number) {
  const { data, error } = await supabase
    .from('fd_matches')
    .select('*')
    .eq('away_team_id', teamId)
    .eq('status', 'FINISHED')
    .limit(20)

  if (error || !data || data.length === 0) return { cleanSheetPct: 0, scoringPct: 0, avgGoalsConceded: 0, avgGoalsScored: 0 }
  
  const cleanSheets = data.filter(m => m.score_fulltime_home === 0).length
  const scoringGames = data.filter(m => (m.score_fulltime_away || 0) > 0).length
  const totalGoalsScored = data.reduce((acc, m) => acc + (m.score_fulltime_away || 0), 0)
  const totalGoalsConceded = data.reduce((acc, m) => acc + (m.score_fulltime_home || 0), 0)
  
  return {
    cleanSheetPct: (cleanSheets / data.length) * 100,
    scoringPct: (scoringGames / data.length) * 100,
    avgGoalsScored: totalGoalsScored / data.length,
    avgGoalsConceded: totalGoalsConceded / data.length
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
  const { data: homeStats, error: homeStatsError } = await supabase
    .from('fd_standings')
    .select('*')
    .eq('team_id', homeTeamId)
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  const { data: awayStats, error: awayStatsError } = await supabase
    .from('fd_standings')
    .select('*')
    .eq('team_id', awayTeamId)
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  if (homeStatsError) {
    console.log(`[ALGO] Home stats error for team ${homeTeamId}:`, homeStatsError)
  }
  if (awayStatsError) {
    console.log(`[ALGO] Away stats error for team ${awayTeamId}:`, awayStatsError)
  }

  // Fallback Averages if standings are missing (common in cups/early season)
  const homeAvgGoals = homeStats && !homeStatsError
    ? (homeStats.goals_for + homeStats.goals_against) / homeStats.played_games 
    : 2.5 // Baseline fallback
  const awayAvgGoals = awayStats && !awayStatsError
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

  // 3. Home & Away Stats (Clean Sheet & Scoring)
  const homePerformance = await calculateHomeStats(homeTeamId)
  const awayPerformance = await calculateAwayStats(awayTeamId)

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

  // --- CALCULATION LOGIC WITH ENHANCED CRITERIA ---

  // Calculate form strength and league positions for better analysis
  const homeFormStrength = (homeStats && !homeStatsError && homeStats.played_games > 0) 
    ? (homeStats.points / homeStats.played_games) * 10 
    : 5
  const awayFormStrength = (awayStats && !awayStatsError && awayStats.played_games > 0) 
    ? (awayStats.points / awayStats.played_games) * 10 
    : 5
  
  const homePosition = (homeStats && !homeStatsError) ? homeStats.position : 20
  const awayPosition = (awayStats && !awayStatsError) ? awayStats.position : 20
  
  // Calculate defensive strength based on goals conceded
  const defensiveStrength = Math.max(0, 100 - ((homeLast3Conceded + awayLast3Conceded) / 6 * 100))

  // Base Logic (Poisson-like expected goals)
  // If we have standings, use them. If not, use fallback.
  const hGF = (homeStats && !homeStatsError) ? (homeStats.goals_for / homeStats.played_games) : (homeLast3Goals / 3)
  const hGA = (homeStats && !homeStatsError) ? (homeStats.goals_against / homeStats.played_games) : (homeLast3Conceded / 3)
  const aGF = (awayStats && !awayStatsError) ? (awayStats.goals_for / awayStats.played_games) : (awayLast3Goals / 3)
  const aGA = (awayStats && !awayStatsError) ? (awayStats.goals_against / awayStats.played_games) : (awayLast3Conceded / 3)

  const expectedGoals = (hGF + aGA + aGF + hGA) / 2
  const weightedAvg = (expectedGoals * 0.7) + (h2hAvg * 0.3)
  
  let over25Base = (weightedAvg / 4.5) * 100
  let under25Base = 100 - over25Base

  // Track criteria met for Over 2.5
  const criteriaMet: string[] = []
  let confidenceScore = 0

  // NEW ENHANCED CRITERIA FOR OVER 2.5
  
  // Criterion 1: Both teams must score at least 2 goals in their last 3 games
  if (homeLast3Goals >= 2 && awayLast3Goals >= 2) {
    criteriaMet.push('Both teams scored 2+ goals in last 3 games')
    confidenceScore += 15
  }

  // Criterion 2: Both teams must have conceded goals continuously in their last 3 games
  if (homeLast3Conceded >= 1 && awayLast3Conceded >= 1) {
    criteriaMet.push('Both teams conceded in last 3 games')
    confidenceScore += 10
  }

  // Criterion 3: Both teams average 1.5+ goals scored in their last 3 games
  if (homeLast3Goals >= 1.5 && awayLast3Goals >= 1.5) {
    criteriaMet.push('Both teams average 1.5+ goals (last 3)')
    confidenceScore += 12
  }

  // Criterion 4: Both teams have scored in their last 4-5 games
  const homeLast5 = await getTeamLastMatches(homeTeamId, 5)
  const awayLast5 = await getTeamLastMatches(awayTeamId, 5)
  
  const homeScoredLast5 = homeLast5.filter(m => {
    const goals = m.home_team_id === homeTeamId ? (m.score_fulltime_home || 0) : (m.score_fulltime_away || 0)
    return goals > 0
  }).length
  
  const awayScoredLast5 = awayLast5.filter(m => {
    const goals = m.home_team_id === awayTeamId ? (m.score_fulltime_home || 0) : (m.score_fulltime_away || 0)
    return goals > 0
  }).length
  
  if (homeScoredLast5 >= 4 && awayScoredLast5 >= 4) {
    criteriaMet.push('Both teams scored in 4+ of last 5 games')
    confidenceScore += 15
  }

  // Criterion 5: Both teams concede 1.3+ goals per game (weak defense)
  if (homePerformance.avgGoalsConceded >= 1.3 && awayPerformance.avgGoalsConceded >= 1.3) {
    criteriaMet.push('Both teams concede 1.3+ goals per game')
    confidenceScore += 12
  }

  // Criterion 6: Both teams rarely keep clean sheets
  if (homePerformance.cleanSheetPct < 30 && awayPerformance.cleanSheetPct < 30) {
    criteriaMet.push('Both teams rarely keep clean sheets')
    confidenceScore += 10
  }

  // Criterion 7: Both teams have patterns of scoring more than 3 goals in previous games
  const homeHighScoring = homeLast5.filter(m => {
    const totalGoals = (m.score_fulltime_home || 0) + (m.score_fulltime_away || 0)
    return totalGoals > 3
  }).length
  
  const awayHighScoring = awayLast5.filter(m => {
    const totalGoals = (m.score_fulltime_home || 0) + (m.score_fulltime_away || 0)
    return totalGoals > 3
  }).length
  
  if (homeHighScoring >= 2 && awayHighScoring >= 2) {
    criteriaMet.push('Both teams have 3+ goal games in recent history')
    confidenceScore += 10
  }

  // Criterion 8: High scoring percentage
  if (homePerformance.scoringPct >= 70 && awayPerformance.scoringPct >= 70) {
    criteriaMet.push('Both teams have high scoring percentage')
    confidenceScore += 8
  }

  // Criterion 9: League position factors (teams needing points for top 4 or avoiding relegation)
  const leagueSize = 20 // Assuming typical league size
  const homeInTop4Race = homePosition <= 6 && homePosition > 0
  const awayInTop4Race = awayPosition <= 6 && awayPosition > 0
  const homeInRelegationBattle = homePosition >= leagueSize - 3 && homePosition > 0
  const awayInRelegationBattle = awayPosition >= leagueSize - 3 && awayPosition > 0
  
  if ((homeInTop4Race || homeInRelegationBattle) && (awayInTop4Race || awayInRelegationBattle)) {
    criteriaMet.push('Both teams motivated (top 4 or relegation battle)')
    confidenceScore += 8
  }
  
  // Individual team motivation
  if (homeInTop4Race) {
    criteriaMet.push('Home team fighting for top 4')
    confidenceScore += 5
  }
  if (awayInTop4Race) {
    criteriaMet.push('Away team fighting for top 4')
    confidenceScore += 5
  }
  if (homeInRelegationBattle) {
    criteriaMet.push('Home team in relegation battle')
    confidenceScore += 5
  }
  if (awayInRelegationBattle) {
    criteriaMet.push('Away team in relegation battle')
    confidenceScore += 5
  }

  // Criterion 10: H2H high scoring history
  if (h2hAvg > 2.8) {
    criteriaMet.push('H2H history shows high scoring')
    confidenceScore += 10
  }

  // Minimum 2 criteria requirement for verdict
  const hasMinimumCriteria = criteriaMet.length >= 2
  
  // Bonus Points for Over 2.5 based on criteria met
  let over25Bonus = criteriaMet.length * 8 // Each criterion adds 8%
  
  // Bonus Points for Under 2.5
  let under25Bonus = 0
  let under25Criteria: string[] = []
  
  if (homeLast3Goals < 1.5 && awayLast3Goals < 1.5) {
    under25Criteria.push('Both teams low scoring (last 3)')
    under25Bonus += 20
  }
  if (homeLast3Conceded <= 1 && awayLast3Conceded <= 1) {
    under25Criteria.push('Both teams strong defense (last 3)')
    under25Bonus += 20
  }
  if (homePerformance.cleanSheetPct >= 50 || awayPerformance.cleanSheetPct >= 50) {
    under25Criteria.push('One team has good clean sheet record')
    under25Bonus += 15
  }
  
  let over25Final = over25Base + over25Bonus
  let under25Final = under25Base + under25Bonus
  
  // Normalize and Cap at 0-100
  const total = over25Final + under25Final
  over25Final = Math.min(Math.max((over25Final / total) * 100, 5), 95)
  under25Final = 100 - over25Final

  // If minimum criteria not met, reduce confidence and probability
  if (!hasMinimumCriteria) {
    over25Final = Math.max(over25Final - 15, 20)
    confidenceScore = Math.max(confidenceScore - 20, 10)
  }

  // Generate analysis explanation
  const analysisExplanation = criteriaMet.length > 0
    ? `Over 2.5 prediction based on ${criteriaMet.length} criteria: ${criteriaMet.join(', ')}. H2H avg: ${h2hAvg.toFixed(1)} goals. Expected goals: ${expectedGoals.toFixed(1)}. Home form strength: ${homeFormStrength.toFixed(0)}, Away form strength: ${awayFormStrength.toFixed(0)}. League positions: Home ${homePosition}, Away ${awayPosition}. Defensive strength: ${defensiveStrength.toFixed(0)}.`
    : `Limited criteria met for Over 2.5 prediction. Based on expected goals: ${expectedGoals.toFixed(1)} and H2H avg: ${h2hAvg.toFixed(1)}. Home form strength: ${homeFormStrength.toFixed(0)}, Away form strength: ${awayFormStrength.toFixed(0)}.`

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
    awayCleanSheetPct: awayPerformance.cleanSheetPct,
    awayScoringPct: awayPerformance.scoringPct,
    homeLast3Goals,
    awayLast3Goals,
    homeLast3Conceded,
    awayLast3Conceded,
    homeAvgGoalsScored: homePerformance.avgGoalsScored,
    awayAvgGoalsScored: awayPerformance.avgGoalsScored,
    homeAvgGoalsConceded: homePerformance.avgGoalsConceded,
    awayAvgGoalsConceded: awayPerformance.avgGoalsConceded,
    homeFormStrength: Math.round(homeFormStrength),
    awayFormStrength: Math.round(awayFormStrength),
    defensiveStrength: Math.round(defensiveStrength),
    leaguePositionHome: homePosition,
    leaguePositionAway: awayPosition,
    criteriaMet,
    confidenceScore: Math.min(confidenceScore, 100),
    analysisExplanation
  }
}

export async function processAllUpcomingPredictions() {
  console.log('[ALGO] Processing Over/Under 2.5 predictions...')
  
  // Get current date in Nigerian time (UTC+1)
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const nigeriaTime = new Date(utc + (3600000 * 1))
  const today = new Date(nigeriaTime)
  today.setUTCHours(0, 0, 0, 0)
  
  // Get end of today (midnight tomorrow)
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  
  const { data: upcomingMatches } = await supabase
    .from('fd_matches')
    .select('id, utc_date, home_team:fd_teams!home_team_id(name), away_team:fd_teams!away_team_id(name), competition:fd_competitions!competition_id(name)')
    .in('status', ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'])
    .gte('utc_date', today.toISOString())
    .lt('utc_date', tomorrow.toISOString())
    .order('utc_date', { ascending: true })

  if (!upcomingMatches || upcomingMatches.length === 0) {
    console.log('[ALGO] No upcoming matches found')
    return
  }

  // Get match IDs that already have OVER_2_5 predictions for today
  const { data: existingPredictions } = await supabase
    .from('fd_predictions')
    .select('match_id')
    .eq('prediction_type', 'OVER_2_5')
    .in('match_id', upcomingMatches.map(m => m.id))

  const existingMatchIds = new Set(existingPredictions?.map(p => p.match_id) || [])
  const matchesToProcess = upcomingMatches.filter(m => !existingMatchIds.has(m.id))

  console.log(`[ALGO] Processing ${matchesToProcess.length} new matches (skipping ${existingMatchIds.size} already processed)`)

  let processedCount = 0
  let failedCount = 0
  
  for (const m of matchesToProcess) {
    try {
      const result = await calculateMatchPredictions(m.id)
      if (result) {
        await supabase.from('fd_predictions').upsert({
          match_id: result.matchId,
          prediction_type: 'OVER_2_5',
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
          away_last_3_conceded: result.awayLast3Conceded,
          home_form_strength: result.homeFormStrength,
          away_form_strength: result.awayFormStrength,
          defensive_strength: result.defensiveStrength,
          league_position_home: result.leaguePositionHome,
          league_position_away: result.leaguePositionAway,
          criteria_met: result.criteriaMet,
          confidence_score: result.confidenceScore,
          analysis_explanation: result.analysisExplanation
        }, { onConflict: 'match_id,prediction_type' })
        
        processedCount++
        if (processedCount % 5 === 0) {
          console.log(`[ALGO] Progress: ${processedCount}/${matchesToProcess.length} matches processed`)
        }
      }
    } catch (error) {
      console.error(`[ALGO] Failed to process match ${m.id}:`, error)
      failedCount++
      // Continue with next match
    }
  }
  
  console.log(`[ALGO] Completed: ${processedCount} successful, ${failedCount} failed`)
}
