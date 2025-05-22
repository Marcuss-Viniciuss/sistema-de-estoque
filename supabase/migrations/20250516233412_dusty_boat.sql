/*
  # Fix app_users RLS policies

  1. Changes
    - Drop existing policies
    - Create new simplified policies for app_users table
    - Fix infinite recursion issues
    - Ensure proper access control

  2. Security
    - Maintain RLS protection
    - Allow proper user management
    - Fix policy recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "enable_read_access_for_authenticated_users" ON app_users;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON app_users;
DROP POLICY IF EXISTS "enable_update_for_own_record_or_admin" ON app_users;
DROP POLICY IF EXISTS "enable_delete_for_own_record_or_admin" ON app_users;

-- Create new simplified policies
-- Allow all authenticated users to read
CREATE POLICY "enable_read_for_authenticated"
ON app_users
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own record
CREATE POLICY "enable_insert_for_self"
ON app_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- Allow users to update their own record or admins to update any record
CREATE POLICY "enable_update_for_self_or_admin"
ON app_users
FOR UPDATE
TO authenticated
USING (
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin'
    ) THEN true
    ELSE auth.uid() = auth_user_id
  END
)
WITH CHECK (
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin'
    ) THEN true
    ELSE auth.uid() = auth_user_id
  END
);

-- Allow users to delete their own record or admins to delete any record
CREATE POLICY "enable_delete_for_self_or_admin"
ON app_users
FOR DELETE
TO authenticated
USING (
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin'
    ) THEN true
    ELSE auth.uid() = auth_user_id
  END
);