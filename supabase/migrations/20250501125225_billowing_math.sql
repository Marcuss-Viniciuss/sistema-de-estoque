/*
  # Add new features to inventory system

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key)

    - `product_details`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `price` (decimal)
      - `cost` (decimal)
      - `expiration_date` (date)
      - `supplier_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add supplier_id to products table
    - Add price columns to products table

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- Create product_details table
CREATE TABLE IF NOT EXISTS product_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  price decimal(10,2) NOT NULL DEFAULT 0,
  cost decimal(10,2) NOT NULL DEFAULT 0,
  expiration_date date,
  supplier_id uuid REFERENCES suppliers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_cost CHECK (cost >= 0)
);

ALTER TABLE product_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read product_details"
  ON product_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert product_details"
  ON product_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update product_details"
  ON product_details FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete product_details"
  ON product_details FOR DELETE
  TO authenticated
  USING (true);

-- Add supplier_id to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id);

-- Create function to update product_details updated_at
CREATE OR REPLACE FUNCTION update_product_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating product_details updated_at
CREATE TRIGGER update_product_details_updated_at_trigger
BEFORE UPDATE ON product_details
FOR EACH ROW
EXECUTE FUNCTION update_product_details_updated_at();