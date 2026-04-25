import { Card } from '@/components/ui/card'

interface LeaderboardEntry {
  userId: string
  wins: number
  totalPoints: number
  predictions: number
  username?: string
}

interface LeaderboardCardProps {
  entry: LeaderboardEntry
  rank: number
}

const getMedalIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return '🥇'
    case 2:
      return '🥈'
    case 3:
      return '🥉'
    default:
      return `#${rank}`
  }
}

export default function LeaderboardCard({ entry, rank }: LeaderboardCardProps) {
  const winPercentage = entry.predictions > 0
    ? Math.round((entry.wins / entry.predictions) * 100)
    : 0

  return (
    <Card className="bg-card border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-accent">
            {getMedalIcon(rank)}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {entry.username || `User ${entry.userId.slice(0, 8)}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {entry.predictions} predictions
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-accent">{entry.totalPoints}</p>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/50 rounded-md p-3">
          <p className="text-xs text-muted-foreground mb-1">Wins</p>
          <p className="text-lg font-bold text-foreground">{entry.wins}</p>
        </div>
        <div className="bg-secondary/50 rounded-md p-3">
          <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
          <p className="text-lg font-bold text-foreground">{winPercentage}%</p>
        </div>
      </div>
    </Card>
  )
}
