-- Create admin user in Supabase Auth
-- This script should be run in Supabase SQL Editor

-- First, let's create the admin user via Supabase Auth
-- This needs to be done via Supabase Dashboard or using the Management API

-- For reference, the admin user should be:
-- Email: admin@rws.com  
-- Password: password123!!
-- Name: Kamura

-- After creating the user in Supabase Auth dashboard, you can run this to set metadata:
UPDATE auth.users 
SET 
  raw_user_meta_data = jsonb_build_object(
    'name', 'Kamura',
    'role', 'admin'
  ),
  user_metadata = jsonb_build_object(
    'name', 'Kamura', 
    'role', 'admin'
  )
WHERE email = 'admin@rws.com';

-- Verify the user was created and updated
SELECT 
  id,
  email,
  user_metadata,
  raw_user_meta_data,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'admin@rws.com';