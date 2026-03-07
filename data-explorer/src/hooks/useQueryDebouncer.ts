import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseQueryDebouncerOptions {
  delay: number;
  maxWait?: number;
  immediate?: boolean;
}

export interface UseQueryDebouncerReturn<T> {
  execute: (queryFn: () => Promise<T>) => Promise<T>;
  cancel: () => void;
  isPending: boolean;
  lastResult: T | null;
  error: Error | null;
}

export function useQueryDebouncer<T = any>(
  options?: UseQueryDebouncerOptions
): UseQueryDebouncerReturn<T> {
  const { delay = 300, maxWait = 1000, immediate = false } = options || {};
  const [isPending, setIsPending] = useState(false);
  const [lastResult, setLastResult] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTime = useRef<number>(0);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    setIsPending(false);
  }, []);

  const execute = useCallback(async (queryFn: () => Promise<T>): Promise<T> => {
    const timeSinceLastCall = Date.now() - lastCallTime.current;
    
    // Clear any existing timeouts
    cancel();

    // Check if we should execute immediately
    if (immediate && timeSinceLastCall > delay) {
      lastCallTime.current = Date.now();
      setIsPending(true);
      setError(null);

      try {
        const result = await queryFn();
        setLastResult(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Query execution failed');
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    }

    // Set up debounced execution
    return new Promise((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        // Clear max wait timeout
        if (maxWaitTimeoutRef.current) {
          clearTimeout(maxWaitTimeoutRef.current);
          maxWaitTimeoutRef.current = null;
        }

        lastCallTime.current = Date.now();
        setIsPending(true);
        setError(null);

        try {
          const result = await queryFn();
          setLastResult(result);
          setIsPending(false);
          resolve(result);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Query execution failed');
          setError(error);
          setIsPending(false);
          reject(error);
        }
      }, delay);

      // Set up max wait timeout
      if (maxWait && maxWait > delay) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          // Execute immediately if max wait is reached
          lastCallTime.current = Date.now();
          setIsPending(true);
          setError(null);

          queryFn()
            .then(result => {
              setLastResult(result);
              setIsPending(false);
              resolve(result);
            })
            .catch(err => {
              const error = err instanceof Error ? err : new Error('Query execution failed');
              setError(error);
              setIsPending(false);
              reject(error);
            });
        }, maxWait);
      }
    });
  }, [delay, maxWait, immediate, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    execute,
    cancel,
    isPending,
    lastResult,
    error
  };
}

// Specialized hook for query building with drag-and-drop
export function useQueryAutoUpdate(
  trigger: any,
  queryFn: () => Promise<any>,
  dependencies: any[] = [],
  options?: UseQueryDebouncerOptions
) {
  const { execute, isPending, lastResult, error, cancel } = useQueryDebouncer(options);

  // Execute query when trigger or dependencies change
  useEffect(() => {
    if (trigger !== undefined && trigger !== null) {
      execute(queryFn).catch(console.error);
    }
  }, [trigger, ...dependencies, execute, queryFn]);

  // Cancel pending queries on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    isPending,
    result: lastResult,
    error,
    execute: () => execute(queryFn),
    cancel
  };
}

// Hook for managing multiple queries with debouncing
export function useBatchQueryDebouncer() {
  const [queries, setQueries] = useState<Map<string, any>>(new Map());
  const debouncers = useRef<Map<string, UseQueryDebouncerReturn<any>>>(new Map());

  const registerQuery = useCallback((id: string, options?: UseQueryDebouncerOptions) => {
    const debouncer = useQueryDebouncer(options);
    debouncers.current.set(id, debouncer);
    
    setQueries(prev => {
      const newMap = new Map(prev);
      newMap.set(id, {
        isPending: false,
        lastResult: null,
        error: null
      });
      return newMap;
    });

    return debouncer;
  }, []);

  const executeQuery = useCallback(async (id: string, queryFn: () => Promise<any>) => {
    const debouncer = debouncers.current.get(id);
    if (!debouncer) {
      throw new Error(`Query debouncer not found for id: ${id}`);
    }

    // Update state
    setQueries(prev => {
      const newMap = new Map(prev);
      const queryState = newMap.get(id);
      if (queryState) {
        newMap.set(id, {
          ...queryState,
          isPending: true,
          error: null
        });
      }
      return newMap;
    });

    try {
      const result = await debouncer.execute(queryFn);
      
      // Update state with result
      setQueries(prev => {
        const newMap = new Map(prev);
        const queryState = newMap.get(id);
        if (queryState) {
          newMap.set(id, {
            ...queryState,
            isPending: false,
            lastResult: result
          });
        }
        return newMap;
      });

      return result;
    } catch (error) {
      // Update state with error
      setQueries(prev => {
        const newMap = new Map(prev);
        const queryState = newMap.get(id);
        if (queryState) {
          newMap.set(id, {
            ...queryState,
            isPending: false,
            error: error instanceof Error ? error : new Error('Query failed')
          });
        }
        return newMap;
      });

      throw error;
    }
  }, []);

  const getQueryState = useCallback((id: string) => {
    return queries.get(id);
  }, [queries]);

  const cancelQuery = useCallback((id: string) => {
    const debouncer = debouncers.current.get(id);
    if (debouncer) {
      debouncer.cancel();
      
      // Update state
      setQueries(prev => {
        const newMap = new Map(prev);
        const queryState = newMap.get(id);
        if (queryState) {
          newMap.set(id, {
            ...queryState,
            isPending: false
          });
        }
        return newMap;
      });
    }
  }, []);

  const cancelAll = useCallback(() => {
    debouncers.current.forEach(debouncer => debouncer.cancel());
    setQueries(new Map());
  }, []);

  return {
    registerQuery,
    executeQuery,
    getQueryState,
    cancelQuery,
    cancelAll,
    queries
  };
}