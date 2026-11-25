import { GeminiDirectProvider } from './geminiProvider';
import type { FinancialAIProvider } from './types';

let providerInstance: FinancialAIProvider | null = null;

/**
 * Returns the active FinancialAIProvider.
 * To migrate from direct browser calls to a Supabase Edge Function later,
 * replace GeminiDirectProvider here without touching any hooks or UI components.
 */
export function getFinancialAIProvider(): FinancialAIProvider {
  if (!providerInstance) {
    providerInstance = new GeminiDirectProvider();
  }
  return providerInstance;
}

export * from './types';
