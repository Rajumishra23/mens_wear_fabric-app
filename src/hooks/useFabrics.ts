import { useEffect, useState, useCallback } from 'react';
import { supabase, type Fabric } from '../lib/supabase';

export function useFabrics() {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('fabric_inventory')
      .select('*')
      .order('fabric_code', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setFabrics((data ?? []) as Fabric[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { fabrics, loading, error, refetch: fetchAll };
}
