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
  const { match, over_2_5_prob, under_2_5_prob, predicted_over_2_5 } = prediction

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
            <div className={`p-3 rounded-xl border transition-all ${predicted_over_2_5 ? 'bg-accent/10 border-accent/40 shadow-inner' : 'bg-background border-border opacity-60'}`}>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase mb-1">Over 2.5</span>
                <span className={`text-lg font-black ${predicted_over_2_5 ? 'text-foreground' : 'text-muted-foreground'}`}>{over_2_5_prob}%</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl border transition-all ${!predicted_over_2_5 ? 'bg-accent/10 border-accent/40 shadow-inner' : 'bg-background border-border opacity-60'}`}>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase mb-1">Under 2.5</span>
                <span className={`text-lg font-black ${!predicted_over_2_5 ? 'text-foreground' : 'text-muted-foreground'}`}>{under_2_5_prob}%</span>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden border border-border/50">
            <div 
              className="bg-accent h-full transition-all duration-1000" 
              style={{ width: `${predicted_over_2_5 ? over_2_5_prob : under_2_5_prob}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center px-1">
            <div className="flex flex-col">
              <span className="text-[8px] text-muted-foreground uppercase font-bold">Home CS%</span>
              <span className="text-xs font-bold text-foreground">{prediction.home_clean_sheet_pct?.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-muted-foreground uppercase font-bold">AI Verdict</span>
              <span className="text-xs font-black text-accent uppercase">{predicted_over_2_5 ? 'OVER' : 'UNDER'} 2.5</span>
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
