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

// Resize + compress an image in the browser before upload.
// A raw phone photo (3-8 MB) becomes a ~150-300kb JPEG, so every
// card that later displays this photo loads fast on any connection.
async function compressImage(file: File, maxDim = 1600, quality = 0.72): Promise<File> {
  // Skip compression for already-small files or unsupported browsers
  if (file.size < 250 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
        'image/jpeg',
        quality,
      );
    });

    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    // If compression fails for any reason, fall back to the original file
    return file;
  }
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
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop() ?? 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('fabric-photos')
        .upload(path, compressed, { cacheControl: '3600', upsert: false });
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
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-[var(--ink-900)]">
            {isEdit ? 'Edit Fabric' : 'Add Fabric'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--ink-500)] transition hover:bg-[var(--ink-900)]/[0.06]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Photo upload */}
        <div className="mb-4">
          <span className={labelCls}>Photo</span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--ink-900)]/[0.05] ring-1 ring-[var(--hairline)]">
              {form.photo_url ? (
                <img src={form.photo_url} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--ink-300)]">
                  <Upload className="h-6 w-6" />
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-xl border border-[var(--ink-300)]/70 bg-white px-3 py-2 text-sm font-medium text-[var(--ink-700)] shadow-premium-sm transition hover:bg-[var(--ink-900)]/[0.03]">
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Optimizing & uploading…
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
          <p className="mt-1.5 text-[11px] text-[var(--ink-500)]">
            Photos are auto-resized and compressed before upload for fast loading.
          </p>
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