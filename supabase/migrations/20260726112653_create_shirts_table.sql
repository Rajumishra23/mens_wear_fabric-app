/*
# Create Shirts table (Product & Carton inventory)

1. New Tables
- `shirts`
  - `id` (uuid, primary key)
  - `photo_url` (text, nullable) — public URL of stored image
  - `name` (text, not null) — shirt name / design
  - `size` (integer, not null) — shirt size e.g. 30, 32 ... 50
  - `category` (text, not null) — 'product' or 'carton'
  - `carton_no` (text, nullable) — carton reference number (for carton category)
  - `available_qty` (integer, not null, default 0) — available quantity
  - `location` (text, nullable) — storage location
  - `last_updated` (date, not null, default today)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `shirts`.
- Single-tenant shared app: allow anon + authenticated CRUD.

3. Notes
- The size filter in the UI (30-50, even sizes) lets users select multiple sizes at once.
- When adding a shirt, multiple sizes can be selected; one row is created per selected size.
*/

CREATE TABLE IF NOT EXISTS shirts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url text,
  name text NOT NULL,
  size integer NOT NULL,
  category text NOT NULL CHECK (category IN ('product', 'carton')),
  carton_no text,
  available_qty integer NOT NULL DEFAULT 0,
  location text,
  last_updated date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shirts_category ON shirts (category);
CREATE INDEX IF NOT EXISTS idx_shirts_size ON shirts (size);
CREATE INDEX IF NOT EXISTS idx_shirts_name ON shirts (name);

ALTER TABLE shirts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_shirts" ON shirts;
CREATE POLICY "anon_select_shirts" ON shirts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_shirts" ON shirts;
CREATE POLICY "anon_insert_shirts" ON shirts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_shirts" ON shirts;
CREATE POLICY "anon_update_shirts" ON shirts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_shirts" ON shirts;
CREATE POLICY "anon_delete_shirts" ON shirts FOR DELETE
  TO anon, authenticated USING (true);