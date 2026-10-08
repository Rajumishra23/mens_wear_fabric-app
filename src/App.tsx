import { useMemo, useState, useCallback } from 'react';
import { Search, Plus, SlidersHorizontal, X, Shirt as ShirtIcon, Eye, Pencil, Package, Check } from 'lucide-react';
import { useFabrics } from './hooks/useFabrics';
import { useShirts } from './hooks/useShirts';
import { useRole, RoleProvider, type Role } from './lib/role-context';
import { FabricCard, FabricCardSkeleton } from './components/FabricCard';
import { FabricFormModal } from './components/FabricFormModal';
import { ShirtCard, ShirtCardSkeleton } from './components/ShirtCard';
import { ShirtFormModal } from './components/ShirtFormModal';
import { OrderPopup } from './components/OrderPopup';
import { NotificationBell } from './components/NotificationBell';
import { supabase, type Fabric, type Shirt, SHIRT_SIZES } from './lib/supabase';
import logo from './assets/klick.webp';

type Category = 'fabric' | 'product' | 'carton';

export default function App() {
  return (
    <RoleProvider>
      <AppInner />
    </RoleProvider>
  );
}

function AppInner() {
  const { fabrics, loading: fabLoading, error: fabError, refetch: refetchFabrics } = useFabrics();
  const { shirts, loading: shirtLoading, error: shirtError, refetch: refetchShirts } = useShirts();
  const { role, setRole, isEditor } = useRole();

  const [category, setCategory] = useState<Category>('fabric');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null);
  const [editingShirt, setEditingShirt] = useState<Shirt | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Order popup state
  const [orderPopup, setOrderPopup] = useState<{ shirt: Shirt; newOrderQty: number } | null>(null);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  const isShirtCategory = category === 'product' || category === 'carton';

  function switchCategory(c: Category) {
    setCategory(c);
    setSearch('');
    setTypeFilter('all');
    setLocationFilter('all');
    setSelectedSizes([]);
    setShowFilters(false);
  }

  function toggleSizeFilter(s: number) {
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].sort((a, b) => a - b),
    );
  }

  // Order change handler — opens popup for salesman name
  const handleOrderChange = useCallback((shirt: Shirt, newOrderQty: number) => {
    if (newOrderQty < 0) return;
    setOrderPopup({ shirt, newOrderQty });
  }, []);

  // Confirm order update — save to DB + log activity
  const confirmOrderUpdate = useCallback(async (salesmanName: string) => {
    if (!orderPopup) return;
    const { shirt, newOrderQty } = orderPopup;
    const diff = newOrderQty - shirt.order_qty;
    const action = diff > 0 ? 'order_added' : 'order_removed';

    const { error: uErr } = await supabase
      .from('shirts')
      .update({
        order_qty: newOrderQty,
        salesman_name: newOrderQty > 0 ? salesmanName : null,
        last_updated: new Date().toISOString().split('T')[0],
      })
      .eq('id', shirt.id);
    if (uErr) throw uErr;

    await supabase.from('activity_log').insert({
      shirt_id: shirt.id,
      shirt_name: shirt.name,
      size: shirt.size,
      action,
      quantity: Math.abs(diff),
      salesman_name: salesmanName,
    });

    setActivityRefreshKey((k) => k + 1);
    refetchShirts();
  }, [orderPopup, refetchShirts]);

  // Fabric filtering
  const filteredFabrics = useMemo(() => {
    if (category !== 'fabric') return [];
    const q = search.trim().toLowerCase();
    return fabrics.filter((f) => {
      if (typeFilter !== 'all' && f.type !== typeFilter) return false;
      if (locationFilter !== 'all' && f.location !== locationFilter) return false;
      if (q && !f.fabric_code.toLowerCase().includes(q) && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fabrics, search, typeFilter, locationFilter, category]);

  const groupedFabrics = useMemo(() => {
    const groups: Record<string, Fabric[]> = {};
    for (const f of filteredFabrics) (groups[f.type] ??= []).push(f);
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredFabrics]);

  // Shirt filtering
  const filteredShirts = useMemo(() => {
    if (!isShirtCategory) return [];
    const q = search.trim().toLowerCase();
    return shirts.filter((s) => {
      if (s.category !== category) return false;
      if (selectedSizes.length > 0 && !selectedSizes.includes(s.size)) return false;
      if (locationFilter !== 'all' && s.location !== locationFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !(s.carton_no ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [shirts, search, selectedSizes, locationFilter, category, isShirtCategory]);

  const groupedShirts = useMemo(() => {
    const groups: Record<string, Shirt[]> = {};
    for (const s of filteredShirts) (groups[s.name] ??= []).push(s);
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredShirts]);

  const loading = category === 'fabric' ? fabLoading : shirtLoading;
  const error = category === 'fabric' ? fabError : shirtError;
  const refetch = category === 'fabric' ? refetchFabrics : refetchShirts;

  const activeFilters =
    (typeFilter !== 'all' && category === 'fabric' ? 1 : 0) +
    (locationFilter !== 'all' ? 1 : 0) +
    (selectedSizes.length > 0 ? 1 : 0);

  const totalCount = category === 'fabric' ? filteredFabrics.length : filteredShirts.length;
  const totalStock = category === 'fabric'
    ? filteredFabrics.reduce((s, f) => s + Number(f.available_mtr), 0)
    : filteredShirts.reduce((s, sh) => s + sh.available_qty, 0);
  const stockLabel = category === 'fabric' ? `${totalStock.toFixed(2)} mtr total` : `${totalStock} pcs total`;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* Header */}
      <header className="surface-glass sticky top-0 z-30 border-b border-[var(--hairline)]">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Klick Selections" className="h-16 w-16 object-contain" />
              <div>
                <h1 className="text-[15px] font-bold leading-tight tracking-tight text-[var(--ink-900)]">
                  Klick Fabric Inventory
                </h1>
                <p className="text-[11px] leading-tight tracking-wide text-[var(--ink-500)]">
                  Menswear Retail Tracker
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell refreshKey={activityRefreshKey} />
              <RoleToggle role={role} setRole={setRole} />
            </div>
          </div>

          {/* Category tabs */}
          <div className="mt-3 flex gap-1.5">
            <CategoryTab active={category === 'fabric'} onClick={() => switchCategory('fabric')} icon={<Package className="h-4 w-4" />}>
              Fabric
            </CategoryTab>
            <CategoryTab active={category === 'product'} onClick={() => switchCategory('product')} icon={<ShirtIcon className="h-4 w-4" />}>
              Product
            </CategoryTab>
            <CategoryTab active={category === 'carton'} onClick={() => switchCategory('carton')} icon={<Package className="h-4 w-4" />}>
              Carton
            </CategoryTab>
          </div>

          {/* Search + filter toggle */}
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isShirtCategory ? 'Search name or carton no…' : 'Search code or name…'}
                className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-9 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-stone-400 hover:bg-stone-200">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                showFilters || activeFilters > 0
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilters > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-stone-900">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-3 space-y-3 rounded-xl border border-stone-200 bg-white p-3">
              {isShirtCategory && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Size {selectedSizes.length > 0 && `(${selectedSizes.length} selected)`}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SHIRT_SIZES.map((s) => {
                      const active = selectedSizes.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleSizeFilter(s)}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                            active ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {active ? <Check className="h-4 w-4" /> : s}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSizes.length > 0 && (
                    <button onClick={() => setSelectedSizes([])} className="mt-2 text-xs font-semibold text-stone-500 underline hover:text-stone-900">
                      Clear sizes
                    </button>
                  )}
                </div>
              )}
              {category === 'fabric' && (
                <FilterRow
                  label="Type"
                  options={Array.from(new Set(fabrics.map((f) => f.type))).sort()}
                  value={typeFilter}
                  onChange={setTypeFilter}
                />
              )}
              <FilterRow
                label="Location"
                options={Array.from(new Set(
                  (category === 'fabric' ? fabrics : shirts)
                    .map((x) => (x as Fabric | Shirt).location ?? '')
                    .filter(Boolean)
                )).sort()}
                value={locationFilter}
                onChange={setLocationFilter}
              />
              {activeFilters > 0 && (
                <button
                  onClick={() => { setTypeFilter('all'); setLocationFilter('all'); setSelectedSizes([]); }}
                  className="text-xs font-semibold text-stone-500 underline hover:text-stone-900"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Summary bar */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200/70">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Package className="h-4 w-4 text-stone-400" />
            <span><span className="font-bold text-stone-900">{totalCount}</span> items</span>
          </div>
          <p className="text-sm text-stone-600">
            <span className="font-bold text-stone-900">{stockLabel}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-4 pb-24">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {category === 'fabric'
              ? Array.from({ length: 6 }).map((_, i) => <FabricCardSkeleton key={i} />)
              : Array.from({ length: 6 }).map((_, i) => <ShirtCardSkeleton key={i} />)}
          </div>
        ) : category === 'fabric' ? (
          filteredFabrics.length === 0 ? <EmptyState /> : (
            <div className="space-y-6">
              {groupedFabrics.map(([type, items]) => (
                <section key={type}>
                  <div className="mb-2.5 flex items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700">{type}</h2>
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((f) => (
                      <FabricCard key={f.id} fabric={f} onEdit={(fab) => setEditingFabric(fab)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : filteredShirts.length === 0 ? (
          <EmptyState category={category} />
        ) : (
          <div className="space-y-6">
            {groupedShirts.map(([name, items]) => (
              <section key={name}>
                <div className="mb-2.5 flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700">{name}</h2>
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">{items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((s) => (
                    <ShirtCard
                      key={s.id}
                      shirt={s}
                      onEdit={(sh) => setEditingShirt(sh)}
                      onOrderChange={handleOrderChange}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* FAB — editor only */}
      {isEditor && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl transition-transform hover:scale-110 active:scale-95"
          aria-label="Add item"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Modals */}
      {showAdd && category === 'fabric' && (
        <FabricFormModal fabric={null} onClose={() => setShowAdd(false)} onSaved={() => { refetch(); setActivityRefreshKey((k) => k + 1); }} />
      )}
      {showAdd && isShirtCategory && (
        <ShirtFormModal shirt={null} category={category} onClose={() => setShowAdd(false)} onSaved={() => { refetch(); setActivityRefreshKey((k) => k + 1); }} />
      )}
      {editingFabric && (
        <FabricFormModal fabric={editingFabric} onClose={() => setEditingFabric(null)} onSaved={() => { refetch(); setActivityRefreshKey((k) => k + 1); }} />
      )}
      {editingShirt && (
        <ShirtFormModal shirt={editingShirt} category={editingShirt.category} onClose={() => setEditingShirt(null)} onSaved={() => { refetch(); setActivityRefreshKey((k) => k + 1); }} />
      )}
      {orderPopup && (
        <OrderPopup
          shirtName={orderPopup.shirt.name}
          size={orderPopup.shirt.size}
          currentOrder={orderPopup.shirt.order_qty}
          newOrderQty={orderPopup.newOrderQty}
          onClose={() => setOrderPopup(null)}
          onConfirm={confirmOrderUpdate}
        />
      )}
    </div>
  );
}

function RoleToggle({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  return (
    <div className="flex items-center rounded-full bg-stone-200 p-0.5 text-xs font-semibold">
      <button
        onClick={() => setRole('viewer')}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 transition ${
          role === 'viewer' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Viewer</span>
      </button>
      <button
        onClick={() => setRole('editor')}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 transition ${
          role === 'editor' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500'
        }`}
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Editor</span>
      </button>
    </div>
  );
}

function CategoryTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active ? 'bg-stone-900 text-white shadow-sm' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        <Chip active={value === 'all'} onClick={() => onChange('all')}>All</Chip>
        {options.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onChange(o)}>{o}</Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ category }: { category?: Category }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-200 text-stone-400">
        <Package className="h-8 w-8" />
      </div>
      <p className="mt-4 text-sm font-medium text-stone-600">
        {category ? `No ${category} items found` : 'No items found'}
      </p>
      <p className="mt-1 text-xs text-stone-400">Try adjusting your search or filters.</p>
    </div>
  );
}