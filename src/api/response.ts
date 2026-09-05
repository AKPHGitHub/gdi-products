/** Generic paginated envelope — reusable for any resource */
export interface PaginatedResponse<T> {
  products: T[];
  total: number;
  skip: number;
  limit: number;
}

/** Alias for this PLP — keeps existing imports working, maps to generic */
export type ProductsResponse<T = unknown> = PaginatedResponse<T>;
