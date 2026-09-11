'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import PredictionsList from '@/components/predictions/predictions-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function PredictionsPage() {
  const [over25Predictions, setOver25Predictions] = useState<any[]>([])
  const [winDrawPredictions, setWinDrawPredictions] = useState<any[]>([])
  const [ggPredictions, setGgPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [syncComplete, setSyncComplete] = useState(false)
  
  // Get current date in Nigerian time (UTC+1)
  const getNigerianDate = () => {
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const nigeriaTime = new Date(utc + (3600000 * 1)) // UTC+1
    return nigeriaTime.toISOString().split('T')[0]
  }
  
  const currentNigerianDate = getNigerianDate()

  const fetchPredictions = async () => {
    setDataLoading(true)
    try {
      const dateParam = `&date=${currentNigerianDate}`
      const [over25, winDraw, gg] = await Promise.all([
        fetch(`/api/predictions?limit=50&type=OVER_2_5${dateParam}`).then(r => r.json()),
        fetch(`/api/predictions?limit=50&type=WIN_DRAW${dateParam}`).then(r => r.json()),
        fetch(`/api/predictions?limit=50&type=GG${dateParam}`).then(r => r.json())
      ])
      setOver25Predictions(over25 || [])
      setWinDrawPredictions(winDraw || [])
      setGgPredictions(gg || [])
    } catch (error) {
      console.error('Failed to fetch predictions:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const checkSyncStatus = async () => {
    try {
      const res = await fetch(`/api/sync/status?date=${currentNigerianDate}`)
      const data = await res.json()
      if (data.success && data.syncStatus) {
        const completedTypes = data.syncStatus.prediction_types_generated || []
        const allTypes = ['OVER_2_5', 'WIN_DRAW', 'GG']
        setSyncComplete(allTypes.every(type => completedTypes.includes(type)))
      }
    } catch (error) {
      console.error('Failed to check sync status:', error)
    }
  }

  const generatePredictions = async () => {
    setLoading(true)
    setMessage('🔄 Starting data sync and predictions...')
    try {
      const res = await fetch('/api/sync/football-data', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        if (data.alreadyComplete) {
          setMessage('✓ Predictions already generated for today')
          setSyncComplete(true)
        } else {
          const details = []
          if (data.usedFallback) details.push('API-Football fallback')
          if (data.successRate) details.push(`${data.successRate} predictions completed`)
          
          setMessage(`✓ ${data.message}${details.length > 0 ? ` (${details.join(', ')})` : ''}`)
          
          setTimeout(() => {
            fetchPredictions()
            checkSyncStatus()
            setMessage('')
          }, 3000)
        }
      } else {
        setMessage(`✗ Failed: ${data.error}`)
      }
    } catch (error) {
      setMessage(`✗ Error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPredictions()
    checkSyncStatus()
  }, [])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 sm:mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-accent">Algorithm Predictions</h1>
              <p className="text-sm text-muted-foreground">Advanced AI-powered predictions for multiple markets based on statistical analysis.</p>
              <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">{format(new Date(currentNigerianDate), 'EEEE, MMMM d, yyyy')} (Nigerian Time)</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
              <Button 
                onClick={generatePredictions}
                disabled={loading || dataLoading || syncComplete}
                className={`${syncComplete ? 'bg-green-600 hover:bg-green-700' : 'bg-accent text-accent-foreground hover:bg-accent/90'} w-full sm:w-auto min-w-[140px] sm:min-w-[180px]`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : syncComplete ? (
                  <>
                    ✓ Already Generated
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Predictions
                  </>
                )}
              </Button>
              {message && (
                <div className={`text-[10px] sm:text-xs max-w-full sm:max-w-xs text-right px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${
                  message.startsWith('✓') 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                    : message.startsWith('✗')
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                    : 'bg-accent/10 text-accent border border-accent/20'
                }`}>
                  <span className="truncate block">{message}</span>
                </div>
              )}
            </div>
          </div>

          {dataLoading ? (
            <div className="py-16 sm:py-20 text-center">
              <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-accent animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading predictions...</p>
            </div>
          ) : (
            <Tabs defaultValue="over25" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8">
                <TabsTrigger value="over25" className="text-xs sm:text-sm">Over 2.5 Goals</TabsTrigger>
                <TabsTrigger value="windraw" className="text-xs sm:text-sm">Win/Draw</TabsTrigger>
                <TabsTrigger value="gg" className="text-xs sm:text-sm">Both Teams to Score</TabsTrigger>
              </TabsList>

              <TabsContent value="over25">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Over 2.5 Goals Predictions</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Matches with high probability of 3+ goals based on scoring patterns and defensive stats.</p>
                </div>
                <PredictionsList initialPredictions={over25Predictions || []} predictionType="OVER_2_5" />
              </TabsContent>

              <TabsContent value="windraw">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Win/Draw Predictions</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Predictions based on team form, league position, and defensive strength.</p>
                </div>
                <PredictionsList initialPredictions={winDrawPredictions || []} predictionType="WIN_DRAW" />
              </TabsContent>

              <TabsContent value="gg">
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Both Teams to Score (GG)</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Matches where both teams are likely to score based on offensive and defensive form.</p>
                </div>
                <PredictionsList initialPredictions={ggPredictions || []} predictionType="GG" />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
