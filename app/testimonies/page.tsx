'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import RecentTestimonies from '@/components/testimonies/recent-testimonies'
import { Card } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default function TestimoniesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2 text-accent">Prediction Testimonies</h1>
            <p className="text-muted-foreground">Community feedback on prediction outcomes. Share your results to help others!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecentTestimonies />
            </div>
            
            <div className="lg:col-span-1">
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="h-6 w-6 text-accent" />
                  <h2 className="text-lg font-bold">How It Works</h2>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>1. Browse predictions on the predictions page</p>
                  <p>2. After a match completes, click "Add Testimony"</p>
                  <p>3. Select if the prediction was correct</p>
                  <p>4. Add the actual match score</p>
                  <p>5. Optionally add your comment</p>
                  <p className="pt-2 text-xs text-accent font-bold">
                    No login required - completely anonymous!
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
