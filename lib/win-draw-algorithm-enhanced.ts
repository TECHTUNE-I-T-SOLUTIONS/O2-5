import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface WinDrawResult {
  matchId: number
  predictedWinDraw: boolean
  predictedWinner: 'HOME' | 'AWAY' | 'DRAW' | null
  winDrawProb: number
  homeFormStrength: number
  awayFormStrength: number
  defensiveStrength: number
  leaguePositionHome: number
  leaguePositionAway: number
  homeRecordLast3: string
  awayRecordLast3: string
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

async function getTeamStandings(teamId: number, competitionId: number) {
  const { data, error } = await supabase
    .from('fd_standings')
    .select('*')
    .eq('team_id', teamId)
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data
}

async function getTopTeamsInLeague(competitionId: number, topN: number = 5) {
  const { data, error } = await supabase
    .from('fd_standings')
    .select('team_id, position')
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return []

  const { data: standings } = await supabase
    .from('fd_standings')
    .select('team_id')
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .eq('season_year', data.season_year)
    .lte('position', topN)

  if (error || !standings) return []
  return standings.map(s => s.team_id)
}

async function checkTeamPerformanceAgainstTopTeams(teamId: number, competitionId: number) {
  const topTeamIds = await getTopTeamsInLeague(competitionId, 5)
  
  if (topTeamIds.length === 0) return { winsAgainstTop: 0, totalAgainstTop: 0 }

  const { data, error } = await supabase
    .from('fd_matches')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('status', 'FINISHED')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .or(topTeamIds.map(id => `home_team_id.eq.${id},away_team_id.eq.${id}`).join(','))

  if (error || !data) return { winsAgainstTop: 0, totalAgainstTop: 0 }

  let winsAgainstTop = 0
  let totalAgainstTop = 0

  for (const match of data) {
    const isTopTeamMatch = topTeamIds.includes(match.home_team_id) || topTeamIds.includes(match.away_team_id)
    if (!isTopTeamMatch) continue

    totalAgainstTop++
    const isHome = match.home_team_id === teamId
    const teamWon = isHome ? match.winner === 'HOME_TEAM' : match.winner === 'AWAY_TEAM'
    
    if (teamWon) winsAgainstTop++
  }

  return { winsAgainstTop, totalAgainstTop }
}

async function getTeamFormString(teamId: number, matches: number = 5) {
  const { data, error } = await supabase
    .from('fd_matches')
    .select('*')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .eq('status', 'FINISHED')
    .order('utc_date', { ascending: false })
    .limit(matches)

  if (error || !data) return ''

  let formString = ''
  for (const match of data) {
    const isHome = match.home_team_id === teamId
    const teamWon = isHome ? match.winner === 'HOME_TEAM' : match.winner === 'AWAY_TEAM'
    const isDraw = match.winner === 'DRAW'
    
    if (teamWon) formString += 'W'
    else if (isDraw) formString += 'D'
    else formString += 'L'
  }

  return formString
}

async function getHeadToHeadRecord(homeTeamId: number, awayTeamId: number, limit: number = 5) {
  const { data, error } = await supabase
    .from('fd_matches')
    .select('*')
    .or(`and(home_team_id.eq.${homeTeamId},away_team_id.eq.${awayTeamId}),and(home_team_id.eq.${awayTeamId},away_team_id.eq.${homeTeamId})`)
    .eq('status', 'FINISHED')
    .order('utc_date', { ascending: false })
    .limit(limit)

  if (error || !data) return { homeWins: 0, awayWins: 0, draws: 0, total: 0 }

  let homeWins = 0, awayWins = 0, draws = 0
  for (const match of data) {
    if (match.winner === 'HOME_TEAM' && match.home_team_id === homeTeamId) homeWins++
    else if (match.winner === 'AWAY_TEAM' && match.away_team_id === homeTeamId) awayWins++
    else if (match.winner === 'HOME_TEAM' && match.home_team_id === awayTeamId) awayWins++
    else if (match.winner === 'AWAY_TEAM' && match.away_team_id === awayTeamId) homeWins++
    else draws++
  }

  return { homeWins, awayWins, draws, total: data.length }
}

async function getHomeAwayPerformance(teamId: number) {
  // Get home performance
  const { data: homeMatches } = await supabase
    .from('fd_matches')
    .select('*')
    .eq('home_team_id', teamId)
    .eq('status', 'FINISHED')
    .order('utc_date', { ascending: false })
    .limit(10)

  // Get away performance
  const { data: awayMatches } = await supabase
    .from('fd_matches')
    .select('*')
    .eq('away_team_id', teamId)
    .eq('status', 'FINISHED')
    .order('utc_date', { ascending: false })
    .limit(10)

  let homeWins = 0, homeDraws = 0, homeLosses = 0
  let awayWins = 0, awayDraws = 0, awayLosses = 0

  for (const match of homeMatches || []) {
    if (match.winner === 'HOME_TEAM') homeWins++
    else if (match.winner === 'DRAW') homeDraws++
    else homeLosses++
  }

  for (const match of awayMatches || []) {
    if (match.winner === 'AWAY_TEAM') awayWins++
    else if (match.winner === 'DRAW') awayDraws++
    else awayLosses++
  }

  return {
    home: { wins: homeWins, draws: homeDraws, losses: homeLosses, total: homeMatches?.length || 0 },
    away: { wins: awayWins, draws: awayDraws, losses: awayLosses, total: awayMatches?.length || 0 }
  }
}

async function getHomeRecord(teamId: number) {
  const { data, error } = await supabase
    .from('fd_matches')
    .select('*')
    .eq('home_team_id', teamId)
    .eq('status', 'FINISHED')
    .order('utc_date', { ascending: false })
    .limit(3)

  if (error || !data) return { record: '', undefeated: false }

  let wins = 0, draws = 0, losses = 0
  for (const match of data) {
    if (match.winner === 'HOME_TEAM') wins++
    else if (match.winner === 'AWAY_TEAM') losses++
    else draws++
  }

  const record = `${wins}W-${draws}D-${losses}L`
  const undefeated = losses === 0

  return { record, undefeated }
}

export async function calculateWinDrawPredictions(matchId: number): Promise<WinDrawResult | null> {
  const { data: match, error: matchError } = await supabase
    .from('fd_matches')
    .select('*, home_team:fd_teams!home_team_id(*), away_team:fd_teams!away_team_id(*)')
    .eq('id', matchId)
    .single()

  if (matchError || !match) return null

  const homeTeamId = match.home_team_id
  const awayTeamId = match.away_team_id
  const competitionId = match.competition_id

  // Get team form strings for better analysis
  const homeFormString = await getTeamFormString(homeTeamId, 5)
  const awayFormString = await getTeamFormString(awayTeamId, 5)

  // Get H2H record
  const h2hRecord = await getHeadToHeadRecord(homeTeamId, awayTeamId, 5)

  // Get home/away performance
  const homePerformance = await getHomeAwayPerformance(homeTeamId)
  const awayPerformance = await getHomeAwayPerformance(awayTeamId)

  // Get last 3 matches for defensive analysis
  const homeLast3 = await getTeamLastMatches(homeTeamId, 3)
  const awayLast3 = await getTeamLastMatches(awayTeamId, 3)

  let homeConcededLast3 = 0
  let awayConcededLast3 = 0

  for (const m of homeLast3) {
    homeConcededLast3 += m.home_team_id === homeTeamId ? (m.score_fulltime_away || 0) : (m.score_fulltime_home || 0)
  }
  for (const m of awayLast3) {
    awayConcededLast3 += m.home_team_id === awayTeamId ? (m.score_fulltime_away || 0) : (m.score_fulltime_home || 0)
  }

  // Get standings for both teams
  const homeStandings = await getTeamStandings(homeTeamId, competitionId)
  const awayStandings = await getTeamStandings(awayTeamId, competitionId)

  const homePosition = homeStandings ? homeStandings.position : 20
  const awayPosition = awayStandings ? awayStandings.position : 20

  // Get league size
  const totalTeams = await supabase
    .from('fd_standings')
    .select('team_id', { count: 'exact', head: true })
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  const leagueSize = totalTeams.count || 20

  const criteriaMet: string[] = []
  let confidenceScore = 0

  // NEW ENHANCED CRITERIA FOR WIN/DRAW

  // Criterion 1: Which team wins its last 5 games between the 2 playing teams (H2H)
  if (h2hRecord.total >= 3) {
    if (h2hRecord.homeWins >= 3) {
      criteriaMet.push(`Home team dominates H2H (${h2hRecord.homeWins}-${h2hRecord.awayWins}-${h2hRecord.draws})`)
      confidenceScore += 20
    } else if (h2hRecord.awayWins >= 3) {
      criteriaMet.push(`Away team dominates H2H (${h2hRecord.homeWins}-${h2hRecord.awayWins}-${h2hRecord.draws})`)
      confidenceScore += 20
    }
  }

  // Criterion 2: Team in very good form with reputation for winning important games
  if (homeFormString) {
    const homeRecentForm = homeFormString.substring(0, 5) // Last 5 matches
    const homeWinsInRecent = (homeRecentForm.match(/W/g) || []).length
    const homeUnbeatenInRecent = (homeRecentForm.match(/[WD]/g) || []).length
    
    if (homeWinsInRecent >= 4) {
      criteriaMet.push(`Home team excellent form: ${homeRecentForm}`)
      confidenceScore += 15
    } else if (homeUnbeatenInRecent >= 4) {
      criteriaMet.push(`Home team unbeaten recently: ${homeRecentForm}`)
      confidenceScore += 10
    }
  }

  if (awayFormString) {
    const awayRecentForm = awayFormString.substring(0, 5) // Last 5 matches
    const awayWinsInRecent = (awayRecentForm.match(/W/g) || []).length
    const awayUnbeatenInRecent = (awayRecentForm.match(/[WD]/g) || []).length
    
    if (awayWinsInRecent >= 4) {
      criteriaMet.push(`Away team excellent form: ${awayRecentForm}`)
      confidenceScore += 15
    } else if (awayUnbeatenInRecent >= 4) {
      criteriaMet.push(`Away team unbeaten recently: ${awayRecentForm}`)
      confidenceScore += 10
    }
  }

  // Criterion 3: Home/Away performance (some teams are monsters at home but terrible away)
  const homeWinRate = homePerformance.home.total > 0 ? (homePerformance.home.wins / homePerformance.home.total) * 100 : 0
  const awayWinRate = awayPerformance.away.total > 0 ? (awayPerformance.away.wins / awayPerformance.away.total) * 100 : 0
  
  if (homeWinRate >= 70 && homePerformance.home.total >= 5) {
    criteriaMet.push(`Home team strong at home (${homePerformance.home.wins}W-${homePerformance.home.draws}D-${homePerformance.home.losses}L)`)
    confidenceScore += 15
  }
  
  if (awayWinRate >= 60 && awayPerformance.away.total >= 5) {
    criteriaMet.push(`Away team good away form (${awayPerformance.away.wins}W-${awayPerformance.away.draws}D-${awayPerformance.away.losses}L)`)
    confidenceScore += 12
  }

  // Criterion 4: One team is among top 4 (implies good reputation for winning)
  if (homePosition <= 4 && homePosition > 0 && homeStandings) {
    criteriaMet.push('Home team in top 4 (strong reputation)')
    confidenceScore += 12
  }
  if (awayPosition <= 4 && awayPosition > 0 && awayStandings) {
    criteriaMet.push('Away team in top 4 (strong reputation)')
    confidenceScore += 12
  }

  // Criterion 5: Team with solid defense (concedes no goal or less than 2 goals per match)
  const homeConcededAvg = homeLast3.length > 0 ? homeConcededLast3 / homeLast3.length : 0
  const awayConcededAvg = awayLast3.length > 0 ? awayConcededLast3 / awayLast3.length : 0
  
  if (homeConcededAvg < 1.5) {
    criteriaMet.push('Home team solid defense (<1.5 goals conceded avg)')
    confidenceScore += 10
  }
  if (awayConcededAvg < 1.5) {
    criteriaMet.push('Away team solid defense (<1.5 goals conceded avg)')
    confidenceScore += 10
  }

  // Criterion 6: Team fighting for UCL spot (top 4 or top 6 depending on league)
  const homeInUCLRace = homePosition <= 6 && homePosition > 0 && homeStandings
  const awayInUCLRace = awayPosition <= 6 && awayPosition > 0 && awayStandings
  
  if (homeInUCLRace) {
    criteriaMet.push('Home team fighting for UCL spot')
    confidenceScore += 8
  }
  if (awayInUCLRace) {
    criteriaMet.push('Away team fighting for UCL spot')
    confidenceScore += 8
  }

  // Criterion 7: Team fighting relegation at home (desperate not to lose)
  if (homePosition >= leagueSize - 3) {
    criteriaMet.push('Home team fighting relegation at home')
    confidenceScore += 10
  }

  // Criterion 8: One team hasn't lost at home in last 3 games
  const homeRecord = await getHomeRecord(homeTeamId)
  const awayRecord = await getHomeRecord(awayTeamId)
  
  if (homeRecord.undefeated) {
    criteriaMet.push('Home team undefeated at home (last 3)')
    confidenceScore += 12
  }
  
  // Also check away team's away performance
  if (awayPerformance.away.total >= 3) {
    const awayAwayLosses = awayPerformance.away.losses
    if (awayAwayLosses === 0) {
      criteriaMet.push('Away team undefeated away (last 3)')
      confidenceScore += 10
    }
  }

  // Criterion 9: One team has beaten at least 2 out of top 5 teams
  const homeTopTeamPerf = await checkTeamPerformanceAgainstTopTeams(homeTeamId, competitionId)
  const awayTopTeamPerf = await checkTeamPerformanceAgainstTopTeams(awayTeamId, competitionId)

  if (homeTopTeamPerf.winsAgainstTop >= 2) {
    criteriaMet.push('Home team has beaten top 5 teams')
    confidenceScore += 15
  }
  if (awayTopTeamPerf.winsAgainstTop >= 2) {
    criteriaMet.push('Away team has beaten top 5 teams')
    confidenceScore += 15
  }

  // Criterion 10: One team is among last 3 (relegation battle)
  if (homePosition >= leagueSize - 2 && homePosition > 0 && homeStandings) {
    criteriaMet.push('Home team in bottom 3')
    confidenceScore += 8
  }
  if (awayPosition >= leagueSize - 2 && awayPosition > 0 && awayStandings) {
    criteriaMet.push('Away team in bottom 3')
    confidenceScore += 8
  }

  // Criterion 11: Set pieces advantage (teams with good corners/free steals)
  // This is estimated based on scoring patterns and form
  if (homeFormStrength > awayFormStrength + 2) {
    criteriaMet.push('Home team set pieces advantage (better form)')
    confidenceScore += 6
  }
  if (awayFormStrength > homeFormStrength + 2) {
    criteriaMet.push('Away team set pieces advantage (better form)')
    confidenceScore += 6
  }

  // Criterion 12: Home advantage factor (home teams generally have advantage)
  if (homePerformance.home.total >= 5) {
    const homeWinRate = (homePerformance.home.wins / homePerformance.home.total) * 100
    if (homeWinRate >= 50) {
      criteriaMet.push('Home team has home advantage (50%+ home win rate)')
      confidenceScore += 8
    }
  }

  // Criterion 13: Pressure situations
  if (homeInRelegationBattle || awayInRelegationBattle) {
    criteriaMet.push('High pressure match (relegation battle)')
    confidenceScore += 5
  }
  if (homeInUCLRace || awayInUCLRace) {
    criteriaMet.push('High pressure match (top 4 race)')
    confidenceScore += 5
  }

  // Minimum 2 criteria requirement for verdict
  const hasMinimumCriteria = criteriaMet.length >= 2

  // Calculate defensive strength
  const defensiveStrength = Math.max(0, 100 - ((homeConcededLast3 + awayConcededLast3) / 6 * 100))

  // Calculate form strength
  const homeFormStrength = (homeStandings && homeStandings.played_games > 0) 
    ? (homeStandings.points / homeStandings.played_games) * 10 
    : 5
  const awayFormStrength = (awayStandings && awayStandings.played_games > 0) 
    ? (awayStandings.points / awayStandings.played_games) * 10 
    : 5

  // Calculate win/draw probability
  const positionAdvantage = (awayPosition - homePosition) / leagueSize * 30
  const formAdvantage = (homeFormStrength - awayFormStrength) * 5
  const defensiveBonus = defensiveStrength * 0.2

  let winDrawProb = 50 + positionAdvantage + formAdvantage + defensiveBonus
  winDrawProb = Math.min(Math.max(winDrawProb, 20), 90)

  // If minimum criteria not met, reduce confidence and probability
  if (!hasMinimumCriteria) {
    winDrawProb = Math.max(winDrawProb - 10, 30)
    confidenceScore = Math.max(confidenceScore - 15, 10)
  }

  const predictedWinDraw = winDrawProb > 55

  // Determine specific winner prediction
  let predictedWinner: 'HOME' | 'AWAY' | 'DRAW' | null = null
  
  if (predictedWinDraw) {
    // Predict which team is more likely to win or if it's a draw
    const homeAdvantage = positionAdvantage + formAdvantage
    
    if (homeAdvantage > 15) {
      predictedWinner = 'HOME'
    } else if (homeAdvantage < -15) {
      predictedWinner = 'AWAY'
    } else {
      predictedWinner = 'DRAW'
    }
  }

  // Generate explanation with specific team prediction
  const homeTeamName = (match.home_team as { name?: string })?.name || 'Home team'
  const awayTeamName = (match.away_team as { name?: string })?.name || 'Away team'
  
  const teamPrediction = predictedWinner 
    ? (predictedWinner === 'HOME' ? `${homeTeamName} predicted to win` : predictedWinner === 'AWAY' ? `${awayTeamName} predicted to win` : 'Draw predicted')
    : `${awayTeamName} win predicted`
    
  const analysisExplanation = criteriaMet.length > 0 
    ? `${teamPrediction}. Analysis based on ${criteriaMet.length} criteria: ${criteriaMet.join(', ')}. Form: Home (${homeFormString || 'N/A'}), Away (${awayFormString || 'N/A'}). H2H: ${h2hRecord.homeWins}-${h2hRecord.awayWins}-${h2hRecord.draws}. League Positions: Home ${homePosition}, Away ${awayPosition}. Confidence score: ${confidenceScore}/100.`
    : `Limited data available for prediction. ${teamPrediction}.`

  return {
    matchId,
    predictedWinDraw,
    predictedWinner,
    winDrawProb: Math.round(winDrawProb),
    homeFormStrength: Math.round(homeFormStrength),
    awayFormStrength: Math.round(awayFormStrength),
    defensiveStrength: Math.round(defensiveStrength),
    leaguePositionHome: homePosition,
    leaguePositionAway: awayPosition,
    homeRecordLast3: homeRecord.record,
    awayRecordLast3: awayRecord.record,
    criteriaMet,
    confidenceScore: Math.min(confidenceScore, 100),
    analysisExplanation
  }
}

export async function processAllWinDrawPredictions() {
  console.log('[WIN-DRAW] Processing Win/Draw predictions...')
  
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
    console.log('[WIN-DRAW] No upcoming matches found')
    return
  }

  // Get match IDs that already have WIN_DRAW predictions for today
  const { data: existingPredictions } = await supabase
    .from('fd_predictions')
    .select('match_id')
    .eq('prediction_type', 'WIN_DRAW')
    .in('match_id', upcomingMatches.map(m => m.id))

  const existingMatchIds = new Set(existingPredictions?.map(p => p.match_id) || [])
  const matchesToProcess = upcomingMatches.filter(m => !existingMatchIds.has(m.id))

  console.log(`[WIN-DRAW] Processing ${matchesToProcess.length} new matches (skipping ${existingMatchIds.size} already processed)`)

  let processedCount = 0
  let failedCount = 0
  
  for (const m of matchesToProcess) {
    try {
      const result = await calculateWinDrawPredictions(m.id)
      if (result) {
        await supabase.from('fd_predictions').upsert({
          match_id: result.matchId,
          prediction_type: 'WIN_DRAW',
          predicted_win_draw: result.predictedWinDraw,
          predicted_winner: result.predictedWinner,
          win_draw_prob: result.winDrawProb,
          home_form_strength: result.homeFormStrength,
          away_form_strength: result.awayFormStrength,
          defensive_strength: result.defensiveStrength,
          league_position_home: result.leaguePositionHome,
          league_position_away: result.leaguePositionAway,
          home_record_last_3: result.homeRecordLast3,
          away_record_last_3: result.awayRecordLast3,
          criteria_met: result.criteriaMet,
          confidence_score: result.confidenceScore,
          analysis_explanation: result.analysisExplanation
        }, { onConflict: 'match_id,prediction_type' })
        
        processedCount++
        if (processedCount % 5 === 0) {
          console.log(`[WIN-DRAW] Progress: ${processedCount}/${matchesToProcess.length} matches processed`)
        }
      }
    } catch (error) {
      console.error(`[WIN-DRAW] Failed to process match ${m.id}:`, error)
      failedCount++
      // Continue with next match
    }
  }
  
  console.log(`[WIN-DRAW] Completed: ${processedCount} successful, ${failedCount} failed`)
}