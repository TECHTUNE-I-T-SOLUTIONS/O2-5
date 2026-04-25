-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo TEXT,
  country TEXT,
  founded INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id INTEGER PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  logo TEXT,
  flag TEXT,
  season INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_id INTEGER UNIQUE NOT NULL,
  league_id INTEGER NOT NULL,
  home_team_id INTEGER NOT NULL,
  away_team_id INTEGER NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT,
  home_goals INTEGER,
  away_goals INTEGER,
  home_xg DECIMAL(4,2),
  away_xg DECIMAL(4,2),
  venue TEXT,
  referee TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (league_id) REFERENCES leagues(id),
  FOREIGN KEY (home_team_id) REFERENCES teams(id),
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  match_id UUID NOT NULL,
  predicted_result TEXT NOT NULL, -- 'HOME', 'DRAW', 'AWAY'
  predicted_home_goals INTEGER,
  predicted_away_goals INTEGER,
  confidence INTEGER, -- 0-100
  won BOOLEAN,
  points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view all predictions" ON predictions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view teams" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view leagues" ON leagues
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view matches" ON matches
  FOR SELECT USING (true);
