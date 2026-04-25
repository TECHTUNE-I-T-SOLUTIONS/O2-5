'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/sync/football-data', { method: 'POST' })
      if (res.ok) {
        setStatus('success')
        router.refresh()
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={handleSync} 
        disabled={loading}
        className="bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {loading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Syncing & Predicting...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Predictions Now
          </>
        )}
      </Button>
      {status === 'success' && (
        <div className="flex items-center text-xs text-green-500 mt-1">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Successfully updated!
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center text-xs text-red-500 mt-1">
          <AlertCircle className="mr-1 h-3 w-3" />
          Sync failed. Try again.
        </div>
      )}
    </div>
  )
}
