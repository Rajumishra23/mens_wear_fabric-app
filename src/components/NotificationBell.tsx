import { useEffect, useState, useRef } from 'react';
import { Bell, X, Plus, Minus, Package, Clock } from 'lucide-react';
import { supabase, type ActivityLog } from '../lib/supabase';

type Props = {
  refreshKey: number;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationBell({ refreshKey }: Props) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seen, setSeen] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchLogs() {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (!cancelled && !error) {
        const newLogs = (data ?? []) as ActivityLog[];
        setLogs(newLogs);
        if (!loadedOnce.current) {
          setSeen(newLogs.length);
          loadedOnce.current = true;
        }
      }
      if (!cancelled) setLoading(false);
    }
    fetchLogs();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const unread = Math.max(0, logs.length - seen);

  function toggle() {
    setOpen((o) => {
      if (!o) setSeen(logs.length);
      return !o;
    });
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-stone-600 transition hover:bg-stone-300"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 max-h-[70vh] w-80 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
              <h3 className="text-sm font-bold text-stone-900">Activity</h3>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 text-stone-400 hover:bg-stone-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-stone-400">Loading…</div>
              ) : logs.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="mx-auto h-8 w-8 text-stone-300" />
                  <p className="mt-2 text-xs text-stone-400">No activity yet</p>
                </div>
              ) : (
                logs.map((log) => <ActivityRow key={log.id} log={log} />)
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ActivityRow({ log }: { log: ActivityLog }) {
  const isOrderAdd = log.action === 'order_added';
  const isOrderRemove = log.action === 'order_removed';

  return (
    <div className="border-b border-stone-50 px-4 py-3 last:border-0">
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isOrderAdd ? 'bg-emerald-50 text-emerald-600' :
          isOrderRemove ? 'bg-red-50 text-red-500' :
          'bg-stone-100 text-stone-500'
        }`}>
          {isOrderAdd ? <Plus className="h-4 w-4" /> :
           isOrderRemove ? <Minus className="h-4 w-4" /> :
           <Package className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-stone-800">
            {isOrderAdd && <span>Order added: </span>}
            {isOrderRemove && <span>Order removed: </span>}
            {log.action === 'shirt_added' && <span>New item added: </span>}
            {log.action === 'shirt_updated' && <span>Item updated: </span>}
            <span className="font-semibold">{log.shirt_name ?? 'Unknown'}</span>
            {log.size != null && <span className="text-stone-500"> (Size {log.size})</span>}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-400">
            {log.quantity > 0 && <span>{log.quantity} pcs</span>}
            {log.salesman_name && <span className="text-stone-500">by {log.salesman_name}</span>}
            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{timeAgo(log.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
