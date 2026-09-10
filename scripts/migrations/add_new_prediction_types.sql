-- Migration: Add new prediction types and enhanced features to fd_predictions table
-- This migration adds support for Win/Draw and GG predictions along with AI analysis features

-- Run this in your Supabase SQL editor or via the migration tool

-- First, drop the existing unique constraint on match_id only
ALTER TABLE public.fd_predictions DROP CONSTRAINT IF EXISTS fd_predictions_match_id_key;

-- Add new columns to fd_predictions table for enhanced prediction support
ALTER TABLE public.fd_predictions 
ADD COLUMN IF NOT EXISTS prediction_type TEXT DEFAULT 'OVER_2_5',
ADD COLUMN IF NOT EXISTS predicted_win_draw BOOLEAN,
ADD COLUMN IF NOT EXISTS win_draw_prob NUMERIC,
ADD COLUMN IF NOT EXISTS predicted_gg BOOLEAN,
ADD COLUMN IF NOT EXISTS gg_prob NUMERIC,
ADD COLUMN IF NOT EXISTS home_form_strength NUMERIC,
ADD COLUMN IF NOT EXISTS away_form_strength NUMERIC,
ADD COLUMN IF NOT EXISTS defensive_strength NUMERIC,
ADD COLUMN IF NOT EXISTS league_position_home INTEGER,
ADD COLUMN IF NOT EXISTS league_position_away INTEGER,
ADD COLUMN IF NOT EXISTS home_record_last_3 TEXT,
ADD COLUMN IF NOT EXISTS away_record_last_3 TEXT,
ADD COLUMN IF NOT EXISTS criteria_met TEXT[],
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC,
ADD COLUMN IF NOT EXISTS analysis_explanation TEXT,
ADD COLUMN IF NOT EXISTS top_scorers_available BOOLEAN,
ADD COLUMN IF NOT EXISTS best_assist_available BOOLEAN,
ADD COLUMN IF NOT EXISTS home_form_string TEXT,
ADD COLUMN IF NOT EXISTS away_form_string TEXT;

-- Add new unique constraint on (match_id, prediction_type) to allow multiple predictions per match
ALTER TABLE public.fd_predictions ADD CONSTRAINT fd_predictions_match_id_prediction_type_key UNIQUE (match_id, prediction_type);

-- Add additional score columns to fd_matches table for more detailed match tracking
ALTER TABLE public.fd_matches
ADD COLUMN IF NOT EXISTS score_halftime_home INTEGER,
ADD COLUMN IF NOT EXISTS score_halftime_away INTEGER,
ADD COLUMN IF NOT EXISTS score_extratime_home INTEGER,
ADD COLUMN IF NOT EXISTS score_extratime_away INTEGER,
ADD COLUMN IF NOT EXISTS score_penalties_home INTEGER,
ADD COLUMN IF NOT EXISTS score_penalties_away INTEGER;

-- Add comments to document the new columns
COMMENT ON COLUMN public.fd_predictions.prediction_type IS 'Type of prediction: OVER_2_5, WIN_DRAW, or GG';
COMMENT ON COLUMN public.fd_predictions.predicted_win_draw IS 'Whether the prediction is for a Win or Draw result';
COMMENT ON COLUMN public.fd_predictions.win_draw_prob IS 'Probability percentage for Win/Draw prediction';
COMMENT ON COLUMN public.fd_predictions.predicted_gg IS 'Whether both teams are predicted to score';
COMMENT ON COLUMN public.fd_predictions.gg_prob IS 'Probability percentage for Both Teams to Score prediction';
COMMENT ON COLUMN public.fd_predictions.home_form_strength IS 'Home team form strength score (0-10)';
COMMENT ON COLUMN public.fd_predictions.away_form_strength IS 'Away team form strength score (0-10)';
COMMENT ON COLUMN public.fd_predictions.defensive_strength IS 'Combined defensive strength score (0-100)';
COMMENT ON COLUMN public.fd_predictions.league_position_home IS 'Home team position in league table';
COMMENT ON COLUMN public.fd_predictions.league_position_away IS 'Away team position in league table';
COMMENT ON COLUMN public.fd_predictions.home_record_last_3 IS 'Home team record in last 3 matches (e.g., "2W-1D-0L")';
COMMENT ON COLUMN public.fd_predictions.away_record_last_3 IS 'Away team record in last 3 matches (e.g., "1W-1D-1L")';
COMMENT ON COLUMN public.fd_predictions.criteria_met IS 'Array of prediction criteria that were met';
COMMENT ON COLUMN public.fd_predictions.confidence_score IS 'AI confidence score (0-100)';
COMMENT ON COLUMN public.fd_predictions.analysis_explanation IS 'AI-generated explanation of the prediction';
COMMENT ON COLUMN public.fd_predictions.top_scorers_available IS 'Whether top scorers are available (estimated)';
COMMENT ON COLUMN public.fd_predictions.best_assist_available IS 'Whether best assist providers are available (estimated)';

-- Create index on prediction_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_fd_predictions_prediction_type ON public.fd_predictions(prediction_type);

-- Create index on confidence_score for sorting high-confidence predictions
CREATE INDEX IF NOT EXISTS idx_fd_predictions_confidence_score ON public.fd_predictions(confidence_score);

-- Create index on match_id and prediction_type for compound queries
CREATE INDEX IF NOT EXISTS idx_fd_predictions_match_type ON public.fd_predictions(match_id, prediction_type);

-- Update existing records to have the default prediction type
UPDATE public.fd_predictions 
SET prediction_type = 'OVER_2_5' 
WHERE prediction_type IS NULL;

-- Grant necessary permissions (adjust based on your Supabase setup)
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verification query (run this to check the migration was successful)
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'fd_predictions' 
-- AND table_schema = 'public' 
-- ORDER BY ordinal_position;