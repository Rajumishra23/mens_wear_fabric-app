import { useEffect, useState } from 'react';
import { X, Upload, Loader2, Trash2 } from 'lucide-react';
import { supabase, type Fabric, type FabricInsert, FABRIC_TYPES, LOCATIONS } from '../lib/supabase';

type Props = {
  fabric: Fabric | null; // null = adding new
  onClose: () => void;
  onSaved: () => void;
};

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function FabricFormModal({ fabric, onClose, onSaved }: Props) {
  const isEdit = !!fabric;
  const [form, setForm] = useState<FabricInsert>(() =>
    fabric
      ? {
          fabric_code: fabric.fabric_code,
          photo_url: fabric.photo_url,
          name: fabric.name,
          type: fabric.type,
          width: fabric.width ?? '',
          available_mtr: Number(fabric.available_mtr),
          location: fabric.location,
          last_updated: fabric.last_updated,
        }
      : {
          fabric_code: '',
          photo_url: null,
          name: '',
          type: FABRIC_TYPES[0],
          width: '',
          available_mtr: 0,
          location: LOCATIONS[0],
          last_updated: todayStr(),
        },
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('fabric-photos').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('fabric-photos').getPublicUrl(path);
      setForm((f) => ({ ...f, photo_url: pub.publicUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setError(null);
    if (!form.fabric_code.trim() || !form.name.trim() || !form.type.trim() || !form.location.trim()) {
      setError('Fabric Code, Name, Type, and Location are required.');
      return;
    }
    setSaving(true);
    try {
      const payload: FabricInsert = {
        ...form,
        available_mtr: Number(form.available_mtr) || 0,
        last_updated: form.last_updated || todayStr(),
      };
      if (isEdit && fabric) {
        const { error: uErr } = await supabase
          .from('fabric_inventory')
          .update({ ...payload, fabric_code: undefined } as Partial<FabricInsert>)
          .eq('id', fabric.id);
        if (uErr) throw uErr;
      } else {
        const { error: iErr } = await supabase.from('fabric_inventory').insert(payload);
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
    if (!fabric) return;
    if (!confirm(`Delete ${fabric.fabric_code}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const { error: dErr } = await supabase.from('fabric_inventory').delete().eq('id', fabric.id);
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
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">{isEdit ? 'Edit Fabric' : 'Add Fabric'}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Photo upload */}
        <div className="mb-4">
          <span className={labelCls}>Photo</span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-200 ring-1 ring-stone-300">
              {form.photo_url ? (
                <img src={form.photo_url} alt="preview" className="h-full w-full object-cover" />
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

        {/* Fabric Code */}
        <div className="mb-4">
          <label className={labelCls}>Fabric Code</label>
          <input
            className={inputCls}
            value={form.fabric_code}
            disabled={isEdit}
            placeholder="FB001"
            onChange={(e) => setForm({ ...form, fabric_code: e.target.value.toUpperCase() })}
          />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className={labelCls}>Name / Design</label>
          <input
            className={inputCls}
            value={form.name}
            placeholder="Classic Oxford Navy"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Type + Width */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Type</label>
            <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {FABRIC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Width</label>
            <input
              className={inputCls}
              value={form.width ?? ''}
              placeholder="44 inch"
              onChange={(e) => setForm({ ...form, width: e.target.value })}
            />
          </div>
        </div>

        {/* Available Mtr + Location */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Available Mtr</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputCls}
              value={form.available_mtr}
              onChange={(e) => setForm({ ...form, available_mtr: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <select className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mb-4">
          <label className={labelCls}>Last Updated</label>
          <input
            type="date"
            className={inputCls}
            value={form.last_updated}
            onChange={(e) => setForm({ ...form, last_updated: e.target.value })}
          />
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
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
          >
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
