-- Migration: Add sync status tracking and testimonies system
-- This tracks when predictions were last generated for each day
-- and allows users to attest to prediction outcomes without login

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS public.fd_sync_status CASCADE;

-- Create sync status table
CREATE TABLE public.fd_sync_status (
  id BIGSERIAL PRIMARY KEY,
  sync_date DATE NOT NULL UNIQUE,
  prediction_types_generated TEXT[] NOT NULL DEFAULT '{}',
  matches_synced INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.fd_sync_status IS 'Tracks daily sync status to prevent duplicate prediction generation';
COMMENT ON COLUMN public.fd_sync_status.sync_date IS 'Date of the sync (UTC)';
COMMENT ON COLUMN public.fd_sync_status.prediction_types_generated IS 'Array of prediction types generated (e.g., OVER_2_5, WIN_DRAW, GG)';
COMMENT ON COLUMN public.fd_sync_status.matches_synced IS 'Number of matches synced for this date';

-- Create index for fast date lookups
CREATE INDEX idx_fd_sync_status_date ON public.fd_sync_status(sync_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fd_sync_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_fd_sync_status_updated_at ON public.fd_sync_status;
CREATE TRIGGER trigger_update_fd_sync_status_updated_at
  BEFORE UPDATE ON public.fd_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_fd_sync_status_updated_at();

-- ============================================================
-- TESTIMONIES SYSTEM
-- ============================================================

-- Create testimonies table for prediction outcome attestations
CREATE TABLE IF NOT EXISTS public.fd_testimonies (
  id BIGSERIAL PRIMARY KEY,
  prediction_id BIGINT NOT NULL,
  outcome TEXT NOT NULL, -- 'CORRECT', 'INCORRECT', 'PARTIAL'
  match_result TEXT, -- e.g., '2-1', '3-0'
  user_comment TEXT,
  anonymous_name TEXT, -- Optional display name for anonymous users
  user_ip TEXT, -- For basic rate limiting (stored as text, no PII)
  user_agent TEXT, -- For basic tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.fd_testimonies IS 'User testimonies for prediction outcomes (no login required)';
COMMENT ON COLUMN public.fd_testimonies.prediction_id IS 'Reference to fd_predictions.id';
COMMENT ON COLUMN public.fd_testimonies.outcome IS 'Whether the prediction was correct: CORRECT, INCORRECT, or PARTIAL';
COMMENT ON COLUMN public.fd_testimonies.match_result IS 'Actual match score (e.g., 2-1)';
COMMENT ON COLUMN public.fd_testimonies.user_comment IS 'Optional user comment about the prediction';
COMMENT ON COLUMN public.fd_testimonies.anonymous_name IS 'Optional display name (anonymous)';
COMMENT ON COLUMN public.fd_testimonies.user_ip IS 'Hashed IP for rate limiting (not displayed)';
COMMENT ON COLUMN public.fd_testimonies.user_agent IS 'Browser info for tracking (not displayed)';

-- Create indexes
CREATE INDEX idx_fd_testimonies_prediction_id ON public.fd_testimonies(prediction_id);
CREATE INDEX idx_fd_testimonies_outcome ON public.fd_testimonies(outcome);
CREATE INDEX idx_fd_testimonies_created_at ON public.fd_testimonies(created_at DESC);

-- Function to update updated_at timestamp for testimonies
CREATE OR REPLACE FUNCTION update_fd_testimonies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for testimonies
DROP TRIGGER IF EXISTS trigger_update_fd_testimonies_updated_at ON public.fd_testimonies;
CREATE TRIGGER trigger_update_fd_testimonies_updated_at
  BEFORE UPDATE ON public.fd_testimonies
  FOR EACH ROW
  EXECUTE FUNCTION update_fd_testimonies_updated_at();

-- ============================================================
-- AI EXPLANATION FIELDS
-- ============================================================

-- Add AI-specific columns to fd_predictions
ALTER TABLE public.fd_predictions 
ADD COLUMN IF NOT EXISTS ai_explanation TEXT,
ADD COLUMN IF NOT EXISTS ai_enhanced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_model_used TEXT;

-- Add comments
COMMENT ON COLUMN public.fd_predictions.ai_explanation IS 'AI-generated enhanced explanation (when available)';
COMMENT ON COLUMN public.fd_predictions.ai_enhanced_at IS 'Timestamp when AI explanation was generated';
COMMENT ON COLUMN public.fd_predictions.ai_model_used IS 'Which AI model was used for the explanation';

-- Create index for predictions that have AI explanations
CREATE INDEX IF NOT EXISTS idx_fd_predictions_ai_enhanced ON public.fd_predictions(ai_enhanced_at) WHERE ai_enhanced_at IS NOT NULL;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Grant necessary permissions for anonymous access (read-only)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant insert permissions for testimonies (both anon and authenticated)
GRANT INSERT ON public.fd_testimonies TO anon, authenticated;
GRANT UPDATE ON public.fd_testimonies TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify sync status table
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'fd_sync_status' 
-- AND table_schema = 'public' 
-- ORDER BY ordinal_position;

-- Verify testimonies table
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'fd_testimonies' 
-- AND table_schema = 'public' 
-- ORDER BY ordinal_position;

-- Verify AI columns
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'fd_predictions' 
-- AND table_schema = 'public' 
-- AND column_name IN ('ai_explanation', 'ai_enhanced_at', 'ai_model_used')
-- ORDER BY ordinal_position;
