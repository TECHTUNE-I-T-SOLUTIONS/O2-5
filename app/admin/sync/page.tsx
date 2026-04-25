import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card } from '@/components/ui/card'
import SyncButton from '@/components/sync/sync-button'
import { Database, ShieldCheck, Zap } from 'lucide-react'

export default function AdminSyncPage() {
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
                  <h3 className="font-bold text-foreground">Data Synchronization</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fetching the latest matches, standings, and results from Football-Data.org. 
                    This process respects API rate limits (10 req/min).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                <Zap className="h-6 w-6 text-accent mt-1" />
                <div>
                  <h3 className="font-bold text-foreground">AI Probability Engine</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    After syncing, the system will automatically run the Over/Under 2.5 algorithm 
                    against all upcoming Tier 1 matches.
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
            </div>
          </Card>

          <div className="mt-12 p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <h4 className="text-sm font-bold text-yellow-500 mb-2 uppercase">Important Notice</h4>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
              <li>Do not close this page while the sync is in progress.</li>
              <li>The operation may take up to 2-3 minutes due to API rate limiting.</li>
              <li>Running this more than once a day is usually not necessary unless fixtures change.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
