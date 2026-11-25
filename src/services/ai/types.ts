import type { Category } from '../../types';
import type { FinancialContextSnapshot } from '../../utils/aiContextBuilder';

export type AIErrorCode =
  | 'MISSING_API_KEY'
  | 'RATE_LIMITED'
  | 'OFFLINE'
  | 'PROVIDER_ERROR';

export class AIServiceError extends Error {
  readonly code: AIErrorCode;

  constructor(code: AIErrorCode, message?: string) {
    super(message || code);
    this.name = 'AIServiceError';
    this.code = code;
  }
}

export type InsightType = 'saving' | 'warning' | 'positive' | 'tip';

export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  type: InsightType;
  impact?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface AskAssistantParams {
  question: string;
  context: FinancialContextSnapshot;
  previousInteractionId?: string;
  language: string;
  onChunk?: (accumulatedText: string) => void;
}

export interface AskAssistantResult {
  text: string;
  interactionId?: string;
}

export interface GenerateInsightsParams {
  context: FinancialContextSnapshot;
  language: string;
}

export interface SuggestCategoryParams {
  description: string;
  type: 'income' | 'expense';
  categories: Pick<Category, 'id' | 'name'>[];
}

export interface FinancialAIProvider {
  isConfigured(): boolean;
  askAssistant(params: AskAssistantParams): Promise<AskAssistantResult>;
  generateMonthlyInsights(params: GenerateInsightsParams): Promise<FinancialInsight[]>;
  suggestCategory(params: SuggestCategoryParams): Promise<string | null>;
}
