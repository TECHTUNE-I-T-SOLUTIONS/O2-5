import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ success: false, error: 'date parameter is required' }, { status: 400 })
    }

    const { data: syncStatus, error } = await supabase
      .from('fd_sync_status')
      .select('*')
      .eq('sync_date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found
        return NextResponse.json({ 
          success: true, 
          syncStatus: null,
          message: 'No sync record found for this date'
        })
      }
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      syncStatus
    })
  } catch (error: any) {
    console.error('Sync Status Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
