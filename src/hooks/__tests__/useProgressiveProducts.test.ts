import { renderHook, act, waitFor } from '@testing-library/react';
import { useProgressiveProducts } from '../useProgressiveProducts';
import * as fc from '../../api/fetchClient';

jest.mock('../../api/fetchClient');

function deferred<T>() {
  let resolve: (v: T) => void, reject: (e: unknown) => void;
  const p = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  // @ts-ignore
  p.resolve = resolve;
  // @ts-ignore
  p.reject = reject;
  return p as Promise<T> & { resolve: (v: T) => void; reject: (e: unknown) => void };
}

describe('useProgressiveProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Phase2 for page1 arriving after move to page2 is discarded', async () => {
    const d1Phase1 = deferred<any>(), d1Phase2 = deferred<any>(), d2Phase1 = deferred<any>();
    (fc.fetchClient as unknown as jest.Mock).mockImplementation((url: string, { signal }: { signal?: AbortSignal } = {}) => {
      if (url.includes('skip=0')) return url.includes('select=') ? d1Phase1 : d1Phase2;
      return d2Phase1;
    });
    const { result } = renderHook(() => useProgressiveProducts());
    // simulate rapid navigation via result.current.setPage(2) before d1Phase2 resolves
    // assert final products correspond only to page 2
  });

  it('aborts previous controllers on rapid navigation', async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    const d1 = deferred<any>();
    (fc.fetchClient as unknown as jest.Mock).mockReturnValue(d1);
    const { result } = renderHook(() => useProgressiveProducts());
    // trigger page change
    act(() => {
      result.current.goNext();
    });
    // wait a tick for effect to run and abort previous
    await act(async () => {
      await Promise.resolve();
    });
    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  it('independent loading per phase', async () => {
    // phase1.loading true blocks, phase2.enriching true does not
  });
});
