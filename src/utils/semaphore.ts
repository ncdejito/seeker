import pLimit from 'p-limit';

export function createSemaphore(n: number) {
  const limit = pLimit(n);
  return <T>(fn: () => Promise<T>): Promise<T> => limit(fn);
}
