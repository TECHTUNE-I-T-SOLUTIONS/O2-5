'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import LeaderboardCard from '@/components/leaderboard/leaderboard-card'
import { LeaderboardCardSkeleton, EmptyState } from '@/components/skeleton-loader'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard')
        const data = await res.json()
        setLeaderboard(data)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Global Leaderboard</h1>
          <p className="text-muted-foreground mt-2">See who&apos;s the best predictor</p>
        </div>

        {/* Main Content */}
        {/* Top 3 Podium */}
        {!loading && leaderboard.length >= 1 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Top Predictors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* 2nd Place */}
              {leaderboard[1] && (
                <div className="order-first md:order-none">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-2">🥈</div>
                    <p className="text-2xl font-bold text-foreground">
                      {leaderboard[1].username || `User ${leaderboard[1].userId.slice(0, 8)}`}
                    </p>
                  </div>
                  <div className="bg-card border-2 border-border rounded-lg p-6 text-center">
                    <p className="text-4xl font-bold text-accent mb-2">{leaderboard[1].totalPoints}</p>
                    <p className="text-sm text-muted-foreground mb-3">points</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Wins</p>
                        <p className="font-bold text-foreground">{leaderboard[1].wins}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Accuracy</p>
                        <p className="font-bold text-foreground">
                          {leaderboard[1].predictions > 0
                            ? Math.round((leaderboard[1].wins / leaderboard[1].predictions) * 100)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              <div className="md:order-first">
                <div className="text-center mb-4">
                  <div className="text-8xl mb-2">🥇</div>
                  <p className="text-2xl font-bold text-accent">
                    {leaderboard[0].username || `User ${leaderboard[0].userId.slice(0, 8)}`}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-accent/20 to-accent/10 border-2 border-accent rounded-lg p-6 text-center">
                  <p className="text-5xl font-bold text-accent mb-2">{leaderboard[0].totalPoints}</p>
                  <p className="text-sm text-muted-foreground mb-3">points</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Wins</p>
                      <p className="font-bold text-foreground">{leaderboard[0].wins}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Accuracy</p>
                      <p className="font-bold text-foreground">
                        {leaderboard[0].predictions > 0
                          ? Math.round((leaderboard[0].wins / leaderboard[0].predictions) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              {leaderboard[2] && (
                <div className="order-last md:order-none">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-2">🥉</div>
                    <p className="text-2xl font-bold text-foreground">
                      {leaderboard[2].username || `User ${leaderboard[2].userId.slice(0, 8)}`}
                    </p>
                  </div>
                  <div className="bg-card border-2 border-border rounded-lg p-6 text-center">
                    <p className="text-4xl font-bold text-accent mb-2">{leaderboard[2].totalPoints}</p>
                    <p className="text-sm text-muted-foreground mb-3">points</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Wins</p>
                        <p className="font-bold text-foreground">{leaderboard[2].wins}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Accuracy</p>
                        <p className="font-bold text-foreground">
                          {leaderboard[2].predictions > 0
                            ? Math.round((leaderboard[2].wins / leaderboard[2].predictions) * 100)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        {!loading && leaderboard.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Full Rankings</h2>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <LeaderboardCard key={entry.userId} entry={entry} rank={index + 1} />
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <LeaderboardCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No predictions yet"
            description="Be the first to make a prediction and claim the top spot!"
          />
        )}
      </main>
      <Footer />
    </>
  )
}
