/*
  # Update app_users RLS policies

  1. Changes
    - Update RLS policies for app_users table to handle edge cases
    - Add policy for users to manage their own data
    - Fix admin policies to properly check admin status
    - Add policy for new user creation

  2. Security
    - Maintain RLS enabled on app_users table
    - Ensure admins can manage all users
    - Allow users to view their own data
    - Allow new user creation during signup
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can delete app_users" ON app_users;
DROP POLICY IF EXISTS "Admins can insert app_users" ON app_users;
DROP POLICY IF EXISTS "Admins can update app_users" ON app_users;
DROP POLICY IF EXISTS "Users can read app_users" ON app_users;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users" ON app_users
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can manage their own data" ON app_users
FOR ALL TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admins can manage all users" ON app_users
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.auth_user_id = auth.uid() 
    AND au.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.auth_user_id = auth.uid() 
    AND au.role = 'admin'
  )
);

CREATE POLICY "Allow new user creation" ON app_users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = auth_user_id);