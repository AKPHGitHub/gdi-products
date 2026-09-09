export const appConfig = {
  apiBaseUrl: 'https://dummyjson.com/products',
  tilesPerPage: 16,
} as const;

export type AppConfig = typeof appConfig;

if (appConfig.tilesPerPage < 4 || appConfig.tilesPerPage > 100) {
  throw new Error(`tilesPerPage must be 4–100, got ${appConfig.tilesPerPage}`);
}

export function createConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const cfg = { ...appConfig, ...overrides };
  if (cfg.tilesPerPage < 4 || cfg.tilesPerPage > 100) {
    throw new Error(`tilesPerPage must be 4–100, got ${cfg.tilesPerPage}`);
  }
  return cfg;
}
