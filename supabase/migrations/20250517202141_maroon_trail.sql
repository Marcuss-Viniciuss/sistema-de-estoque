/*
  # Update transactions foreign key constraint

  1. Changes
    - Modify the foreign key constraint on transactions table to add ON DELETE CASCADE
    This ensures that when a product is deleted, all associated transactions are automatically deleted

  2. Implementation Details
    - Drop existing foreign key constraint
    - Create new foreign key constraint with CASCADE delete
*/

DO $$ BEGIN
  -- Drop the existing foreign key constraint
  ALTER TABLE transactions 
  DROP CONSTRAINT IF EXISTS transactions_product_id_fkey;

  -- Add the new foreign key constraint with CASCADE delete
  ALTER TABLE transactions 
  ADD CONSTRAINT transactions_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES products(id) 
  ON DELETE CASCADE;
END $$;