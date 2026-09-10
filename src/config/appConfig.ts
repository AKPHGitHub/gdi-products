const getEnv = (key: string, fallback: string): string => {
  // For Node (build time, Docker, tests) and browser (via window.__APP_CONFIG__ or fallback)
  if (typeof process !== 'undefined' && (process as unknown as { env?: Record<string, string> }).env?.[key] != null) {
    return (process as unknown as { env: Record<string, string> }).env[key] as string;
  }
  if (typeof window !== 'undefined' && (window as unknown as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__?.[key] != null) {
    return (window as unknown as { __APP_CONFIG__: Record<string, string> }).__APP_CONFIG__[key];
  }
  return fallback;
};

const apiBaseUrl = getEnv('API_BASE_URL', 'https://dummyjson.com/products');
const tilesPerPage = Number(getEnv('TILES_PER_PAGE', '16'));

export const appConfig = {
  apiBaseUrl,
  tilesPerPage,
} as const;

export type AppConfig = typeof appConfig;

export function createConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const cfg = { ...appConfig, ...overrides };
  if (cfg.tilesPerPage < 4 || cfg.tilesPerPage > 100) {
    throw new Error(`tilesPerPage must be 4–100, got ${cfg.tilesPerPage}`);
  }
  return cfg;
}
