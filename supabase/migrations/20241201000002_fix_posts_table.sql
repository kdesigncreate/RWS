-- Fix posts table structure
-- Add missing columns to existing posts table

-- Add is_published and is_draft columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_published') THEN
        ALTER TABLE public.posts ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_draft') THEN
        ALTER TABLE public.posts ADD COLUMN is_draft BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update existing posts to set is_published based on status
UPDATE public.posts 
SET 
    is_published = (status = 'published'),
    is_draft = (status = 'draft')
WHERE is_published IS NULL OR is_draft IS NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view published posts" ON public.posts;
DROP POLICY IF EXISTS "Admin access through Edge Functions only" ON public.posts;

-- Create RLS policies for posts table
CREATE POLICY "Public can view published posts" ON public.posts
    FOR SELECT USING (status = 'published' AND is_published = true);

CREATE POLICY "Admin access through Edge Functions only" ON public.posts
    FOR ALL USING (false); 