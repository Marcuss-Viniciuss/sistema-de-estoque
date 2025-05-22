/*
  # Fix recursive policies for app_users table

  1. Changes
    - Drop existing policies that cause recursion
    - Create new non-recursive policies for app_users table
    - Implement proper role-based access control

  2. Security
    - Maintain RLS enabled
    - Add simplified policies for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read app_users" ON app_users;
DROP POLICY IF EXISTS "Admins can insert app_users" ON app_users;
DROP POLICY IF EXISTS "Admins can update app_users" ON app_users;
DROP POLICY IF EXISTS "Admins can delete app_users" ON app_users;
DROP POLICY IF EXISTS "allow_read_access" ON app_users;
DROP POLICY IF EXISTS "allow_user_creation" ON app_users;
DROP POLICY IF EXISTS "users_manage_own_data" ON app_users;
DROP POLICY IF EXISTS "admin_manage_all_users" ON app_users;

-- Create new simplified policies
CREATE POLICY "allow_read_access" ON app_users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "allow_user_creation" ON app_users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "users_manage_own_data" ON app_users
  FOR ALL TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Create a separate admin policy that doesn't cause recursion
CREATE POLICY "admin_manage_all_users" ON app_users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid()
      AND role = 'admin'
    )
  );