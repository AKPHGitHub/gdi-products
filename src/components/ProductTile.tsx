import type { Product } from '../types/product.js';

export function ProductTile({ product, enriching }: { product: Product; enriching: boolean }) {
  const isEnriching = enriching && product.rating == null;
  return (
    <div data-testid={`tile-${product.id}`} className="tile flex flex-col border p-2 gap-1">
      <img src={product.thumbnail} alt={product.title} className="aspect-square object-cover w-full" />
      <h3 className="font-bold truncate">{product.title}</h3>
      <p>${product.price}</p>
      {isEnriching ? (
        <div className="skeleton h-4 w-12 bg-gray-200 animate-pulse" />
      ) : (
        <p className="text-sm">
          {product.rating != null ? `★ ${product.rating}` : '★ —'} · Stock {product.stock ?? '—'}
        </p>
      )}
      {isEnriching ? (
        <div className="skeleton h-4 w-full bg-gray-200 animate-pulse" />
      ) : (
        product.description && <p className="text-sm">{product.description}</p>
      )}
      <div className="text-xs space-y-1">
        {product.category && <p>Category: {product.category}</p>}
        {product.brand && <p>Brand: {product.brand}</p>}
        {product.discountPercentage != null && <p>Discount: {product.discountPercentage}%</p>}
        {product.tags && product.tags.length > 0 && <p>Tags: {product.tags.join(', ')}</p>}
        {product.sku && <p>SKU: {product.sku}</p>}
        {product.weight != null && <p>Weight: {product.weight}</p>}
        {product.dimensions && (
          <p>
            Dimensions: {product.dimensions.width}×{product.dimensions.height}×{product.dimensions.depth}
          </p>
        )}
        {product.warrantyInformation && <p>Warranty: {product.warrantyInformation}</p>}
        {product.shippingInformation && <p>Shipping: {product.shippingInformation}</p>}
        {product.availabilityStatus && <p>Status: {product.availabilityStatus}</p>}
        {product.returnPolicy && <p>Return: {product.returnPolicy}</p>}
        {product.minimumOrderQuantity != null && <p>MOQ: {product.minimumOrderQuantity}</p>}
        {product.meta && (
          <p>
            Meta: {product.meta.barcode} {product.meta.qrCode && '· QR'}
          </p>
        )}
        {product.images && product.images.length > 0 && (
          <div className="grid grid-cols-3 gap-1">
            {product.images
              .filter((img) => img !== product.thumbnail)
              .slice(0, 6)
              .map((img, i) => (
                <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded" loading="lazy" />
              ))}
          </div>
        )}
        {product.reviews && product.reviews.length > 0 && (
          <div>
            <p>Reviews: {product.reviews.length}</p>
            {product.reviews.slice(0, 1).map((r, i) => (
              <p key={i} className="truncate">
                {r.rating}★ {r.comment} — {r.reviewerName}
              </p>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs">{isEnriching ? 'loading details…' : 'enriched'}</span>
    </div>
  );
}
