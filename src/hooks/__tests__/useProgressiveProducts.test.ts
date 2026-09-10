import { renderHook, act, waitFor } from '@testing-library/react';
import { useProgressiveProducts } from '../useProgressiveProducts';
import * as fc from '../../api/fetchClient.js';

jest.mock('../../api/fetchClient.js', () => ({
  fetchClient: jest.fn(),
}));


function deferred<T>() {
  let resolve: (v: T) => void, reject: (e: unknown) => void;
  const p = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  // @ts-ignore
  p.resolve = resolve;
  // @ts-ignore
  p.reject = reject;
  return p as Promise<T> & { resolve: (v: T) => void; reject: (e: unknown) => void };
}

describe('useProgressiveProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('aborts previous controllers on rapid navigation', async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    const d1 = deferred<any>();
    (fc.fetchClient as unknown as jest.Mock).mockReturnValue(d1);
    const { result } = renderHook(() => useProgressiveProducts());
    // trigger page change
    act(() => {
      result.current.goNext();
    });
    // wait a tick for effect to run and abort previous
    await act(async () => {
      await Promise.resolve();
    });
    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  it('independent loading per phase', async () => {
    (fc.fetchClient as unknown as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useProgressiveProducts(1));
    // Wait for effect to run and set both phases
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current.phase1.loading).toBe(true);
    expect(result.current.phase2.enriching).toBe(true);
  });

  it('handles Phase 1 error', async () => {
    const err = new Error('Phase1 failed');
    (fc.fetchClient as unknown as jest.Mock).mockRejectedValue(err);
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase1.error).toBe('Phase1 failed'));
    expect(result.current.phase1.loading).toBe(false);
  });

  it('handles Phase 2 error', async () => {
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.resolve({ products: [{ id: 1, title: 'A', price: 10, thumbnail: 't1' }], total: 1, skip: 0, limit: 16 });
      return Promise.reject(new Error('Phase2 failed'));
    });
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase2.error).toBe('Phase2 failed'));
    expect(result.current.phase2.enriching).toBe(false);
  });

  it('handles AbortError without setting error', async () => {
    const err = new DOMException('aborted', 'AbortError');
    (fc.fetchClient as unknown as jest.Mock).mockRejectedValue(err);
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase1.loading).toBe(false));
    expect(result.current.phase1.error).toBe(null);
    expect(result.current.phase2.error).toBe(null);
  });

  it('covers AbortError false branches when idle (both not loading/enriching)', async () => {
    // Get to idle: both phases finished
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.resolve({ products: [{ id: 1, title: 'A', price: 10, thumbnail: 't' }], total: 1, skip: 0, limit: 16 });
      return Promise.resolve({ products: [{ id: 1, title: 'A', price: 10, thumbnail: 't', description: 'desc' }], total: 1, skip: 0, limit: 16 });
    });
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase1.loading).toBe(false));
    await waitFor(() => expect(result.current.phase2.enriching).toBe(false));
    // Now both false, trigger AbortError via retry
    (fc.fetchClient as unknown as jest.Mock).mockRejectedValue(new DOMException('aborted', 'AbortError'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.phase1.loading).toBe(false));
    expect(result.current.phase1.error).toBe(null);
    expect(result.current.phase2.error).toBe(null);
    expect(result.current.phase2.enriching).toBe(false);
  });

  it('covers non-AbortError false branches (Phase2 error when Phase1 not loading)', async () => {
    // Phase1 succeeds (loading false, enriching true), Phase2 fails -> phase1 false branch, phase2 true branch
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.resolve({ products: [{ id: 1, title: 'A', price: 10, thumbnail: 't' }], total: 1, skip: 0, limit: 16 });
      return Promise.reject(new Error('phase2 late'));
    });
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase1.loading).toBe(false));
    expect(result.current.phase1.error).toBe(null); // false branch: s.loading false -> keep s
    await waitFor(() => expect(result.current.phase2.enriching).toBe(false));
    expect(result.current.phase2.error).toBe('phase2 late');
  });

  it('covers non-AbortError enriching false branch (retry Phase1 error when idle)', async () => {
    // Get to idle (both false)
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.resolve({ products: [{ id: 1, title: 'A', price: 10, thumbnail: 't' }], total: 1, skip: 0, limit: 16 });
      return Promise.resolve({ products: [{ id: 1, title: 'A', price: 10, thumbnail: 't', description: 'desc' }], total: 1, skip: 0, limit: 16 });
    });
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase2.enriching).toBe(false));
    // Now idle: phase1 false, phase2 false, retry Phase1 fails -> phase1 true branch, phase2 false branch (line 64 false)
    (fc.fetchClient as unknown as jest.Mock).mockRejectedValue(new Error('retry phase1 fail'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.phase1.loading).toBe(false));
    expect(result.current.phase1.error).toBe('retry phase1 fail');
    expect(result.current.phase2.error).toBe(null); // false branch covered (s.enriching false)
  });

  it('covers AbortError false branch for phase1 (Phase2 abort when Phase1 not loading)', async () => {
    const dPhase2 = deferred<any>();
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.resolve({ products: [{ id: 1, title: 'A', price: 10, thumbnail: 't' }], total: 1, skip: 0, limit: 16 });
      return dPhase2; // Phase2 slow
    });
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase1.loading).toBe(false));
    expect(result.current.phase2.enriching).toBe(true);
    // Abort Phase2 via retry before it resolves -> AbortError when phase1 false, phase2 true
    (fc.fetchClient as unknown as jest.Mock).mockImplementation(() => Promise.reject(new DOMException('aborted', 'AbortError')));
    act(() => result.current.retry());
    await act(async () => {
      dPhase2.reject(new DOMException('aborted', 'AbortError'));
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.phase1.loading).toBe(false));
    expect(result.current.phase1.error).toBe(null); // line 58 false branch covered
    expect(result.current.phase2.enriching).toBe(false);
  });

  it('covers error message fallback when err.message is undefined', async () => {
    (fc.fetchClient as unknown as jest.Mock).mockRejectedValue({ name: 'Error' } as unknown as Error);
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase1.loading).toBe(false));
    expect(result.current.phase1.error).toBe('Unknown error');
  });

  it('covers stale Phase2 guard (key !== pageKeyRef)', async () => {
    const dSlowPhase2 = deferred<any>();
    let call = 0;
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.resolve({ products: [{ id: 1, title: 'A', price: 10, thumbnail: 't' }], total: 1, skip: 0, limit: 16 });
      call += 1;
      if (call === 1) return dSlowPhase2; // first Phase2 slow
      return Promise.resolve({ products: [{ id: 99, title: 'New', price: 99, thumbnail: 't99', description: 'new' }], total: 1, skip: 0, limit: 16 });
    });
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase1.loading).toBe(false));
    // Now Phase2 is enriching, trigger retry before slow Phase2 resolves -> stale
    act(() => result.current.retry());
    await act(async () => {
      dSlowPhase2.resolve({ products: [{ id: 1, title: 'Stale', price: 1, thumbnail: 't1', description: 'stale' }], total: 1, skip: 0, limit: 16 });
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.phase2.enriching).toBe(false));
    expect(result.current.products.find((p) => p.title === 'Stale')).toBeUndefined();
  });

  it('does not scroll when window.scrollTo is undefined', async () => {
    const orig = window.scrollTo;
    // @ts-ignore delete scrollTo
    delete (window as unknown as { scrollTo?: unknown }).scrollTo;
    (fc.fetchClient as unknown as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useProgressiveProducts(1));
    act(() => result.current.goNext());
    expect(result.current.page).toBe(2);
    act(() => result.current.goPrev());
    expect(result.current.page).toBe(1);
    window.scrollTo = orig;
  });

  it('covers totalPages null branch and hasNext true before total known', async () => {
    (fc.fetchClient as unknown as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useProgressiveProducts(1));
    expect(result.current.total).toBe(null);
    expect(result.current.totalPages).toBe(null);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrev).toBe(false);
  });

  it('goNext and goPrev update page and scroll', async () => {
    const d1 = deferred<any>();
    (fc.fetchClient as unknown as jest.Mock).mockReturnValue(d1);
    const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { result } = renderHook(() => useProgressiveProducts(1));
    expect(result.current.page).toBe(1);
    act(() => { result.current.goNext(); });
    expect(result.current.page).toBe(2);
    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    act(() => { result.current.goPrev(); });
    expect(result.current.page).toBe(1);
    scrollSpy.mockRestore();
  });

  it('hasNext is false on last page', async () => {
    const d1 = deferred<any>();
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.resolve({ products: [{ id: 193, title: 'A', price: 10, thumbnail: 't' }], total: 194, skip: 192, limit: 16 });
      return Promise.resolve({ products: [{ id: 193, title: 'A', price: 10, thumbnail: 't', description: 'desc' }], total: 194, skip: 192, limit: 16 });
    });
    const { result } = renderHook(() => useProgressiveProducts(13));
    await waitFor(() => expect(result.current.total).toBe(194));
    expect(result.current.totalPages).toBe(13);
    expect(result.current.hasNext).toBe(false);
    expect(result.current.hasPrev).toBe(true);
  });

  it('fetches 16 products per page (default tilesPerPage)', async () => {
    const mockProducts = Array.from({ length: 16 }, (_, i) => ({ id: i + 1, title: `P${i+1}`, price: 10, thumbnail: `t${i+1}` }));
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.resolve({ products: mockProducts, total: 194, skip: 0, limit: 16 });
      return Promise.resolve({ products: mockProducts.map(p => ({ ...p, description: 'desc' })), total: 194, skip: 0, limit: 16 });
    });
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.products).toHaveLength(16));
    expect(result.current.products[0].title).toBe('P1');
  });

  it('does not set products if pageKey stale', async () => {
    const dOld1 = deferred<any>();
    let firstCall = true;
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) {
        if (firstCall) {
          firstCall = false;
          return dOld1;
        }
        // For retry's new Phase1, return a new deferred that will not be resolved with stale
        return new Promise(() => {});
      }
      return Promise.resolve({ products: [], total: 0, skip: 0, limit: 16 });
    });
    const { result } = renderHook(() => useProgressiveProducts(1));
    // Trigger pageKey change before fetch resolves (stale guard) — old fetch should be discarded
    act(() => {
      result.current.retry();
    });
    await act(async () => {
      dOld1.resolve({ products: [{ id: 1, title: 'Stale', price: 10, thumbnail: 't' }], total: 1, skip: 0, limit: 16 });
      await Promise.resolve();
    });
    // Should not have set stale data from old pageKey
    expect(result.current.products.find((p) => p.title === 'Stale')).toBeUndefined();
  });

  it('handles !full (Phase1 fails, Phase2 gets undefined)', async () => {
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.reject(new Error('Phase1 fail'));
      return Promise.resolve(null as unknown as { products: [] });
    });
    const { result } = renderHook(() => useProgressiveProducts(1));
    await waitFor(() => expect(result.current.phase1.error).toBe('Phase1 fail'));
    expect(result.current.phase2.enriching).toBe(false);
  });

  it('goNext does not go beyond last page and scrolls', async () => {
    const d1 = deferred<any>();
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('select=')) return Promise.resolve({ products: [{ id: 193, title: 'A', price: 10, thumbnail: 't' }], total: 194, skip: 192, limit: 16 });
      return Promise.resolve({ products: [{ id: 193, title: 'A', price: 10, thumbnail: 't', description: 'desc' }], total: 194, skip: 192, limit: 16 });
    });
    const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { result } = renderHook(() => useProgressiveProducts(13));
    await waitFor(() => expect(result.current.totalPages).toBe(13));
    expect(result.current.hasNext).toBe(false);
    act(() => result.current.goNext());
    expect(result.current.page).toBe(13); // should not go to 14
    expect(scrollSpy).toHaveBeenCalled();
    scrollSpy.mockRestore();
  });
});
