import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface MutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

interface MutationResult<T, V> {
  mutate: (variables: V) => Promise<T | null>;
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  reset: () => void;
}

export function useOptimisticMutation<T = any, V = any>(
  mutationFn: (variables: V) => Promise<T>,
  options: MutationOptions<T> = {}
): MutationResult<T, V> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(async (variables: V): Promise<T | null> => {
    // Don't set loading state immediately for faster UI response
    setError(null);

    try {
      setIsLoading(true);
      const result = await mutationFn(variables);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      // Delay loading state reset for smoother UX
      setTimeout(() => setIsLoading(false), 100);
      options.onSettled?.();
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    data,
    reset
  };
}

// Optimized Supabase operations
export const createOptimizedMutation = {
  // Insert with optimistic updates
  insert: <T>(table: string, onUpdate?: (data: T[]) => void) => {
    return useOptimisticMutation(
      async (data: Partial<T>) => {
        const { data: result, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      {
        onSuccess: (newData) => {
          // Optimistically update local state
          onUpdate?.([newData] as T[]);
        }
      }
    );
  },

  // Update with optimistic updates
  update: <T>(table: string, onUpdate?: (data: T) => void) => {
    return useOptimisticMutation(
      async ({ id, data }: { id: string; data: Partial<T> }) => {
        const { data: result, error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      {
        onSuccess: (updatedData) => {
          onUpdate?.(updatedData);
        }
      }
    );
  },

  // Delete with optimistic updates
  delete: <T>(table: string, onUpdate?: (id: string) => void) => {
    return useOptimisticMutation(
      async (id: string) => {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { id };
      },
      {
        onSuccess: (result) => {
          onUpdate?.(result.id);
        }
      }
    );
  }
};