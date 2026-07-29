import { useState } from 'react';
import { Pencil, MapPin, Calendar, ImageIcon } from 'lucide-react';
import type { Shirt } from '../lib/supabase';
import { useRole } from '../lib/role-context';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = {
  shirt: Shirt;
  onEdit: (s: Shirt) => void;
  onView: (s: Shirt) => void;
};

export function ShirtCard({ shirt, onEdit, onView }: Props) {
  const { isEditor } = useRole();
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      onClick={() => onView(shirt)}
      className="group relative cursor-pointer overflow-hidden rounded-[22px] bg-white shadow-premium-md ring-1 ring-[var(--hairline)] transition-all duration-500 ease-premium hover:-translate-y-1.5 hover:shadow-premium-lg">
      {/* Accent top edge — small premium detail */}
      <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-[var(--accent)] via-[var(--ink-900)] to-[var(--accent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {shirt.photo_url ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200" />
            )}
            <img
              src={shirt.photo_url}
              alt={shirt.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              className={`h-full w-full object-cover transition-all duration-700 ease-premium group-hover:scale-[1.06] ${
                loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
              }`}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <ImageIcon className="h-9 w-9" strokeWidth={1.5} />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Size badge */}
        <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink-900)]/90 text-sm font-bold text-white shadow-premium-sm backdrop-blur-md">
          {shirt.size}
        </div>
        {/* Carton number badge */}
        {shirt.category === 'carton' && shirt.carton_no && (
          <div className="absolute right-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-bold text-white shadow-premium-sm backdrop-blur-md">
            {shirt.carton_no}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="truncate text-[15.5px] font-bold tracking-tight text-[var(--ink-900)]">
          {shirt.name}
        </h3>

        {/* Available Qty — prominent */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent)]">
              Available
            </p>
            <p className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--ink-900)]">
              {shirt.available_qty}
              <span className="ml-1 text-sm font-medium text-[var(--ink-500)]">pcs</span>
            </p>
          </div>
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent-deep)] ring-1 ring-[var(--accent-ring)]">
            Size {shirt.size}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-3 space-y-1.5 border-t border-[var(--hairline)] pt-3 text-xs text-[var(--ink-500)]">
          {shirt.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" strokeWidth={2} />
              <span>{shirt.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" strokeWidth={2} />
            <span>Updated {formatDate(shirt.last_updated)}</span>
          </div>
        </div>
      </div>

      {/* Edit button — editor only */}
      {isEditor && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(shirt);
          }}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink-900)] text-white opacity-0 shadow-premium-md transition-all duration-300 ease-premium group-hover:opacity-100 hover:scale-110 active:scale-95 sm:opacity-100"
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
    <div className="overflow-hidden rounded-[22px] bg-white shadow-premium-sm ring-1 ring-[var(--hairline)]">
      <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200" />
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
