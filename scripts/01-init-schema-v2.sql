-- O2-5 Football Prediction Platform - Complete Database Schema

-- Leagues Table
CREATE TABLE IF NOT EXISTS leagues (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  flag TEXT,
  logo TEXT,
  type TEXT,
  is_current BOOLEAN DEFAULT FALSE,
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

-- Create index for faster queries
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

-- Create index for predictions
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
