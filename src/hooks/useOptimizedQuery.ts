import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface QueryOptions {
  table: string;
  select?: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  cacheKey: string;
  cacheDuration?: number;
  enabled?: boolean;
}

interface QueryResult<T> {
  data: T[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  mutate: (newData: T[]) => void;
}

// Global cache with memory management
const queryCache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();
const MAX_CACHE_SIZE = 50;

// Cleanup old cache entries
const cleanupCache = () => {
  if (queryCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(queryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => queryCache.delete(key));
  }
};

export function useOptimizedQuery<T = any>({
  table,
  select = '*',
  filter = {},
  orderBy,
  limit,
  cacheKey,
  cacheDuration = 300000, // 5 minutes default
  enabled = true
}: QueryOptions): QueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Optimized query builder with request deduplication
  const buildQuery = useCallback(() => {
    let query = supabase.from(table).select(select);

    // Apply filters efficiently
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Apply ordering and limits
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }
    if (limit) {
      query = query.limit(limit);
    }

    return query;
  }, [table, select, filter, orderBy, limit]);

  // Fetch data with request deduplication and caching
  const fetchData = useCallback(async (showLoading = true): Promise<T[]> => {
    if (!enabled) return [];

    // Check cache first
    const cached = queryCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cacheDuration) {
      // Return cached data immediately
      if (cached.promise) {
        // If there's an ongoing request, wait for it
        return cached.promise;
      }
      return cached.data;
    }

    // Check if there's already a pending request for this key
    if (cached?.promise) {
      return cached.promise;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (showLoading && mountedRef.current) {
      setIsLoading(true);
    } else if (mountedRef.current) {
      setIsRefreshing(true);
    }

    if (mountedRef.current) {
      setError(null);
    }

    // Create and cache the promise
    const promise = (async () => {
      try {
        // Optimize query execution
        const query = buildQuery();
        
        // Use faster query execution with timeout
        const queryPromise = query.abortSignal(abortControllerRef.current!.signal);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 10000)
        );
        
        const { data: fetchedData, error: fetchError } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]);

        if (fetchError) throw fetchError;

        const result = fetchedData || [];
        
        // Update cache
        queryCache.set(cacheKey, {
          data: result,
          timestamp: now
        });
        
        cleanupCache();
        
        return result;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw err;
        }
        
        console.error(`Query error for ${table}:`, err);
        
        if (mountedRef.current) {
          setError(err.message || 'An error occurred');
        }
        
        // Return cached data on error if available
        return cached?.data || [];
      }
    })();

    // Cache the promise temporarily
    queryCache.set(cacheKey, {
      data: cached?.data || [],
      timestamp: cached?.timestamp || 0,
      promise
    });

    try {
      const result = await promise;
      
      if (mountedRef.current) {
        setData(result);
      }
      
      return result;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // AbortError is expected when requests are cancelled, don't log as error
        return cached?.data || [];
      }
      
      if (mountedRef.current) {
        setError(err.message || 'An error occurred');
      }
      return cached?.data || [];
    } finally {
      // Remove promise from cache
      const currentCached = queryCache.get(cacheKey);
      if (currentCached) {
        queryCache.set(cacheKey, {
          data: currentCached.data,
          timestamp: currentCached.timestamp
        });
      }
      
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [enabled, cacheKey, cacheDuration, buildQuery, table]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    // Invalidate cache
    queryCache.delete(cacheKey);
    await fetchData(false);
  }, [cacheKey, fetchData]);

  // Optimistic updates
  const mutate = useCallback((newData: T[]) => {
    setData(newData);
    // Update cache
    queryCache.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  // Initial data fetch
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Check cache first for immediate display
    const cached = queryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < cacheDuration) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    fetchData(true);
  }, [enabled, fetchData, cacheKey, cacheDuration]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    mutate
  };
}