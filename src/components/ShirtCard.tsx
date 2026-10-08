import { Pencil, MapPin, Calendar, ImageIcon, Plus, Minus, ShoppingCart } from 'lucide-react';
import type { Shirt } from '../lib/supabase';
import { useRole } from '../lib/role-context';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = {
  shirt: Shirt;
  onEdit: (s: Shirt) => void;
  onOrderChange: (shirt: Shirt, newOrderQty: number) => void;
};

export function ShirtCard({ shirt, onEdit, onOrderChange }: Props) {
  const { isEditor } = useRole();
  const effectiveQty = shirt.available_qty - shirt.order_qty;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 transition-all duration-300 hover:shadow-md hover:ring-stone-300">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {shirt.photo_url ? (
          <img
            src={shirt.photo_url}
            alt={shirt.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        {/* Size badge */}
        <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900/80 text-sm font-bold text-white backdrop-blur-sm">
          {shirt.size}
        </div>
        {/* Carton number badge */}
        {shirt.category === 'carton' && shirt.carton_no && (
          <div className="absolute right-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {shirt.carton_no}
          </div>
        )}
        {/* Order badge on photo if order > 0 */}
        {shirt.order_qty > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
            <ShoppingCart className="h-3 w-3" />
            {shirt.order_qty} ordered
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="truncate text-base font-semibold text-stone-900">{shirt.name}</h3>

        {/* Available + Order row */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Available */}
          <div className="rounded-xl bg-stone-50 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Available</p>
            <p className={`text-2xl font-bold leading-tight ${effectiveQty < 0 ? 'text-red-600' : 'text-stone-900'}`}>
              {effectiveQty}
              <span className="ml-1 text-xs font-normal text-stone-500">pcs</span>
            </p>
          </div>

          {/* Order with +/- buttons */}
          <div className="rounded-xl bg-stone-50 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Order</p>
            <div className="flex items-center gap-1.5">
              {isEditor ? (
                <button
                  onClick={() => onOrderChange(shirt, Math.max(0, shirt.order_qty - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-stone-600 ring-1 ring-stone-300 transition hover:bg-red-50 hover:text-red-500 hover:ring-red-200 active:scale-90"
                  aria-label="Decrease order"
                >
                  <Minus className="h-4 w-4" />
                </button>
              ) : (
                <div className="h-7 w-7" />
              )}
              <span className={`flex-1 text-center text-2xl font-bold leading-tight ${shirt.order_qty > 0 ? 'text-emerald-600' : 'text-stone-300'}`}>
                {shirt.order_qty}
              </span>
              {isEditor ? (
                <button
                  onClick={() => onOrderChange(shirt, shirt.order_qty + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white transition hover:bg-emerald-600 active:scale-90"
                  aria-label="Increase order"
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : (
                <div className="h-7 w-7" />
              )}
            </div>
          </div>
        </div>

        {/* Salesman name */}
        {shirt.order_qty > 0 && shirt.salesman_name && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700">
              {shirt.salesman_name.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">by {shirt.salesman_name}</span>
          </div>
        )}

        {/* Meta row */}
        <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-3 text-xs text-stone-500">
          {shirt.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{shirt.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Updated {formatDate(shirt.last_updated)}</span>
          </div>
        </div>
      </div>

      {/* Edit button — editor only */}
      {isEditor && (
        <button
          onClick={() => onEdit(shirt)}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label="Edit shirt"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ShirtCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70">
      <div className="aspect-[4/3] animate-pulse bg-stone-200" />
      <div className="p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
        <div className="mt-3 h-8 w-1/2 animate-pulse rounded bg-stone-200" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
