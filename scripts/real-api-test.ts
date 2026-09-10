/**
 * Real API Test - Run this to verify actual Football-Data.org responses
 * This will help us understand the exact structure of the data we're receiving
 */

const API_KEY = process.env.FOOTBALL_DATA_API_KEY || '4d05a14d149b41dbb262e576091bd9d7'
const BASE_URL = 'https://api.football-data.org/v4'

async function testFootballDataAPI() {
  console.log('=== Football-Data.org Real API Test ===')
  console.log(`API Key configured: ${API_KEY ? 'Yes' : 'No'}`)
  
  if (!API_KEY) {
    console.error('❌ FOOTBALL_DATA_API_KEY not found in environment variables')
    console.log('Please add it to your .env.local file')
    return
  }

  const headers = {
    'X-Auth-Token': API_KEY,
  }

  try {
    // Test 1: Get available competitions
    console.log('\n📊 Test 1: Competitions')
    const compResponse = await fetch(`${BASE_URL}/competitions`, { headers })
    const compData = await compResponse.json()
    
    console.log(`✅ Status: ${compResponse.status}`)
    console.log(`Total competitions: ${compData.count}`)
    console.log('Sample competition structure:')
    console.log(JSON.stringify(compData.competitions[0], null, 2))

    // Test 2: Get Premier League matches
    console.log('\n⚽ Test 2: Premier League Matches')
    const matchesResponse = await fetch(`${BASE_URL}/competitions/PL/matches`, { headers })
    const matchesData = await matchesResponse.json()
    
    console.log(`✅ Status: ${matchesResponse.status}`)
    console.log(`Total matches: ${matchesData.count}`)
    if (matchesData.matches && matchesData.matches.length > 0) {
      console.log('Sample match structure:')
      console.log(JSON.stringify(matchesData.matches[0], null, 2))
      
      // Check today's matches
      const today = new Date().toISOString().split('T')[0]
      const todayMatches = matchesData.matches.filter((m: any) => 
        m.utcDate.startsWith(today)
      )
      console.log(`\n📅 Today's matches: ${todayMatches.length}`)
      if (todayMatches.length > 0) {
        console.log('Today\'s matches:', todayMatches.map((m: any) => ({
          id: m.id,
          homeTeam: m.homeTeam?.name,
          awayTeam: m.awayTeam?.name,
          utcDate: m.utcDate,
          status: m.status
        })))
      }
    }

    // Test 3: Get Premier League standings
    console.log('\n🏆 Test 3: Premier League Standings')
    const standingsResponse = await fetch(`${BASE_URL}/competitions/PL/standings`, { headers })
    const standingsData = await standingsResponse.json()
    
    console.log(`✅ Status: ${standingsResponse.status}`)
    console.log(`Total standings tables: ${standingsData.standings?.length || 0}`)
    if (standingsData.standings && standingsData.standings.length > 0) {
      console.log('Sample standings structure:')
      console.log(JSON.stringify(standingsData.standings[0], null, 2))
      
      if (standingsData.standings[0].table && standingsData.standings[0].table.length > 0) {
        console.log('Sample team in standings:')
        console.log(JSON.stringify(standingsData.standings[0].table[0], null, 2))
      }
    }

    // Test 4: Get today's matches across all competitions
    console.log('\n📅 Test 4: Today\'s Matches (All Competitions)')
    const today = new Date().toISOString().split('T')[0]
    const todayResponse = await fetch(`${BASE_URL}/matches?dateFrom=${today}&dateTo=${today}`, { headers })
    const todayData = await todayResponse.json()
    
    console.log(`✅ Status: ${todayResponse.status}`)
    console.log(`Total today's matches: ${todayData.count}`)
    if (todayData.matches && todayData.matches.length > 0) {
      console.log('Sample today match:')
      console.log(JSON.stringify(todayData.matches[0], null, 2))
    }

    console.log('\n✅ All API tests completed successfully')

  } catch (error) {
    console.error('❌ API Test Failed:', error)
  }
}

// Run the test
testFootballDataAPI()