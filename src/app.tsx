import { useProgressiveProducts } from './hooks/useProgressiveProducts.js';
import { ProductGrid } from './components/ProductGrid.js';
import { Pagination } from './components/Pagination.js';

export default function App() {
  const { products, page, phase1, phase2, goNext, goPrev, hasNext, hasPrev, totalPages } = useProgressiveProducts(1);
  return (
    <main className="max-w-7xl mx-auto p-4">
      <h1>Products</h1>
      <Pagination page={page} onPrev={goPrev} onNext={goNext} hasNext={hasNext} hasPrev={hasPrev} totalPages={totalPages} />
      <ProductGrid products={products} phase1={phase1} phase2={phase2} />
      <Pagination page={page} onPrev={goPrev} onNext={goNext} hasNext={hasNext} hasPrev={hasPrev} totalPages={totalPages} />
    </main>
  );
}
