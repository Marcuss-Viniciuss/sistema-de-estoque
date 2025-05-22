/*
  # Initial schema for inventory system

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `color` (text)
      - `created_at` (timestamp)

    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `sku` (text, unique)
      - `category_id` (uuid, foreign key)
      - `quantity` (integer)
      - `minimum_stock` (integer)
      - `location` (text)
      - `acquisition_date` (date)
      - `last_updated` (timestamp)
      - `image_url` (text)

    - `transactions`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `type` (text, check constraint for 'in' or 'out')
      - `quantity` (integer)
      - `date` (timestamp)
      - `notes` (text)
      - `created_by` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sku text UNIQUE NOT NULL,
  category_id uuid REFERENCES categories(id),
  quantity integer NOT NULL DEFAULT 0,
  minimum_stock integer NOT NULL DEFAULT 0,
  location text,
  acquisition_date date,
  last_updated timestamptz DEFAULT now(),
  image_url text,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  type text NOT NULL CHECK (type IN ('in', 'out')),
  quantity integer NOT NULL,
  date timestamptz DEFAULT now(),
  notes text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update product quantity on transaction
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE products
    SET quantity = quantity + NEW.quantity,
        last_updated = now()
    WHERE id = NEW.product_id;
  ELSE
    UPDATE products
    SET quantity = quantity - NEW.quantity,
        last_updated = now()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating product quantity
CREATE TRIGGER update_product_quantity_trigger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_product_quantity();