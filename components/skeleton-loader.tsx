import { Card } from '@/components/ui/card'

export function MatchCardSkeleton() {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-secondary rounded w-24 animate-pulse" />
          <div className="h-4 bg-secondary rounded w-20 animate-pulse" />
        </div>

        <div className="space-y-3">
          <div className="h-3 bg-secondary rounded w-16 animate-pulse" />
          
          <div className="flex items-center justify-between gap-2">
            <div className="h-5 bg-secondary rounded w-24 animate-pulse flex-1" />
            <div className="h-8 bg-secondary rounded w-12 animate-pulse" />
            <div className="h-5 bg-secondary rounded w-24 animate-pulse flex-1" />
          </div>
        </div>

        <div className="h-9 bg-secondary rounded w-full animate-pulse" />
      </div>
    </Card>
  )
}

export function LeaderboardCardSkeleton() {
  return (
    <Card className="bg-card border-border p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-8 w-8 bg-secondary rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-secondary rounded w-24 animate-pulse" />
              <div className="h-3 bg-secondary rounded w-16 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="h-6 bg-secondary rounded w-16 animate-pulse" />
            <div className="h-3 bg-secondary rounded w-12 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-secondary rounded animate-pulse" />
          <div className="h-12 bg-secondary rounded animate-pulse" />
        </div>
      </div>
    </Card>
  )
}

export function StatsCardSkeleton() {
  return (
    <Card className="bg-card border-border p-4">
      <div className="space-y-3">
        <div className="h-4 bg-secondary rounded w-24 animate-pulse" />
        <div className="h-8 bg-secondary rounded w-16 animate-pulse" />
        <div className="h-3 bg-secondary rounded w-20 animate-pulse" />
      </div>
    </Card>
  )
}

export function EmptyState({ 
  title = "No data available",
  description = "Check back later for updates"
}: { 
  title?: string
  description?: string 
}) {
  return (
    <div className="col-span-full text-center py-12">
      <div className="text-6xl mb-4">📭</div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
