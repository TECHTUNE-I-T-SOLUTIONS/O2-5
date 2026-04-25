'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'

interface Match {
  id: number
  utc_date: string
  status: string
  score_fulltime_home: number
  score_fulltime_away: number
  competition: { name: string; code: string }
  home_team: { name: string; crest: string }
  away_team: { name: string; crest: string }
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const observer = useRef<IntersectionObserver | null>(null)
  const lastMatchElementRef = useCallback((node: any) => {
    if (loading || loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMatches(true)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, loadingMore, hasMore])

  const fetchMatches = async (isMore = false) => {
    if (isMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({
        limit: '20',
        order: sortOrder,
        status: status,
        ...(isMore && cursor ? { cursor: cursor.toString() } : {})
      })

      const res = await fetch(`/api/matches?${params.toString()}`)
      const data = await res.json()

      if (isMore) {
        setMatches(prev => {
          const combined = [...prev, ...data.matches]
          // Deduplicate by ID
          const unique = Array.from(new Map(combined.map(m => [m.id, m])).values())
          return unique
        })
      } else {
        setMatches(data.matches)
      }

      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (err) {
      console.error('Failed to fetch matches:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [status, sortOrder])

  const filteredMatches = matches.filter(m => 
    m.home_team.name.toLowerCase().includes(search.toLowerCase()) ||
    m.away_team.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div>
              <h1 className="text-4xl font-black mb-2 tracking-tight">MATCH CENTER</h1>
              <p className="text-muted-foreground text-sm">Real-time fixtures and results from Tier 1 leagues.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search teams..." 
                  className="pl-9 w-64 bg-card border-border h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 border-border bg-card"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <FilterButton active={status === ''} onClick={() => setStatus('')} label="All Matches" />
            <FilterButton active={status === 'SCHEDULED'} onClick={() => setStatus('SCHEDULED')} label="Upcoming" />
            <FilterButton active={status === 'FINISHED'} onClick={() => setStatus('FINISHED')} label="Finished" />
            <FilterButton active={status === 'IN_PLAY'} onClick={() => setStatus('IN_PLAY')} label="Live" />
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground font-medium">Loading match data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match, index) => {
                const isLast = filteredMatches.length === index + 1
                return (
                  <div key={match.id} ref={isLast ? lastMatchElementRef : null}>
                    <MatchListItem match={match} />
                  </div>
                )
              })}
              
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              )}

              {filteredMatches.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">No matches found for this criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <Button 
      variant={active ? 'default' : 'outline'} 
      className={`rounded-full px-6 h-9 text-xs font-bold transition-all ${active ? 'bg-accent text-accent-foreground border-accent' : 'border-border bg-card hover:border-accent/50'}`}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

function MatchListItem({ match }: { match: Match }) {
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'

  return (
    <Card className="p-4 bg-card border-border hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-32">
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider bg-background">
            {match.competition.code}
          </Badge>
          <div className="text-[10px] text-muted-foreground font-bold flex-1 md:text-right">
            {format(new Date(match.utc_date), 'HH:mm')}
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-between gap-2 md:gap-8 w-full">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1 justify-end group-hover:translate-x-[-4px] transition-transform">
            <span className="text-xs md:text-sm font-black text-right line-clamp-1">{match.home_team.name}</span>
            <div className="w-10 h-10 p-1.5 bg-background rounded-lg border border-border shadow-sm flex-shrink-0">
              <img src={match.home_team.crest} alt="" className="w-full h-full object-contain" />
            </div>
          </div>
          
          {/* Score / VS */}
          <div className="flex flex-col items-center gap-1 min-w-[70px]">
            {isFinished || isLive ? (
              <div className={`text-xl font-black px-3 py-1 rounded-lg border ${isLive ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-muted/50 border-border'}`}>
                {match.score_fulltime_home} - {match.score_fulltime_away}
              </div>
            ) : (
              <div className="text-[10px] font-black text-muted-foreground/40 bg-muted/20 px-3 py-1 rounded-full border border-border/50 italic">
                VS
              </div>
            )}
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
              {isLive ? 'LIVE' : format(new Date(match.utc_date), 'MMM d')}
            </span>
          </div>
          
          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 group-hover:translate-x-[4px] transition-transform">
            <div className="w-10 h-10 p-1.5 bg-background rounded-lg border border-border shadow-sm flex-shrink-0">
              <img src={match.away_team.crest} alt="" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs md:text-sm font-black line-clamp-1">{match.away_team.name}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
