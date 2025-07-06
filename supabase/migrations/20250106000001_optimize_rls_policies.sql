-- Optimize RLS policies for performance
-- This migration addresses the Supabase linter warnings by:
-- 1. Consolidating duplicate policies
-- 2. Optimizing auth function calls with SELECT statements
-- 3. Removing redundant policies

-- Posts table optimization
DROP POLICY IF EXISTS "Posts are publicly readable" ON posts;
DROP POLICY IF EXISTS "Admin can do everything on posts" ON posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON posts;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON posts;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON posts;

-- Create consolidated, optimized policies for posts
CREATE POLICY "posts_select_policy" ON posts
    FOR SELECT USING (true);

CREATE POLICY "posts_admin_policy" ON posts
    FOR ALL USING (
        (SELECT auth.jwt() ->> 'email') = 'admin@rws.com'
    );

-- Users table optimization  
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admin can do everything on users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON users;

-- Create consolidated, optimized policies for users
CREATE POLICY "users_own_data_policy" ON users
    FOR ALL USING (
        id = (SELECT auth.uid()) OR 
        (SELECT auth.jwt() ->> 'email') = 'admin@rws.com'
    );

-- Rate limits table optimization
DROP POLICY IF EXISTS "Rate limits are viewable by all" ON rate_limits;
DROP POLICY IF EXISTS "Admin can do everything on rate_limits" ON rate_limits;
DROP POLICY IF EXISTS "Enable read access for all users" ON rate_limits;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rate_limits;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON rate_limits;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON rate_limits;

-- Create consolidated, optimized policies for rate_limits
CREATE POLICY "rate_limits_system_policy" ON rate_limits
    FOR ALL USING (true);

-- Ensure RLS is enabled on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Add comments for clarity
COMMENT ON POLICY "posts_select_policy" ON posts IS 'Allow public read access to all posts';
COMMENT ON POLICY "posts_admin_policy" ON posts IS 'Allow admin full access to posts using optimized auth check';
COMMENT ON POLICY "users_own_data_policy" ON users IS 'Users can access own data, admin can access all using optimized auth check';
COMMENT ON POLICY "rate_limits_system_policy" ON rate_limits IS 'System-wide access for rate limiting functionality';