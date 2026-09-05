/** Internal app model — domain Product, used in UI and store. Pure, no import from api. All 16 ApiProduct fields as optional (except Phase 1 required) for defensive real backend + Phase 1 minimal → Phase 2 full without as unknown. */
export interface Product {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  // Enriched Phase 2 fields (optional until merged, defensive for real backend where any may be absent)
  description?: string;
  category?: string;
  brand?: string;
  rating?: number;
  stock?: number;
  discountPercentage?: number;
  images?: string[];
  tags?: string[];
  sku?: string;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  reviews?: { rating: number; comment: string; date: string; reviewerName: string; reviewerEmail: string }[];
  returnPolicy?: string;
  minimumOrderQuantity?: number;
  meta?: { createdAt: string; updatedAt: string; barcode: string; qrCode: string };
}
