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

export const FABRIC_TYPES = ['Cotton', 'Linen', 'Silk', 'Rayon', 'Wool', 'Blend'] as const;
export const LOCATIONS = ['Shop Floor', 'Office', 'Godown'] as const;

export type Shirt = {
  id: string;
  photo_url: string | null;
  name: string;
  size: number;
  category: 'product' | 'carton';
  carton_no: string | null;
  available_qty: number;
  order_qty: number;
  salesman_name: string | null;
  location: string | null;
  last_updated: string;
  created_at: string;
};

export type ShirtInsert = {
  photo_url?: string | null;
  name: string;
  size: number;
  category: 'product' | 'carton';
  carton_no?: string | null;
  available_qty?: number;
  order_qty?: number;
  salesman_name?: string | null;
  location?: string | null;
  last_updated?: string;
};

export type ShirtUpdate = Partial<ShirtInsert>;

export const SHIRT_SIZES = [30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50] as const;

export type ActivityLog = {
  id: string;
  shirt_id: string | null;
  shirt_name: string | null;
  size: number | null;
  action: string;
  quantity: number;
  salesman_name: string | null;
  created_at: string;
};

export type ActivityLogInsert = {
  shirt_id?: string | null;
  shirt_name?: string | null;
  size?: number | null;
  action: string;
  quantity?: number;
  salesman_name?: string | null;
};
