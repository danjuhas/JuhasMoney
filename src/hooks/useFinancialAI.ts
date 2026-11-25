import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildFinancialContextSnapshot,
  computeContextFingerprint,
  type BuildFinancialContextInput,
} from '../utils/aiContextBuilder';
import {
  AIServiceError,
  getFinancialAIProvider,
  type AIChatMessage,
  type AIErrorCode,
  type FinancialInsight,
} from '../services/ai';

const INSIGHTS_CACHE_PREFIX = 'juhas_ai_insights_v1_';

function readCachedInsights(cacheKey: string): FinancialInsight[] | null {
  try {
    const raw = sessionStorage.getItem(INSIGHTS_CACHE_PREFIX + cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FinancialInsight[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedInsights(cacheKey: string, insights: FinancialInsight[]): void {
  try {
    sessionStorage.setItem(INSIGHTS_CACHE_PREFIX + cacheKey, JSON.stringify(insights));
  } catch {
    // Ignore storage quota errors
  }
}

export function useFinancialAI(contextInput: BuildFinancialContextInput) {
  const { i18n } = useTranslation();
  const provider = useMemo(() => getFinancialAIProvider(), []);
  const isConfigured = provider.isConfigured();
  const language = i18n.language || 'pt';

  const {
    selectedMonth,
    currency,
    allExpenses,
    monthExpenses,
    categories,
    cards,
    investments,
    investmentTransactions,
    totals,
  } = contextInput;
  const {
    totalIncomes,
    totalExpenses,
    totalPending,
    totalInvestedMonth,
    currentBalance,
    projectedBalance,
  } = totals;

  const snapshot = useMemo(
    () =>
      buildFinancialContextSnapshot({
        selectedMonth,
        currency,
        allExpenses,
        monthExpenses,
        categories,
        cards,
        investments,
        investmentTransactions,
        totals: {
          totalIncomes,
          totalExpenses,
          totalPending,
          totalInvestedMonth,
          currentBalance,
          projectedBalance,
        },
      }),
    [
      selectedMonth,
      currency,
      allExpenses,
      monthExpenses,
      categories,
      cards,
      investments,
      investmentTransactions,
      totalIncomes,
      totalExpenses,
      totalPending,
      totalInvestedMonth,
      currentBalance,
      projectedBalance,
    ]
  );

  const fingerprint = useMemo(() => computeContextFingerprint(snapshot), [snapshot]);
  const cacheKey = `${fingerprint}__${language}`;

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<AIErrorCode | null>(null);
  const previousInteractionIdRef = useRef<string | undefined>(undefined);

  const [insightsByKey, setInsightsByKey] = useState<
    Record<string, FinancialInsight[]>
  >({});
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsErrorState, setInsightsErrorState] = useState<{
    key: string;
    code: AIErrorCode | null;
  }>({ key: '', code: null });

  const insights = useMemo(() => {
    if (insightsByKey[cacheKey]) return insightsByKey[cacheKey];
    return readCachedInsights(cacheKey) ?? [];
  }, [cacheKey, insightsByKey]);

  const insightsError =
    insightsErrorState.key === cacheKey ? insightsErrorState.code : null;

  // Reset stateful interaction chain when selectedMonth changes so the model receives fresh context
  useEffect(() => {
    previousInteractionIdRef.current = undefined;
  }, [selectedMonth]);

  const sendMessage = useCallback(
    async (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (!question || isChatLoading) return;

      setChatError(null);

      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `assistant-${Date.now() + 1}`;
      const nowIso = new Date().toISOString();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content: question, createdAt: nowIso },
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          createdAt: nowIso,
          isStreaming: true,
        },
      ]);

      setIsChatLoading(true);

      try {
        const result = await provider.askAssistant({
          question,
          context: snapshot,
          previousInteractionId: previousInteractionIdRef.current,
          language,
          onChunk: (accumulatedText) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
              )
            );
          },
        });

        if (result.interactionId) {
          previousInteractionIdRef.current = result.interactionId;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: result.text, isStreaming: false }
              : m
          )
        );
      } catch (err) {
        const code: AIErrorCode =
          err instanceof AIServiceError ? err.code : 'PROVIDER_ERROR';
        setChatError(code);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      } finally {
        setIsChatLoading(false);
      }
    },
    [isChatLoading, language, provider, snapshot]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setChatError(null);
    previousInteractionIdRef.current = undefined;
  }, []);

  const generateInsights = useCallback(
    async (forceRefresh = false) => {
      if (isInsightsLoading) return;

      if (!forceRefresh) {
        const cached = readCachedInsights(cacheKey);
        if (cached && cached.length > 0) {
          setInsightsByKey((prev) => ({ ...prev, [cacheKey]: cached }));
          setInsightsErrorState({ key: cacheKey, code: null });
          return;
        }
      }

      setIsInsightsLoading(true);
      setInsightsErrorState({ key: cacheKey, code: null });

      try {
        const result = await provider.generateMonthlyInsights({
          context: snapshot,
          language,
        });
        setInsightsByKey((prev) => ({ ...prev, [cacheKey]: result }));
        writeCachedInsights(cacheKey, result);
      } catch (err) {
        const code: AIErrorCode =
          err instanceof AIServiceError ? err.code : 'PROVIDER_ERROR';
        setInsightsErrorState({ key: cacheKey, code });
      } finally {
        setIsInsightsLoading(false);
      }
    },
    [cacheKey, isInsightsLoading, language, provider, snapshot]
  );

  return {
    isConfigured,
    snapshot,
    messages,
    isChatLoading,
    chatError,
    sendMessage,
    clearChat,
    insights,
    isInsightsLoading,
    insightsError,
    generateInsights,
  };
}
