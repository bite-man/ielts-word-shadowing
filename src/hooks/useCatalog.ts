import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CatalogResponse, WordItem } from '../types';

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(forceRefresh ? '/api/catalog?refresh=1' : '/api/catalog');
      if (!res.ok) {
        throw new Error(`加载词库失败 (${res.status})`);
      }
      const data: CatalogResponse = await res.json();
      setCatalog(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '无法连接到本地音频服务');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog(false);
  }, [fetchCatalog]);

  const allWords = useMemo<WordItem[]>(() => {
    if (!catalog) return [];
    const items: WordItem[] = [];
    for (const list of catalog.lists) {
      for (const unit of list.units) {
        items.push(...unit.words);
      }
    }
    return items;
  }, [catalog]);

  return {
    catalog,
    allWords,
    isLoading,
    error,
    refresh: () => fetchCatalog(true),
  };
}
