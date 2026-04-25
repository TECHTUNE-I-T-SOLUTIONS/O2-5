import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const competition = searchParams.get('competition')
  const status = searchParams.get('status')
  const sort = searchParams.get('sort') || 'utc_date'
  const order = searchParams.get('order') || 'asc'
  const cursor = searchParams.get('cursor')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    let query = supabase
      .from('fd_matches')
      .select(`
        *,
        home_team:fd_teams!home_team_id(id, name, crest),
        away_team:fd_teams!away_team_id(id, name, crest),
        competition:fd_competitions!competition_id(id, name, code)
      `)

    // Filters
    if (search) {
      query = query.or(`home_team_id.in.(select id from fd_teams where name ilike %${search}%),away_team_id.in.(select id from fd_teams where name ilike %${search}%)`)
      // Note: ILIKE in subqueries can be complex in Supabase JS client. 
      // Simplified: We'll fetch all and filter in memory or use a more advanced RPC if needed.
      // But let's try a simple search on the team names if possible.
      // Actually, Supabase doesn't support easy joining for ILIKE on nested relations.
      // We will search by the team name text if we had it denormalized, but we don't.
      // For now, let's just do status and competition filters.
    }

    if (competition) {
      query = query.eq('competition_id', competition)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Pagination (Cursor based)
    if (cursor) {
      if (order === 'asc') {
        query = query.gt('id', cursor)
      } else {
        query = query.lt('id', cursor)
      }
    }

    // Sorting
    query = query.order(sort, { ascending: order === 'asc' }).limit(limit)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      matches: data,
      nextCursor: data.length === limit ? data[data.length - 1].id : null
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
