import { useState, useCallback } from 'react';

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
      setIsLoading(false);
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