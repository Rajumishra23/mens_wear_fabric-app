import { X, MapPin, Calendar, Package, ImageIcon } from 'lucide-react';
import type { Shirt } from '../lib/supabase';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

type Props = {
  shirt: Shirt;
  onClose: () => void;
};

export function ShirtDetailModal({ shirt, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink-900)]/55 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-[var(--surface-elevated)] shadow-premium-lg sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Large photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 sm:rounded-t-[28px]">
          {shirt.photo_url ? (
            <img src={shirt.photo_url} alt={shirt.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-300">
              <ImageIcon className="h-14 w-14" strokeWidth={1.5} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--ink-900)] shadow-premium-sm backdrop-blur-md transition hover:scale-105"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute left-4 bottom-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink-900)]/85 text-sm font-bold text-white backdrop-blur-md">
            {shirt.size}
          </div>
          {shirt.category === 'carton' && shirt.carton_no && (
            <div className="absolute right-14 top-3 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              {shirt.carton_no}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink-900)]">{shirt.name}</h2>

          {/* Big stock number */}
          <div className="mt-4 rounded-2xl bg-[var(--accent-soft)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-deep)]">Available Stock</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight text-[var(--ink-900)]">
              {shirt.available_qty}
              <span className="ml-1.5 text-base font-medium text-[var(--ink-500)]">pcs</span>
            </p>
          </div>

          {/* Info grid */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <DetailItem icon={<Package className="h-4 w-4" />} label="Size" value={String(shirt.size)} />
            <DetailItem icon={<Package className="h-4 w-4" />} label="Category" value={shirt.category} />
            {shirt.location && <DetailItem icon={<MapPin className="h-4 w-4" />} label="Location" value={shirt.location} />}
            <DetailItem icon={<Calendar className="h-4 w-4" />} label="Last Updated" value={formatDate(shirt.last_updated)} />
            {shirt.category === 'carton' && shirt.carton_no && (
              <DetailItem icon={<Package className="h-4 w-4" />} label="Carton No" value={shirt.carton_no} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-white p-3">
      <div className="flex items-center gap-1.5 text-[var(--accent)]">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)]">{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-[var(--ink-900)]">{value}</p>
    </div>
  );
}
