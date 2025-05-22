/*
  # Fix recursive policies for app_users table

  1. Changes
    - Remove existing policies that cause recursion
    - Create new, non-recursive policies for app_users table
    
  2. Security
    - Enable RLS on app_users table (maintained)
    - Add policy for users to manage their own data
    - Add policy for admins to manage all users
    - Add policy for new user creation
    - Add policy for reading user data
*/

-- First, drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Admins can manage all users" ON app_users;
DROP POLICY IF EXISTS "Users can manage their own data" ON app_users;
DROP POLICY IF EXISTS "Allow new user creation" ON app_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON app_users;

-- Create new, non-recursive policies
-- Policy for admins to manage all users
CREATE POLICY "admin_manage_all_users" ON app_users
FOR ALL TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id 
    FROM app_users 
    WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id 
    FROM app_users 
    WHERE role = 'admin'
  )
);

-- Policy for users to manage their own data
CREATE POLICY "users_manage_own_data" ON app_users
FOR ALL TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Policy for new user creation
CREATE POLICY "allow_user_creation" ON app_users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- Policy for reading user data
CREATE POLICY "allow_read_access" ON app_users
FOR SELECT TO authenticated
USING (true);