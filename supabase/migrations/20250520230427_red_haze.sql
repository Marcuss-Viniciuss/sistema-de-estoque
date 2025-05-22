/*
  # Add email column to app_users table

  1. Changes
    - Add email column to app_users table
    - Set default value for existing records
    - Make column NOT NULL after populating data

  2. Implementation
    - Add column as nullable first
    - Update existing records with email from auth.users
    - Set NOT NULL constraint
*/

-- Add email column as nullable first
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS email text;

-- Update existing records with email from auth.users
UPDATE app_users
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = app_users.auth_user_id
)
WHERE email IS NULL;

-- Make email column NOT NULL
ALTER TABLE app_users 
ALTER COLUMN email SET NOT NULL;