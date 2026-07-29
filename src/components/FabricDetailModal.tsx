import { X, MapPin, Ruler, Calendar, Tag, ImageIcon } from 'lucide-react';
import type { Fabric } from '../lib/supabase';

function availabilityMeta(mtr: number): { label: string; dot: string; text: string; bg: string; ring: string } {
  if (mtr <= 10) return { label: 'Low stock', dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', ring: 'ring-rose-200/60' };
  if (mtr <= 40) return { label: 'Mid stock', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200/60' };
  return { label: 'Good stock', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200/60' };
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

type Props = {
  fabric: Fabric;
  onClose: () => void;
};

export function FabricDetailModal({ fabric, onClose }: Props) {
  const avail = availabilityMeta(Number(fabric.available_mtr));

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
          {fabric.photo_url ? (
            <img src={fabric.photo_url} alt={fabric.name} className="h-full w-full object-cover" />
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

          <div className="absolute left-4 bottom-4 rounded-full bg-[var(--ink-900)]/85 px-3 py-1 text-xs font-bold tracking-wider text-white backdrop-blur-md">
            {fabric.fabric_code}
          </div>
        </div>

        {/* Details */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink-900)]">{fabric.name}</h2>
            <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${avail.bg} ${avail.text} ${avail.ring}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${avail.dot}`} />
              {avail.label}
            </span>
          </div>

          {/* Big stock number */}
          <div className="mt-4 rounded-2xl bg-[var(--accent-soft)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-deep)]">Available Stock</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight text-[var(--ink-900)]">
              {Number(fabric.available_mtr).toFixed(2)}
              <span className="ml-1.5 text-base font-medium text-[var(--ink-500)]">mtr</span>
            </p>
          </div>

          {/* Info grid */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <DetailItem icon={<Tag className="h-4 w-4" />} label="Type" value={fabric.type} />
            {fabric.width && <DetailItem icon={<Ruler className="h-4 w-4" />} label="Width" value={fabric.width} />}
            <DetailItem icon={<MapPin className="h-4 w-4" />} label="Location" value={fabric.location} />
            <DetailItem icon={<Calendar className="h-4 w-4" />} label="Last Updated" value={formatDate(fabric.last_updated)} />
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
