import { useEffect, useState, useCallback } from 'react';
import { supabase, type Shirt } from '../lib/supabase';

export function useShirts() {
  const [shirts, setShirts] = useState<Shirt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('shirts')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setShirts((data ?? []) as Shirt[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { shirts, loading, error, refetch: fetchAll };
}
