import type { ApiProduct, ApiProductMinimal } from '../../api/product';
import type { Product } from '../../types/product';
import { toProduct, toProductMinimal, toProducts, toProductsMinimal } from '../product';

describe('product model — maps https://dummyjson.com/products to internal Product', () => {
  it('maps ApiProductMinimal (Phase 1) to Product', () => {
    // Arrange
    const rawMinimal: ApiProductMinimal = {
      id: 1,
      title: 'Essence Mascara Lash Princess',
      price: 9.99,
      thumbnail: 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
    };
    const expected: Product = {
      id: 1,
      title: 'Essence Mascara Lash Princess',
      price: 9.99,
      thumbnail: 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
    };
    // Act
    const actual = toProductMinimal(rawMinimal);
    // Assert
    expect(actual).toEqual(expected);
  });

  it('maps full ApiProduct (Phase 2) to internal Product', () => {
    // Arrange
    const rawFull: ApiProduct = {
      id: 1,
      title: 'Essence Mascara Lash Princess',
      description: 'The Essence Mascara Lash Princess is a popular mascara.',
      category: 'beauty',
      price: 9.99,
      discountPercentage: 10.48,
      rating: 2.56,
      stock: 99,
      tags: ['beauty', 'mascara'],
      brand: 'Essence',
      sku: 'BEA-ESS-ESS-001',
      weight: 4,
      dimensions: { width: 15.14, height: 13.08, depth: 22.99 },
      warrantyInformation: '1 week warranty',
      shippingInformation: 'Ships in 3-5 business days',
      availabilityStatus: 'In Stock',
      reviews: [],
      returnPolicy: 'No return policy',
      minimumOrderQuantity: 48,
      meta: { createdAt: '2025-04-30T09:41:02.053Z', updatedAt: '2025-04-30T09:41:02.053Z', barcode: '5784719087687', qrCode: 'https://cdn.dummyjson.com/public/qr-code.png' },
      images: ['https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp'],
      thumbnail: 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
    };
    const expected: Product = {
      id: 1,
      title: 'Essence Mascara Lash Princess',
      price: 9.99,
      thumbnail: 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
      description: 'The Essence Mascara Lash Princess is a popular mascara.',
      category: 'beauty',
      brand: 'Essence',
      rating: 2.56,
      stock: 99,
      discountPercentage: 10.48,
      images: ['https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp'],
      tags: ['beauty', 'mascara'],
      sku: 'BEA-ESS-ESS-001',
      weight: 4,
      dimensions: { width: 15.14, height: 13.08, depth: 22.99 },
      warrantyInformation: '1 week warranty',
      shippingInformation: 'Ships in 3-5 business days',
      availabilityStatus: 'In Stock',
      reviews: [],
      returnPolicy: 'No return policy',
      minimumOrderQuantity: 48,
      meta: { createdAt: '2025-04-30T09:41:02.053Z', updatedAt: '2025-04-30T09:41:02.053Z', barcode: '5784719087687', qrCode: 'https://cdn.dummyjson.com/public/qr-code.png' },
    };
    // Act
    const actual = toProduct(rawFull);
    // Assert
    expect(actual).toEqual(expected);
  });

  it('maps list of minimal products', () => {
    // Arrange
    const raws: ApiProductMinimal[] = [
      { id: 1, title: 'A', price: 10, thumbnail: 't1' },
      { id: 2, title: 'B', price: 20, thumbnail: 't2' },
    ];
    const expected: Product[] = [
      { id: 1, title: 'A', price: 10, thumbnail: 't1' },
      { id: 2, title: 'B', price: 20, thumbnail: 't2' },
    ];
    // Act
    const actual = toProductsMinimal(raws);
    // Assert
    expect(actual).toEqual(expected);
  });

  it('maps list of full products', () => {
    // Arrange
    const raws: ApiProduct[] = [
      {
        id: 1,
        title: 'A',
        description: 'desc A',
        category: 'cat',
        price: 10,
        discountPercentage: 1,
        rating: 4,
        stock: 5,
        tags: ['tA'],
        brand: 'B1',
        sku: 'SKU-1',
        weight: 1,
        dimensions: { width: 1, height: 1, depth: 1 },
        warrantyInformation: '1 week',
        shippingInformation: 'Ships in 1 day',
        availabilityStatus: 'In Stock',
        reviews: [{ rating: 5, comment: 'great', date: '2025-01-01', reviewerName: 'Anon', reviewerEmail: 'a@b.com' }],
        returnPolicy: '30 days',
        minimumOrderQuantity: 1,
        meta: { createdAt: '2025-01-01', updatedAt: '2025-01-02', barcode: '123', qrCode: 'qr' },
        images: ['i1'],
        thumbnail: 't1',
      },
      {
        id: 2,
        title: 'B',
        description: 'desc B',
        category: 'cat2',
        price: 20,
        discountPercentage: 2,
        rating: 3,
        stock: 6,
        tags: ['tB'],
        brand: 'B2',
        sku: 'SKU-2',
        weight: 2,
        dimensions: { width: 2, height: 2, depth: 2 },
        warrantyInformation: '2 weeks',
        shippingInformation: 'Ships in 2 days',
        availabilityStatus: 'Low Stock',
        reviews: [{ rating: 4, comment: 'ok', date: '2025-01-02', reviewerName: 'Bob', reviewerEmail: 'b@c.com' }],
        returnPolicy: '14 days',
        minimumOrderQuantity: 2,
        meta: { createdAt: '2025-02-01', updatedAt: '2025-02-02', barcode: '456', qrCode: 'qr2' },
        images: ['i2', 'i3'],
        thumbnail: 't2',
      },
    ];
    const expected: Product[] = [
      {
        id: 1,
        title: 'A',
        price: 10,
        thumbnail: 't1',
        description: 'desc A',
        category: 'cat',
        brand: 'B1',
        rating: 4,
        stock: 5,
        discountPercentage: 1,
        images: ['i1'],
        tags: ['tA'],
        sku: 'SKU-1',
        weight: 1,
        dimensions: { width: 1, height: 1, depth: 1 },
        warrantyInformation: '1 week',
        shippingInformation: 'Ships in 1 day',
        availabilityStatus: 'In Stock',
        reviews: [{ rating: 5, comment: 'great', date: '2025-01-01', reviewerName: 'Anon', reviewerEmail: 'a@b.com' }],
        returnPolicy: '30 days',
        minimumOrderQuantity: 1,
        meta: { createdAt: '2025-01-01', updatedAt: '2025-01-02', barcode: '123', qrCode: 'qr' },
      },
      {
        id: 2,
        title: 'B',
        price: 20,
        thumbnail: 't2',
        description: 'desc B',
        category: 'cat2',
        brand: 'B2',
        rating: 3,
        stock: 6,
        discountPercentage: 2,
        images: ['i2', 'i3'],
        tags: ['tB'],
        sku: 'SKU-2',
        weight: 2,
        dimensions: { width: 2, height: 2, depth: 2 },
        warrantyInformation: '2 weeks',
        shippingInformation: 'Ships in 2 days',
        availabilityStatus: 'Low Stock',
        reviews: [{ rating: 4, comment: 'ok', date: '2025-01-02', reviewerName: 'Bob', reviewerEmail: 'b@c.com' }],
        returnPolicy: '14 days',
        minimumOrderQuantity: 2,
        meta: { createdAt: '2025-02-01', updatedAt: '2025-02-02', barcode: '456', qrCode: 'qr2' },
      },
    ];
    // Act
    const actual = toProducts(raws);
    // Assert
    expect(actual).toEqual(expected);
    // Additionally assert every field individually for the first product to ensure no field is missed
    expect(actual[0].tags).toEqual(['tA']);
    expect(actual[0].sku).toBe('SKU-1');
    expect(actual[0].weight).toBe(1);
    expect(actual[0].dimensions).toEqual({ width: 1, height: 1, depth: 1 });
    expect(actual[0].warrantyInformation).toBe('1 week');
    expect(actual[0].shippingInformation).toBe('Ships in 1 day');
    expect(actual[0].availabilityStatus).toBe('In Stock');
    expect(actual[0].reviews).toEqual([{ rating: 5, comment: 'great', date: '2025-01-01', reviewerName: 'Anon', reviewerEmail: 'a@b.com' }]);
    expect(actual[0].returnPolicy).toBe('30 days');
    expect(actual[0].minimumOrderQuantity).toBe(1);
    expect(actual[0].meta).toEqual({ createdAt: '2025-01-01', updatedAt: '2025-01-02', barcode: '123', qrCode: 'qr' });
    expect(actual[0].images).toEqual(['i1']);
    expect(actual[0].brand).toBe('B1');
    expect(actual[0].category).toBe('cat');
    expect(actual[0].rating).toBe(4);
    expect(actual[0].stock).toBe(5);
    expect(actual[0].discountPercentage).toBe(1);
  });
});
