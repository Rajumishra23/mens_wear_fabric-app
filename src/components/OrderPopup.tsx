import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

type Props = {
  shirtName: string;
  size: number;
  currentOrder: number;
  newOrderQty: number;
  onClose: () => void;
  onConfirm: (salesmanName: string) => Promise<void>;
};

export function OrderPopup({ shirtName, size, currentOrder, newOrderQty, onClose, onConfirm }: Props) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const diff = newOrderQty - currentOrder;

  async function handleConfirm() {
    if (!name.trim()) {
      setError('Salesman name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(name.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-stone-900/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl bg-stone-50 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">Confirm Order</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-white p-3 ring-1 ring-stone-200">
          <p className="text-sm font-semibold text-stone-900">{shirtName}</p>
          <p className="text-xs text-stone-500">Size {size}</p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-stone-600">Order: <span className="font-bold text-stone-900">{newOrderQty}</span></span>
            {diff > 0 && <span className="text-xs font-semibold text-emerald-600">+{diff} new</span>}
            {diff < 0 && <span className="text-xs font-semibold text-red-500">{diff} removed</span>}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Salesman Name</label>
          <input
            autoFocus
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            value={name}
            placeholder="Enter your name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !saving) handleConfirm(); }}
          />
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={saving} className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
