import type { Product } from '../../types/product';
import { mergeProducts } from '../product';

describe('mergeProducts — merges Phase 2 into Phase 1 by id, enriching all 16 fields', () => {
  it('preserves phase1 fields and enriches all 16 fields, no duplicates', () => {
    // Arrange
    const prev: Product[] = [{ id: 1, title: 'A', price: 10, thumbnail: 't.jpg' }];
    const enriched: Partial<Product>[] = [
      {
        id: 1,
        description: 'desc',
        rating: 4.5,
        stock: 10,
        brand: 'X',
        category: 'beauty',
        discountPercentage: 10.48,
        images: ['i1'],
        tags: ['tA'],
        sku: 'SKU-1',
        weight: 1,
        dimensions: { width: 1, height: 1, depth: 1 },
        warrantyInformation: '1 week',
        shippingInformation: 'Ships',
        availabilityStatus: 'In Stock',
        reviews: [{ rating: 5, comment: 'great', date: '2025-01-01', reviewerName: 'Anon', reviewerEmail: 'a@b.com' }],
        returnPolicy: '30 days',
        minimumOrderQuantity: 1,
        meta: { createdAt: '2025-01-01', updatedAt: '2025-01-02', barcode: '123', qrCode: 'qr' },
      },
    ];
    const expected: Product = {
      id: 1,
      title: 'A',
      price: 10,
      thumbnail: 't.jpg',
      description: 'desc',
      rating: 4.5,
      stock: 10,
      brand: 'X',
      category: 'beauty',
      discountPercentage: 10.48,
      images: ['i1'],
      tags: ['tA'],
      sku: 'SKU-1',
      weight: 1,
      dimensions: { width: 1, height: 1, depth: 1 },
      warrantyInformation: '1 week',
      shippingInformation: 'Ships',
      availabilityStatus: 'In Stock',
      reviews: [{ rating: 5, comment: 'great', date: '2025-01-01', reviewerName: 'Anon', reviewerEmail: 'a@b.com' }],
      returnPolicy: '30 days',
      minimumOrderQuantity: 1,
      meta: { createdAt: '2025-01-01', updatedAt: '2025-01-02', barcode: '123', qrCode: 'qr' },
    };
    // Act
    const actual = mergeProducts(prev, enriched);
    // Assert
    expect(actual).toHaveLength(1);
    expect(actual[0]).toEqual(expected);
    expect(actual[0].title).toBe('A'); // preserved from prev
    expect(actual[0].tags).toEqual(['tA']);
    expect(actual[0].sku).toBe('SKU-1');
    expect(actual[0].reviews).toEqual(expected.reviews);
    expect(actual[0].meta).toEqual(expected.meta);
  });

  it('no duplicates on idempotent merge', () => {
    // Arrange
    const prev: Product[] = [{ id: 1, title: 'A', price: 10, thumbnail: 't.jpg', rating: 4.5 }];
    const enriched: Partial<Product>[] = [{ id: 1, rating: 4.5 }];
    const expectedLength = 1;
    // Act
    const actual = mergeProducts(prev, enriched);
    // Assert
    expect(actual).toHaveLength(expectedLength);
    expect(actual[0].rating).toBe(4.5);
  });

  it('merges multiple ids, enriching each', () => {
    // Arrange
    const prev: Product[] = [
      { id: 1, title: 'A', price: 10, thumbnail: 't1' },
      { id: 2, title: 'B', price: 20, thumbnail: 't2' },
    ];
    const enriched: Partial<Product>[] = [
      { id: 1, description: 'desc A', rating: 4 },
      { id: 2, description: 'desc B', rating: 5 },
    ];
    // Act
    const actual = mergeProducts(prev, enriched);
    // Assert
    expect(actual).toHaveLength(2);
    expect(actual.find((p) => p.id === 1)?.description).toBe('desc A');
    expect(actual.find((p) => p.id === 2)?.description).toBe('desc B');
  });

  it('ignores enriched without id (cannot merge)', () => {
    // Arrange
    const prev: Product[] = [{ id: 1, title: 'A', price: 10, thumbnail: 't1' }];
    const enriched = [{ description: 'no id' } as unknown as Partial<Product>];
    // Act
    const actual = mergeProducts(prev, enriched);
    // Assert
    expect(actual).toEqual(prev);
  });
});
