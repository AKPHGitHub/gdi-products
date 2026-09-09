// Benchmark sequential vs concurrent two-phase loading
// Simulates fetch delays and measures TTFP (Time To First Paint) and TTEn (Time To Enriched)

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchMinimal(delayMs = 150) {
  await delay(delayMs);
  return { products: [{ id: 1, title: 'A', price: 10, thumbnail: 't1' }], total: 194 };
}

async function fetchFull(delayMs = 150) {
  await delay(delayMs);
  return { products: [{ id: 1, title: 'A', price: 10, thumbnail: 't1', description: 'desc', rating: 4.5 }] };
}

// Sequential: Phase1 -> Phase2
async function sequential() {
  const start = Date.now();
  const t0 = Date.now();
  const minimal = await fetchMinimal(150);
  const ttfp = Date.now() - t0;
  const full = await fetchFull(150);
  const tten = Date.now() - start;
  return { ttfp, tten };
}

// Concurrent: Phase1 || Phase2
async function concurrent() {
  const start = Date.now();
  const p1 = fetchMinimal(150).then((minimal) => {
    const ttfp = Date.now() - start;
    return { minimal, ttfp };
  });
  const p2 = fetchFull(150).then((full) => {
    const tten = Date.now() - start;
    return { full, tten };
  });
  const [{ minimal, ttfp }, { full, tten }] = await Promise.all([p1, p2]);
  // Merge would happen here
  return { ttfp, tten: Math.max(ttfp, tten) };
}

async function runBenchmark() {
  console.log('Benchmarking sequential vs concurrent (10 runs, 150ms each fetch)...');
  const seqResults = [];
  const conResults = [];
  for (let i = 0; i < 10; i++) {
    seqResults.push(await sequential());
    conResults.push(await concurrent());
  }
  const avg = (arr, key) => arr.reduce((a, b) => a + b[key], 0) / arr.length;
  console.log('\nSequential:');
  console.log(`  Avg TTFP (first paint): ${avg(seqResults, 'ttfp').toFixed(1)}ms`);
  console.log(`  Avg TTEn (enriched): ${avg(seqResults, 'tten').toFixed(1)}ms`);
  console.log('\nConcurrent:');
  console.log(`  Avg TTFP (first paint): ${avg(conResults, 'ttfp').toFixed(1)}ms`);
  console.log(`  Avg TTEn (enriched): ${avg(conResults, 'tten').toFixed(1)}ms`);
  console.log('\nDifference:');
  console.log(`  TTFP equal (both ~150ms)`);
  console.log(`  TTEn concurrent is ~${(avg(seqResults, 'tten') - avg(conResults, 'tten')).toFixed(1)}ms faster (saves 1 RTT)`);
  console.log('\nNote: Blank for 2s suggests Phase1 fetch is slow (network to dummyjson) or phase1.loading not handled. Concurrent does not affect TTFP, but sequential adds Phase2 wait to TTEn.');
}

runBenchmark();

// Also test with real network to dummyjson
async function realNetworkBenchmark() {
  console.log('\n--- Real network to dummyjson.com ---');
  const testFetch = async (url) => {
    const start = Date.now();
    const res = await fetch(url);
    await res.json();
    return Date.now() - start;
  };
  try {
    const t1 = await testFetch('https://dummyjson.com/products?limit=16&skip=0&select=title,price,thumbnail');
    const t2 = await testFetch('https://dummyjson.com/products?limit=16&skip=0');
    console.log(`Phase1 (minimal) fetch: ${t1}ms`);
    console.log(`Phase2 (full) fetch: ${t2}ms`);
    console.log(`Sequential TTEn: ${t1 + t2}ms`);
    console.log(`Concurrent TTEn: ${Math.max(t1, t2)}ms (if fired together)`);
    console.log(`Concurrent saves: ${t1 + t2 - Math.max(t1, t2)}ms`);
  } catch (e) {
    console.log('Real network test failed (offline?):', e.message);
  }
}

realNetworkBenchmark();
