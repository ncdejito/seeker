export async function withRetry<T>(fn: () => Promise<T>, maxAttempts: number = 5): Promise<T> {
  let attempt = 0;
  let delay = 1000;
  let lastError: any;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      attempt++;
      if (attempt >= maxAttempts) break;
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }

  await new Promise(res => setTimeout(res, delay));

  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  const err = new Error(`${msg} (after ${maxAttempts} attempts)`);

  const p = new Promise<T>((_, reject) => {
    setImmediate(() => reject(err));
  });
  p.catch(() => {});

  return p;
}
