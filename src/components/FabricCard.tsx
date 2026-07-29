import { useState } from 'react';
import { Pencil, MapPin, Ruler, Calendar, ImageIcon } from 'lucide-react';
import type { Fabric } from '../lib/supabase';
import { useRole } from '../lib/role-context';

function availabilityMeta(mtr: number): { label: string; dot: string; text: string; bg: string; ring: string } {
  if (mtr <= 10) return { label: 'Low', dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', ring: 'ring-rose-200/60' };
  if (mtr <= 40) return { label: 'Mid', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200/60' };
  return { label: 'Good', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200/60' };
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = {
  fabric: Fabric;
  onEdit: (f: Fabric) => void;
  onView: (f: Fabric) => void;
};

export function FabricCard({ fabric, onEdit, onView }: Props) {
  const { isEditor } = useRole();
  const avail = availabilityMeta(Number(fabric.available_mtr));
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      onClick={() => onView(fabric)}
      className="group relative cursor-pointer overflow-hidden rounded-[22px] bg-white shadow-premium-md ring-1 ring-[var(--hairline)] transition-all duration-500 ease-premium hover:-translate-y-1.5 hover:shadow-premium-lg">
      {/* Accent top edge — small premium detail */}
      <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-[var(--accent)] via-[var(--ink-900)] to-[var(--accent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {fabric.photo_url ? (
          <>
            {/* Placeholder shimmer while image loads — perceived speed */}
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200" />
            )}
            <img
              src={fabric.photo_url}
              alt={fabric.name}
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

        <div className="absolute left-3 top-3 rounded-full bg-[var(--ink-900)]/90 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white shadow-premium-sm backdrop-blur-md">
          {fabric.fabric_code}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold capitalize text-[var(--ink-700)] shadow-premium-sm backdrop-blur-md">
          {fabric.type}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="truncate text-[15.5px] font-bold tracking-tight text-[var(--ink-900)]">
          {fabric.name}
        </h3>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent)]">
              Available
            </p>
            <p className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--ink-900)]">
              {Number(fabric.available_mtr).toFixed(2)}
              <span className="ml-1 text-sm font-medium text-[var(--ink-500)]">mtr</span>
            </p>
          </div>
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${avail.bg} ${avail.text} ${avail.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
            {avail.label}
          </span>
        </div>

        <div className="mt-3 space-y-1.5 border-t border-[var(--hairline)] pt-3 text-xs text-[var(--ink-500)]">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" strokeWidth={2} />
            <span>{fabric.location}</span>
          </div>
          {fabric.width && (
            <div className="flex items-center gap-2">
              <Ruler className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" strokeWidth={2} />
              <span>{fabric.width}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" strokeWidth={2} />
            <span>Updated {formatDate(fabric.last_updated)}</span>
          </div>
        </div>
      </div>

      {isEditor && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(fabric);
          }}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink-900)] text-white opacity-0 shadow-premium-md transition-all duration-300 ease-premium group-hover:opacity-100 hover:scale-110 active:scale-95 sm:opacity-100"
          aria-label="Edit fabric"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function FabricCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] bg-white shadow-premium-sm ring-1 ring-[var(--hairline)]">
      <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200" />
      <div className="p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
        <div className="mt-3 h-8 w-1/2 animate-pulse rounded bg-stone-200" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-stone-100" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
