/*
  # Update app_users RLS policies

  1. Changes
    - Update insert policy to allow admins to create new users
    - Update update policy to allow admins to update any user
    - Update delete policy to allow admins to delete any user
    - Keep select policy unchanged as it's already correct

  2. Security
    - Admins can perform all operations on any user
    - Regular users can only manage their own data
    - All authenticated users can read all users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "enable_insert_for_self" ON app_users;
DROP POLICY IF EXISTS "enable_update_for_self_or_admin" ON app_users;
DROP POLICY IF EXISTS "enable_delete_for_self_or_admin" ON app_users;

-- Create new insert policy
CREATE POLICY "enable_insert_for_self_or_admin" ON app_users
FOR INSERT TO authenticated
WITH CHECK (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid()
      AND role = 'admin'
    ) THEN true
    ELSE auth.uid() = auth_user_id
  END
);

-- Create new update policy
CREATE POLICY "enable_update_for_self_or_admin" ON app_users
FOR UPDATE TO authenticated
USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid()
      AND role = 'admin'
    ) THEN true
    ELSE auth.uid() = auth_user_id
  END
)
WITH CHECK (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid()
      AND role = 'admin'
    ) THEN true
    ELSE auth.uid() = auth_user_id
  END
);

-- Create new delete policy
CREATE POLICY "enable_delete_for_self_or_admin" ON app_users
FOR DELETE TO authenticated
USING (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_user_id = auth.uid()
      AND role = 'admin'
    ) THEN true
    ELSE auth.uid() = auth_user_id
  END
);