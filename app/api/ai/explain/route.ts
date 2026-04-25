import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  try {
    const { predictionId, messages } = await request.json()

    // 1. Fetch full prediction context
    const { data: prediction, error } = await supabase
      .from('fd_predictions')
      .select(`
        *,
        match:match_id(
          *,
          home_team:fd_teams!home_team_id(*),
          away_team:fd_teams!away_team_id(*),
          competition:fd_competitions!competition_id(*)
        )
      `)
      .eq('id', predictionId)
      .single()

    if (error || !prediction) {
      throw new Error('Prediction not found')
    }

    const systemPrompt = `
      You are an expert Football Analyst AI for the O2-5 Prediction Platform.
      Your goal is to explain why our algorithm predicted certain probabilities for Over 2.5 or Under 2.5 goals.
      
      MATCH CONTEXT:
      League: ${prediction.match.competition.name}
      Match: ${prediction.match.home_team.name} vs ${prediction.match.away_team.name}
      Date: ${prediction.match.utc_date}
      
      ALGORITHM STATS:
      Over 2.5 Probability: ${prediction.over_2_5_prob}%
      Under 2.5 Probability: ${prediction.under_2_5_prob}%
      Verdict: ${prediction.predicted_over_2_5 ? 'OVER 2.5' : 'UNDER 2.5'}
      
      CRITERIA STATS:
      - Home Season Avg Goals Scored/Conceded: ${prediction.avg_home_goals.toFixed(2)}
      - Away Season Avg Goals Scored/Conceded: ${prediction.avg_away_goals.toFixed(2)}
      - H2H Avg Goals: ${prediction.h2h_avg_goals.toFixed(2)}
      - Home Clean Sheet %: ${prediction.home_clean_sheet_pct}%
      - Home Scoring %: ${prediction.home_scoring_pct}%
      - Home Last 3 Games Goals: ${prediction.home_last_3_goals}
      - Away Last 3 Games Goals: ${prediction.away_last_3_goals}
      - Home Last 3 Games Conceded: ${prediction.home_last_3_conceded}
      - Away Last 3 Games Conceded: ${prediction.away_last_3_conceded}
      
      EXPLANATION STYLE:
      - Professional, data-driven, yet easy to understand.
      - Mention the specific "Over 2.5" criteria if the probability is high (e.g., many goals in last 3 matches).
      - Be honest about risks and variance in football.
      - Use markdown for formatting.
    `

    // Initialize model with system instruction correctly
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }]
      }
    })

    // Construct history ensuring it starts with 'user' role
    const history = (messages || []).slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }))

    // Gemini requires history to start with a user message
    if (history.length > 0 && history[0].role === 'model') {
      history.unshift({
        role: 'user',
        parts: [{ text: "Can you analyze this match for me?" }]
      })
    }

    const chat = model.startChat({ history })

    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : "Explain this match prediction to me based on the stats provided."

    const result = await chat.sendMessage(lastMessage)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ content: text })
  } catch (error: any) {
    console.error('Gemini AI Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
