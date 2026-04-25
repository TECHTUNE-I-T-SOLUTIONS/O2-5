'use client'

import { useState } from 'react'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  league: string
}

interface PredictionFormProps {
  match: Match
  onSubmit: (prediction: {
    matchId: string
    prediction: 'home' | 'draw' | 'away'
    confidence: number
  }) => Promise<void>
}

export function PredictionForm({ match, onSubmit }: PredictionFormProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<'home' | 'draw' | 'away' | null>(null)
  const [confidence, setConfidence] = useState(50)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPrediction) return

    try {
      setIsLoading(true)
      await onSubmit({
        matchId: match.id,
        prediction: selectedPrediction,
        confidence,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div>
        <h3 className="font-semibold text-foreground">
          {match.homeTeam} vs {match.awayTeam}
        </h3>
        <p className="text-sm text-muted-foreground">{match.league}</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Your Prediction</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: match.homeTeam, value: 'home' as const },
            { label: 'Draw', value: 'draw' as const },
            { label: match.awayTeam, value: 'away' as const },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedPrediction(option.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                selectedPrediction === option.value
                  ? 'bg-accent text-accent-foreground'
                  : 'border border-border bg-secondary text-foreground hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="confidence" className="text-sm font-medium text-foreground">
            Confidence
          </label>
          <span className="text-sm font-semibold text-accent">{confidence}%</span>
        </div>
        <input
          id="confidence"
          type="range"
          min="10"
          max="100"
          step="10"
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <button
        type="submit"
        disabled={!selectedPrediction || isLoading}
        className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? 'Submitting...' : 'Make Prediction'}
      </button>
    </form>
  )
}
