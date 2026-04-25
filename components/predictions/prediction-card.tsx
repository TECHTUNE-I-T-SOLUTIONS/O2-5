import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import AIExplainer from '@/components/ai/ai-explainer'

interface PredictionCardProps {
  prediction: {
    id: number
    match: {
      utc_date: string
      home_team: { name: string; crest: string }
      away_team: { name: string; crest: string }
      competition: { name: string }
    }
    over_2_5_prob: number
    under_2_5_prob: number
    predicted_over_2_5: boolean
    avg_home_goals: number
    avg_away_goals: number
    home_clean_sheet_pct?: number
  }
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  // Deep scan for probability values to handle any potential naming or case-sensitivity issues
  const getVal = (obj: any, ...keys: string[]) => {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key]
    }
    // Fallback: scan all keys case-insensitively
    const lowerKeys = Object.keys(obj).map(k => k.toLowerCase())
    for (const search of keys) {
      const foundIdx = lowerKeys.indexOf(search.toLowerCase())
      if (foundIdx !== -1) return obj[Object.keys(obj)[foundIdx]]
    }
    return 0
  }

  const rawOver = getVal(prediction, 'over_2_5_prob', 'over_2_5_probability', 'probability')
  const rawUnder = getVal(prediction, 'under_2_5_prob', 'under_2_5_probability', 'under_probability')
  
  const over25 = Math.round(parseFloat(rawOver.toString() || '0'))
  const under25 = Math.round(parseFloat(rawUnder.toString() || '0'))
  const isOver = prediction.predicted_over_2_5 ?? (over25 > under25)
  const { match } = prediction

  return (
    <Card className="bg-card border-border overflow-hidden hover:border-accent transition-all duration-300 group">
      <div className="p-4 border-b border-border bg-muted/50 group-hover:bg-accent/5 transition-colors">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
            {match.competition.name}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
            {format(new Date(match.utc_date), 'MMM d, HH:mm')}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-8 gap-4">
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="relative w-14 h-14 p-2 bg-background rounded-xl border border-border shadow-sm group-hover:shadow-accent/20 transition-all">
              <img 
                src={match.home_team.crest} 
                alt={match.home_team.name}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xs font-bold text-center line-clamp-1 h-8 flex items-center">{match.home_team.name}</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-muted-foreground/30 italic">VS</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="relative w-14 h-14 p-2 bg-background rounded-xl border border-border shadow-sm group-hover:shadow-accent/20 transition-all">
              <img 
                src={match.away_team.crest} 
                alt={match.away_team.name}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xs font-bold text-center line-clamp-1 h-8 flex items-center">{match.away_team.name}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Over/Under Toggle-like Display */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-3 rounded-xl border transition-all ${isOver ? 'bg-accent/10 border-accent/40 shadow-inner' : 'bg-background border-border opacity-60'}`}>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase mb-1">Over 2.5</span>
                <span className={`text-lg font-black ${isOver ? 'text-foreground' : 'text-muted-foreground'}`}>{over25}%</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl border transition-all ${!isOver ? 'bg-accent/10 border-accent/40 shadow-inner' : 'bg-background border-border opacity-60'}`}>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase mb-1">Under 2.5</span>
                <span className={`text-lg font-black ${!isOver ? 'text-foreground' : 'text-muted-foreground'}`}>{under25}%</span>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden border border-border/50">
            <div 
              className="bg-accent h-full transition-all duration-1000" 
              style={{ width: `${isOver ? over25 : under25}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center px-1">
            <div className="flex flex-col">
              <span className="text-[8px] text-muted-foreground uppercase font-bold">Home GS%</span>
              <span className="text-xs font-bold text-foreground">
                {Math.round(parseFloat((prediction as any).home_scoring_pct || 0))}%
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-muted-foreground uppercase font-bold">Home CS%</span>
              <span className="text-xs font-bold text-foreground">
                {Math.round(parseFloat((prediction as any).home_clean_sheet_pct || 0))}%
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-muted-foreground uppercase font-bold">AI Verdict</span>
              <span className="text-xs font-black text-accent uppercase">{isOver ? 'OVER' : 'UNDER'} 2.5</span>
            </div>
          </div>

          <AIExplainer 
            predictionId={prediction.id} 
            homeTeam={match.home_team.name} 
            awayTeam={match.away_team.name} 
          />
        </div>
      </div>
    </Card>
  )
}
