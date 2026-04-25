'use client'

import { Card } from '@/components/ui/card'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <Card className="p-6 bg-card hover:bg-secondary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        {icon && (
          <div className="text-accent ml-2">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
