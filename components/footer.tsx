'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FE00C5] p-1.5">
                <img src="/logo.png" alt="" className="h-full w-full object-contain" />
              </div>
              <h3 className="text-xl font-black text-foreground tracking-tighter uppercase">O2-5</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              The ultimate football prediction platform. Predict, compete, and dominate the leaderboard.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/matches" className="text-muted-foreground hover:text-accent transition-colors">
                  Matches
                </Link>
              </li>
              <li>
                <Link href="/predictions" className="text-muted-foreground hover:text-accent transition-colors">
                  My Predictions
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-muted-foreground hover:text-accent transition-colors">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8">
          <p className="text-xs text-muted-foreground text-center">
            © 2026 O2-5 Prediction Platform. All rights reserved. Powered by API-SPORTS and Football-Data.org.
          </p>
        </div>
      </div>
    </footer>
  )
}
