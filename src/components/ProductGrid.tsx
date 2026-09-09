import type { Product } from '../types/product.js';
import { ProductTile } from './ProductTile.js';
import { appConfig } from '../config/appConfig.js';

export function ProductGrid({
  products,
  phase1,
  phase2,
}: {
  products: Product[];
  phase1: { loading: boolean; error: string | null };
  phase2: { enriching: boolean; error: string | null };
}) {
  if (phase1.loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: appConfig.tilesPerPage }).map((_, i) => (
          <div key={i} className="h-64 border skeleton animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }
  if (phase1.error) {
    return (
      <div>
        Error: {phase1.error} <button onClick={() => location.reload()}>Retry</button>
      </div>
    );
  }
  return (
    <>
      {phase2.enriching && <div className="text-sm">loading details…</div>}
      {phase2.error && <div className="text-sm text-amber-600">Enrichment warning: {phase2.error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductTile key={p.id} product={p} enriching={phase2.enriching} />
        ))}
      </div>
    </>
  );
}
