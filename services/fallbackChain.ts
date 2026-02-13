export type ModelProvider = 'claude' | 'gemini' | 'gpt';

export interface ProviderAttempt<T> {
  provider: ModelProvider;
  execute: () => Promise<T>;
  isAvailable: () => boolean;
}

export interface FallbackResult<T> {
  data: T;
  modelUsed: ModelProvider;
  fallbackLog: string[];
}

/**
 * Execute a chain of providers with automatic fallback.
 * Never throws — returns defaultResult if ALL providers fail.
 */
export async function callWithFallback<T>(
  label: string,
  providers: ProviderAttempt<T>[],
  defaultResult: T,
): Promise<FallbackResult<T>> {
  const fallbackLog: string[] = [];

  for (const { provider, execute, isAvailable } of providers) {
    if (!isAvailable()) {
      const msg = `${provider}: skipped (no API key)`;
      fallbackLog.push(msg);
      console.log(`[${label}] ${msg}`);
      continue;
    }

    try {
      console.log(`[${label}] ${provider}: attempting...`);
      const data = await execute();
      const msg = `${provider}: success`;
      fallbackLog.push(msg);
      console.log(`[${label}] ${msg}`);
      return { data, modelUsed: provider, fallbackLog };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const msg = `${provider}: failed — ${errMsg}`;
      fallbackLog.push(msg);
      console.warn(`[${label}] ${msg}`);
    }
  }

  // All providers failed
  const msg = 'all providers failed, using defaults';
  fallbackLog.push(msg);
  console.error(`[${label}] ${msg}`);
  return { data: defaultResult, modelUsed: 'gemini', fallbackLog };
}
