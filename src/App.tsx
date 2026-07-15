import { useMemo, useState } from 'react';
import { Search, Plus, SlidersHorizontal, X, Shirt, Eye, Pencil, Package } from 'lucide-react';
import { useFabrics } from './hooks/useFabrics';
import { useRole, RoleProvider, type Role } from './lib/role-context';
import { FabricCard, FabricCardSkeleton } from './components/FabricCard';
import { FabricFormModal } from './components/FabricFormModal';
import type { Fabric } from './lib/supabase';

export default function App() {
  return (
    <RoleProvider>
      <AppInner />
    </RoleProvider>
  );
}

function AppInner() {
  const { fabrics, loading, error, refetch } = useFabrics();
  const { role, setRole, isEditor } = useRole();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<Fabric | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const types = useMemo(() => Array.from(new Set(fabrics.map((f) => f.type))).sort(), [fabrics]);
  const locations = useMemo(() => Array.from(new Set(fabrics.map((f) => f.location))).sort(), [fabrics]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fabrics.filter((f) => {
      if (typeFilter !== 'all' && f.type !== typeFilter) return false;
      if (locationFilter !== 'all' && f.location !== locationFilter) return false;
      if (q && !f.fabric_code.toLowerCase().includes(q) && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fabrics, search, typeFilter, locationFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Fabric[]> = {};
    for (const f of filtered) {
      (groups[f.type] ??= []).push(f);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const totalMtr = useMemo(
    () => filtered.reduce((sum, f) => sum + Number(f.available_mtr), 0),
    [filtered],
  );

  const activeFilters = (typeFilter !== 'all' ? 1 : 0) + (locationFilter !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white">
                <Shirt className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight text-stone-900">Fabric Inventory</h1>
                <p className="text-[11px] leading-tight text-stone-500">Menswear Retail Tracker</p>
              </div>
            </div>
            <RoleToggle role={role} setRole={setRole} />
          </div>

          {/* Search + filter toggle */}
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or name…"
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

          {showFilters && (
            <div className="mt-3 space-y-3 rounded-xl border border-stone-200 bg-white p-3">
              <FilterRow label="Type" options={types} value={typeFilter} onChange={setTypeFilter} />
              <FilterRow label="Location" options={locations} value={locationFilter} onChange={setLocationFilter} />
              {activeFilters > 0 && (
                <button
                  onClick={() => { setTypeFilter('all'); setLocationFilter('all'); }}
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
            <span><span className="font-bold text-stone-900">{filtered.length}</span> fabrics</span>
          </div>
          <p className="text-sm text-stone-600">
            <span className="font-bold text-stone-900">{totalMtr.toFixed(2)}</span> mtr total
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
            {Array.from({ length: 6 }).map((_, i) => <FabricCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {grouped.map(([type, items]) => (
              <section key={type}>
                <div className="mb-2.5 flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700">{type}</h2>
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">{items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((f) => (
                    <FabricCard key={f.id} fabric={f} onEdit={(fab) => setEditing(fab)} />
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
          aria-label="Add fabric"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {showAdd && <FabricFormModal fabric={null} onClose={() => setShowAdd(false)} onSaved={refetch} />}
      {editing && <FabricFormModal fabric={editing} onClose={() => setEditing(null)} onSaved={refetch} />}
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-200 text-stone-400">
        <Package className="h-8 w-8" />
      </div>
      <p className="mt-4 text-sm font-medium text-stone-600">No fabrics found</p>
      <p className="mt-1 text-xs text-stone-400">Try adjusting your search or filters.</p>
    </div>
  );
}
