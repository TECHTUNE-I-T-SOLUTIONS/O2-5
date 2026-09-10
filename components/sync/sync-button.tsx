'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SyncButtonProps {
  isSyncComplete?: boolean
}

export default function SyncButton({ isSyncComplete = false }: SyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [localSyncComplete, setLocalSyncComplete] = useState(isSyncComplete)
  const router = useRouter()

  useEffect(() => {
    setLocalSyncComplete(isSyncComplete)
  }, [isSyncComplete])

  const handleSync = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/sync/football-data', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        setStatus('success')
        if (data.alreadyComplete) {
          setLocalSyncComplete(true)
        }
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
        disabled={loading || localSyncComplete}
        className={`${localSyncComplete ? 'bg-green-600 hover:bg-green-700' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`}
      >
        {loading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Running All Predictions...
          </>
        ) : localSyncComplete ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Already Generated
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run All Predictions
          </>
        )}
      </Button>
      {status === 'success' && !localSyncComplete && (
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
