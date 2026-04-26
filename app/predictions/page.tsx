import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import PredictionCard from '@/components/predictions/prediction-card'
import { getFdPredictions } from '@/lib/supabase'
import PredictionsList from '@/components/predictions/predictions-list'

export default async function PredictionsPage() {
  const predictions = await getFdPredictions(50)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2 text-accent">Algorithm Predictions</h1>
            <p className="text-muted-foreground">Detailed Over 2.5 goals probability analysis for upcoming fixtures.</p>
          </div>
          <PredictionsList initialPredictions={predictions || []} />
        </div>
      </main>
      <Footer />
    </>
  )
}
