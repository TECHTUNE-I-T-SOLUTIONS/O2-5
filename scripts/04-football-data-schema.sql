-- Football-Data.org Schema (v4)
-- Prefixed with fd_ to avoid conflict with API-Football tables

-- Competitions (Leagues)
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

-- Teams
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

-- Matches (Fixtures)
CREATE TABLE IF NOT EXISTS fd_matches (
  id BIGINT PRIMARY KEY,
  competition_id BIGINT REFERENCES fd_competitions(id),
  season_year INTEGER,
  utc_date TIMESTAMP NOT NULL,
  status TEXT,
  matchday INTEGER,
  stage TEXT,
  group_name TEXT,
  last_updated TIMESTAMP,
  
  -- Teams
  home_team_id BIGINT REFERENCES fd_teams(id),
  away_team_id BIGINT REFERENCES fd_teams(id),
  
  -- Scores (Full Time)
  score_fulltime_home INTEGER,
  score_fulltime_away INTEGER,
  
  -- Half Time
  score_halftime_home INTEGER,
  score_halftime_away INTEGER,
  
  -- Extra Time
  score_extratime_home INTEGER,
  score_extratime_away INTEGER,
  
  -- Penalties
  score_penalties_home INTEGER,
  score_penalties_away INTEGER,
  
  -- Winner
  winner TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standings
CREATE TABLE IF NOT EXISTS fd_standings (
  id BIGSERIAL PRIMARY KEY,
  competition_id BIGINT REFERENCES fd_competitions(id),
  season_year INTEGER,
  type TEXT, -- TOTAL, HOME, AWAY
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

-- Odds & Predictions (Over/Under 2.5 Algorithm Data)
CREATE TABLE IF NOT EXISTS fd_predictions (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES fd_matches(id),
  
  -- Algorithm Inputs
  avg_home_goals numeric,
  avg_away_goals numeric,
  h2h_avg_goals numeric,
  
  -- Under 2.5 Criteria Stats
  home_clean_sheet_pct numeric,
  home_last_3_goals integer,
  away_last_3_goals integer,
  home_last_3_conceded integer,
  away_last_3_conceded integer,
  
  -- Prediction Result
  predicted_over_2_5 boolean,
  over_2_5_prob numeric, -- 0 to 100
  under_2_5_prob numeric, -- 0 to 100
  
  -- Outcome
  is_correct boolean,
  actual_goals integer,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id)
);

-- Sync Status for Football-Data
CREATE TABLE IF NOT EXISTS fd_sync_status (
  id BIGSERIAL PRIMARY KEY,
  endpoint TEXT UNIQUE,
  last_sync TIMESTAMP,
  status TEXT,
  total_records INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
