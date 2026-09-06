import { useState, useEffect, useRef } from 'react';
import { fetchClient } from '../api/fetchClient';
import { toProductMinimal, toProduct, mergeProducts } from '../mappers/product';
import type { Product } from '../types/product';
import type { ApiProduct, ApiProductMinimal } from '../api/product';
import type { ProductsResponse } from '../api/response';

const BASE = 'https://dummyjson.com/products';

export function useProgressiveProducts(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const [pageKey, setPageKey] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [phase1, setPhase1] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [phase2, setPhase2] = useState<{ enriching: boolean; error: string | null }>({ enriching: false, error: null });
  const pageKeyRef = useRef(0);
  const controllersRef = useRef<{ p1: AbortController | null; p2: AbortController | null }>({ p1: null, p2: null });

  useEffect(() => {
    pageKeyRef.current = pageKey;
    const c1 = new AbortController();
    const c2 = new AbortController();
    controllersRef.current.p1?.abort();
    controllersRef.current.p2?.abort();
    controllersRef.current = { p1: c1, p2: c2 };
    const key = pageKey;

    setPhase1({ loading: true, error: null });
    const skip = (page - 1) * 16;

    fetchClient<ProductsResponse<ApiProductMinimal>>(`${BASE}?limit=16&skip=${skip}&select=title,price,thumbnail`, { signal: c1.signal })
      .then((data) => {
        if (key !== pageKeyRef.current) return;
        const minimal = data.products.map(toProductMinimal);
        setProducts(minimal);
        setPhase1({ loading: false, error: null });
        setPhase2({ enriching: true, error: null });
        return fetchClient<ProductsResponse<ApiProduct>>(`${BASE}?limit=16&skip=${skip}`, { signal: c2.signal });
      })
      .then((full) => {
        if (!full || key !== pageKeyRef.current) return;
        const enriched = full.products.map(toProduct);
        setProducts((prev) => mergeProducts(prev, enriched));
        setPhase2({ enriching: false, error: null });
      })
      .catch((err: unknown) => {
        const e = err as { name?: string; message?: string };
        if (e.name === 'AbortError') return;
        // route error to correct phase
        setPhase1((s) => (s.loading ? { loading: false, error: e.message ?? 'Unknown error' } : s));
        setPhase2((s) => (s.enriching ? { enriching: false, error: e.message ?? 'Unknown error' } : s));
      });

    return () => {
      c1.abort();
      c2.abort();
    };
  }, [page, pageKey]);

  const goNext = () => setPage((p) => p + 1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const retry = () => setPageKey((k) => k + 1);

  return { products, page, phase1, phase2, setPage, goNext, goPrev, retry, pageKey };
}
