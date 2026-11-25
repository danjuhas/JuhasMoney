import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category, Expense } from '../types';
import { matchCategoryLocally } from '../utils/localCategoryMatcher';
import { getFinancialAIProvider } from '../services/ai';

interface UseSmartCategorySuggestionParams {
  enabled: boolean;
  description: string;
  type: 'income' | 'expense';
  categories: Category[];
  pastExpenses: Expense[];
  currentCategoryId: string;
  hasManualSelection: boolean;
  onSuggest: (categoryId: string) => void;
}

/**
 * Hybrid smart category suggestion hook:
 * 1. Instant local match using user's history & bilingual keywords (0ms, 0 tokens).
 * 2. Debounced AI fallback via lightweight Gemini model only when no local match exists.
 */
export function useSmartCategorySuggestion({
  enabled,
  description,
  type,
  categories,
  pastExpenses,
  currentCategoryId,
  hasManualSelection,
  onSuggest,
}: UseSmartCategorySuggestionParams) {
  const [aiSuggestedForKey, setAiSuggestedForKey] = useState<string | null>(null);
  const [isSuggestingAI, setIsSuggestingAI] = useState(false);
  const lastQueriedRef = useRef<string>('');
  const onSuggestRef = useRef(onSuggest);

  useEffect(() => {
    onSuggestRef.current = onSuggest;
  }, [onSuggest]);

  const trimmed = description.trim();
  const queryKey = `${type}:${trimmed.toLowerCase()}`;

  // Layer 1: Instant local matching (derived during render, 0ms, 0 tokens)
  const localMatch = useMemo(() => {
    if (!enabled || hasManualSelection || trimmed.length < 2) return null;
    return matchCategoryLocally(trimmed, type, categories, pastExpenses);
  }, [enabled, hasManualSelection, trimmed, type, categories, pastExpenses]);

  // Apply local match or fall back to debounced AI suggestion
  useEffect(() => {
    if (!enabled || hasManualSelection || trimmed.length < 2) {
      return;
    }

    if (localMatch) {
      if (localMatch.categoryId !== currentCategoryId) {
        onSuggestRef.current(localMatch.categoryId);
      }
      return;
    }

    // Layer 2: Debounced AI fallback for unrecognized descriptions
    const provider = getFinancialAIProvider();
    if (!provider.isConfigured() || trimmed.length < 3) {
      return;
    }

    const validCategories = categories
      .filter((c) => c.type === type)
      .map((c) => ({ id: c.id, name: c.name }));
    if (validCategories.length === 0) return;

    if (lastQueriedRef.current === queryKey) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      lastQueriedRef.current = queryKey;
      setIsSuggestingAI(true);

      const aiCategoryId = await provider.suggestCategory({
        description: trimmed,
        type,
        categories: validCategories,
      });

      if (!cancelled) {
        setIsSuggestingAI(false);
        if (aiCategoryId) {
          onSuggestRef.current(aiCategoryId);
          setAiSuggestedForKey(queryKey);
        }
      }
    }, 750);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setIsSuggestingAI(false);
    };
  }, [
    enabled,
    hasManualSelection,
    trimmed,
    queryKey,
    localMatch,
    currentCategoryId,
    type,
    categories,
  ]);

  const suggestedSource: 'local' | 'ai' | null =
    !enabled || hasManualSelection || !currentCategoryId
      ? null
      : localMatch
        ? 'local'
        : aiSuggestedForKey === queryKey
          ? 'ai'
          : null;

  return {
    suggestedSource,
    isSuggestingAI: enabled && !hasManualSelection && isSuggestingAI,
  };
}
