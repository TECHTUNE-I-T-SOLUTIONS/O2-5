'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface PredictionDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prediction: {
    prediction_type?: string
    match: {
      utc_date: string
      home_team: { name: string; crest: string }
      away_team: { name: string; crest: string }
      competition: { name: string }
    }
    over_2_5_prob: number
    under_2_5_prob: number
    predicted_over_2_5: boolean
    win_draw_prob?: number
    predicted_win_draw?: boolean
    predicted_winner?: 'HOME' | 'AWAY' | 'DRAW' | null
    gg_prob?: number
    predicted_gg?: boolean
    confidence_score?: number
    analysis_explanation?: string
    criteria_met?: string[]
    ai_explanation?: string
    avg_home_goals?: number
    avg_away_goals?: number
    h2h_avg_goals?: number
    home_clean_sheet_pct?: number
    home_scoring_pct?: number
    home_form_strength?: number
    away_form_strength?: number
    defensive_strength?: number
    league_position_home?: number
    league_position_away?: number
    home_record_last_3?: string
    away_record_last_3?: string
  }
}

export function PredictionDetailsModal({
  open,
  onOpenChange,
  prediction
}: PredictionDetailsModalProps) {
  const predictionType = prediction.prediction_type || 'OVER_2_5'
  
  const getPredictionDisplay = () => {
    switch (predictionType) {
      case 'WIN_DRAW':
        let winDrawLabel = prediction.predicted_win_draw ? 'WIN/DRAW' : 'AWAY WIN'
        if (prediction.predicted_winner) {
          if (prediction.predicted_winner === 'HOME') {
            winDrawLabel = `${prediction.match.home_team.name} WIN/DRAW`
          } else if (prediction.predicted_winner === 'AWAY') {
            winDrawLabel = `${prediction.match.away_team.name} WIN/DRAW`
          } else if (prediction.predicted_winner === 'DRAW') {
            winDrawLabel = 'DRAW'
          }
        }
        return {
          label: winDrawLabel,
          probability: prediction.win_draw_prob || 0,
          positive: prediction.predicted_win_draw || false
        }
      case 'GG':
        return {
          label: prediction.predicted_gg ? 'YES - GG' : 'NO - GG',
          probability: prediction.gg_prob || 0,
          positive: prediction.predicted_gg || false
        }
      default:
        const over25 = prediction.over_2_5_prob || 0
        const under25 = prediction.under_2_5_prob || 0
        const isOver = prediction.predicted_over_2_5 || (over25 > under25)
        return {
          label: isOver ? 'OVER 2.5' : 'UNDER 2.5',
          probability: isOver ? over25 : under25,
          positive: isOver
        }
    }
  }

  const display = getPredictionDisplay()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold mb-2">
                {prediction.match.home_team.name} vs {prediction.match.away_team.name}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {prediction.match.competition.name} • Full Prediction Details
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="p-6 max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Prediction Summary */}
            <div className="bg-muted/50 rounded-xl p-4 border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold uppercase tracking-wide">
                  {predictionType === 'OVER_2_5' ? 'Over/Under 2.5' : predictionType === 'WIN_DRAW' ? 'Win/Draw' : 'Both Teams to Score'}
                </span>
                <Badge variant={display.positive ? 'default' : 'secondary'} className="text-sm font-bold">
                  {display.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-3xl font-black text-accent">
                    {display.probability}%
                  </div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                </div>
                {prediction.confidence_score !== undefined && (
                  <div className="flex-1">
                    <div className="text-3xl font-black text-foreground">
                      {prediction.confidence_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                )}
              </div>
            </div>

            {/* Criteria Met */}
            {prediction.criteria_met && prediction.criteria_met.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide">Criteria Analysis ({prediction.criteria_met.length} met)</h3>
                <div className="space-y-2">
                  {prediction.criteria_met.map((criterion, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      <span className="text-muted-foreground">{criterion}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  ✓ Minimum 2 criteria requirement met
                </div>
              </div>
            )}

            {/* Criteria Validation Summary */}
            <div className="bg-muted/50 rounded-lg p-4 border">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wide">Criteria Validation Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-1">Criteria Met</span>
                  <span className="text-lg font-bold text-green-500">{prediction.criteria_met?.length || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-1">Required Minimum</span>
                  <span className="text-lg font-bold">2</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-1">Confidence Score</span>
                  <span className="text-lg font-bold text-accent">{prediction.confidence_score || 0}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-1">Verdict Status</span>
                  <span className={`text-lg font-bold ${(prediction.criteria_met?.length || 0) >= 2 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {(prediction.criteria_met?.length || 0) >= 2 ? 'Valid' : 'Weak'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                {(prediction.criteria_met?.length || 0) >= 2 
                  ? '✓ This prediction meets the minimum 2 criteria requirement and is considered reliable.'
                  : '⚠ This prediction has weak criteria support. Use with caution.'}
              </div>
            </div>

            {/* Algorithm Analysis */}
            {prediction.analysis_explanation && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide">Algorithm Analysis</h3>
                <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                  {prediction.analysis_explanation}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            {prediction.ai_explanation && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span>AI Enhanced Analysis</span>
                  <Badge variant="outline" className="text-xs">✨ AI</Badge>
                </h3>
                <div className="bg-accent/10 rounded-lg p-4 text-sm border border-accent/20">
                  {prediction.ai_explanation}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div>
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wide">Key Statistics</h3>
              <div className="grid grid-cols-2 gap-3">
                {prediction.avg_home_goals !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Avg Home Goals</div>
                    <div className="text-lg font-bold">{prediction.avg_home_goals.toFixed(1)}</div>
                  </div>
                )}
                {prediction.avg_away_goals !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Avg Away Goals</div>
                    <div className="text-lg font-bold">{prediction.avg_away_goals.toFixed(1)}</div>
                  </div>
                )}
                {prediction.h2h_avg_goals !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">H2H Avg Goals</div>
                    <div className="text-lg font-bold">{prediction.h2h_avg_goals.toFixed(1)}</div>
                  </div>
                )}
                {prediction.home_clean_sheet_pct !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Home Clean Sheet %</div>
                    <div className="text-lg font-bold">{prediction.home_clean_sheet_pct.toFixed(0)}%</div>
                  </div>
                )}
                {prediction.home_form_strength !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Home Form Strength</div>
                    <div className="text-lg font-bold">{prediction.home_form_strength.toFixed(0)}</div>
                  </div>
                )}
                {prediction.away_form_strength !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Away Form Strength</div>
                    <div className="text-lg font-bold">{prediction.away_form_strength.toFixed(0)}</div>
                  </div>
                )}
                {prediction.defensive_strength !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Defensive Strength</div>
                    <div className="text-lg font-bold">{prediction.defensive_strength.toFixed(0)}</div>
                  </div>
                )}
                {prediction.league_position_home !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Home League Position</div>
                    <div className="text-lg font-bold">{prediction.league_position_home}</div>
                  </div>
                )}
                {prediction.league_position_away !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Away League Position</div>
                    <div className="text-lg font-bold">{prediction.league_position_away}</div>
                  </div>
                )}
                {prediction.home_record_last_3 && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Home Record (Last 3)</div>
                    <div className="text-lg font-bold">{prediction.home_record_last_3}</div>
                  </div>
                )}
                {prediction.away_record_last_3 && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Away Record (Last 3)</div>
                    <div className="text-lg font-bold">{prediction.away_record_last_3}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}