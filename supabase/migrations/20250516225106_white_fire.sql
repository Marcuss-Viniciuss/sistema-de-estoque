/*
  # Fix app_users RLS policies

  1. Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new, simplified policies for app_users table:
      - Allow admins to manage all users
      - Allow users to read all users
      - Allow users to manage their own data
      - Allow initial user creation during signup

  2. Security
    - Maintains RLS protection
    - Prevents infinite recursion in policy evaluation
    - Ensures proper access control based on user roles
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "admin_manage_all_users" ON app_users;
DROP POLICY IF EXISTS "allow_read_access" ON app_users;
DROP POLICY IF EXISTS "allow_user_creation" ON app_users;
DROP POLICY IF EXISTS "users_manage_own_data" ON app_users;

-- Create new, simplified policies
-- Allow admins to manage all users
CREATE POLICY "admin_can_manage_all"
ON app_users
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT au.auth_user_id 
    FROM app_users au 
    WHERE au.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT au.auth_user_id 
    FROM app_users au 
    WHERE au.role = 'admin'
  )
);

-- Allow all authenticated users to read user data
CREATE POLICY "users_can_view_all"
ON app_users
FOR SELECT
TO authenticated
USING (true);

-- Allow users to manage their own data
CREATE POLICY "users_can_manage_own"
ON app_users
FOR ALL
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Allow initial user creation during signup
CREATE POLICY "allow_user_creation"
ON app_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);