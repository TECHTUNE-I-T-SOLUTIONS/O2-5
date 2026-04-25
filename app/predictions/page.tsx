import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import PredictionCard from '@/components/predictions/prediction-card'
import { getFdPredictions } from '@/lib/supabase'
import { EmptyState } from '@/components/skeleton-loader'

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
          
          {predictions && predictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {predictions.map((pred: any) => (
                <div key={pred.id} className="flex flex-col gap-4">
                  <PredictionCard prediction={pred} />
                  <div className="bg-card/50 border border-border rounded-lg p-4 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Historical H2H Avg Goals:</span>
                      <span className="font-bold text-foreground">{pred.h2h_avg_goals.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Probability Score:</span>
                      <span className={`font-bold ${pred.probability > 70 ? 'text-green-500' : 'text-accent'}`}>
                        {pred.probability}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No predictions found" 
              description="Run the sync and algorithm suite to generate Over 2.5 predictions."
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
