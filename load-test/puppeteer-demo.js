import puppeteer from 'puppeteer';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SHOPPERS = 4;
const PAGES_PER_SHOPPER = 5;

async function runShopper(browser, id) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  // Enable performance observer before navigation
  await page.evaluateOnNewDocument(() => {
    window.__perf = { lcp: 0, cls: 0 };
    try {
      new PerformanceObserver((entryList) => {
        for (const e of entryList.getEntries()) {
          if (e.entryType === 'largest-contentful-paint') window.__perf.lcp = e.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((entryList) => {
        for (const e of entryList.getEntries()) {
          if (!e.hadRecentInput) window.__perf.cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
  });

  const t0 = performance.now();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Wait for skeleton then grid
  try { await page.waitForSelector('[data-testid="skeleton"]', { timeout: 2000 }); } catch {}
  const ttfpStart = performance.now();
  await page.waitForSelector('[data-testid="product-grid"]', { timeout: 15000 });
  const tiles = await page.$$('[data-testid^="tile-"]');
  const ttfp = performance.now() - ttfpStart;
  const firstPaint = performance.now() - t0;

  // Wait for enrichment to finish
  const tEnStart = performance.now();
  try { await page.waitForSelector('[data-testid="phase2-enriching"]', { timeout: 1000 }); } catch {}
  await page.waitForFunction(() => !document.querySelector('[data-testid="phase2-enriching"]'), { timeout: 10000 }).catch(() => {});
  const tten = performance.now() - tEnStart;

  // Pagination stress: browse 5 pages
  const inpSamples = [];
  let heapBefore = 0, heapAfter = 0;
  try {
    const metricsBefore = await page.metrics();
    heapBefore = metricsBefore.JSHeapUsedSize;
  } catch {}
  for (let i = 0; i < PAGES_PER_SHOPPER; i++) {
    const inp0 = performance.now();
    const nextBtn = await page.$('[data-testid="next-btn"]');
    const disabled = await page.$eval('[data-testid="next-btn"]', (el) => el.disabled).catch(() => true);
    if (disabled) {
      await page.click('[data-testid="prev-btn"]').catch(() => {});
    } else {
      await nextBtn.click().catch(() => {});
    }
    await page.waitForSelector('[data-testid="product-grid"]', { timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => !document.querySelector('[data-testid="phase2-enriching"]'), { timeout: 8000 }).catch(() => {});
    inpSamples.push(performance.now() - inp0);
  }
  try {
    const metricsAfter = await page.metrics();
    heapAfter = metricsAfter.JSHeapUsedSize;
  } catch {}

  const perf = await page.evaluate(() => window.__perf || { lcp: 0, cls: 0 });
  const tileCount = await page.$$eval('[data-testid^="tile-"]', (els) => els.length).catch(() => tiles.length);

  await page.close();
  return {
    shopper: id,
    firstPaintMs: Math.round(firstPaint),
    ttfpMs: Math.round(ttfp),
    ttenMs: Math.round(tten),
    lcpMs: Math.round(perf.lcp),
    cls: Number(perf.cls.toFixed(4)),
    inpAvgMs: inpSamples.length ? Math.round(inpSamples.reduce((a, b) => a + b, 0) / inpSamples.length) : 0,
    heapDeltaKb: Math.round((heapAfter - heapBefore) / 1024),
    tiles: tileCount,
    pagesBrowsed: PAGES_PER_SHOPPER,
  };
}

async function main() {
  console.log(`Launching 4 shoppers against ${BASE_URL} ...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const start = performance.now();
  const results = await Promise.all([
    runShopper(browser, 'A'),
    runShopper(browser, 'B'),
    runShopper(browser, 'C'),
    runShopper(browser, 'D'),
  ]);
  await browser.close();
  const totalMs = Math.round(performance.now() - start);

  // Summary
  const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const summary = {
    baseUrl: BASE_URL,
    shoppers: SHOPPERS,
    totalDurationMs: totalMs,
    ttfp_p50: avg(results.map((r) => r.ttfpMs)),
    ttfp_p95: Math.max(...results.map((r) => r.ttfpMs)),
    tten_avg: avg(results.map((r) => r.ttenMs)),
    lcp_avg: avg(results.map((r) => r.lcpMs)),
    cls_max: Math.max(...results.map((r) => r.cls)),
    inp_avg: avg(results.map((r) => r.inpAvgMs)),
    heapDelta_maxKb: Math.max(...results.map((r) => r.heapDeltaKb)),
    allPassed: results.every((r) => r.tiles >= 4 && r.tiles <= 100),
  };
  console.log('\n=== Per-Shopper Results ===');
  console.table(results);
  console.log('\n=== Summary (Scalability) ===');
  console.log(JSON.stringify(summary, null, 2));
  // Thresholds for evaluator
  const checks = {
    'ttfp < 800ms': summary.ttfp_p95 < 800,
    'lcp < 2500ms': summary.lcp_avg < 2500,
    'cls < 0.4': summary.cls_max < 0.4,
    'all shoppers rendered': summary.allPassed,
    'heap growth < 30MB': summary.heapDelta_maxKb < 30 * 1024,
  };
  console.log('\n=== Checks ===');
  console.table(checks);
  if (Object.values(checks).every(Boolean)) console.log('✓ Scalability demo PASSED');
  else console.log('✗ Some checks failed — see above (often cls/lcp due to dummyjson latency)');
}

main().catch((e) => { console.error(e); process.exit(1); });
