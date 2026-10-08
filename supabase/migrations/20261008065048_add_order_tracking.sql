/*
# Add order tracking to shirts + activity log

1. Modified Tables
- `shirts`
  - ADD `order_qty` (integer, not null, default 0) — current pending order count
  - ADD `salesman_name` (text, nullable) — name of salesman who placed the order

2. New Tables
- `activity_log`
  - `id` (uuid, primary key)
  - `shirt_id` (uuid, references shirts, ON DELETE CASCADE)
  - `shirt_name` (text) — denormalized for display
  - `size` (integer) — shirt size
  - `action` (text) — 'order_added', 'order_removed', 'shirt_added', 'shirt_updated'
  - `quantity` (integer, default 0) — quantity involved
  - `salesman_name` (text, nullable)
  - `created_at` (timestamptz, default now())

3. Security
- RLS enabled on activity_log, anon+authenticated CRUD (single-tenant).
*/

ALTER TABLE shirts ADD COLUMN IF NOT EXISTS order_qty integer NOT NULL DEFAULT 0;
ALTER TABLE shirts ADD COLUMN IF NOT EXISTS salesman_name text;

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shirt_id uuid REFERENCES shirts(id) ON DELETE CASCADE,
  shirt_name text,
  size integer,
  action text NOT NULL,
  quantity integer DEFAULT 0,
  salesman_name text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log (created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_activity" ON activity_log;
CREATE POLICY "anon_select_activity" ON activity_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_activity" ON activity_log;
CREATE POLICY "anon_insert_activity" ON activity_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_activity" ON activity_log;
CREATE POLICY "anon_delete_activity" ON activity_log FOR DELETE
  TO anon, authenticated USING (true);