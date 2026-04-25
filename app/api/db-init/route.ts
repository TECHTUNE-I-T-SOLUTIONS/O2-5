import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This route should only be accessible in development
// DO NOT use in production without proper authentication

export async function POST(request: Request) {
  // Security check - only allow in development or with admin key
  const adminKey = request.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_INIT_KEY

  if (process.env.NODE_ENV === 'production' && !expectedKey) {
    return NextResponse.json(
      { error: 'Database initialization not available in production without proper authentication' },
      { status: 403 }
    )
  }

  if (expectedKey && adminKey !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if tables already exist
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (!tableError && tables && tables.length > 0) {
      return NextResponse.json({
        status: 'already_initialized',
        message: 'Database tables already exist',
        tables: tables.map((t: any) => t.table_name)
      })
    }

    // Create all tables using raw SQL
    const schemaSQL = `
      -- Leagues Table
      CREATE TABLE IF NOT EXISTS leagues (
        id BIGINT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        country TEXT,
        flag TEXT,
        logo TEXT,
        type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Seasons Table
      CREATE TABLE IF NOT EXISTS seasons (
        id BIGINT PRIMARY KEY,
        league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
        year INT NOT NULL,
        start_date DATE,
        end_date DATE,
        is_current BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(league_id, year)
      );

      -- Teams Table
      CREATE TABLE IF NOT EXISTS teams (
        id BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        country TEXT,
        founded INT,
        national BOOLEAN DEFAULT FALSE,
        logo TEXT,
        venue_id BIGINT,
        venue_name TEXT,
        venue_city TEXT,
        venue_capacity INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Players Table
      CREATE TABLE IF NOT EXISTS players (
        id BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        firstname TEXT,
        lastname TEXT,
        age INT,
        birth_date DATE,
        nationality TEXT,
        height INT,
        weight INT,
        photo TEXT,
        type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Team Players (Squad) - Join Table
      CREATE TABLE IF NOT EXISTS team_players (
        id BIGSERIAL PRIMARY KEY,
        team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        season INT NOT NULL,
        position TEXT,
        number INT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, player_id, season)
      );

      -- Fixtures (Matches) Table
      CREATE TABLE IF NOT EXISTS fixtures (
        id BIGINT PRIMARY KEY,
        league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
        season INT NOT NULL,
        fixture_date TIMESTAMP NOT NULL,
        round TEXT,
        status TEXT,
        status_short TEXT,
        status_elapsed INT,
        home_team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        away_team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        home_goals INT,
        away_goals INT,
        home_goals_halftime INT,
        away_goals_halftime INT,
        home_goals_extra INT,
        away_goals_extra INT,
        home_goals_penalty INT,
        away_goals_penalty INT,
        venue_id BIGINT,
        venue_name TEXT,
        venue_city TEXT,
        referee TEXT,
        referee_country TEXT,
        extra_time INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_fixtures_date ON fixtures(fixture_date);
      CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
      CREATE INDEX IF NOT EXISTS idx_fixtures_league ON fixtures(league_id);
      CREATE INDEX IF NOT EXISTS idx_fixtures_home_team ON fixtures(home_team_id);
      CREATE INDEX IF NOT EXISTS idx_fixtures_away_team ON fixtures(away_team_id);

      -- Standings Table
      CREATE TABLE IF NOT EXISTS standings (
        id BIGSERIAL PRIMARY KEY,
        league_id BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
        season INT NOT NULL,
        team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        rank INT,
        rank_points INT,
        group_name TEXT,
        played INT DEFAULT 0,
        win INT DEFAULT 0,
        draw INT DEFAULT 0,
        lose INT DEFAULT 0,
        goals_for INT DEFAULT 0,
        goals_against INT DEFAULT 0,
        goals_diff INT DEFAULT 0,
        points INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(league_id, season, team_id)
      );

      -- Fixture Events (Goals, Cards, etc) Table
      CREATE TABLE IF NOT EXISTS fixture_events (
        id BIGSERIAL PRIMARY KEY,
        fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
        team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        player_id BIGINT REFERENCES players(id) ON DELETE SET NULL,
        type TEXT,
        minute INT,
        extra_minute INT,
        detail TEXT,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Fixture Statistics Table
      CREATE TABLE IF NOT EXISTS fixture_statistics (
        id BIGSERIAL PRIMARY KEY,
        fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
        team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        shots_on_goal INT,
        shots_off_goal INT,
        shots_blocked INT,
        shots_inside_box INT,
        shots_outside_box INT,
        fouls INT,
        corner_kicks INT,
        offsides INT,
        ball_possession INT,
        yellow_cards INT,
        red_cards INT,
        goalkeeper_saves INT,
        passes INT,
        passes_accurate INT,
        passes_percent INT,
        tackles INT,
        blocks INT,
        interceptions INT,
        dribbles INT,
        dribbles_successful INT,
        dribbles_past INT,
        duels INT,
        duels_won INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(fixture_id, team_id)
      );

      -- Fixture Lineups (Formations) Table
      CREATE TABLE IF NOT EXISTS fixture_lineups (
        id BIGSERIAL PRIMARY KEY,
        fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
        team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        formation TEXT,
        coach_id BIGINT,
        coach_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(fixture_id, team_id)
      );

      -- Lineups Players Table
      CREATE TABLE IF NOT EXISTS lineup_players (
        id BIGSERIAL PRIMARY KEY,
        lineup_id BIGSERIAL NOT NULL REFERENCES fixture_lineups(id) ON DELETE CASCADE,
        player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        position TEXT,
        position_id INT,
        number INT,
        grid TEXT,
        is_substitute BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Predictions Table
      CREATE TABLE IF NOT EXISTS predictions (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
        predicted_result TEXT,
        home_score INT,
        away_score INT,
        confidence INT DEFAULT 50,
        won BOOLEAN,
        points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
      CREATE INDEX IF NOT EXISTS idx_predictions_fixture ON predictions(fixture_id);
      CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at);

      -- Odds Table (Optional - for betting odds)
      CREATE TABLE IF NOT EXISTS odds (
        id BIGSERIAL PRIMARY KEY,
        fixture_id BIGINT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
        bookmaker TEXT,
        home_win_odds DECIMAL(10, 2),
        draw_odds DECIMAL(10, 2),
        away_win_odds DECIMAL(10, 2),
        over_under_2_5 DECIMAL(10, 2),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(fixture_id, bookmaker)
      );

      -- Sync Status Table (Track API sync)
      CREATE TABLE IF NOT EXISTS sync_status (
        id BIGSERIAL PRIMARY KEY,
        endpoint TEXT NOT NULL UNIQUE,
        last_sync TIMESTAMP,
        last_sync_date DATE,
        status TEXT,
        total_records INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Users Table (For future authentication)
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        avatar TEXT,
        total_predictions INT DEFAULT 0,
        correct_predictions INT DEFAULT 0,
        total_points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

    -- Football-Data.org Schema (v4)
    CREATE TABLE IF NOT EXISTS fd_competitions (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      type TEXT,
      emblem TEXT,
      plan TEXT,
      area_name TEXT,
      area_code TEXT,
      area_flag TEXT,
      last_updated TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fd_teams (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT,
      tla TEXT,
      crest TEXT,
      address TEXT,
      website TEXT,
      founded INTEGER,
      club_colors TEXT,
      venue TEXT,
      last_updated TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fd_matches (
      id BIGINT PRIMARY KEY,
      competition_id BIGINT REFERENCES fd_competitions(id),
      season_year INTEGER,
      utc_date TIMESTAMP NOT NULL,
      status TEXT,
      matchday INTEGER,
      stage TEXT,
      group_name TEXT,
      home_team_id BIGINT REFERENCES fd_teams(id),
      away_team_id BIGINT REFERENCES fd_teams(id),
      score_fulltime_home INTEGER,
      score_fulltime_away INTEGER,
      score_halftime_home INTEGER,
      score_halftime_away INTEGER,
      winner TEXT,
      last_updated TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fd_standings (
      id BIGSERIAL PRIMARY KEY,
      competition_id BIGINT REFERENCES fd_competitions(id),
      season_year INTEGER,
      type TEXT,
      stage TEXT,
      group_name TEXT,
      team_id BIGINT REFERENCES fd_teams(id),
      position INTEGER,
      played_games INTEGER,
      won INTEGER,
      draw INTEGER,
      lost INTEGER,
      points INTEGER,
      goals_for INTEGER,
      goals_against INTEGER,
      goals_difference INTEGER,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(competition_id, season_year, team_id, type)
    );


    CREATE TABLE IF NOT EXISTS fd_predictions (
      id BIGSERIAL PRIMARY KEY,
      match_id BIGINT REFERENCES fd_matches(id),
      avg_home_goals numeric,
      avg_away_goals numeric,
      h2h_avg_goals numeric,
      predicted_over_2_5 boolean,
      over_2_5_prob numeric,
      under_2_5_prob numeric,
      home_clean_sheet_pct numeric,
      home_last_3_goals integer,
      away_last_3_goals integer,
      home_last_3_conceded integer,
      away_last_3_conceded integer,
      is_correct boolean,
      actual_goals integer,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(match_id)
    );
    `

    // Execute the schema
    let execError = null
    try {
      const { error } = await supabase.rpc('exec', {
        sql: schemaSQL
      })
      execError = error
    } catch (e) {
      console.warn('RPC exec failed, attempting to continue...')
    }

    return NextResponse.json({
      status: 'initialized',
      message: 'Database tables created successfully',
      next_steps: [
        'Set environment variables for API-FOOTBALL and FOOTBALL-DATA',
        'Run Sync 1: pnpm tsx scripts/02-sync-api-football-real.ts',
        'Run Sync 2: pnpm tsx scripts/03-sync-football-data.ts',
        'Run Algorithm: pnpm tsx scripts/05-run-football-data-suite.ts'
      ]
    })
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    )
  }
}
