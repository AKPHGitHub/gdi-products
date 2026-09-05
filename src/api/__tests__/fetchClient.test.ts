import { fetchClient } from '../fetchClient';
import type { ProductsResponse, ApiProductMinimal } from '../product';

describe('fetchClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as jest.Mock;
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches successfully and returns json (typed Product model)', async () => {
    const rawMinimal: ApiProductMinimal = {
      id: 1,
      title: 'Essence Mascara Lash Princess',
      price: 9.99,
      thumbnail: 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
    };
    const data: ProductsResponse<ApiProductMinimal> = {
      products: [rawMinimal],
      total: 194,
      skip: 0,
      limit: 1,
    };
    (global.fetch as unknown as jest.Mock).mockResolvedValue({ ok: true, json: async () => data } as Response);
    const res = await fetchClient<ProductsResponse<ApiProductMinimal>>('https://dummyjson.com/products?limit=1');
    expect(res).toEqual(data);
    expect(res.products[0]).toEqual(rawMinimal);
    expect(global.fetch).toHaveBeenCalledWith('https://dummyjson.com/products?limit=1', { signal: undefined });
  });

  it('throws on HTTP error', async () => {
    (global.fetch as unknown as jest.Mock).mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' } as Response);
    await expect(fetchClient('https://dummyjson.com/products')).rejects.toThrow('HTTP 500');
  });

  it('throws on network error', async () => {
    (global.fetch as unknown as jest.Mock).mockRejectedValue(new Error('network down'));
    await expect(fetchClient('https://dummyjson.com/products')).rejects.toThrow('network down');
  });

  it('forwards AbortSignal to fetch', async () => {
    (global.fetch as unknown as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    const c = new AbortController();
    await fetchClient('https://dummyjson.com/products', { signal: c.signal });
    expect(global.fetch).toHaveBeenCalledWith('https://dummyjson.com/products', { signal: c.signal });
  });

  it('aborted request rejects with AbortError', async () => {
    const err = new DOMException('aborted', 'AbortError');
    (global.fetch as unknown as jest.Mock).mockRejectedValue(err);
    const c = new AbortController();
    c.abort();
    await expect(fetchClient('https://dummyjson.com/products', { signal: c.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
