-- Migration: Add predicted_winner column to fd_predictions table
-- This migration adds support for storing which specific team is predicted to win (HOME/AWAY/DRAW)

-- Add the new column
ALTER TABLE public.fd_predictions 
ADD COLUMN IF NOT EXISTS predicted_winner TEXT;

-- Add comment to document the new column
COMMENT ON COLUMN public.fd_predictions.predicted_winner IS 'Specific winner prediction: HOME, AWAY, DRAW, or null for away win';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_fd_predictions_predicted_winner ON public.fd_predictions(predicted_winner);

-- Verification query (run this to check the migration was successful)
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'fd_predictions' 
-- AND table_schema = 'public' 
-- AND column_name = 'predicted_winner';