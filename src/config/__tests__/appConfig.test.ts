import { createConfig } from '../appConfig';
import { appConfig } from '../appConfig';

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
  it('has correct default apiBaseUrl and tilesPerPage', () => {
    expect(appConfig.apiBaseUrl).toBe('https://dummyjson.com/products');
    expect(appConfig.tilesPerPage).toBe(16);
  });
  it('reads from process.env when set', async () => {
    const original = process.env.API_BASE_URL;
    process.env.API_BASE_URL = 'https://example.com/api';
    await jest.isolateModulesAsync(async () => {
      const mod = await import('../appConfig');
      expect(mod.appConfig.apiBaseUrl).toBe('https://example.com/api');
    });
    process.env.API_BASE_URL = original;
  });
  it('reads from window.__APP_CONFIG__ when process.env not set', async () => {
    const originalEnv = process.env.API_BASE_URL;
    const originalWindow = (window as unknown as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__;
    delete (process.env as unknown as Record<string, string | undefined>).API_BASE_URL;
    (window as unknown as { __APP_CONFIG__: Record<string, string> }).__APP_CONFIG__ = {
      API_BASE_URL: 'https://window.example.com',
    };
    await jest.isolateModulesAsync(async () => {
      const mod = await import('../appConfig');
      expect(mod.appConfig.apiBaseUrl).toBe('https://window.example.com');
    });
    if (originalWindow) {
      (window as unknown as { __APP_CONFIG__: Record<string, string> }).__APP_CONFIG__ = originalWindow;
    } else {
      delete (window as unknown as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__;
    }
    if (originalEnv !== undefined) process.env.API_BASE_URL = originalEnv;
    else delete (process.env as unknown as Record<string, string | undefined>).API_BASE_URL;
  });
  it('falls back to default when neither env nor window set', async () => {
    const originalEnv = process.env.API_BASE_URL;
    const originalWindow = (window as unknown as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__;
    delete (process.env as unknown as Record<string, string | undefined>).API_BASE_URL;
    delete (window as unknown as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__;
    await jest.isolateModulesAsync(async () => {
      const mod = await import('../appConfig');
      expect(mod.appConfig.apiBaseUrl).toBe('https://dummyjson.com/products');
    });
    if (originalEnv !== undefined) process.env.API_BASE_URL = originalEnv;
    if (originalWindow) (window as unknown as { __APP_CONFIG__: Record<string, string> }).__APP_CONFIG__ = originalWindow;
  });
});
