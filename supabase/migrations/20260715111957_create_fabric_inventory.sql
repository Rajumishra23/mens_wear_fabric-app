/*
# Create Fabric Inventory table

1. New Tables
- `fabric_inventory`
  - `id` (uuid, primary key)
  - `fabric_code` (text, unique, not null) — human-readable unique ID e.g. FB001
  - `photo_url` (text, nullable) — public URL of the stored image in Supabase Storage
  - `name` (text, not null) — Name / Design of the fabric
  - `type` (text, not null) — Fabric type e.g. Cotton, Linen, Silk, Rayon
  - `width` (text, nullable) — Fabric width e.g. "44 inch", "60 inch"
  - `available_mtr` (numeric, not null, default 0) — Available meters
  - `location` (text, not null) — Storage location e.g. Shop Floor, Office, Godown
  - `last_updated` (date, not null, default today) — Last updated date
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `fabric_inventory`.
- This is a single-tenant shared app (no sign-in screen; roles are handled in-app).
  All CRUD is allowed for both `anon` and `authenticated` so the anon-key client can operate.

3. Storage
- Create a public bucket `fabric-photos` for storing fabric images.
*/

CREATE TABLE IF NOT EXISTS fabric_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_code text UNIQUE NOT NULL,
  photo_url text,
  name text NOT NULL,
  type text NOT NULL,
  width text,
  available_mtr numeric NOT NULL DEFAULT 0,
  location text NOT NULL,
  last_updated date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Helpful index for search by code / name
CREATE INDEX IF NOT EXISTS idx_fabric_inventory_code ON fabric_inventory (fabric_code);
CREATE INDEX IF NOT EXISTS idx_fabric_inventory_name ON fabric_inventory (name);
CREATE INDEX IF NOT EXISTS idx_fabric_inventory_type ON fabric_inventory (type);
CREATE INDEX IF NOT EXISTS idx_fabric_inventory_location ON fabric_inventory (location);

ALTER TABLE fabric_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_fabric" ON fabric_inventory;
CREATE POLICY "anon_select_fabric" ON fabric_inventory FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_fabric" ON fabric_inventory;
CREATE POLICY "anon_insert_fabric" ON fabric_inventory FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_fabric" ON fabric_inventory;
CREATE POLICY "anon_update_fabric" ON fabric_inventory FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_fabric" ON fabric_inventory;
CREATE POLICY "anon_delete_fabric" ON fabric_inventory FOR DELETE
  TO anon, authenticated USING (true);

-- Storage bucket for fabric photos (public so images can be displayed without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fabric-photos', 'fabric-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anon + authenticated to upload/read/delete in the fabric-photos bucket
DROP POLICY IF EXISTS "anon_read_fabric_photos" ON storage.objects;
CREATE POLICY "anon_read_fabric_photos" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'fabric-photos');

DROP POLICY IF EXISTS "anon_insert_fabric_photos" ON storage.objects;
CREATE POLICY "anon_insert_fabric_photos" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'fabric-photos');

DROP POLICY IF EXISTS "anon_update_fabric_photos" ON storage.objects;
CREATE POLICY "anon_update_fabric_photos" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'fabric-photos') WITH CHECK (bucket_id = 'fabric-photos');

DROP POLICY IF EXISTS "anon_delete_fabric_photos" ON storage.objects;
CREATE POLICY "anon_delete_fabric_photos" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'fabric-photos');