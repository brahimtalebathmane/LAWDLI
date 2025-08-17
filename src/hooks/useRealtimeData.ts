import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseRealtimeDataOptions {
  table: string;
  select?: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  cacheKey: string;
  cacheDuration?: number; // in milliseconds
  enableRealtime?: boolean; // Now defaults to false for manual refresh
}

export function useRealtimeData<T = any>({
  table,
  select = '*',
  filter = {},
  orderBy,
  cacheKey,
  cacheDuration = 300000, // 5 minutes default cache
  enableRealtime = false // Disabled by default for manual refresh
}: UseRealtimeDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const cacheRef = useRef<Map<string, CacheEntry<T[]>>>(new Map());
  const subscriptionRef = useRef<any>(null);

  // Get cached data
  const getCachedData = useCallback((): T[] | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cacheDuration;
    if (isExpired) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }, [cacheKey, cacheDuration]);

  // Set cached data
  const setCachedData = useCallback((newData: T[]) => {
    cacheRef.current.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  // Fetch data from Supabase
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const newData = fetchedData || [];
      setData(newData);
      setCachedData(newData);
      setLastUpdated(new Date());

    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [table, select, filter, orderBy, setCachedData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  // Force refresh (bypass cache)
  const forceRefresh = useCallback(() => {
    cacheRef.current.delete(cacheKey);
    fetchData(true);
  }, [cacheKey, fetchData]);

  // Initialize data on mount only
  useEffect(() => {
    const cachedData = getCachedData();
    
    if (cachedData) {
      // Use cached data immediately
      setData(cachedData);
      setIsLoading(false);
      const cached = cacheRef.current.get(cacheKey);
      setLastUpdated(new Date(cached?.timestamp || Date.now()));
    } else {
      // No cache, fetch fresh data
      fetchData(true);
    }
  }, [getCachedData, fetchData, cacheKey]);

  // Set up real-time subscription only if enabled
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel(`realtime-${table}-${cacheKey}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table
      }, (payload) => {
        console.log(`Real-time update for ${table}:`, payload);
        
        // Invalidate cache and refresh data
        cacheRef.current.delete(cacheKey);
        fetchData(false);
      })
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [table, cacheKey, fetchData, enableRealtime]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
    forceRefresh
  };
}