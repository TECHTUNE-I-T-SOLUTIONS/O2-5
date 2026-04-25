import { Suspense } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import MatchCard from '@/components/matches/match-card'
import LeaderboardCard from '@/components/leaderboard/leaderboard-card'
import PredictionCard from '@/components/predictions/prediction-card'
import { MatchCardSkeleton, LeaderboardCardSkeleton, EmptyState } from '@/components/skeleton-loader'
import { getFixtures, getLeaderboard, getFdPredictions, getFdMatches } from '@/lib/supabase'

async function getUpcomingMatches() {
  try {
    // Get from both APIs
    const [afMatches, fdMatches] = await Promise.all([
      getFixtures('NS', 3),
      getFdMatches(3)
    ])
    
    // Combine and format for display (MatchCard expects API-Football format or we adapt it)
    // For now, let's just count them for the stats
    return {
      af: afMatches || [],
      fd: fdMatches || [],
      total: (afMatches?.length || 0) + (fdMatches?.length || 0)
    }
  } catch (error) {
    console.error('Error fetching matches:', error)
    return { af: [], fd: [], total: 0 }
  }
}

async function getOver25Predictions() {
  try {
    const predictions = await getFdPredictions(6)
    return predictions || []
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return []
  }
}

async function getTopPredictors() {
  try {
    const leaderboard = await getLeaderboard(5)
    return leaderboard || []
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}

export default async function Home() {
  const [matchData, leaderboard, over25Predictions] = await Promise.all([
    getUpcomingMatches(),
    getTopPredictors(),
    getOver25Predictions()
  ])

  const totalPredictions = leaderboard.reduce((sum: number, entry: any) => sum + (entry.predictions || 0), 0)
  const leaguesCount = matchData.af.length > 0 ? new Set(matchData.af.map((m: any) => m.league?.id)).size : 0

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background text-foreground">
        {/* Hero Section */}
        <div className="bg-muted/30 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-5xl font-black mb-4 tracking-tight">O2-5 PREDICTION PLATFORM</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">Advanced AI-powered statistical analysis for Over/Under 2.5 goal markets.</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="bg-card border-border p-6">
              <p className="text-sm text-muted-foreground mb-2">Upcoming Matches</p>
              <p className="text-3xl font-bold text-foreground mb-1">{matchData.total}</p>
              <p className="text-xs text-muted-foreground">Across all synced APIs</p>
            </Card>
            <Card className="bg-card border-border p-6">
              <p className="text-sm text-muted-foreground mb-2">Algorithm Predictions</p>
              <p className="text-3xl font-bold text-accent mb-1">{over25Predictions.length}</p>
              <p className="text-xs text-muted-foreground">Over 2.5 Goals ready</p>
            </Card>
            <Card className="bg-card border-border p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Predictions</p>
              <p className="text-3xl font-bold text-foreground mb-1">{totalPredictions}</p>
              <p className="text-xs text-muted-foreground">By community</p>
            </Card>
            <Card className="bg-card border-border p-6">
              <p className="text-sm text-muted-foreground mb-2">Leaderboard Users</p>
              <p className="text-3xl font-bold text-foreground mb-1">{leaderboard.length}</p>
              <p className="text-xs text-muted-foreground">Active predictors</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Over 2.5 Predictions Section */}
        <section className="mb-16" id="predictions">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-accent">AI Over 2.5 Predictions</h2>
              <p className="text-muted-foreground">High confidence picks from our algorithm</p>
            </div>
            <Link href="/predictions">
              <Button variant="ghost" className="text-accent">
                All Predictions →
              </Button>
            </Link>
          </div>

          <Suspense fallback={<LoadingMatchCards />}>
            {over25Predictions && over25Predictions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {over25Predictions.map((pred: any) => (
                  <PredictionCard key={pred.id} prediction={pred} />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No algorithm predictions"
                description="Click the 'Update Predictions Now' button above to sync data and generate picks."
              />
            )}
          </Suspense>
        </section>

        {/* Upcoming Matches (Football-Data) */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Upcoming Matches</h2>
              <p className="text-muted-foreground">Matches from Tier 1 Leagues</p>
            </div>
            <Link href="/matches">
              <Button variant="ghost" className="text-accent">
                View All Matches →
              </Button>
            </Link>
          </div>

          <Suspense fallback={<LoadingMatchCards />}>
            {matchData.fd && matchData.fd.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchData.fd.map((match: any) => (
                  <Card key={match.id} className="p-4 bg-card border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={match.home_team.crest} alt="" className="w-6 h-6" />
                      <span className="text-sm font-medium">{match.home_team.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-bold italic">VS</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-right">{match.away_team.name}</span>
                      <img src={match.away_team.crest} alt="" className="w-6 h-6" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title="No upcoming matches" description="Sync the data to see fixtures." />
            )}
          </Suspense>
        </section>

        {/* Leaderboard Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Community Leaderboard</h2>
              <p className="text-muted-foreground">See how your manual predictions compare</p>
            </div>
            <Link href="/leaderboard">
              <Button variant="ghost" className="text-accent">
                Full Leaderboard →
              </Button>
            </Link>
          </div>

          <Suspense fallback={<LoadingLeaderboard />}>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {leaderboard.map((entry: any, index: number) => (
                  <LeaderboardCard key={entry.userId || index} entry={entry} rank={index + 1} />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No predictors yet"
                description="Make a manual prediction on any match to join the leaderboard!"
              />
            )}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  )
}

function LoadingLeaderboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <LeaderboardCardSkeleton key={i} />
      ))}
    </div>
  )
}
