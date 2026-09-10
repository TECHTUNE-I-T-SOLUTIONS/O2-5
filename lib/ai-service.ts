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
      return this.getFallbackAnalysis(predictionType)
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
    return this.getFallbackAnalysis(predictionType)
  }

  private buildAnalysisPrompt(matchData: any, predictionType: string): string {
    const { home_team, away_team, competition, utc_date } = matchData
    
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

    return `You are a football prediction analyst for the O2-5 Prediction Platform. 

Match: ${home_team.name} vs ${away_team.name}
Competition: ${competition.name}
Date: ${utc_date}

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

  private getFallbackAnalysis(predictionType: string): AIAnalysisResult {
    const fallbackMessages = {
      'OVER_2_5': 'Analysis based on recent scoring patterns and defensive statistics. Both teams show offensive potential based on historical data.',
      'WIN_DRAW': 'Analysis based on league positioning and recent form. Consider home advantage and head-to-head records.',
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