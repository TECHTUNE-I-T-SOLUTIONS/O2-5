'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface AIExplainerProps {
  predictionId: number
  homeTeam: string
  awayTeam: string
}

interface Message {
  role: 'user' | 'ai'
  content: string
}

export default function AIExplainer({ predictionId, homeTeam, awayTeam }: AIExplainerProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchExplanation = async (msgs: Message[] = []) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          predictionId,
          messages: msgs.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', content: m.content }))
        })
      })
      const data = await res.json()
      if (data.content) {
        setMessages(prev => [...prev, { role: 'ai', content: data.content }])
      }
    } catch (err) {
      console.error('Failed to get AI explanation:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && messages.length === 0) {
      fetchExplanation()
    }
  }, [open])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    await fetchExplanation([...messages, userMsg])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full mt-4 text-[10px] font-black uppercase text-accent hover:bg-accent/10 border border-accent/20">
          <Sparkles className="mr-2 h-3 w-3" />
          Explain with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col bg-card border-border overflow-hidden">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            AI Analysis: {homeTeam} vs {awayTeam}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden px-6">
          <ScrollArea className="h-full pr-4 py-4">
          <div className="space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'ai' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  {m.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${m.role === 'ai' ? 'bg-muted/50 border border-border' : 'bg-accent text-accent-foreground'}`}>
                  {m.role === 'ai' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown children={m.content} />
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                  <Loader2 size={16} className="animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        </div>
 
        <div className="p-6 border-t border-border flex-shrink-0 bg-card">
          <div className="flex gap-2">
            <Input 
              placeholder="Ask AI about this match..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="bg-muted/50 border-border"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()} className="bg-accent text-accent-foreground">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
