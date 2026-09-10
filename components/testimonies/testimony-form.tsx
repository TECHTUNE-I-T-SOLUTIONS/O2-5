'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Minus, MessageSquare } from 'lucide-react'

interface TestimonyFormProps {
  predictionId: number
  onTestimonySubmitted?: () => void
}

export default function TestimonyForm({ predictionId, onTestimonySubmitted }: TestimonyFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<'CORRECT' | 'INCORRECT' | 'PARTIAL' | null>(null)
  const [matchResult, setMatchResult] = useState('')
  const [userComment, setUserComment] = useState('')
  const [anonymousName, setAnonymousName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    if (!selectedOutcome) {
      setMessage('Please select an outcome')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const res = await fetch('/api/testimonies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          outcome: selectedOutcome,
          matchResult: matchResult || undefined,
          userComment: userComment || undefined,
          anonymousName: anonymousName || undefined
        })
      })

      const data = await res.json()

      if (data.success) {
        setMessage('✓ Testimony submitted successfully!')
        setSelectedOutcome(null)
        setMatchResult('')
        setUserComment('')
        setAnonymousName('')
        setTimeout(() => {
          setIsOpen(false)
          setMessage('')
          onTestimonySubmitted?.()
        }, 2000)
      } else {
        setMessage(`✗ ${data.error}`)
      }
    } catch (error) {
      setMessage('✗ Failed to submit testimony')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="w-full mt-2"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Add Testimony
      </Button>
    )
  }

  return (
    <div className="mt-3 p-3 bg-muted/30 border border-border rounded-xl">
      <p className="text-xs font-bold mb-2">Was this prediction correct?</p>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => setSelectedOutcome('CORRECT')}
          className={`p-2 rounded-lg border transition-all ${
            selectedOutcome === 'CORRECT'
              ? 'bg-green-500/20 border-green-500 text-green-500'
              : 'bg-background border-border hover:border-green-500/50'
          }`}
        >
          <Check className="h-4 w-4 mx-auto mb-1" />
          <span className="text-[10px] font-bold">Correct</span>
        </button>
        
        <button
          onClick={() => setSelectedOutcome('PARTIAL')}
          className={`p-2 rounded-lg border transition-all ${
            selectedOutcome === 'PARTIAL'
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
              : 'bg-background border-border hover:border-yellow-500/50'
          }`}
        >
          <Minus className="h-4 w-4 mx-auto mb-1" />
          <span className="text-[10px] font-bold">Partial</span>
        </button>
        
        <button
          onClick={() => setSelectedOutcome('INCORRECT')}
          className={`p-2 rounded-lg border transition-all ${
            selectedOutcome === 'INCORRECT'
              ? 'bg-red-500/20 border-red-500 text-red-500'
              : 'bg-background border-border hover:border-red-500/50'
          }`}
        >
          <X className="h-4 w-4 mx-auto mb-1" />
          <span className="text-[10px] font-bold">Incorrect</span>
        </button>
      </div>

      <input
        type="text"
        placeholder="Match result (e.g., 2-1)"
        value={matchResult}
        onChange={(e) => setMatchResult(e.target.value)}
        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <input
        type="text"
        placeholder="Your name (optional)"
        value={anonymousName}
        onChange={(e) => setAnonymousName(e.target.value)}
        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <textarea
        placeholder="Add a comment (optional)"
        value={userComment}
        onChange={(e) => setUserComment(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background mb-2 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="sm"
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
        <Button
          onClick={() => setIsOpen(false)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>

      {message && (
        <p className={`text-xs mt-2 text-center ${
          message.startsWith('✓') ? 'text-green-500' : 'text-red-500'
        }`}>
          {message}
        </p>
      )}
    </div>
  )
}
