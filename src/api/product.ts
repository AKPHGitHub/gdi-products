
export type { PaginatedResponse, ProductsResponse } from './response.js';

/** Raw product from API — https://dummyjson.com/products */
export interface ApiProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: { rating: number; comment: string; date: string; reviewerName: string; reviewerEmail: string }[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: { createdAt: string; updatedAt: string; barcode: string; qrCode: string };
  images: string[];
  thumbnail: string;
}

/** Minimal payload from Phase 1: GET /products?select=title,price,thumbnail */
export type ApiProductMinimal = Pick<ApiProduct, 'id' | 'title' | 'price' | 'thumbnail'>;
