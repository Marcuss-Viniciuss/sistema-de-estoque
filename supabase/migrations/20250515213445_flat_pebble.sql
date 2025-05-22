/*
  # Add users management and reporting features

  1. New Tables
    - `app_users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `cpf` (text, unique)
      - `role` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `auth_user_id` (uuid, foreign key)

  2. Changes
    - Add CNPJ field to suppliers table
    - Add role-based access control

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add CNPJ to suppliers
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS cnpj text UNIQUE;

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  auth_user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  CONSTRAINT valid_role CHECK (role IN ('admin', 'user'))
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Policies for app_users
CREATE POLICY "Users can read app_users"
  ON app_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert app_users"
  ON app_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE role = 'admin'
  ));

CREATE POLICY "Admins can update app_users"
  ON app_users FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE role = 'admin'
  ));

CREATE POLICY "Admins can delete app_users"
  ON app_users FOR DELETE
  TO authenticated
  USING (auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE role = 'admin'
  ));