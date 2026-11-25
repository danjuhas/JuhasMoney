import { GoogleGenAI } from '@google/genai';
import {
  AIServiceError,
  type AskAssistantParams,
  type AskAssistantResult,
  type FinancialAIProvider,
  type FinancialInsight,
  type GenerateInsightsParams,
  type InsightType,
  type SuggestCategoryParams,
} from './types';
import type { FinancialContextSnapshot } from '../../utils/aiContextBuilder';

const CHAT_AND_INSIGHTS_MODEL = 'gemini-4-hydrogen';
const CATEGORIZATION_MODEL = 'gemini-3.5-flash-lite';

function getLanguageLabel(language: string): string {
  const normalized = language.toLowerCase();
  if (normalized.startsWith('pt')) return 'Portuguese (Brazil)';
  if (normalized.startsWith('es')) return 'Spanish';
  return 'English';
}

function buildAssistantSystemInstruction(
  context: FinancialContextSnapshot,
  language: string
): string {
  const langLabel = getLanguageLabel(language);
  return [
    `You are Juhas AI, a friendly, concise, and practical personal finance assistant inside the JuhasMoney app.`,
    `Always respond in ${langLabel}.`,
    `Use ONLY the verified financial data provided below. Never invent transactions or numbers that are not in the snapshot.`,
    `All totals, balances, and percentages are already pre-calculated accurately in the snapshot — trust those numbers.`,
    `Be actionable, empathetic, and direct. Use short paragraphs or bullet points with bold highlights for monetary values.`,
    `If the user has no transactions in the selected month, kindly explain that and invite them to add their first transactions.`,
    `Format monetary values consistently using the user's currency (${context.currency}).`,
    ``,
    `CURRENT USER FINANCIAL SNAPSHOT (JSON):`,
    JSON.stringify(context),
  ].join('\n');
}

function classifyError(error: unknown): AIServiceError {
  if (error instanceof AIServiceError) return error;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new AIServiceError('OFFLINE', 'No internet connection');
  }

  const message =
    error instanceof Error ? error.message : String(error ?? 'Unknown AI error');
  const lower = message.toLowerCase();

  if (
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted')
  ) {
    return new AIServiceError('RATE_LIMITED', message);
  }

  if (
    lower.includes('api key') ||
    lower.includes('api_key') ||
    lower.includes('401') ||
    lower.includes('403')
  ) {
    return new AIServiceError('MISSING_API_KEY', message);
  }

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return new AIServiceError('OFFLINE', message);
  }

  return new AIServiceError('PROVIDER_ERROR', message);
}

function parseJsonSafely<T>(raw: string): T | null {
  try {
    const trimmed = raw.trim();
    const cleaned = trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '');
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export class GeminiDirectProvider implements FinancialAIProvider {
  private readonly apiKey: string;
  private client: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    this.apiKey = (apiKey ?? import.meta.env.VITE_GEMINI_API_KEY ?? '').trim();
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  private getClient(): GoogleGenAI {
    if (!this.isConfigured()) {
      throw new AIServiceError('MISSING_API_KEY', 'VITE_GEMINI_API_KEY is not configured');
    }
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this.client;
  }

  async askAssistant(params: AskAssistantParams): Promise<AskAssistantResult> {
    const { question, context, previousInteractionId, language, onChunk } = params;

    try {
      const ai = this.getClient();
      const systemInstruction = buildAssistantSystemInstruction(context, language);

      const stream = await ai.interactions.create({
        model: CHAT_AND_INSIGHTS_MODEL,
        system_instruction: systemInstruction,
        input: question,
        ...(previousInteractionId
          ? { previous_interaction_id: previousInteractionId }
          : {}),
        stream: true,
      });

      let accumulatedText = '';
      let interactionId: string | undefined;

      for await (const event of stream) {
        if (event.event_type === 'step.delta' && event.delta?.type === 'text') {
          const deltaText = event.delta.text ?? '';
          if (deltaText) {
            accumulatedText += deltaText;
            onChunk?.(accumulatedText);
          }
        } else if (event.event_type === 'interaction.completed') {
          interactionId = event.interaction?.id;
        }
      }

      return {
        text: accumulatedText.trim(),
        interactionId,
      };
    } catch (error) {
      throw classifyError(error);
    }
  }

  async generateMonthlyInsights(
    params: GenerateInsightsParams
  ): Promise<FinancialInsight[]> {
    const { context, language } = params;
    const langLabel = getLanguageLabel(language);

    try {
      const ai = this.getClient();

      const prompt = [
        `Analyze the user's financial snapshot for ${context.selectedMonth} and return 3 to 4 concise, high-value personal finance insights in ${langLabel}.`,
        `Prioritize:`,
        `1. Concrete savings opportunities (categories that increased vs. previous month or take a high share of expenses).`,
        `2. Warnings (high credit card limit usage, negative projected balance, high fixed cost ratio, or pending bills).`,
        `3. Positive reinforcement (healthy savings rate, investment growth, or reduced spending).`,
        `Keep each title under 60 characters and each description under 180 characters. Always cite exact numbers in ${context.currency}.`,
        ``,
        `SNAPSHOT:`,
        JSON.stringify(context),
      ].join('\n');

      const interaction = await ai.interactions.create({
        model: CHAT_AND_INSIGHTS_MODEL,
        input: prompt,
        store: false,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: {
            type: 'object',
            properties: {
              insights: {
                type: 'array',
                minItems: 1,
                maxItems: 4,
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    type: {
                      type: 'string',
                      enum: ['saving', 'warning', 'positive', 'tip'],
                    },
                    impact: { type: 'string' },
                  },
                  required: ['title', 'description', 'type'],
                },
              },
            },
            required: ['insights'],
          },
        },
      });

      const rawText = interaction.output_text ?? '';
      const parsed = parseJsonSafely<{
        insights?: Array<{
          title?: string;
          description?: string;
          type?: string;
          impact?: string;
        }>;
      }>(rawText);

      if (!parsed?.insights || !Array.isArray(parsed.insights)) {
        throw new AIServiceError('PROVIDER_ERROR', 'Invalid insights JSON response');
      }

      const allowedTypes = new Set<InsightType>(['saving', 'warning', 'positive', 'tip']);

      return parsed.insights
        .filter((item) => item.title && item.description)
        .slice(0, 4)
        .map((item, idx) => ({
          id: `insight-${idx}-${Date.now()}`,
          title: String(item.title).trim(),
          description: String(item.description).trim(),
          type: allowedTypes.has(item.type as InsightType)
            ? (item.type as InsightType)
            : 'tip',
          impact: item.impact ? String(item.impact).trim() : undefined,
        }));
    } catch (error) {
      throw classifyError(error);
    }
  }

  async suggestCategory(params: SuggestCategoryParams): Promise<string | null> {
    const { description, type, categories } = params;
    if (!description.trim() || categories.length === 0) return null;

    try {
      const ai = this.getClient();

      const prompt = [
        `Classify the following ${type} transaction description into the single best matching category ID from the provided list.`,
        `If none of the categories reasonably fit, return null.`,
        ``,
        `Description: "${description.trim()}"`,
        `Available categories: ${JSON.stringify(categories)}`,
      ].join('\n');

      const interaction = await ai.interactions.create({
        model: CATEGORIZATION_MODEL,
        input: prompt,
        store: false,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: {
            type: 'object',
            properties: {
              categoryId: { type: ['string', 'null'] },
            },
            required: ['categoryId'],
          },
        },
      });

      const parsed = parseJsonSafely<{ categoryId?: string | null }>(
        interaction.output_text ?? ''
      );
      if (!parsed?.categoryId) return null;

      const validIds = new Set(categories.map((c) => c.id));
      return validIds.has(parsed.categoryId) ? parsed.categoryId : null;
    } catch {
      // Auto-categorization is a non-blocking UX enhancement; fail silently
      return null;
    }
  }
}
