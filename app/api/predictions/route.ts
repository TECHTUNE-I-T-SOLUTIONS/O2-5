import { NextResponse } from 'next/server'
import { getFdPredictions } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const predictionType = searchParams.get('type') || undefined
  const date = searchParams.get('date') || undefined

  try {
    const data = await getFdPredictions(limit, offset, predictionType, date)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
