/**
 * Data Quality Tracker
 * Tracks and reports on data quality across providers
 * Provides metrics for monitoring and improvement
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface DataQualityReport {
  date: string
  totalMatches: number
  highQualityMatches: number
  mediumQualityMatches: number
  lowQualityMatches: number
  averageQualityScore: number
  providersUsed: string[]
  crossCheckSuccessRate: number
  dataFreshness: {
    stale: number
    fresh: number
    averageAge: number
  }
  issues: string[]
}

export class DataQualityTracker {
  /**
   * Get data quality report for a specific date
   */
  async getQualityReport(date: string): Promise<DataQualityReport> {
    const report: DataQualityReport = {
      date,
      totalMatches: 0,
      highQualityMatches: 0,
      mediumQualityMatches: 0,
      lowQualityMatches: 0,
      averageQualityScore: 0,
      providersUsed: [],
      crossCheckSuccessRate: 0,
      dataFreshness: {
        stale: 0,
        fresh: 0,
        averageAge: 0
      },
      issues: []
    }

    try {
      // Get sync status for the date
      const { data: syncStatus } = await supabase
        .from('fd_sync_status')
        .select('*')
        .eq('sync_date', date)
        .single()

      if (syncStatus) {
        report.totalMatches = syncStatus.matches_synced || 0
        report.providersUsed = syncStatus.sources_used?.primary 
          ? [syncStatus.sources_used.primary, ...(syncStatus.sources_used.secondary || [])]
          : []
        
        if (syncStatus.data_quality) {
          report.highQualityMatches = syncStatus.data_quality.high || 0
          report.mediumQualityMatches = syncStatus.data_quality.medium || 0
          report.lowQualityMatches = syncStatus.data_quality.low || 0
          
          const total = report.highQualityMatches + report.mediumQualityMatches + report.lowQualityMatches
          if (total > 0) {
            report.averageQualityScore = (
              (report.highQualityMatches * 100 + 
               report.mediumQualityMatches * 50 + 
               report.lowQualityMatches * 25) / total
            )
          }
        }
      }

      // Analyze match data freshness - only check recent matches (last 24 hours)
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const { data: matches } = await supabase
        .from('fd_matches')
        .select('id, utc_date, last_updated')
        .gte('utc_date', yesterday.toISOString())
        .lt('utc_date', now.toISOString())

      if (matches) {
        let totalAge = 0
        
        for (const match of matches) {
          const updateTime = new Date(match.last_updated).getTime()
          const age = (now.getTime() - updateTime) / (1000 * 60 * 60) // hours
          
          totalAge += age
          
          if (age > 24) {
            report.dataFreshness.stale++
          } else {
            report.dataFreshness.fresh++
          }
        }
        
        if (matches.length > 0) {
          report.dataFreshness.averageAge = totalAge / matches.length
        }
      }

      // Check for data issues
      const issues = await this.detectDataIssues(date)
      report.issues = issues

    } catch (error) {
      console.error('[DataQualityTracker] Failed to generate quality report:', error)
    }

    return report
  }

  /**
   * Detect data quality issues
   */
  private async detectDataIssues(date: string): Promise<string[]> {
    const issues: string[] = []

    try {
      // Check for matches without team data (only recent matches)
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const { data: matchesWithoutTeams } = await supabase
        .from('fd_matches')
        .select('id')
        .is('home_team_id', null)
        .or('away_team_id.is.null')
        .gte('utc_date', yesterday.toISOString())
        .lt('utc_date', now.toISOString())

      if (matchesWithoutTeams && matchesWithoutTeams.length > 0) {
        issues.push(`${matchesWithoutTeams.length} recent matches missing team data`)
      }

      // Check for matches without competition data (only recent matches)
      const { data: matchesWithoutCompetition } = await supabase
        .from('fd_matches')
        .select('id')
        .is('competition_id', null)
        .gte('utc_date', yesterday.toISOString())
        .lt('utc_date', now.toISOString())

      if (matchesWithoutCompetition && matchesWithoutCompetition.length > 0) {
        issues.push(`${matchesWithoutCompetition.length} recent matches missing competition data`)
      }

      // Skip outdated standings check for today-only mode
      // Standings may be older but that's expected when not doing full sync

    } catch (error) {
      console.error('[DataQualityTracker] Failed to detect issues:', error)
    }

    return issues
  }

  /**
   * Generate quality summary for dashboard
   */
  async generateQualitySummary(days: number = 7): Promise<any> {
    const summaries = []
    const today = new Date()
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const report = await this.getQualityReport(dateStr)
      summaries.push(report)
    }

    // Calculate overall statistics
    const totalMatches = summaries.reduce((sum, r) => sum + r.totalMatches, 0)
    const totalHighQuality = summaries.reduce((sum, r) => sum + r.highQualityMatches, 0)
    const totalMediumQuality = summaries.reduce((sum, r) => sum + r.mediumQualityMatches, 0)
    const totalLowQuality = summaries.reduce((sum, r) => sum + r.lowQualityMatches, 0)
    
    const overallQualityScore = totalMatches > 0 
      ? (totalHighQuality * 100 + totalMediumQuality * 50 + totalLowQuality * 25) / totalMatches
      : 0

    return {
      period: `${days} days`,
      overallQualityScore: Math.round(overallQualityScore),
      totalMatches,
      qualityDistribution: {
        high: totalHighQuality,
        medium: totalMediumQuality,
        low: totalLowQuality
      },
      dailyReports: summaries,
      trend: this.calculateTrend(summaries)
    }
  }

  /**
   * Calculate quality trend
   */
  private calculateTrend(reports: DataQualityReport[]): string {
    if (reports.length < 2) return 'insufficient_data'
    
    const recent = reports.slice(0, 3).map(r => r.averageQualityScore)
    const older = reports.slice(3, 6).map(r => r.averageQualityScore)
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    
    if (recentAvg > olderAvg + 5) return 'improving'
    if (recentAvg < olderAvg - 5) return 'declining'
    return 'stable'
  }

  /**
   * Log quality metrics for monitoring
   */
  async logQualityMetrics(report: DataQualityReport): Promise<void> {
    console.log('=== DATA QUALITY REPORT ===')
    console.log(`Date: ${report.date}`)
    console.log(`Total Matches: ${report.totalMatches}`)
    console.log(`Quality Distribution: High ${report.highQualityMatches}, Medium ${report.mediumQualityMatches}, Low ${report.lowQualityMatches}`)
    console.log(`Average Quality Score: ${report.averageQualityScore.toFixed(2)}`)
    console.log(`Providers Used: ${report.providersUsed.join(', ')}`)
    console.log(`Data Freshness: Fresh ${report.dataFreshness.fresh}, Stale ${report.dataFreshness.stale}`)
    console.log(`Average Data Age: ${report.dataFreshness.averageAge.toFixed(2)} hours`)
    
    if (report.issues.length > 0) {
      console.log('Issues Detected:')
      report.issues.forEach(issue => console.log(`  - ${issue}`))
    }
    
    console.log('========================')
  }
}

// Singleton instance
let dataQualityTrackerInstance: DataQualityTracker | null = null

export function getDataQualityTracker(): DataQualityTracker {
  if (!dataQualityTrackerInstance) {
    dataQualityTrackerInstance = new DataQualityTracker()
  }
  return dataQualityTrackerInstance
}