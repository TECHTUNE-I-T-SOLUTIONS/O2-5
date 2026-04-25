import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-black mb-8 tracking-tight">PRIVACY POLICY</h1>
          <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-xl font-bold text-foreground">1. Data Collection</h2>
              <p>
                We collect information that you provide directly to us, such as when you create an account, make a prediction, or contact us. This may include your email address, username, and profile data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">2. Usage Data</h2>
              <p>
                We automatically collect certain information when you visit our site, including your IP address, browser type, and how you interact with our prediction models and match data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">3. How We Use Your Information</h2>
              <p>
                Your data is used to:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Personalize your experience and leaderboard ranking.</li>
                <li>Improve our AI prediction algorithms.</li>
                <li>Send technical notices, updates, and security alerts.</li>
                <li>Respond to your comments and questions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">4. Data Sharing</h2>
              <p>
                We do not sell your personal data to third parties. We may share aggregated, non-personally identifiable information with partners for research or marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">5. Data Security</h2>
              <p>
                We use industry-standard security measures, including Supabase Auth and SSL encryption, to protect your personal information from unauthorized access or disclosure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">6. Cookies</h2>
              <p>
                We use cookies to maintain your session and remember your preferences. You can disable cookies in your browser settings, but some features of the Service may not function correctly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground">7. Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal data. Contact us at the email provided in the Contact page for any data-related requests.
              </p>
            </section>

            <p className="text-xs italic pt-8 border-t border-border">
              Last updated: April 25, 2026
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
