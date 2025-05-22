/*
  # Fix app_users RLS policies for proper access control

  1. Changes
    - Drop all existing RLS policies
    - Create new simplified policies that properly handle:
      - User creation
      - Admin access
      - Self-management
      - Read access

  2. Security
    - Maintain RLS protection
    - Allow proper user creation and management
    - Ensure admins can manage all users
    - Allow users to manage their own data
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "enable_read_access_for_authenticated_users" ON app_users;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON app_users;
DROP POLICY IF EXISTS "enable_update_for_own_record_or_admin" ON app_users;
DROP POLICY IF EXISTS "enable_delete_for_own_record_or_admin" ON app_users;

-- Create new policies
-- Allow all authenticated users to read
CREATE POLICY "enable_read_for_all_users"
ON app_users FOR SELECT
TO authenticated
USING (true);

-- Allow user creation (first user becomes admin)
CREATE POLICY "enable_insert_for_users"
ON app_users FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = auth_user_id OR
  NOT EXISTS (SELECT 1 FROM app_users)  -- First user can be created
);

-- Allow updates for admins and self
CREATE POLICY "enable_update_for_admins_and_self"
ON app_users FOR UPDATE
TO authenticated
USING (
  auth.uid() = auth_user_id OR
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = auth_user_id OR
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow deletion for admins and self
CREATE POLICY "enable_delete_for_admins_and_self"
ON app_users FOR DELETE
TO authenticated
USING (
  auth.uid() = auth_user_id OR
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);