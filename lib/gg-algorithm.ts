import { createClient } from '@supabase/supabase-js'
import { aiService } from './ai-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface GGResult {
  matchId: number
  predictedGG: boolean
  ggProb: number
  homeLast3Goals: number
  awayLast3Goals: number
  homeLast3Conceded: number
  awayLast3Conceded: number
  topScorersAvailable: boolean
  bestAssistAvailable: boolean
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

async function checkTeamScoringForm(teamId: number, minGoals: number = 2, matches: number = 3) {
  const lastMatches = await getTeamLastMatches(teamId, matches)
  
  if (lastMatches.length === 0) return { totalGoals: 0, meetsCriteria: false }

  let totalGoals = 0
  for (const match of lastMatches) {
    const isHome = match.home_team_id === teamId
    totalGoals += isHome ? (match.score_fulltime_home || 0) : (match.score_fulltime_away || 0)
  }

  const meetsCriteria = totalGoals >= minGoals
  return { totalGoals, meetsCriteria }
}

async function checkTeamConcedingForm(teamId: number, matches: number = 3) {
  const lastMatches = await getTeamLastMatches(teamId, matches)
  
  if (lastMatches.length === 0) return { totalConceded: 0, isConcedingTeam: false }

  let totalConceded = 0
  for (const match of lastMatches) {
    const isHome = match.home_team_id === teamId
    totalConceded += isHome ? (match.score_fulltime_away || 0) : (match.score_fulltime_home || 0)
  }

  // Consider a team "conceding" if they average at least 1 goal per game
  const isConcedingTeam = totalConceded >= matches
  return { totalConceded, isConcedingTeam }
}

// Note: Since Football-Data.org doesn't provide real-time player availability,
// we'll use team scoring averages as a proxy for "top scorer availability"
async function estimateTopScorerAvailability(teamId: number, competitionId: number) {
  const { data: standings } = await supabase
    .from('fd_standings')
    .select('*')
    .eq('team_id', teamId)
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  if (!standings) return false

  // If team has good scoring record, assume top scorer is likely available
  const avgGoalsPerGame = standings.goals_for / standings.played_games
  return avgGoalsPerGame >= 1.5
}

// Note: Similar approach for assist providers - using team offensive strength
async function estimateAssistProviderAvailability(teamId: number, competitionId: number) {
  const { data: standings } = await supabase
    .from('fd_standings')
    .select('*')
    .eq('team_id', teamId)
    .eq('competition_id', competitionId)
    .eq('type', 'TOTAL')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  if (!standings) return false

  // If team creates many goals, assume good playmakers are available
  const avgGoalsPerGame = standings.goals_for / standings.played_games
  return avgGoalsPerGame >= 1.3
}

export async function calculateGGPredictions(matchId: number): Promise<GGResult | null> {
  const { data: match, error: matchError } = await supabase
    .from('fd_matches')
    .select('*, home_team:fd_teams!home_team_id(*), away_team:fd_teams!away_team_id(*)')
    .eq('id', matchId)
    .single()

  if (matchError || !match) return null

  const homeTeamId = match.home_team_id
  const awayTeamId = match.away_team_id
  const competitionId = match.competition_id

  const criteriaMet: string[] = []
  let confidenceScore = 0

  // Criteria 1: Both teams must have scored at least 2 goals in their last 2-3 games
  const homeScoringForm = await checkTeamScoringForm(homeTeamId, 2, 3)
  const awayScoringForm = await checkTeamScoringForm(awayTeamId, 2, 3)

  if (homeScoringForm.meetsCriteria) {
    criteriaMet.push('Home team scoring form (2+ goals in last 3)')
    confidenceScore += 25
  }
  if (awayScoringForm.meetsCriteria) {
    criteriaMet.push('Away team scoring form (2+ goals in last 3)')
    confidenceScore += 25
  }

  // Criteria 2: Both teams' top scorers must be available
  const homeTopScorerAvailable = await estimateTopScorerAvailability(homeTeamId, competitionId)
  const awayTopScorerAvailable = await estimateTopScorerAvailability(awayTeamId, competitionId)

  if (homeTopScorerAvailable && awayTopScorerAvailable) {
    criteriaMet.push('Both teams have strong scoring records (top scorers likely available)')
    confidenceScore += 20
  }

  // Criteria 3: Both teams' best assist providers must be available
  const homeAssistAvailable = await estimateAssistProviderAvailability(homeTeamId, competitionId)
  const awayAssistAvailable = await estimateAssistProviderAvailability(awayTeamId, competitionId)

  if (homeAssistAvailable && awayAssistAvailable) {
    criteriaMet.push('Both teams have good offensive creativity (assist providers likely available)')
    confidenceScore += 15
  }

  // Criteria 4: Both teams must be goal conceding teams in their last 2-3 matches
  const homeConcedingForm = await checkTeamConcedingForm(homeTeamId, 3)
  const awayConcedingForm = await checkTeamConcedingForm(awayTeamId, 3)

  if (homeConcedingForm.isConcedingTeam) {
    criteriaMet.push('Home team concedes goals regularly')
    confidenceScore += 15
  }
  if (awayConcedingForm.isConcedingTeam) {
    criteriaMet.push('Away team concedes goals regularly')
    confidenceScore += 15
  }

  // Calculate GG probability
  const scoringStrength = (homeScoringForm.totalGoals + awayScoringForm.totalGoals) / 6 * 40
  const concedingWeakness = (homeConcedingForm.totalConceded + awayConcedingForm.totalConceded) / 6 * 30
  const baseProbability = 50 + scoringStrength + concedingWeakness

  let ggProb = baseProbability + (confidenceScore * 0.3)
  ggProb = Math.min(Math.max(ggProb, 20), 90)

  const predictedGG = ggProb > 55

  // Generate explanation
  const analysisExplanation = criteriaMet.length > 0 
    ? `Analysis based on ${criteriaMet.length} criteria: ${criteriaMet.join(', ')}. Confidence score: ${confidenceScore}/100.`
    : 'Limited data available for prediction.'

  return {
    matchId,
    predictedGG,
    ggProb: Math.round(ggProb),
    homeLast3Goals: homeScoringForm.totalGoals,
    awayLast3Goals: awayScoringForm.totalGoals,
    homeLast3Conceded: homeConcedingForm.totalConceded,
    awayLast3Conceded: awayConcedingForm.totalConceded,
    topScorersAvailable: homeTopScorerAvailable && awayTopScorerAvailable,
    bestAssistAvailable: homeAssistAvailable && awayAssistAvailable,
    criteriaMet,
    confidenceScore: Math.min(confidenceScore, 100),
    analysisExplanation
  }
}

export async function processAllGGPredictions() {
  console.log('[GG] Processing Both Teams to Score predictions...')
  
  const { data: upcomingMatches } = await supabase
    .from('fd_matches')
    .select('id, utc_date, home_team:fd_teams!home_team_id(name), away_team:fd_teams!away_team_id(name), competition:fd_competitions!competition_id(name)')
    .in('status', ['SCHEDULED', 'TIMED'])
    .gte('utc_date', new Date().toISOString())
    .order('utc_date', { ascending: true })

  if (!upcomingMatches) return

  for (const m of upcomingMatches) {
    const result = await calculateGGPredictions(m.id)
    if (result) {
      // Get AI analysis for the match
      let aiExplanation = result.analysisExplanation
      let aiConfidence = result.confidenceScore
      let aiKeyFactors = result.criteriaMet
      
      try {
        const matchData = {
          home_team: m.home_team,
          away_team: m.away_team,
          competition: m.competition,
          utc_date: m.utc_date
        }
        
        const aiAnalysis = await aiService.analyzeMatch(matchData, 'GG')
        aiExplanation = aiAnalysis.explanation
        aiConfidence = aiAnalysis.confidence
        aiKeyFactors = aiAnalysis.keyFactors
      } catch (error) {
        console.warn('[AI] Failed to get AI analysis for GG:', error)
      }

      await supabase.from('fd_predictions').upsert({
        match_id: result.matchId,
        prediction_type: 'GG',
        predicted_gg: result.predictedGG,
        gg_prob: result.ggProb,
        home_last_3_goals: result.homeLast3Goals,
        away_last_3_goals: result.awayLast3Goals,
        home_last_3_conceded: result.homeLast3Conceded,
        away_last_3_conceded: result.awayLast3Conceded,
        top_scorers_available: result.topScorersAvailable,
        best_assist_available: result.bestAssistAvailable,
        criteria_met: aiKeyFactors,
        confidence_score: aiConfidence,
        analysis_explanation: aiExplanation
      }, { onConflict: 'match_id' })
    }
  }
}