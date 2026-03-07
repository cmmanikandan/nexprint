-- Fix missing is_resolved column in feedback table
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false;
