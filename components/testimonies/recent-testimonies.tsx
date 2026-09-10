'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Check, X, Minus, MessageSquare } from 'lucide-react'

interface Testimony {
  id: number
  prediction_id: number
  outcome: string
  match_result: string | null
  user_comment: string | null
  anonymous_name: string
  created_at: string
}

export default function RecentTestimonies() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestimonies()
  }, [])

  const fetchTestimonies = async () => {
    try {
      const res = await fetch('/api/testimonies?limit=5')
      const data = await res.json()
      if (data.success) {
        setTestimonies(data.testimonies || [])
      }
    } catch (error) {
      console.error('Failed to fetch testimonies:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'CORRECT':
        return <Check className="h-4 w-4 text-green-500" />
      case 'INCORRECT':
        return <X className="h-4 w-4 text-red-500" />
      case 'PARTIAL':
        return <Minus className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'CORRECT':
        return 'text-green-500'
      case 'INCORRECT':
        return 'text-red-500'
      case 'PARTIAL':
        return 'text-yellow-500'
      default:
        return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Loading testimonies...</p>
      </div>
    )
  }

  if (testimonies.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center py-8">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No testimonies yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to share your prediction results!</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {testimonies.map((testimony) => (
        <Card key={testimony.id} className="p-4 bg-card border-border">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getOutcomeIcon(testimony.outcome)}
              <span className="text-xs font-bold">{testimony.anonymous_name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {new Date(testimony.created_at).toLocaleDateString()}
            </span>
          </div>
          
          {testimony.match_result && (
            <div className="mb-2">
              <span className="text-[10px] text-muted-foreground">Result: </span>
              <span className="text-xs font-bold">{testimony.match_result}</span>
            </div>
          )}
          
          {testimony.user_comment && (
            <p className="text-xs text-muted-foreground">{testimony.user_comment}</p>
          )}
        </Card>
      ))}
    </div>
  )
}
