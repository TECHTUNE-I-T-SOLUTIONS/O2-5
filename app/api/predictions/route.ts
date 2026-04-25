import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = supabase
      .from('predictions')
      .select(`
        *,
        fixture:fixtures(
          home_goals,
          away_goals,
          status,
          fixture_date,
          home_team:teams!home_team_id(name, logo),
          away_team:teams!away_team_id(name, logo)
        )
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, fixtureId, predictedResult, homeScore, awayScore, confidence } = body;

    const { data, error } = await supabase
      .from('predictions')
      .insert({
        user_id: userId,
        fixture_id: fixtureId,
        predicted_result: predictedResult,
        home_score: homeScore,
        away_score: awayScore,
        confidence: confidence || 50,
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Error creating prediction:', error);
    return NextResponse.json(
      { error: 'Failed to create prediction' },
      { status: 500 }
    );
  }
}
