import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface WinDrawResult {
  matchId: number
  predictedWinDraw: boolean
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

  const criteriaMet: string[] = []
  let confidenceScore = 0

  // Add form analysis to criteria
  if (homeFormString) {
    const homeRecentForm = homeFormString.substring(0, 3) // Last 3 matches
    const homeWinsInRecent = (homeRecentForm.match(/W/g) || []).length
    if (homeWinsInRecent >= 2) {
      criteriaMet.push(`Home team strong form: ${homeRecentForm}`)
      confidenceScore += 10
    }
  }

  if (awayFormString) {
    const awayRecentForm = awayFormString.substring(0, 3) // Last 3 matches
    const awayWinsInRecent = (awayRecentForm.match(/W/g) || []).length
    if (awayWinsInRecent >= 2) {
      criteriaMet.push(`Away team strong form: ${awayRecentForm}`)
      confidenceScore += 10
    }
  }

  // Get standings for both teams
  const homeStandings = await getTeamStandings(homeTeamId, competitionId)
  const awayStandings = await getTeamStandings(awayTeamId, competitionId)

  const homePosition = homeStandings?.position || 20
  const awayPosition = awayStandings?.position || 20

  // Criteria 1: One team must have beaten at least 2 out of top 5 teams
  const homeTopTeamPerf = await checkTeamPerformanceAgainstTopTeams(homeTeamId, competitionId)
  const awayTopTeamPerf = await checkTeamPerformanceAgainstTopTeams(awayTeamId, competitionId)

  if (homeTopTeamPerf.winsAgainstTop >= 2) {
    criteriaMet.push('Home team has beaten top 5 teams')
    confidenceScore += 20
  }
  if (awayTopTeamPerf.winsAgainstTop >= 2) {
    criteriaMet.push('Away team has beaten top 5 teams')
    confidenceScore += 20
  }

  // Criteria 2: One team is among top 4
  if (homePosition <= 4) {
    criteriaMet.push('Home team in top 4')
    confidenceScore += 15
  }
  if (awayPosition <= 4) {
    criteriaMet.push('Away team in top 4')
    confidenceScore += 15
  }

  // Criteria 3: One team is defensively strong (no goals in last 2-3 games)
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

  const defensiveStrength = Math.max(0, 100 - ((homeConcededLast3 + awayConcededLast3) / 6 * 100))
  
  if (homeConcededLast3 === 0 || awayConcededLast3 === 0) {
    criteriaMet.push('Team with strong defense (no goals conceded)')
    confidenceScore += 20
  }

  // Criteria 4: One team is among last 3
  const totalTeams = await supabase
    .from('fd_standings')
    .select('team_id', { count: 'exact', head: true })
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  const leagueSize = totalTeams.count || 20
  
  if (homePosition >= leagueSize - 2) {
    criteriaMet.push('Home team in bottom 3')
    confidenceScore += 10
  }
  if (awayPosition >= leagueSize - 2) {
    criteriaMet.push('Away team in bottom 3')
    confidenceScore += 10
  }

  // Criteria 5: One team hasn't lost at home in last 3 games
  const homeRecord = await getHomeRecord(homeTeamId)
  if (homeRecord.undefeated) {
    criteriaMet.push('Home team undefeated at home (last 3)')
    confidenceScore += 15
  }

  // Calculate form strength
  const homeFormStrength = homeStandings ? (homeStandings.points / homeStandings.played_games) * 10 : 5
  const awayFormStrength = awayStandings ? (awayStandings.points / awayStandings.played_games) * 10 : 5

  // Calculate win/draw probability
  const positionAdvantage = (awayPosition - homePosition) / leagueSize * 30
  const formAdvantage = (homeFormStrength - awayFormStrength) * 5
  const defensiveBonus = defensiveStrength * 0.2

  let winDrawProb = 50 + positionAdvantage + formAdvantage + defensiveBonus
  winDrawProb = Math.min(Math.max(winDrawProb, 20), 90)

  const predictedWinDraw = winDrawProb > 55

  // Generate explanation
  const analysisExplanation = criteriaMet.length > 0 
    ? `Analysis based on ${criteriaMet.length} criteria: ${criteriaMet.join(', ')}. Form: Home (${homeFormString || 'N/A'}), Away (${awayFormString || 'N/A'}). Confidence score: ${confidenceScore}/100.`
    : 'Limited data available for prediction.'

  return {
    matchId,
    predictedWinDraw,
    winDrawProb: Math.round(winDrawProb),
    homeFormStrength: Math.round(homeFormStrength),
    awayFormStrength: Math.round(awayFormStrength),
    defensiveStrength: Math.round(defensiveStrength),
    leaguePositionHome: homePosition,
    leaguePositionAway: awayPosition,
    homeRecordLast3: homeRecord.record,
    awayRecordLast3: (await getHomeRecord(awayTeamId)).record,
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
        // Use algorithm's own analysis directly (no AI calls for speed)
        const aiExplanation = result.analysisExplanation
        const aiConfidence = result.confidenceScore
        const aiKeyFactors = result.criteriaMet

        await supabase.from('fd_predictions').upsert({
          match_id: result.matchId,
          prediction_type: 'WIN_DRAW',
          predicted_win_draw: result.predictedWinDraw,
          win_draw_prob: result.winDrawProb,
          home_form_strength: result.homeFormStrength,
          away_form_strength: result.awayFormStrength,
          defensive_strength: result.defensiveStrength,
          league_position_home: result.leaguePositionHome,
          league_position_away: result.leaguePositionAway,
          home_record_last_3: result.homeRecordLast3,
          away_record_last_3: result.awayRecordLast3,
          criteria_met: aiKeyFactors,
          confidence_score: aiConfidence,
          analysis_explanation: aiExplanation
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