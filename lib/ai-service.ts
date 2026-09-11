import { GoogleGenerativeAI } from '@google/generative-ai'

// Model chain with free Gemini models - try in order until one works
// Updated with current valid Gemini models from Google AI
// NOTE: Add models here when you want to enable AI explanations
const MODEL_CHAIN: string[] = ['gemini-3.5-flash-lite', 'gemini-3.5-flash']

interface AIAnalysisResult {
  explanation: string
  model: string
  confidence: number
  keyFactors: string[]
}

export class FootballAIService {
  private genAI: GoogleGenerativeAI | null = null
  private aiEnabled: boolean = false

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey && apiKey !== 'your-gemini-api-key') {
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.aiEnabled = true
      console.log('[AI] Gemini AI service initialized')
    } else {
      console.log('[AI] Gemini AI service disabled - no valid API key')
    }
  }

  isConfigured(): boolean {
    return this.aiEnabled && this.genAI !== null
  }

  async analyzeMatch(matchData: any, predictionType: 'OVER_2_5' | 'WIN_DRAW' | 'GG'): Promise<AIAnalysisResult> {
    // Check if AI models are available
    if (MODEL_CHAIN.length === 0 || !this.isConfigured()) {
      console.log('[AI] No AI models available or not configured, using algorithm fallback')
      return this.getFallbackAnalysis(predictionType, matchData)
    }

    const prompt = this.buildAnalysisPrompt(matchData, predictionType)
    let lastError: Error | null = null

    for (const model of MODEL_CHAIN) {
      try {
        console.log(`[AI] Trying model: ${model}`)
        const result = await this.callModel(model, prompt)
        if (result) {
          console.log(`[AI] Successfully used model: ${model}`)
          return result
        }
      } catch (error) {
        lastError = error as Error
        console.warn(`[AI] Model ${model} failed:`, (error as Error).message)
        // Continue to next model
      }
    }

    // All models failed, return fallback
    console.error('[AI] All AI models failed, using fallback. Last error:', lastError?.message)
    return this.getFallbackAnalysis(predictionType, matchData)
  }

  private buildAnalysisPrompt(matchData: any, predictionType: string): string {
    const { home_team, away_team, competition, utc_date, algorithm_explanation, confidence_score, criteria_met, league_position_home, league_position_away, home_form_strength, away_form_strength, defensive_strength, home_record_last_3, away_record_last_3 } = matchData
    
    // Handle both string and object formats for team names
    const homeTeamName = typeof home_team === 'string' ? home_team : home_team?.name || 'Unknown'
    const awayTeamName = typeof away_team === 'string' ? away_team : away_team?.name || 'Unknown'
    const competitionName = typeof competition === 'string' ? competition : competition?.name || 'Unknown'
    
    let criteriaContext = ''
    
    switch (predictionType) {
      case 'OVER_2_5':
        criteriaContext = `
Criteria for Over 2.5:
- Both teams must score at least 2 goals in their last 3 games
- At least 2 of both teams' top scorers must be available for the game
- Both teams must be a goal conceding team in most of their games
- Both teams' best assist player must be available as well
This will work for Over 1.5 too
        `
        break
      case 'WIN_DRAW':
        criteriaContext = `
Criteria for Win or Draw:
- One of the two teams must have beaten at least 2 out of the top 5 teams on the league table
- One of the teams is among the top 4 teams on the league table
- One of the teams must be defensively strong not conceding goal at all in the last 3 to 2 games
- One of the teams is among the last 3 teams on the same league table
- If one of the teams hasn't lost at home in their last 3 games at home as well
        `
        break
      case 'GG':
        criteriaContext = `
Criteria for (GG) both teams to score:
- Both teams must have scored at least 2 goals in their last 2 to 3 games
- Both teams' top goal scorers must be available for the match
- Both teams' best assist provider must be available as well for the match
- Both teams must be a goal conceding team in their last 3 to 2 matches
        `
        break
    }

    // Build statistical context if available
    let statisticalContext = ''
    if (league_position_home || league_position_away) {
      statisticalContext += `
League Positions:
- Home Team: Position ${league_position_home || 'N/A'}
- Away Team: Position ${league_position_away || 'N/A'}
`
    }
    
    if (home_form_strength || away_form_strength) {
      statisticalContext += `
Form Strength (0-10):
- Home Team: ${home_form_strength || 'N/A'}
- Away Team: ${away_form_strength || 'N/A'}
`
    }
    
    if (defensive_strength) {
      statisticalContext += `
Defensive Strength: ${defensive_strength || 'N/A'}/100
`
    }
    
    if (home_record_last_3 || away_record_last_3) {
      statisticalContext += `
Recent Form (Last 3 matches):
- Home Team: ${home_record_last_3 || 'N/A'}
- Away Team: ${away_record_last_3 || 'N/A'}
`
    }
    
    if (criteria_met && criteria_met.length > 0) {
      statisticalContext += `
Criteria Met: ${criteria_met.join(', ')}
`
    }

    return `You are a football prediction analyst for the O2-5 Prediction Platform. 

Match: ${homeTeamName} vs ${awayTeamName}
Competition: ${competitionName}
Date: ${utc_date}

${statisticalContext}

Algorithm Analysis: ${algorithm_explanation || 'No algorithm analysis available'}
Algorithm Confidence: ${confidence_score || 'N/A'}%

${criteriaContext}

Please provide a concise analysis (max 200 words) for this ${predictionType} prediction. Include:
1. Key factors supporting the prediction
2. Any concerns or risks
3. Overall confidence level (0-100)

Format your response as:
Key Factors: [list 2-3 factors]
Analysis: [your analysis]
Confidence: [number]`
  }

  private async callModel(model: string, prompt: string): Promise<AIAnalysisResult | null> {
    try {
      const aiModel = this.genAI!.getGenerativeModel({ model })
      const result = await aiModel.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      if (!text || text.trim().length === 0) {
        return null
      }

      return this.parseAIResponse(text, model)
    } catch (error) {
      console.error(`[AI] Error calling model ${model}:`, error)
      return null
    }
  }

  private parseAIResponse(text: string, model: string): AIAnalysisResult {
    // Parse the structured response
    const keyFactorsMatch = text.match(/Key Factors:\s*(.*?)(?=\nAnalysis:|$)/s)
    const analysisMatch = text.match(/Analysis:\s*(.*?)(?=\nConfidence:|$)/s)
    const confidenceMatch = text.match(/Confidence:\s*(\d+)/)

    const keyFactors = keyFactorsMatch 
      ? keyFactorsMatch[1].split('\n').map(f => f.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
      : ['Statistical analysis based on recent form']

    const explanation = analysisMatch ? analysisMatch[1].trim() : text.trim()
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70

    return {
      explanation,
      model,
      confidence: Math.min(Math.max(confidence, 0), 100),
      keyFactors
    }
  }

  private getFallbackAnalysis(predictionType: string, matchData?: any): AIAnalysisResult {
    let winDrawMessage = 'Analysis based on league positioning and recent form. Consider home advantage and head-to-head records.'
    
    if (predictionType === 'WIN_DRAW' && matchData) {
      const homeTeam = typeof matchData?.home_team === 'string' ? matchData.home_team : matchData?.home_team?.name || 'Home team'
      const awayTeam = typeof matchData?.away_team === 'string' ? matchData.away_team : matchData?.away_team?.name || 'Away team'
      const homePos = matchData?.league_position_home
      const awayPos = matchData?.league_position_away
      
      if (homePos && awayPos) {
        if (homePos < awayPos) {
          winDrawMessage = `${homeTeam} has better league position (${homePos} vs ${awayPos}) and recent form suggests they are more likely to win or draw.`
        } else if (awayPos < homePos) {
          winDrawMessage = `${awayTeam} has better league position (${awayPos} vs ${homePos}) and recent form suggests they are more likely to win or draw.`
        } else {
          winDrawMessage = `Both ${homeTeam} and ${awayTeam} have similar league positions (${homePos}), making this a competitive match likely to end in a draw or close result.`
        }
      } else {
        winDrawMessage = `Analysis for ${homeTeam} vs ${awayTeam} based on available data. Consider home advantage and recent form patterns.`
      }
    }
    
    const fallbackMessages = {
      'OVER_2_5': 'Analysis based on recent scoring patterns and defensive statistics. Both teams show offensive potential based on historical data.',
      'WIN_DRAW': winDrawMessage,
      'GG': 'Analysis based on both teams\' scoring records and defensive vulnerabilities. Recent form suggests both teams may find the net.'
    }

    return {
      explanation: fallbackMessages[predictionType] || 'Statistical analysis based on available data.',
      model: 'fallback',
      confidence: 65,
      keyFactors: ['Historical performance data', 'Recent team form']
    }
  }
}

// Singleton instance
export const aiService = new FootballAIService()