import { useEffect, useState } from 'react';
import { X, Upload, Loader2, Trash2, Check } from 'lucide-react';
import { supabase, type Shirt, type ShirtInsert, SHIRT_SIZES, LOCATIONS } from '../lib/supabase';

type Props = {
  shirt: Shirt | null; // null = adding new
  category: 'product' | 'carton';
  onClose: () => void;
  onSaved: () => void;
};

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function ShirtFormModal({ shirt, category, onClose, onSaved }: Props) {
  const isEdit = !!shirt;
  const [name, setName] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [availableQty, setAvailableQty] = useState<number>(0);
  const [cartonNo, setCartonNo] = useState('');
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [lastUpdated, setLastUpdated] = useState(todayStr());

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shirt) {
      setName(shirt.name);
      setSelectedSizes([shirt.size]);
      setPhotoUrl(shirt.photo_url);
      setAvailableQty(shirt.available_qty);
      setCartonNo(shirt.carton_no ?? '');
      setLocation(shirt.location ?? LOCATIONS[0]);
      setLastUpdated(shirt.last_updated);
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [shirt]);

  function toggleSize(s: number) {
    if (isEdit) return; // single size in edit mode
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].sort((a, b) => a - b),
    );
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('fabric-photos').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('fabric-photos').getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!isEdit && selectedSizes.length === 0) {
      setError('Select at least one size.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && shirt) {
        const payload: Partial<ShirtInsert> = {
          name: name.trim(),
          photo_url: photoUrl,
          available_qty: Number(availableQty) || 0,
          carton_no: category === 'carton' ? cartonNo.trim() || null : null,
          location,
          last_updated: lastUpdated || todayStr(),
        };
        const { error: uErr } = await supabase.from('shirts').update(payload).eq('id', shirt.id);
        if (uErr) throw uErr;
      } else {
        const rows: ShirtInsert[] = selectedSizes.map((s) => ({
          name: name.trim(),
          size: s,
          category,
          photo_url: photoUrl,
          available_qty: Number(availableQty) || 0,
          carton_no: category === 'carton' ? cartonNo.trim() || null : null,
          location,
          last_updated: lastUpdated || todayStr(),
        }));
        const { error: iErr } = await supabase.from('shirts').insert(rows);
        if (iErr) throw iErr;
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!shirt) return;
    if (!confirm(`Delete ${shirt.name} (size ${shirt.size})? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const { error: dErr } = await supabase.from('shirts').delete().eq('id', shirt.id);
      if (dErr) throw dErr;
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full rounded-xl border border-[var(--ink-300)]/70 bg-white px-3 py-2.5 text-sm text-[var(--ink-900)] placeholder-[var(--ink-500)]/70 outline-none transition-all duration-200 focus:border-[var(--ink-900)] focus:ring-1 focus:ring-[var(--ink-900)]';
  const labelCls = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink-900)]/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-[var(--surface)] p-5 shadow-premium-lg sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-[var(--ink-900)]">
            {isEdit ? 'Edit Shirt' : `Add ${category === 'carton' ? 'Carton' : 'Product'} Shirt`}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--ink-500)] transition hover:bg-[var(--ink-900)]/[0.06]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Photo */}
        <div className="mb-4">
          <span className={labelCls}>Photo</span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--ink-900)]/[0.05] ring-1 ring-[var(--hairline)]">
              {photoUrl ? (
                <img src={photoUrl} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--ink-300)]">
                  <Upload className="h-6 w-6" />
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-xl border border-[var(--ink-300)]/70 bg-white px-3 py-2 text-sm font-medium text-[var(--ink-700)] shadow-premium-sm transition hover:bg-[var(--ink-900)]/[0.03]">
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                </span>
              ) : (
                'Choose Image'
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
            </label>
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className={labelCls}>Name / Design</label>
          <input className={inputCls} value={name} placeholder="Oxford Navy Shirt" onChange={(e) => setName(e.target.value)} />
        </div>

        {/* Size selector — multi for new, single (locked) for edit */}
        <div className="mb-4">
          <label className={labelCls}>
            {isEdit ? 'Size' : `Select Sizes (${selectedSizes.length} selected)`}
          </label>
          <div className="flex flex-wrap gap-2">
            {SHIRT_SIZES.map((s) => {
              const active = selectedSizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-[var(--ink-900)] text-white shadow-premium-sm'
                      : 'bg-[var(--ink-900)]/[0.05] text-[var(--ink-700)] hover:bg-[var(--ink-900)]/[0.09]'
                  } ${isEdit ? 'cursor-default' : ''}`}
                >
                  {active && !isEdit ? <Check className="h-4 w-4" /> : s}
                </button>
              );
            })}
          </div>
          {!isEdit && selectedSizes.length > 0 && (
            <p className="mt-2 text-xs text-[var(--ink-500)]">
              Will add {selectedSizes.length} shirt{selectedSizes.length > 1 ? 's' : ''} (one per size)
            </p>
          )}
        </div>

        {/* Available Qty + Location */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Available Qty</label>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={availableQty}
              onChange={(e) => setAvailableQty(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <select className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)}>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Carton number — only for carton category */}
        {category === 'carton' && (
          <div className="mb-4">
            <label className={labelCls}>Carton No</label>
            <input className={inputCls} value={cartonNo} placeholder="CT-001" onChange={(e) => setCartonNo(e.target.value)} />
          </div>
        )}

        {/* Last Updated */}
        <div className="mb-4">
          <label className={labelCls}>Last Updated</label>
          <input type="date" className={inputCls} value={lastUpdated} onChange={(e) => setLastUpdated(e.target.value)} />
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200/60">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-[var(--ink-300)]/70 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink-700)] transition hover:bg-[var(--ink-900)]/[0.03] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 rounded-xl bg-[var(--ink-900)] px-4 py-2.5 text-sm font-semibold text-white shadow-premium-sm transition hover:bg-[var(--ink-700)] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
