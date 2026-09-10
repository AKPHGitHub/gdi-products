import { useState, useEffect, useRef } from 'react';
import { fetchClient } from '../api/fetchClient.js';
import { toProductMinimal, toProduct, mergeProducts } from '../mappers/product.js';
import type { Product } from '../types/product.js';
import type { ApiProduct, ApiProductMinimal } from '../api/product.js';
import type { ProductsResponse } from '../api/response.js';
import { appConfig } from '../config/appConfig.js';

const BASE = appConfig.apiBaseUrl;
const LIMIT = appConfig.tilesPerPage;

export function useProgressiveProducts(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const [pageKey, setPageKey] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [phase1, setPhase1] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });
  const [phase2, setPhase2] = useState<{ enriching: boolean; error: string | null }>({ enriching: true, error: null });
  const pageKeyRef = useRef(0);
  const controllersRef = useRef<{ p1: AbortController | null; p2: AbortController | null }>({ p1: null, p2: null });
  const totalPages = total != null ? Math.ceil(total / LIMIT) : null;
  const hasNext = totalPages == null ? true : page < totalPages;
  const hasPrev = page > 1;

  useEffect(() => {
    pageKeyRef.current = pageKey;
    const c1 = new AbortController();
    const c2 = new AbortController();
    controllersRef.current.p1?.abort();
    controllersRef.current.p2?.abort();
    controllersRef.current = { p1: c1, p2: c2 };
    const key = pageKey;

    setPhase1({ loading: true, error: null });
    const skip = (page - 1) * LIMIT;

    fetchClient<ProductsResponse<ApiProductMinimal>>(`${BASE}?limit=${LIMIT}&skip=${skip}&select=title,price,thumbnail`, { signal: c1.signal })
      .then((data) => {
        if (key !== pageKeyRef.current) {
          return;
        }
        setTotal(data.total);
        const minimal = data.products.map(toProductMinimal);
        setProducts(minimal);
        setPhase1({ loading: false, error: null });
        setPhase2({ enriching: true, error: null });
        return fetchClient<ProductsResponse<ApiProduct>>(`${BASE}?limit=${LIMIT}&skip=${skip}`, { signal: c2.signal });
      })
      .then((full) => {
        if (!full || key !== pageKeyRef.current) return;
        const enriched = full.products.map(toProduct);
        setProducts((prev) => mergeProducts(prev, enriched));
        setPhase2({ enriching: false, error: null });
      })
      .catch((err: unknown) => {
        const e = err as { name?: string; message?: string };
        if (e.name === 'AbortError') {
          setPhase1((s) => (s.loading ? { loading: false, error: null } : s));
          setPhase2((s) => (s.enriching ? { enriching: false, error: null } : s));
          return;
        }
        // route error to correct phase
        setPhase1((s) => (s.loading ? { loading: false, error: e.message ?? 'Unknown error' } : s));
        setPhase2((s) => (s.enriching ? { enriching: false, error: e.message ?? 'Unknown error' } : s));
      });

    return () => {
      c1.abort();
      c2.abort();
    };
  }, [page, pageKey]);

  const goNext = () => {
    setPage((p) => (hasNext ? p + 1 : p));
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const goPrev = () => {
    setPage((p) => Math.max(1, p - 1));
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const retry = () => setPageKey((k) => k + 1);

  return { products, page, phase1, phase2, setPage, goNext, goPrev, retry, pageKey, total, totalPages, hasNext, hasPrev };
}
