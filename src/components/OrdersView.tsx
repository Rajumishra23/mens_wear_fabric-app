import { useEffect, useState } from 'react';
import { X, ShoppingCart, Package, Loader2, StickyNote, Check } from 'lucide-react';
import { supabase, type Shirt } from '../lib/supabase';

type Props = {
  onClose: () => void;
  refreshKey: number;
};

export function OrdersView({ onClose, refreshKey }: Props) {
  const [shirts, setShirts] = useState<Shirt[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      const { data, error } = await supabase
        .from('shirts')
        .select('*')
        .eq('category', 'product')
        .gt('order_qty', 0)
        .order('name', { ascending: true });
      if (!cancelled && !error) {
        const rows = (data ?? []) as Shirt[];
        setShirts(rows);
        const drafts: Record<string, string> = {};
        for (const r of rows) drafts[r.id] = r.order_note ?? '';
        setNoteDrafts(drafts);
      }
      if (!cancelled) setLoading(false);
    }
    fetchOrders();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const totalOrders = shirts.reduce((s, sh) => s + sh.order_qty, 0);
  const grouped = shirts.reduce<Record<string, Shirt[]>>((acc, s) => {
    (acc[s.name] ??= []).push(s);
    return acc;
  }, {});

  async function saveNote(shirtId: string) {
    const note = noteDrafts[shirtId]?.trim() ?? '';
    setSavingNoteId(shirtId);
    try {
      const { error } = await supabase
        .from('shirts')
        .update({ order_note: note || null })
        .eq('id', shirtId);
      if (error) throw error;
      setShirts((prev) => prev.map((s) => s.id === shirtId ? { ...s, order_note: note || null } : s));
    } catch {
      // ignore — keep draft so user can retry
    } finally {
      setSavingNoteId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-stone-50 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ShoppingCart className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Orders</h2>
              <p className="text-[11px] text-stone-500">{shirts.length} items · {totalOrders} pcs total</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-stone-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : shirts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-200 text-stone-400">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <p className="mt-3 text-sm font-medium text-stone-600">No orders placed yet</p>
              <p className="mt-1 text-xs text-stone-400">Orders will appear here when salesmen add them</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([name, items]) => (
                <div key={name}>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700">{name}</h3>
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">
                      {items.reduce((s, sh) => s + sh.order_qty, 0)} pcs
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((sh) => (
                      <div key={sh.id} className="rounded-xl bg-white p-3 ring-1 ring-stone-200/70">
                        <div className="flex items-center gap-3">
                          {/* Photo */}
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                            {sh.photo_url ? (
                              <img src={sh.photo_url} alt={sh.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-300">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-bold text-stone-600">Size {sh.size}</span>
                              <span className="text-sm font-semibold text-stone-900">{sh.order_qty} ordered</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                              <span>Avl: <span className="font-semibold text-stone-700">{sh.available_qty - sh.order_qty}</span></span>
                              {sh.salesman_name && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  · by {sh.salesman_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Note field */}
                        <div className="mt-2.5 border-t border-stone-100 pt-2.5">
                          <div className="mb-1 flex items-center gap-1.5">
                            <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Note</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <textarea
                              value={noteDrafts[sh.id] ?? ''}
                              onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [sh.id]: e.target.value }))}
                              placeholder="Write a note for this order…"
                              rows={2}
                              className="flex-1 resize-none rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-xs text-stone-800 placeholder-stone-400 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-1 focus:ring-stone-400"
                            />
                            <button
                              onClick={() => saveNote(sh.id)}
                              disabled={savingNoteId === sh.id}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white transition hover:bg-stone-800 active:scale-90 disabled:opacity-50"
                              aria-label="Save note"
                            >
                              {savingNoteId === sh.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {sh.order_note && (
                            <p className="mt-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
                              {sh.order_note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
