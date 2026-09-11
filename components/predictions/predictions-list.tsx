'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import PredictionCard from '@/components/predictions/prediction-card'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Search, Filter, ArrowUpDown, Loader2 } from 'lucide-react'

interface PredictionsListProps {
  initialPredictions: any[]
  predictionType?: 'OVER_2_5' | 'WIN_DRAW' | 'GG'
}

export default function PredictionsList({ initialPredictions, predictionType = 'OVER_2_5' }: PredictionsListProps) {
  const [predictions, setPredictions] = useState(initialPredictions)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_asc')
  
  // Pagination state
  const [offset, setOffset] = useState(initialPredictions.length)
  const [hasMore, setHasMore] = useState(initialPredictions.length >= 20)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return
    
    setIsLoadingMore(true)
    try {
      const typeParam = predictionType ? `&type=${predictionType}` : ''
      const res = await fetch(`/api/predictions?limit=20&offset=${offset}${typeParam}`)
      const newData = await res.json()
      
      if (newData && newData.length > 0) {
        setPredictions(prev => [...prev, ...newData])
        setOffset(prev => prev + newData.length)
        if (newData.length < 20) setHasMore(false)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more predictions:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !searchTerm) {
          loadMore()
        }
      },
      { threshold: 1.0 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, offset, searchTerm])

  const filteredAndSortedPredictions = useMemo(() => {
    let result = [...predictions]

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(p => 
        p.match.home_team.name.toLowerCase().includes(term) ||
        p.match.away_team.name.toLowerCase().includes(term) ||
        p.match.competition.name.toLowerCase().includes(term)
      )
    }

    // Filter
    if (statusFilter !== 'all') {
      if (predictionType === 'OVER_2_5') {
        const isOver = statusFilter === 'over'
        result = result.filter(p => p.predicted_over_2_5 === isOver)
      } else if (predictionType === 'WIN_DRAW') {
        const isWinDraw = statusFilter === 'yes'
        result = result.filter(p => p.predicted_win_draw === isWinDraw)
      } else if (predictionType === 'GG') {
        const isGG = statusFilter === 'yes'
        result = result.filter(p => p.predicted_gg === isGG)
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date_asc') {
        return new Date(a.match.utc_date).getTime() - new Date(b.match.utc_date).getTime()
      }
      if (sortBy === 'date_desc') {
        return new Date(b.match.utc_date).getTime() - new Date(a.match.utc_date).getTime()
      }
      if (sortBy === 'prob_desc') {
        const probA = predictionType === 'OVER_2_5' ? a.over_2_5_prob : 
                     predictionType === 'WIN_DRAW' ? a.win_draw_prob : 
                     predictionType === 'GG' ? a.gg_prob : 0
        const probB = predictionType === 'OVER_2_5' ? b.over_2_5_prob : 
                     predictionType === 'WIN_DRAW' ? b.win_draw_prob : 
                     predictionType === 'GG' ? b.gg_prob : 0
        return probB - probA
      }
      if (sortBy === 'prob_asc') {
        const probA = predictionType === 'OVER_2_5' ? a.over_2_5_prob : 
                     predictionType === 'WIN_DRAW' ? a.win_draw_prob : 
                     predictionType === 'GG' ? a.gg_prob : 0
        const probB = predictionType === 'OVER_2_5' ? b.over_2_5_prob : 
                     predictionType === 'WIN_DRAW' ? b.win_draw_prob : 
                     predictionType === 'GG' ? b.gg_prob : 0
        return probA - probB
      }
      return 0
    })

    return result
  }, [predictions, searchTerm, statusFilter, sortBy])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-card p-3 sm:p-4 rounded-2xl border border-border sticky top-16 sm:top-20 z-10 shadow-sm backdrop-blur-md bg-card/90">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search teams or leagues..." 
            className="pl-10 bg-muted/50 border-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] bg-muted/50 border-none text-sm">
              <Filter className="mr-2 h-4 w-4 text-accent" />
              <SelectValue placeholder="Verdict" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verdicts</SelectItem>
              {predictionType === 'OVER_2_5' ? (
                <>
                  <SelectItem value="over">Over 2.5</SelectItem>
                  <SelectItem value="under">Under 2.5</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] bg-muted/50 border-none text-sm">
              <ArrowUpDown className="mr-2 h-4 w-4 text-accent" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_asc">Date (Soonest)</SelectItem>
              <SelectItem value="date_desc">Date (Latest)</SelectItem>
              <SelectItem value="prob_desc">Confidence (High)</SelectItem>
              <SelectItem value="prob_asc">Confidence (Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {filteredAndSortedPredictions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredAndSortedPredictions.map((pred: any) => (
              <div key={pred.id} className="flex flex-col gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PredictionCard prediction={pred} />
                <div className="bg-card/30 border border-border/50 rounded-xl p-3 sm:p-4 text-[10px] space-y-2 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium uppercase tracking-wider">H2H Avg Goals</span>
                    <span className="font-black text-foreground">{(pred.h2h_avg_goals || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium uppercase tracking-wider">Probability</span>
                    <span className={`font-black px-2 py-0.5 rounded-md ${
                      (predictionType === 'OVER_2_5' ? pred.over_2_5_prob : 
                       predictionType === 'WIN_DRAW' ? pred.win_draw_prob : 
                       predictionType === 'GG' ? pred.gg_prob : 0) > 70 
                      ? 'bg-green-500/10 text-green-500' : 'bg-accent/10 text-accent'
                    }`}>
                      {predictionType === 'OVER_2_5' ? pred.over_2_5_prob : 
                       predictionType === 'WIN_DRAW' ? pred.win_draw_prob : 
                       predictionType === 'GG' ? pred.gg_prob : 0}%
                    </span>
                  </div>
                  {pred.confidence_score > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium uppercase tracking-wider">AI Confidence</span>
                      <span className="font-black text-foreground">{pred.confidence_score}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Infinite Scroll Loader Trigger */}
          {hasMore && !searchTerm && (
            <div ref={loaderRef} className="py-8 sm:py-12 flex justify-center">
              {isLoadingMore && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-accent animate-spin" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest">Loading more matches...</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="py-16 sm:py-20 text-center">
          <p className="text-sm text-muted-foreground">No matches match your filters.</p>
        </div>
      )}
    </div>
  )
}
