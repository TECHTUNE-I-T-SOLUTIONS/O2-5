import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get leaderboard data from predictions table with user stats
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('user_id, won, points');

    if (predError) throw predError;

    if (!predictions || predictions.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate leaderboard from predictions
    const leaderboard = Object.values(
      predictions.reduce((acc: any, pred: any) => {
        if (!acc[pred.user_id]) {
          acc[pred.user_id] = { 
            userId: pred.user_id, 
            wins: 0, 
            totalPoints: 0, 
            predictions: 0 
          };
        }
        if (pred.won) acc[pred.user_id].wins++;
        acc[pred.user_id].totalPoints += pred.points || 0;
        acc[pred.user_id].predictions++;
        return acc;
      }, {})
    ).sort((a: any, b: any) => b.totalPoints - a.totalPoints);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
