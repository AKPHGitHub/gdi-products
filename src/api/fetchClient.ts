export async function fetchClient<T>(url: string, { signal }: { signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}
