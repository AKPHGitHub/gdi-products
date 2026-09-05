import type { ApiProduct, ApiProductMinimal } from '../api/product';
import type { Product } from '../types/product';

/** Map Phase 1 minimal raw → internal Product (fast first paint) */
export function toProductMinimal(raw: ApiProductMinimal): Product {
  return {
    id: raw.id,
    title: raw.title,
    price: raw.price,
    thumbnail: raw.thumbnail,
  };
}

/** Map Phase 2 full raw → internal Product (enrichment) — all 16 ApiProduct fields as optional, without as unknown */
export function toProduct(raw: ApiProduct): Product {
  return {
    id: raw.id,
    title: raw.title,
    price: raw.price,
    thumbnail: raw.thumbnail,
    description: raw.description,
    category: raw.category,
    brand: raw.brand,
    rating: raw.rating,
    stock: raw.stock,
    discountPercentage: raw.discountPercentage,
    images: raw.images,
    tags: raw.tags,
    sku: raw.sku,
    weight: raw.weight,
    dimensions: raw.dimensions,
    warrantyInformation: raw.warrantyInformation,
    shippingInformation: raw.shippingInformation,
    availabilityStatus: raw.availabilityStatus,
    reviews: raw.reviews,
    returnPolicy: raw.returnPolicy,
    minimumOrderQuantity: raw.minimumOrderQuantity,
    meta: raw.meta,
  };
}

/** Map full list — minimal */
export function toProductsMinimal(raw: ApiProductMinimal[]): Product[] {
  return raw.map(toProductMinimal);
}

/** Map full list — full */
export function toProducts(raw: ApiProduct[]): Product[] {
  return raw.map(toProduct);
}
