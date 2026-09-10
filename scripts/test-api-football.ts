/**
 * Test API-Football.com API responses
 * Alternative provider to verify data structure
 */

const API_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY || '6a42be9d6322fb7d55bc8b0e1a0815df'
const BASE_URL = 'https://v3.football.api-sports.io'

async function testApiFootball() {
  console.log('=== API-Football.com Real API Test ===')
  console.log(`API Key configured: ${API_KEY ? 'Yes' : 'No'}`)
  
  if (!API_KEY) {
    console.error('❌ NEXT_PUBLIC_API_FOOTBALL_KEY not found')
    return
  }

  const headers = {
    'x-apisports-key': API_KEY,
  }

  try {
    // Test 1: Get leagues
    console.log('\n📊 Test 1: Leagues')
    const leaguesResponse = await fetch(`${BASE_URL}/leagues`, { headers })
    const leaguesData = await leaguesResponse.json()
    
    console.log(`✅ Status: ${leaguesResponse.status}`)
    console.log(`Response structure:`, Object.keys(leaguesData))
    console.log(`Total items: ${leaguesData.results}`)
    if (leaguesData.response && leaguesData.response.length > 0) {
      console.log('Sample league structure:')
      console.log(JSON.stringify(leaguesData.response[0], null, 2))
    }

    // Test 2: Get Premier League fixtures
    console.log('\n⚽ Test 2: Premier League Fixtures')
    const fixturesResponse = await fetch(`${BASE_URL}/fixtures?league=39&season=2024`, { headers })
    const fixturesData = await fixturesResponse.json()
    
    console.log(`✅ Status: ${fixturesResponse.status}`)
    console.log(`Response structure:`, Object.keys(fixturesData))
    console.log(`Total fixtures: ${fixturesData.results}`)
    if (fixturesData.response && fixturesData.response.length > 0) {
      console.log('Sample fixture structure:')
      console.log(JSON.stringify(fixturesData.response[0], null, 2))
      
      // Check today's fixtures
      const today = new Date().toISOString().split('T')[0]
      const todayFixtures = fixturesData.response.filter((f: any) => 
        f.fixture.date.startsWith(today)
      )
      console.log(`\n📅 Today's fixtures: ${todayFixtures.length}`)
      if (todayFixtures.length > 0) {
        console.log('Today\'s fixtures:', todayFixtures.map((f: any) => ({
          id: f.fixture.id,
          homeTeam: f.teams.home.name,
          awayTeam: f.teams.away.name,
          date: f.fixture.date,
          status: f.fixture.status.short
        })))
      }
    }

    // Test 3: Get standings
    console.log('\n🏆 Test 3: Premier League Standings')
    const standingsResponse = await fetch(`${BASE_URL}/standings?league=39&season=2024`, { headers })
    const standingsData = await standingsResponse.json()
    
    console.log(`✅ Status: ${standingsResponse.status}`)
    console.log(`Response structure:`, Object.keys(standingsData))
    console.log(`Total items: ${standingsData.results}`)
    if (standingsData.response && standingsData.response.length > 0) {
      console.log('Sample standings structure:')
      console.log(JSON.stringify(standingsData.response[0], null, 2))
      
      if (standingsData.response[0].league && standingsData.response[0].league.standings && standingsData.response[0].league.standings.length > 0) {
        console.log('Sample team in standings:')
        console.log(JSON.stringify(standingsData.response[0].league.standings[0], null, 2))
      }
    }

    // Test 4: Get today's fixtures across all leagues
    console.log('\n📅 Test 4: Today\'s Fixtures (All Leagues)')
    const today = new Date().toISOString().split('T')[0]
    const todayResponse = await fetch(`${BASE_URL}/fixtures?date=${today}`, { headers })
    const todayData = await todayResponse.json()
    
    console.log(`✅ Status: ${todayResponse.status}`)
    console.log(`Response structure:`, Object.keys(todayData))
    console.log(`Total today's fixtures: ${todayData.results}`)
    if (todayData.response && todayData.response.length > 0) {
      console.log('Sample today fixture:')
      console.log(JSON.stringify(todayData.response[0], null, 2))
    }

    console.log('\n✅ All API-Football tests completed successfully')

  } catch (error) {
    console.error('❌ API Test Failed:', error)
  }
}

testApiFootball()