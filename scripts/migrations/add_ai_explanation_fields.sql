-- Migration: Add AI explanation fields to fd_predictions table
-- This adds support for hybrid AI + algorithm explanations

-- Add AI-specific columns
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
