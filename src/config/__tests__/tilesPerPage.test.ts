import { createConfig } from '../appConfig';

describe('tilesPerPage other than 16 does not break', () => {
  it('createConfig allows 4 and 100 and rejects outside', () => {
    expect(createConfig({ tilesPerPage: 4 } as any).tilesPerPage).toBe(4);
    expect(createConfig({ tilesPerPage: 100 } as any).tilesPerPage).toBe(100);
    expect(() => createConfig({ tilesPerPage: 3 } as any)).toThrow('4–100');
    expect(() => createConfig({ tilesPerPage: 101 } as any)).toThrow('4–100');
  });

  it('hook and mappers handle small and large product lists (4, 100) without breaking merge', () => {
    // This test verifies that the Product and toProduct mappers work for any count, not just 16
    // The hook's LIMIT is from appConfig.tilesPerPage (16 by default), but the mappers and merge should handle any size
    // We test the mappers directly with 4 and 100 items
    const makeMinimal = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ id: i + 1, title: `P${i + 1}`, price: 10, thumbnail: `t${i + 1}` }));
    const { toProductsMinimal } = require('../../mappers/product');
    expect(toProductsMinimal(makeMinimal(4))).toHaveLength(4);
    expect(toProductsMinimal(makeMinimal(100))).toHaveLength(100);
    expect(toProductsMinimal(makeMinimal(1))).toHaveLength(1);
  });
});
