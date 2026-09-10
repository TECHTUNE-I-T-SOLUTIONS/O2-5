const API_KEY = process.env.FOOTBALL_DATA_API_KEY
const BASE_URL = 'https://api.football-data.org/v4'

export interface FdMatch {
  id: number
  competition: { id: number; name: string; code: string }
  season: { id: number; startDate: string; endDate: string; currentMatchday: number }
  utcDate: string
  status: string
  matchday: number
  stage: string
  group: string | null
  lastUpdated: string
  homeTeam: { id: number; name: string; shortName: string; tla: string; crest: string }
  awayTeam: { id: number; name: string; shortName: string; tla: string; crest: string }
  score: {
    winner: string | null
    duration: string
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
    extraTime?: { home: number | null; away: number | null }
    penalties?: { home: number | null; away: number | null }
  }
}

async function apiRequest(endpoint: string) {
  const headers: HeadersInit = {
    'X-Auth-Token': API_KEY || '',
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      throw new Error(`Rate limit hit. Retry after ${retryAfter || 'some time'}`)
    }
    throw new Error(`Football-Data API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function fetchCompetitions() {
  const data = await apiRequest('/competitions')
  return data.competitions
}

export async function fetchCompetitionMatches(competitionCode: string, season?: number) {
  let url = `/competitions/${competitionCode}/matches`
  if (season) url += `?season=${season}`
  const data = await apiRequest(url)
  return data.matches as FdMatch[]
}

export async function fetchMatches(params?: { dateFrom?: string; dateTo?: string; status?: string }) {
  let url = '/matches'
  if (params) {
    const query = new URLSearchParams(params as any).toString()
    url += `?${query}`
  }
  const data = await apiRequest(url)
  return data.matches as FdMatch[]
}

export async function fetchCompetitionStandings(competitionCode: string, season?: number) {
  let url = `/competitions/${competitionCode}/standings`
  if (season) url += `?season=${season}`
  const data = await apiRequest(url)
  return data.standings
}

export async function fetchTeams(competitionCode: string, season?: number) {
  let url = `/competitions/${competitionCode}/teams`
  if (season) url += `?season=${season}`
  const data = await apiRequest(url)
  return data.teams
}
