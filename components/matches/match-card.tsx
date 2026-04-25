import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MatchCardProps {
  match: {
    id: number
    fixture_date: string
    status: string
    home_goals?: number
    away_goals?: number
    home_team?: { id: number; name: string; logo?: string }
    away_team?: { id: number; name: string; logo?: string }
    league?: { id: number; name: string; country?: string }
  }
}

export default function MatchCard({ match }: MatchCardProps) {
  const matchDate = new Date(match.fixture_date)
  const isLive = match.status === 'LIVE'
  const isFinished = ['FT', 'AET', 'PEN'].includes(match.status)
  const isScheduled = ['NS', 'PM'].includes(match.status)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Link href={`/fixtures/${match.id}`}>
      <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer overflow-hidden">
        <div className="p-4">
          {/* League & Date */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <span className="text-muted-foreground">{match.league?.name || 'League'}</span>
            <span className="text-muted-foreground">{formatDate(matchDate)}</span>
          </div>

          {/* Status Badge */}
          {(isLive || isFinished) && (
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
              isLive
                ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                : 'bg-green-500/20 text-green-600 dark:text-green-400'
            }`}>
              {isLive ? 'LIVE' : 'FINISHED'}
            </div>
          )}

          {/* Match Info */}
          <div className="flex items-center justify-between gap-2 mb-4">
            {/* Home Team */}
            <div className="flex-1 text-right">
              <p className="font-semibold text-sm truncate">{match.home_team?.name || 'Team A'}</p>
            </div>

            {/* Score/Time */}
            <div className="flex flex-col items-center justify-center min-w-16">
              {isFinished ? (
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-foreground">{match.home_goals ?? '-'}</span>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-2xl font-bold text-foreground">{match.away_goals ?? '-'}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{formatTime(matchDate)}</p>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm truncate">{match.away_team?.name || 'Team B'}</p>
            </div>
          </div>

          {/* Action Button */}
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-[#fe00c5]/90"
            size="sm"
          >
            {isFinished ? 'View Details' : isLive ? 'Watch Live' : 'Make Prediction'}
          </Button>
        </div>
      </Card>
    </Link>
  )
}
