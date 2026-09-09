import { createConfig } from '../appConfig';

describe('appConfig', () => {
  it('throws if tilesPerPage <4', () => {
    expect(() => createConfig({ tilesPerPage: 3 } as any)).toThrow('4–100');
    expect(() => createConfig({ tilesPerPage: 0 } as any)).toThrow('4–100');
  });
  it('throws if tilesPerPage >100', () => {
    expect(() => createConfig({ tilesPerPage: 101 } as any)).toThrow('4–100');
    expect(() => createConfig({ tilesPerPage: 200 } as any)).toThrow('4–100');
  });
  it('accepts 4 and 100 (boundaries)', () => {
    expect(createConfig({ tilesPerPage: 4 } as any).tilesPerPage).toBe(4);
    expect(createConfig({ tilesPerPage: 100 } as any).tilesPerPage).toBe(100);
  });
  it('accepts 16 (default)', () => {
    expect(createConfig({ tilesPerPage: 16 } as any).tilesPerPage).toBe(16);
  });
});
