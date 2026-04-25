const API_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

export interface ApiFixture {
  fixture: {
    id: number
    referee: string | null
    timezone: string
    date: string
    timestamp: number
    periods: {
      first: number | null
      second: number | null
    }
    venue: {
      id: number | null
      name: string | null
      city: string | null
    }
    status: {
      long: string
      short: string
      elapsed: number | null
      extra: number | null
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string | null
    season: number
    round: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
      update: string
    }
    away: {
      id: number
      name: string
      logo: string
      update: string
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
    extratime: {
      home: number | null
      away: number | null
    }
    penalty: {
      home: number | null
      away: number | null
    }
  }
}

export interface ApiTeam {
  team: {
    id: number
    name: string
    code: string | null
    country: string | null
    founded: number | null
    national: boolean
    logo: string
  }
  venue: {
    id: number | null
    name: string | null
    address: string | null
    city: string | null
    capacity: number | null
    surface: string | null
    image: string | null
  }
}

export interface ApiLeague {
  league: {
    id: number
    name: string
    type: string
    logo: string
    country: string
    flag: string | null
  }
  country: {
    name: string
    code: string | null
    flag: string | null
  }
  seasons: {
    year: number
    start: string
    end: string
    current: boolean
  }[]
}

// Fetch with proper headers for API-SPORTS
async function apiRequest(endpoint: string, retries = 3) {
  const headers: HeadersInit = {
    'x-apisports-key': API_KEY || '',
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
        // Increased timeout
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        throw new Error(`API-SPORTS HTTP error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Check for API-specific errors in the response body
      if (data.errors && Object.keys(data.errors).length > 0) {
        const errorMsg = JSON.stringify(data.errors)
        
        // Rate limit
        if (data.errors.rateLimit || data.errors.requests) {
          console.warn(`[RATE LIMIT] ${endpoint}. Waiting 30s...`)
          await new Promise(r => setTimeout(r, 30000))
          continue // Retry
        }
        
        // Plan restriction
        if (data.errors.plan) {
           throw new Error(`API-SPORTS Plan Restricted: ${errorMsg}`)
        }
        
        console.error(`[API ERROR] Endpoint: ${endpoint}, Errors: ${errorMsg}`)
      }

      return data
    } catch (error: any) {
      if (i === retries - 1) throw error
      console.warn(`[RETRYING] ${endpoint} due to error: ${error.message}`)
      await new Promise(r => setTimeout(r, 5000))
    }
  }
}

export async function fetchUpcomingFixtures(leagueId: number, season: number, days: number = 30) {
  try {
    const from = new Date()
    const to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000)

    const fromStr = from.toISOString().split('T')[0]
    const toStr = to.toISOString().split('T')[0]

    const data = await apiRequest(`/fixtures?league=${leagueId}&season=${season}&from=${fromStr}&to=${toStr}&status=NS-PST`)
    return data.response as ApiFixture[]
  } catch (error: any) {
    console.error(`Error fetching upcoming fixtures for league ${leagueId}:`, error.message)
    throw error
  }
}

export async function fetchFinishedFixtures(leagueId: number, season: number, days: number = 7) {
  try {
    const to = new Date()
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)

    const fromStr = from.toISOString().split('T')[0]
    const toStr = to.toISOString().split('T')[0]

    const data = await apiRequest(`/fixtures?league=${leagueId}&season=${season}&from=${fromStr}&to=${toStr}&status=FT-AET-PEN`)
    return data.response as ApiFixture[]
  } catch (error: any) {
    console.error(`Error fetching finished fixtures for league ${leagueId}:`, error.message)
    throw error
  }
}

export async function fetchFixture(fixtureId: number) {
  try {
    const data = await apiRequest(`/fixtures?id=${fixtureId}`)
    return data.response[0] as ApiFixture
  } catch (error) {
    console.error('Error fetching fixture:', error)
    throw error
  }
}

export async function fetchFixturesByLeague(leagueId: number, season: number, status?: string) {
  try {
    let url = `/fixtures?league=${leagueId}&season=${season}`
    if (status) {
      url += `&status=${status}`
    }
    const data = await apiRequest(url)
    return data.response as ApiFixture[]
  } catch (error) {
    console.error('Error fetching fixtures by league:', error)
    throw error
  }
}

export async function fetchFixtureStatistics(fixtureId: number) {
  try {
    const data = await apiRequest(`/fixtures/statistics?fixture=${fixtureId}`)
    return data.response
  } catch (error) {
    console.error('Error fetching fixture statistics:', error)
    throw error
  }
}

export async function fetchFixtureEvents(fixtureId: number) {
  try {
    const data = await apiRequest(`/fixtures/events?fixture=${fixtureId}`)
    return data.response
  } catch (error) {
    console.error('Error fetching fixture events:', error)
    throw error
  }
}

export async function fetchFixtureLineups(fixtureId: number) {
  try {
    const data = await apiRequest(`/fixtures/lineups?fixture=${fixtureId}`)
    return data.response
  } catch (error) {
    console.error('Error fetching fixture lineups:', error)
    throw error
  }
}

export async function fetchLeagues() {
  try {
    const data = await apiRequest('/leagues')
    return data.response as ApiLeague[]
  } catch (error) {
    console.error('Error fetching leagues:', error)
    throw error
  }
}

export async function fetchCurrentLeagues() {
  try {
    const data = await apiRequest('/leagues?current=true')
    return data.response as ApiLeague[]
  } catch (error) {
    console.error('Error fetching current leagues:', error)
    throw error
  }
}

export async function fetchLeagueStandings(leagueId: number, season: number) {
  try {
    const data = await apiRequest(`/standings?league=${leagueId}&season=${season}`)
    return data.response
  } catch (error) {
    console.error('Error fetching standings:', error)
    throw error
  }
}

export async function fetchTeams(leagueId: number, season: number) {
  try {
    const data = await apiRequest(`/teams?league=${leagueId}&season=${season}`)
    return data.response as ApiTeam[]
  } catch (error) {
    console.error('Error fetching teams:', error)
    throw error
  }
}

export async function fetchTeam(teamId: number) {
  try {
    const data = await apiRequest(`/teams?id=${teamId}`)
    return data.response[0] as ApiTeam
  } catch (error) {
    console.error('Error fetching team:', error)
    throw error
  }
}

export async function fetchTeamSquad(teamId: number, season: number) {
  try {
    const data = await apiRequest(`/players/squads?team=${teamId}&season=${season}`)
    return data.response[0]
  } catch (error) {
    console.error('Error fetching team squad:', error)
    throw error
  }
}

export async function fetchOdds(fixtureId: number) {
  try {
    const data = await apiRequest(`/odds?fixture=${fixtureId}`)
    return data.response[0]
  } catch (error) {
    console.warn(`Error fetching odds for fixture ${fixtureId}:`, error)
    return null
  }
}

export async function getApiStatus() {
  try {
    const data = await apiRequest('/status')
    return data.response
  } catch (error) {
    console.error('Error fetching API status:', error)
    throw error
  }
}
