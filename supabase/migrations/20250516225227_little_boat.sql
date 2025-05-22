/*
  # Fix app_users policies to prevent recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create new, simplified policies that prevent recursion
    - Maintain security while avoiding circular references

  2. Security
    - Users can still only manage their own data
    - Admins retain full access
    - Prevents infinite recursion in policy checks
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "admin_can_manage_all" ON app_users;
DROP POLICY IF EXISTS "allow_user_creation" ON app_users;
DROP POLICY IF EXISTS "users_can_manage_own" ON app_users;
DROP POLICY IF EXISTS "users_can_view_all" ON app_users;

-- Create new, simplified policies
CREATE POLICY "enable_read_access_for_authenticated_users"
ON app_users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "enable_insert_for_authenticated_users"
ON app_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "enable_update_for_own_record_or_admin"
ON app_users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = auth_user_id OR 
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = auth_user_id OR 
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "enable_delete_for_own_record_or_admin"
ON app_users
FOR DELETE
TO authenticated
USING (
  auth.uid() = auth_user_id OR 
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);