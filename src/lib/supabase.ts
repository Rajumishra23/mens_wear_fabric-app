import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export type Fabric = {
  id: string;
  fabric_code: string;
  photo_url: string | null;
  name: string;
  type: string;
  width: string | null;
  available_mtr: number;
  location: string;
  last_updated: string;
  created_at: string;
};

export type FabricInsert = {
  fabric_code: string;
  photo_url?: string | null;
  name: string;
  type: string;
  width?: string | null;
  available_mtr?: number;
  location: string;
  last_updated?: string;
};

export type FabricUpdate = Partial<FabricInsert>;

export const FABRIC_TYPES = ['Cotton', 'Linen', 'Silk', 'Rayon', 'Wool', 'Blend', 'TR', 'japanes', 'korian', 'velvet','jaquard'] as const;
export const LOCATIONS = ['Shop Floor', 'Office', 'Godown'] as const;
