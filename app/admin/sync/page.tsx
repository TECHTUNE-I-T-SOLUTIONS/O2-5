'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SyncButton from '@/components/sync/sync-button'
import { Database, ShieldCheck, Zap, RefreshCw, AlertTriangle } from 'lucide-react'

export default function AdminSyncPage() {
  const [isForceSyncing, setIsForceSyncing] = useState(false)
  const [forceSyncResult, setForceSyncResult] = useState<any>(null)

  const handleForceSync = async () => {
    if (!confirm('⚠️ WARNING: This will force a full sync ignoring daily limits. Continue?')) {
      return
    }

    setIsForceSyncing(true)
    setForceSyncResult(null)

    try {
      const response = await fetch('/api/sync/multi-provider/force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonYear: 2025, force: true })
      })

      const data = await response.json()
      setForceSyncResult(data)
    } catch (error) {
      setForceSyncResult({ success: false, error: 'Force sync failed' })
    } finally {
      setIsForceSyncing(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="h-8 w-8 text-accent" />
            <h1 className="text-4xl font-black tracking-tight">ADMIN CONTROL PANEL</h1>
          </div>

          <Card className="p-8 border-border bg-card shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                <Database className="h-6 w-6 text-accent mt-1" />
                <div>
                  <h3 className="font-bold text-foreground">Multi-Provider Data Synchronization</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fetching the latest matches, standings, and results from multiple providers (Football-Data.org, API-Football, FotMob, SofaScore). 
                    This process respects API rate limits and includes cross-verification for data quality.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                <Zap className="h-6 w-6 text-accent mt-1" />
                <div>
                  <h3 className="font-bold text-foreground">Algorithmic Prediction Engine</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    After syncing, the system will automatically run all prediction algorithms 
                    (Over/Under 2.5, Win/Draw, and Both Teams to Score) using verified data from multiple sources.
                    Minimum 2-criteria requirement enforced for reliable predictions.
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-border flex flex-col items-center justify-center gap-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Ready to update the platform?
                </p>
                <div className="scale-125 py-4">
                  <SyncButton />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Last run: System records are updated upon completion.
                </p>
              </div>

              {/* Force Sync Section */}
              <div className="pt-8 border-t border-border">
                <div className="flex items-start gap-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">Force Multi-Provider Sync</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This will force a full sync from all providers (Football-Data.org, API-Football, FotMob, SofaScore) 
                      ignoring daily limits. Use for testing or when data needs immediate refresh.
                    </p>
                    <Button
                      onClick={handleForceSync}
                      disabled={isForceSyncing}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isForceSyncing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Force Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Force Sync Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Force Sync Results */}
                {forceSyncResult && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border">
                    <h4 className="font-bold text-foreground mb-2">Force Sync Results</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={forceSyncResult.success ? 'text-green-500' : 'text-red-500'}>
                          {forceSyncResult.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      {forceSyncResult.aggregation && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Matches Synced:</span>
                            <span>{forceSyncResult.aggregation?.matchesSynced || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Teams Synced:</span>
                            <span>{forceSyncResult.aggregation?.teamsSynced || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Standings Synced:</span>
                            <span>{forceSyncResult.aggregation?.standingsSynced || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data Quality:</span>
                            <span>
                              High: {forceSyncResult.aggregation?.data_quality?.high || 0} | 
                              Medium: {forceSyncResult.aggregation?.data_quality?.medium || 0} | 
                              Low: {forceSyncResult.aggregation?.data_quality?.low || 0}
                            </span>
                          </div>
                        </>
                      )}
                      {forceSyncResult.predictions && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Predictions:</span>
                          <span>{forceSyncResult.predictionSuccessRate}</span>
                        </div>
                      )}
                      {forceSyncResult.error && (
                        <div className="text-red-500">
                          Error: {forceSyncResult.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="mt-12 p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <h4 className="text-sm font-bold text-yellow-500 mb-2 uppercase">Important Notice</h4>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Do not close this page while the sync is in progress.</li>
              <li>The operation may take up to 2-3 minutes due to API rate limiting and cross-verification.</li>
              <li>Multi-provider sync fetches from Football-Data.org (primary), API-Football (backup), and verifies with FotMob/SofaScore.</li>
              <li>Force sync bypasses daily limits - use for testing or immediate data refresh only.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
