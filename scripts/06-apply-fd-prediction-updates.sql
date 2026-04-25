-- Migration Script to update fd_predictions table
-- Run this in Supabase SQL Editor

-- Add new columns if they don't exist
ALTER TABLE fd_predictions 
ADD COLUMN IF NOT EXISTS over_2_5_prob numeric,
ADD COLUMN IF NOT EXISTS under_2_5_prob numeric,
ADD COLUMN IF NOT EXISTS home_clean_sheet_pct numeric,
ADD COLUMN IF NOT EXISTS home_last_3_goals integer,
ADD COLUMN IF NOT EXISTS away_last_3_goals integer,
ADD COLUMN IF NOT EXISTS home_last_3_conceded integer,
ADD COLUMN IF NOT EXISTS away_last_3_conceded integer;

-- Remove old 'probability' column if it exists (Optional, but keeps schema clean)
ALTER TABLE fd_predictions DROP COLUMN IF EXISTS probability;

-- Ensure the Unique constraint on match_id remains
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fd_predictions_match_id_key') THEN
        ALTER TABLE fd_predictions ADD CONSTRAINT fd_predictions_match_id_key UNIQUE (match_id);
    END IF;
END $$;

COMMENT ON TABLE fd_predictions IS 'Table for Over/Under 2.5 goal predictions with detailed criteria stats.';
