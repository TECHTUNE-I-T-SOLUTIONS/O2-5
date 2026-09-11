import { Suspense } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import PredictionCard from '@/components/predictions/prediction-card'
import RecentTestimonies from '@/components/testimonies/recent-testimonies'
import { getFdPredictions, getFdMatches } from '@/lib/supabase'
import SyncButton from '@/components/sync/sync-button'
import { EmptyState } from '@/components/skeleton-loader'


async function getUpcomingMatches() {
  try {
    // Get today's matches from Football-Data API
    const fdMatches = await getFdMatches(6)
    
    return {
      fd: fdMatches || [],
      total: fdMatches?.length || 0
    }
  } catch (error) {
    console.error('Error fetching matches:', error)
    return { fd: [], total: 0 }
  }
}

async function getOver25Predictions() {
  try {
    const predictions = await getFdPredictions(6, 0, 'OVER_2_5')
    return predictions || []
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return []
  }
}

async function getSyncStatus() {
  try {
    // Get current date in Nigerian time (UTC+1)
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const nigeriaTime = new Date(utc + (3600000 * 1))
    const nigeriaDate = nigeriaTime.toISOString().split('T')[0]
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sync/status?date=${nigeriaDate}`)
    const data = await res.json()
    return data.syncStatus || null
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return null
  }
}

async function getTopPredictors() {
  return [] // No longer using leaderboard
}

export default async function Home() {
  const [matchData, over25Predictions, syncStatus] = await Promise.all([
    getUpcomingMatches(),
    getOver25Predictions(),
    getSyncStatus()
  ])
  
  // Check if all prediction types are completed for today
  const completedTypes = syncStatus?.prediction_types_generated || []
  const allTypes = ['OVER_2_5', 'WIN_DRAW', 'GG']
  const isSyncComplete = allTypes.every(type => completedTypes.includes(type))

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background text-foreground">
        {/* Hero Section */}
        <div className="bg-muted/30 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight">O2-5 PREDICTION PLATFORM</h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl">Advanced AI-powered statistical analysis for Over/Under 2.5 goal markets.</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <Card className="bg-card border-border p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Today's Matches</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{matchData.total}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">From Tier 1 leagues</p>
            </Card>
            <Card className="bg-card border-border p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Algorithm Predictions</p>
              <p className="text-2xl sm:text-3xl font-bold text-accent mb-1">{over25Predictions.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Over 2.5 Goals ready</p>
            </Card>
            <Card className="bg-card border-border p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">System Status</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{isSyncComplete ? '✓ Ready' : 'Syncing'}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Daily predictions</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        
        {/* Over 2.5 Predictions Section */}
        <section className="mb-12 sm:mb-16" id="predictions">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-accent">AI Over 2.5 Predictions</h2>
              <p className="text-sm text-muted-foreground">High confidence picks from our algorithm</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <SyncButton isSyncComplete={isSyncComplete} />
              <Link href="/predictions" className="w-full sm:w-auto">
                <Button variant="ghost" className="text-accent w-full sm:w-auto">
                  All Predictions →
                </Button>
              </Link>
            </div>
          </div>

          <Suspense fallback={<LoadingMatchCards />}>
            {over25Predictions && over25Predictions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {over25Predictions.slice(0, 6).map((pred: any) => (
                  <PredictionCard key={pred.id} prediction={pred} />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No algorithm predictions"
                description="Click the 'Run All Predictions' button above to sync data and generate picks."
              />
            )}
          </Suspense>
        </section>

        {/* Win/Draw and GG Predictions Preview */}
        <section className="mb-12 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">More Prediction Types</h2>
              <p className="text-sm text-muted-foreground">Win/Draw and Both Teams to Score analysis</p>
            </div>
            <Link href="/predictions" className="w-full sm:w-auto">
              <Button variant="ghost" className="text-accent w-full sm:w-auto">
                View All Types →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6 bg-card border-border">
              <h3 className="text-base sm:text-lg font-bold mb-2 text-accent">Win/Draw Predictions</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">Based on team form, league position, and defensive strength.</p>
              <Link href="/predictions" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">View Win/Draw</Button>
              </Link>
            </Card>
            <Card className="p-4 sm:p-6 bg-card border-border">
              <h3 className="text-base sm:text-lg font-bold mb-2 text-accent">Both Teams to Score</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">Matches where both teams are likely to score based on offensive form.</p>
              <Link href="/predictions" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">View GG Predictions</Button>
              </Link>
            </Card>
          </div>
        </section>

        {/* Upcoming Matches (Football-Data) */}
        <section className="mb-12 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Today's Matches</h2>
              <p className="text-sm text-muted-foreground">Matches from Tier 1 Leagues</p>
            </div>
            <Link href="/matches" className="w-full sm:w-auto">
              <Button variant="ghost" className="text-accent w-full sm:w-auto">
                View All Matches →
              </Button>
            </Link>
          </div>

          <Suspense fallback={<LoadingMatchCards />}>
            {matchData.fd && matchData.fd.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {matchData.fd.map((match: any) => (
                  <Card key={match.id} className="p-3 sm:p-4 bg-card border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img src={match.home_team.crest} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-xs sm:text-sm font-medium truncate">{match.home_team.name}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-bold italic">VS</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-right truncate">{match.away_team.name}</span>
                      <img src={match.away_team.crest} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title="No upcoming matches" description="Sync the data to see fixtures." />
            )}
          </Suspense>
        </section>

        {/* Recent Testimonies Section */}
        <section className="mb-12 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Recent Testimonies</h2>
              <p className="text-sm text-muted-foreground">Community feedback on prediction outcomes</p>
            </div>
            <Link href="/testimonies" className="w-full sm:w-auto">
              <Button variant="ghost" className="text-accent w-full sm:w-auto">
                View All →
              </Button>
            </Link>
          </div>

          <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading testimonies...</div>}>
            <RecentTestimonies />
          </Suspense>
        </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

function LoadingMatchCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-3 sm:p-4 bg-card border-border animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-3 sm:h-4 bg-muted rounded w-16 sm:w-20" />
            <div className="h-3 sm:h-4 bg-muted rounded w-12 sm:w-16" />
          </div>
        </Card>
      ))}
    </div>
  )
}
