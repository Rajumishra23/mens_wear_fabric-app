import { useEffect, useState } from 'react';
import { X, Upload, Loader2, Trash2, Check } from 'lucide-react';
import { supabase, type Shirt, type ShirtInsert, SHIRT_SIZES, LOCATIONS } from '../lib/supabase';
import type { ActivityLogInsert } from '../lib/supabase';

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
        const logEntry: ActivityLogInsert = {
          shirt_id: shirt.id,
          shirt_name: name.trim(),
          size: shirt.size,
          action: 'shirt_updated',
          quantity: Number(availableQty) || 0,
        };
        await supabase.from('activity_log').insert(logEntry);
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
        const { data: inserted, error: iErr } = await supabase.from('shirts').insert(rows).select('id, size');
        if (iErr) throw iErr;
        if (inserted) {
          const logs: ActivityLogInsert[] = (inserted as { id: string; size: number }[]).map((row) => ({
            shirt_id: row.id,
            shirt_name: name.trim(),
            size: row.size,
            action: 'shirt_added',
            quantity: Number(availableQty) || 0,
          }));
          await supabase.from('activity_log').insert(logs);
        }
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

  const inputCls = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-stone-900 focus:ring-1 focus:ring-stone-900';
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-stone-50 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">
            {isEdit ? 'Edit Shirt' : `Add ${category === 'carton' ? 'Carton' : 'Product'} Shirt`}
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Photo */}
        <div className="mb-4">
          <span className={labelCls}>Photo</span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-200 ring-1 ring-stone-300">
              {photoUrl ? (
                <img src={photoUrl} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-400">
                  <Upload className="h-6 w-6" />
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100">
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
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition ${
                    active
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  } ${isEdit ? 'cursor-default' : ''}`}
                >
                  {active && !isEdit ? <Check className="h-4 w-4" /> : s}
                </button>
              );
            })}
          </div>
          {!isEdit && selectedSizes.length > 0 && (
            <p className="mt-2 text-xs text-stone-500">
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

        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} disabled={saving} className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
