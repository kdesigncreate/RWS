'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * デバウンス処理用カスタムフック
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * デバウンス付きコールバック関数用フック
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // コールバック関数を最新に保つ
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}

/**
 * 検索用デバウンスフック（キャンセル機能付き）
 */
export function useSearchDebounce(
  searchFunction: (query: string) => Promise<void>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, delay);

  // デバウンス後に検索実行
  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setIsSearching(false);
      setError(null);
      return;
    }

    const performSearch = async () => {
      // 前回の検索をキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 新しいAbortControllerを作成
      abortControllerRef.current = new AbortController();

      setIsSearching(true);
      setError(null);

      try {
        await searchFunction(debouncedQuery);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || '検索中にエラーが発生しました');
        }
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchFunction]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSearching(false);
  }, []);

  const setSearchQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setError(null);
  }, []);

  return {
    query,
    debouncedQuery,
    isSearching,
    error,
    setQuery: setSearchQuery,
    clearSearch,
  };
}

/**
 * リアルタイム保存用デバウンスフック
 */
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  delay: number = 2000,
  enabled: boolean = true
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initialDataRef = useRef<T>(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // データが変更されたかチェック
  const hasChanges = JSON.stringify(data) !== JSON.stringify(initialDataRef.current);

  const debouncedSave = useDebouncedCallback(
    async (dataToSave: T) => {
      if (!enabled || !hasChanges) return;

      setIsSaving(true);
      setSaveError(null);

      try {
        await saveFunction(dataToSave);
        setLastSaved(new Date());
        initialDataRef.current = dataToSave;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '保存に失敗しました';
        setSaveError(errorMessage);
      } finally {
        setIsSaving(false);
      }
    },
    delay
  );

  // データ変更時に自動保存をトリガー
  useEffect(() => {
    if (enabled && hasChanges) {
      debouncedSave(data);
    }
  }, [data, enabled, hasChanges, debouncedSave]);

  const forceSave = useCallback(async () => {
    if (!hasChanges) return { success: true };

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveFunction(data);
      setLastSaved(new Date());
      initialDataRef.current = data;
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存に失敗しました';
      setSaveError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSaving(false);
    }
  }, [data, hasChanges, saveFunction]);

  const resetData = useCallback(() => {
    initialDataRef.current = data;
    setSaveError(null);
  }, [data]);

  return {
    isSaving,
    lastSaved,
    saveError,
    hasChanges,
    forceSave,
    resetData,
  };
}

/**
 * スロットル処理用カスタムフック
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * フォーム用デバウンスバリデーションフック
 */
export function useDebounceValidation<T>(
  value: T,
  validator: (value: T) => Promise<string | null>,
  delay: number = 500
) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    if (!debouncedValue) {
      setValidationError(null);
      setIsValid(null);
      return;
    }

    const validate = async () => {
      setIsValidating(true);
      try {
        const error = await validator(debouncedValue);
        setValidationError(error);
        setIsValid(error === null);
      } catch (err) {
        setValidationError('バリデーション中にエラーが発生しました');
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [debouncedValue, validator]);

  const reset = useCallback(() => {
    setValidationError(null);
    setIsValid(null);
    setIsValidating(false);
  }, []);

  return {
    isValidating,
    validationError,
    isValid,
    reset,
  };
}