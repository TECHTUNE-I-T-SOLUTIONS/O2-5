import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const API_FOOTBALL_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface Team {
  id: number
  name: string
  logo: string
}

interface Match {
  fixture: {
    id: number
    date: string
    status: {
      short: string
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
  }
  teams: {
    home: Team
    away: Team
  }
  goals: {
    home: number | null
    away: number | null
  }
}

async function fetchMatchesFromAPI() {
  const today = new Date()
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  const startDate = today.toISOString().split('T')[0]
  const endDate = next7Days.toISOString().split('T')[0]

  const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?dateFrom=${startDate}&dateTo=${endDate}&status=NS,LS,PST,FT`

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_FOOTBALL_KEY,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
    },
  }

  try {
    const response = await fetch(url, options)
    const data = await response.json()
    return data.response || []
  } catch (error) {
    console.error('Error fetching from API-Football:', error)
    return []
  }
}

async function syncData() {
  console.log('Starting API-Football sync...')

  try {
    // Fetch matches
    const matches = await fetchMatchesFromAPI()
    console.log(`Fetched ${matches.length} matches`)

    // Insert/update teams
    const teams: any[] = []
    const teamMap = new Map<number, boolean>()

    for (const match of matches) {
      const homeTeam = match.teams.home
      const awayTeam = match.teams.away

      if (!teamMap.has(homeTeam.id)) {
        teams.push({
          id: homeTeam.id,
          name: homeTeam.name,
          logo: homeTeam.logo || null,
        })
        teamMap.set(homeTeam.id, true)
      }

      if (!teamMap.has(awayTeam.id)) {
        teams.push({
          id: awayTeam.id,
          name: awayTeam.name,
          logo: awayTeam.logo || null,
        })
        teamMap.set(awayTeam.id, true)
      }
    }

    if (teams.length > 0) {
      const { error: teamError } = await supabase.from('teams').upsert(teams, {
        onConflict: 'id',
      })
      if (teamError) console.error('Error inserting teams:', teamError)
      else console.log(`Inserted ${teams.length} teams`)
    }

    // Insert/update leagues
    const leagues: any[] = []
    const leagueMap = new Map<number, boolean>()

    for (const match of matches) {
      const league = match.league
      if (!leagueMap.has(league.id)) {
        leagues.push({
          id: league.id,
          name: league.name,
          country: league.country,
          logo: league.logo || null,
        })
        leagueMap.set(league.id, true)
      }
    }

    if (leagues.length > 0) {
      const { error: leagueError } = await supabase.from('leagues').upsert(leagues, {
        onConflict: 'id',
      })
      if (leagueError) console.error('Error inserting leagues:', leagueError)
      else console.log(`Inserted ${leagues.length} leagues`)
    }

    // Insert/update matches
    const matchesData = matches.map((match: Match) => ({
      id: match.fixture.id,
      league_id: match.league.id,
      home_team_id: match.teams.home.id,
      away_team_id: match.teams.away.id,
      match_date: match.fixture.date,
      status: match.fixture.status.short,
      home_goals: match.goals.home,
      away_goals: match.goals.away,
    }))

    if (matchesData.length > 0) {
      const { error: matchError } = await supabase.from('matches').upsert(matchesData, {
        onConflict: 'id',
      })
      if (matchError) console.error('Error inserting matches:', matchError)
      else console.log(`Inserted ${matchesData.length} matches`)
    }

    console.log('API-Football sync completed successfully!')
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

syncData()
