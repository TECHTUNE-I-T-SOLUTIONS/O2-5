'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'

export default function ResponsibleBettingModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if the user has seen the notice in this session
    const hasSeenNotice = sessionStorage.getItem('hasSeenBettingNotice')
    if (!hasSeenNotice) {
      const timer = setTimeout(() => {
        setOpen(true)
      }, 2000) // Show after 2 seconds
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    sessionStorage.setItem('hasSeenBettingNotice', 'true')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-card border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-6 w-6 text-yellow-500" />
            <DialogTitle className="text-xl font-bold tracking-tight">Responsible Betting Notice</DialogTitle>
          </div>
          <div className="text-muted-foreground space-y-4 pt-4">
            <p>
              Welcome to <strong>O2-5 Prediction Platform</strong>. Before you proceed, please keep the following in mind:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  Our algorithm-generated predictions are based on historical data and statistical models. They are <strong>not guarantees</strong> of future results.
                </p>
              </div>
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  Betting involves significant financial risk. Never bet more than you can afford to lose.
                </p>
              </div>
            </div>
            <p className="text-xs italic">
              By using this platform, you acknowledge that you are responsible for your own betting decisions.
            </p>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button 
            onClick={handleClose}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase tracking-wider"
          >
            I Understand & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
