import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Simple hash function for IP anonymization
function hashIP(ip: string): string {
  // Simple hash - in production, use a proper cryptographic hash
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { predictionId, outcome, matchResult, userComment, anonymousName } = body

    if (!predictionId || !outcome) {
      return NextResponse.json({ 
        success: false, 
        error: 'predictionId and outcome are required' 
      }, { status: 400 })
    }

    if (!['CORRECT', 'INCORRECT', 'PARTIAL'].includes(outcome)) {
      return NextResponse.json({ 
        success: false, 
        error: 'outcome must be CORRECT, INCORRECT, or PARTIAL' 
      }, { status: 400 })
    }

    // Get client IP for rate limiting (anonymized)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    const hashedIP = hashIP(ip)
    
    // Get user agent for tracking
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if this IP has already submitted a testimony for this prediction (rate limiting)
    const { data: existingTestimony } = await supabase
      .from('fd_testimonies')
      .select('id')
      .eq('prediction_id', predictionId)
      .eq('user_ip', hashedIP)
      .single()

    if (existingTestimony) {
      return NextResponse.json({ 
        success: false, 
        error: 'You have already submitted a testimony for this prediction' 
      }, { status: 400 })
    }

    // Insert the testimony
    const { data, error } = await supabase
      .from('fd_testimonies')
      .insert({
        prediction_id: predictionId,
        outcome,
        match_result: matchResult || null,
        user_comment: userComment || null,
        anonymous_name: anonymousName || 'Anonymous',
        user_ip: hashedIP,
        user_agent: userAgent
      })
      .select()
      .single()

    if (error) {
      console.error('Testimony insertion error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to submit testimony' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      testimony: data,
      message: 'Testimony submitted successfully'
    })
  } catch (error: any) {
    console.error('Testimony API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const predictionId = searchParams.get('predictionId')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('fd_testimonies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (predictionId) {
      query = query.eq('prediction_id', predictionId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Testimony fetch error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch testimonies' 
      }, { status: 500 })
    }

    // Remove sensitive data before returning
    const sanitizedData = (data || []).map(t => ({
      id: t.id,
      prediction_id: t.prediction_id,
      outcome: t.outcome,
      match_result: t.match_result,
      user_comment: t.user_comment,
      anonymous_name: t.anonymous_name,
      created_at: t.created_at
      // user_ip and user_agent are intentionally excluded
    }))

    return NextResponse.json({ 
      success: true, 
      testimonies: sanitizedData 
    })
  } catch (error: any) {
    console.error('Testimony GET Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
