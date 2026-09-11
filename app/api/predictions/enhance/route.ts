import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aiService } from '@/lib/ai-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const { predictionId } = await request.json()
    
    if (!predictionId) {
      return NextResponse.json({ success: false, error: 'predictionId is required' }, { status: 400 })
    }

    // Fetch the prediction with match details
    const { data: prediction, error: fetchError } = await supabase
      .from('fd_predictions')
      .select(`
        *,
        fd_matches (
          id,
          utc_date,
          status,
          home_team_id,
          away_team_id,
          score_fulltime_home,
          score_fulltime_away
        )
      `)
      .eq('id', predictionId)
      .single()

    if (fetchError || !prediction) {
      return NextResponse.json({ success: false, error: 'Prediction not found' }, { status: 404 })
    }

    // Fetch team names separately
    const match = prediction.fd_matches
    const { data: homeTeam } = await supabase
      .from('fd_teams')
      .select('name')
      .eq('id', match.home_team_id)
      .single()
    
    const { data: awayTeam } = await supabase
      .from('fd_teams')
      .select('name')
      .eq('id', match.away_team_id)
      .single()

    const matchData = {
      home_team: { name: homeTeam?.name || 'Unknown' },
      away_team: { name: awayTeam?.name || 'Unknown' },
      competition: { name: 'Football' },
      utc_date: match.utc_date,
      prediction_type: prediction.prediction_type,
      algorithm_explanation: prediction.analysis_explanation,
      confidence_score: prediction.confidence_score,
      criteria_met: prediction.criteria_met,
      league_position_home: prediction.league_position_home,
      league_position_away: prediction.league_position_away,
      home_form_strength: prediction.home_form_strength,
      away_form_strength: prediction.away_form_strength,
      defensive_strength: prediction.defensive_strength,
      home_record_last_3: prediction.home_record_last_3,
      away_record_last_3: prediction.away_record_last_3
    }

    // Generate AI explanation
    const aiAnalysis = await aiService.analyzeMatch(matchData, prediction.prediction_type as any)

    // Update the prediction with AI explanation
    const { error: updateError } = await supabase
      .from('fd_predictions')
      .update({
        ai_explanation: aiAnalysis.explanation,
        ai_enhanced_at: new Date().toISOString(),
        ai_model_used: 'enhanced'
      })
      .eq('id', predictionId)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      aiExplanation: aiAnalysis.explanation,
      aiConfidence: aiAnalysis.confidence,
      aiKeyFactors: aiAnalysis.keyFactors
    })
  } catch (error: any) {
    console.error('AI Enhancement Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
