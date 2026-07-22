import { Pencil, MapPin, Ruler, Calendar, ImageIcon } from 'lucide-react';
import type { Fabric } from '../lib/supabase';
import { useRole } from '../lib/role-context';

function availabilityColor(mtr: number): string {
  if (mtr <= 10) return 'text-red-600 bg-red-50';
  if (mtr <= 40) return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
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

  return (
    <div
      onClick={() => onView(fabric)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 transition-all duration-300 hover:shadow-md hover:ring-stone-300"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {fabric.photo_url ? (
          <img
            src={fabric.photo_url}
            alt={fabric.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        {/* Fabric code badge */}
        <div className="absolute left-3 top-3 rounded-full bg-stone-900/80 px-2.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
          {fabric.fabric_code}
        </div>
        {/* Type badge */}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 backdrop-blur-sm">
          {fabric.type}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="truncate text-base font-semibold text-stone-900">{fabric.name}</h3>

        {/* Available Mtr — prominent */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Available</p>
            <p className="text-2xl font-bold leading-tight text-stone-900">
              {Number(fabric.available_mtr).toFixed(2)}
              <span className="ml-1 text-sm font-normal text-stone-500">mtr</span>
            </p>
          </div>
          <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${availabilityColor(Number(fabric.available_mtr))}`}>
            {Number(fabric.available_mtr) <= 10 ? 'Low' : Number(fabric.available_mtr) <= 40 ? 'Mid' : 'Good'}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{fabric.location}</span>
          </div>
          {fabric.width && (
            <div className="flex items-center gap-2">
              <Ruler className="h-3.5 w-3.5 shrink-0" />
              <span>{fabric.width}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Updated {formatDate(fabric.last_updated)}</span>
          </div>
        </div>
      </div>

      {/* Edit button — editor only */}
      {isEditor && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(fabric);
          }}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
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
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70">
      <div className="aspect-[4/3] animate-pulse bg-stone-200" />
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
