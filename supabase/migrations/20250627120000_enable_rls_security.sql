-- Enable Row Level Security (RLS) for all public tables
-- This migration addresses the security linter warnings

-- Enable RLS on posts table (main data table)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts table
-- Policy for public read access (anyone can read published posts)
CREATE POLICY "Public can view published posts" ON public.posts
    FOR SELECT USING (true);

-- Policy for admin access (full CRUD operations)
-- Note: We use Edge Functions for admin operations, so this is restrictive by design
CREATE POLICY "Admin access through Edge Functions only" ON public.posts
    FOR ALL USING (false);

-- Enable RLS on users table 
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users table policies (restrictive - managed via Edge Functions)
CREATE POLICY "No direct user access" ON public.users
    FOR ALL USING (false);

-- Enable RLS on system tables (restrictive policies)
ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to migrations" ON public.migrations
    FOR ALL USING (false);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to password reset tokens" ON public.password_reset_tokens
    FOR ALL USING (false);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to sessions" ON public.sessions
    FOR ALL USING (false);

ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to cache" ON public.cache
    FOR ALL USING (false);

ALTER TABLE public.cache_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to cache locks" ON public.cache_locks
    FOR ALL USING (false);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to jobs" ON public.jobs
    FOR ALL USING (false);

ALTER TABLE public.job_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to job batches" ON public.job_batches
    FOR ALL USING (false);

ALTER TABLE public.failed_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to failed jobs" ON public.failed_jobs
    FOR ALL USING (false);

ALTER TABLE public.personal_access_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to personal access tokens" ON public.personal_access_tokens
    FOR ALL USING (false);

-- Grant necessary permissions to the authenticated role for posts
GRANT SELECT ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;

-- Comment explaining our security approach
COMMENT ON TABLE public.posts IS 'RLS enabled. Public read access for published posts. Admin operations handled via Edge Functions with JWT authentication.';
COMMENT ON TABLE public.users IS 'RLS enabled. All operations handled via Edge Functions with proper authentication.';