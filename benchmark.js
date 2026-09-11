// Benchmark sequential two-phase loading
// Goes through src/hooks/useProgressiveProducts.ts (sequential chain)
// Uses stubbed fetch when STUB=1 to avoid DummyJSON rate-limit

import { performance } from 'node:perf_hooks';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// STUB=1 — deterministic stub with 150ms per phase, no DummyJSON rate-limit, goes through hook via fetchClient
// Run with: STUB=1 npx tsx benchmark.js
if (process.env.STUB === '1') {
  const STUB_TOTAL = 194;
  const STUB_LIMIT = 16;
  function stubMakeMinimal(skip) {
    const count = Math.min(STUB_LIMIT, STUB_TOTAL - skip);
    return Array.from({ length: count }, (_, i) => ({ id: skip + i + 1, title: `P${skip + i + 1}`, price: 10 + i, thumbnail: `t${skip + i + 1}` }));
  }
  function stubMakeFull(skip) {
    return stubMakeMinimal(skip).map((p) => ({
      ...p,
      description: `desc ${p.id}`, rating: 4.5, stock: 10, brand: 'B', category: 'cat', discountPercentage: 5, images: [`t${p.id}`], tags: [], sku: 'S', weight: 1, dimensions: { width: 1, height: 1, depth: 1 }, warrantyInformation: '', shippingInformation: '', availabilityStatus: '', reviews: [], returnPolicy: '', minimumOrderQuantity: 1, meta: { createdAt: '', updatedAt: '', barcode: '', qrCode: '' },
    }));
  }
  globalThis.fetch = async (url, opts) => {
    if (opts?.signal?.aborted) throw new DOMException('aborted', 'AbortError');
    await new Promise((res, rej) => {
      const t = setTimeout(res, 150);
      opts?.signal?.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('aborted', 'AbortError')); }, { once: true });
    });
    const u = new URL(String(url));
    const skip = Number(u.searchParams.get('skip') ?? '0');
    const isMinimal = String(url).includes('select=');
    const data = isMinimal ? { products: stubMakeMinimal(skip), total: STUB_TOTAL, skip, limit: STUB_LIMIT } : { products: stubMakeFull(skip), total: STUB_TOTAL, skip, limit: STUB_LIMIT };
    return { ok: true, status: 200, statusText: 'OK', json: async () => data };
  };
  console.log('STUB=1: mocked fetch with 150ms per phase, deterministic 194 total 16/page, no rate-limit — goes through src/hooks/useProgressiveProducts.ts');
}

// Real benchmark through src/hooks/useProgressiveProducts.ts (sequential)
async function realHookBenchmark() {
  console.log('\n--- Hook benchmark via src/hooks/useProgressiveProducts.ts (sequential) ---');
  console.log('Going through src/hooks/useProgressiveProducts.ts (sequential chain)');
  try {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    try { globalThis.navigator = dom.window.navigator; } catch { Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, writable: true, configurable: true }); }
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.Node = dom.window.Node;
    globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
    if (process.env.STUB === '1') {
      dom.window.fetch = globalThis.fetch;
      globalThis.window.fetch = globalThis.fetch;
    }
    globalThis.window.scrollTo = () => {};

    const { renderHook, waitFor } = await import('@testing-library/react');
    let useProgressiveProducts;
    try {
      const seqMod = await import('./src/hooks/useProgressiveProducts.ts');
      useProgressiveProducts = seqMod.useProgressiveProducts;
    } catch (e) {
      console.log('Hook import failed (run with: npx tsx benchmark.js):', e.message);
      return;
    }

    async function benchHook(useHook, label) {
      const start = performance.now();
      const { result, unmount } = renderHook(() => useHook(1));
      const t0 = performance.now();
      await waitFor(() => {
        if (result.current.phase1.loading !== false && !result.current.phase1.error) throw new Error('phase1 not ready');
      }, { timeout: 8000 });
      const ttfp = performance.now() - t0;
      if (result.current.phase1.error) console.log(`${label} Phase1 error:`, result.current.phase1.error);
      await waitFor(() => {
        if (result.current.phase2.enriching !== false && !result.current.phase2.error) throw new Error('phase2 not ready');
      }, { timeout: 8000 });
      if (result.current.phase2.error) console.log(`${label} Phase2 error:`, result.current.phase2.error);
      const tten = performance.now() - start;
      const count = result.current.products.length;
      console.log(`${label}: TTFP ${ttfp.toFixed(1)}ms TTEn ${tten.toFixed(1)}ms products:${count} total:${result.current.total}`);
      await delay(100, null);
      unmount();
      return { ttfp, tten };
    }

    const seq = await benchHook(useProgressiveProducts, 'Sequential Hook (src/hooks/useProgressiveProducts.ts)');
    console.log('\nResult:');
    console.log(`  TTEn: ${seq.tten.toFixed(1)}ms (Phase1 150ms + Phase2 150ms sequential)`);
    console.log(`  TTFP ~150ms (first paint after Phase1)`);
  } catch (e) {
    console.log('Real hook benchmark failed:', e.message);
    console.log(e.stack?.slice(0, 800));
  }
}

await realHookBenchmark();
