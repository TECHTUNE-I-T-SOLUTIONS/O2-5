/**
 * Test script to verify API response structures from Football-Data.org
 * This helps ensure we're handling the data correctly in our application
 */

const API_KEY = process.env.FOOTBALL_DATA_API_KEY
const BASE_URL = 'https://api.football-data.org/v4'

async function testApiEndpoint(endpoint: string, description: string) {
  console.log(`\n=== Testing: ${description} ===`)
  console.log(`Endpoint: ${endpoint}`)
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY || '',
      },
    })

    if (!response.ok) {
      console.error(`HTTP ${response.status}: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    
    // Log structure overview
    console.log('Response structure:', Object.keys(data))
    
    // If it's an array, show first item structure
    if (Array.isArray(data) && data.length > 0) {
      console.log('First item structure:', Object.keys(data[0]))
      console.log('Sample first item:', JSON.stringify(data[0], null, 2))
    } 
    // If it has matches array, show first match structure
    else if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
      console.log('Number of matches:', data.matches.length)
      console.log('First match structure:', Object.keys(data.matches[0]))
      console.log('Sample first match:', JSON.stringify(data.matches[0], null, 2))
    }
    // If it has competitions array
    else if (data.competitions && Array.isArray(data.competitions) && data.competitions.length > 0) {
      console.log('Number of competitions:', data.competitions.length)
      console.log('First competition structure:', Object.keys(data.competitions[0]))
      console.log('Sample first competition:', JSON.stringify(data.competitions[0], null, 2))
    }
    // If it has standings array
    else if (data.standings && Array.isArray(data.standings) && data.standings.length > 0) {
      console.log('Number of standings tables:', data.standings.length)
      console.log('First standings table structure:', Object.keys(data.standings[0]))
      if (data.standings[0].table && Array.isArray(data.standings[0].table)) {
        console.log('First table entry structure:', Object.keys(data.standings[0].table[0]))
        console.log('Sample table entry:', JSON.stringify(data.standings[0].table[0], null, 2))
      }
    }
    else {
      console.log('Full response:', JSON.stringify(data, null, 2))
    }

    return data
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

async function main() {
  console.log('=== Football-Data.org API Response Structure Test ===')
  console.log(`API Key configured: ${!!API_KEY}`)
  
  if (!API_KEY) {
    console.error('FOOTBALL_DATA_API_KEY not set in environment variables')
    process.exit(1)
  }

  // Test 1: Competitions
  await testApiEndpoint('/competitions', 'Competitions List')
  
  // Test 2: Specific competition matches (Premier League)
  await testApiEndpoint('/competitions/PL/matches', 'Premier League Matches')
  
  // Test 3: Competition standings
  await testApiEndpoint('/competitions/PL/standings', 'Premier League Standings')
  
  // Test 4: Teams in competition
  await testApiEndpoint('/competitions/PL/teams', 'Premier League Teams')
  
  // Test 5: All matches with date filter (today)
  const today = new Date().toISOString().split('T')[0]
  await testApiEndpoint(`/matches?dateFrom=${today}&dateTo=${today}`, 'Today\'s Matches')
  
  console.log('\n=== Test Complete ===')
}

main().catch(console.error)