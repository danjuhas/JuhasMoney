import {
  Sparkles,
  RefreshCw,
  PiggyBank,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  KeyRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { AIErrorCode, FinancialInsight, InsightType } from '../services/ai';

interface AIInsightsCardProps {
  isConfigured: boolean;
  hasTransactions: boolean;
  insights: FinancialInsight[];
  isLoading: boolean;
  error: AIErrorCode | null;
  onGenerate: (forceRefresh?: boolean) => void;
  onOpenAssistant?: () => void;
}

function getInsightStyle(type: InsightType) {
  switch (type) {
    case 'saving':
      return {
        icon: PiggyBank,
        border: 'border-emerald-500/25',
        bg: 'bg-emerald-500/5',
        iconBg: 'bg-emerald-500/15 text-emerald-400',
        badgeVariant: 'emerald' as const,
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        border: 'border-rose-500/25',
        bg: 'bg-rose-500/5',
        iconBg: 'bg-rose-500/15 text-rose-400',
        badgeVariant: 'rose' as const,
      };
    case 'positive':
      return {
        icon: TrendingUp,
        border: 'border-sky-500/25',
        bg: 'bg-sky-500/5',
        iconBg: 'bg-sky-500/15 text-sky-400',
        badgeVariant: 'emerald' as const,
      };
    case 'tip':
    default:
      return {
        icon: Lightbulb,
        border: 'border-amber-500/25',
        bg: 'bg-amber-500/5',
        iconBg: 'bg-amber-500/15 text-amber-400',
        badgeVariant: 'amber' as const,
      };
  }
}

export function AIInsightsCard({
  isConfigured,
  hasTransactions,
  insights,
  isLoading,
  error,
  onGenerate,
  onOpenAssistant,
}: AIInsightsCardProps) {
  const { t } = useTranslation();

  const getErrorMessage = (code: AIErrorCode) => {
    switch (code) {
      case 'MISSING_API_KEY':
        return t('ai.error_missing_key');
      case 'RATE_LIMITED':
        return t('ai.error_rate_limited');
      case 'OFFLINE':
        return t('ai.error_offline');
      default:
        return t('ai.error_generic');
    }
  };

  return (
    <Card
      padding="md"
      className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-950/30"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {t('ai.insights_title')}
              </h3>
              <Badge variant="emerald">AI</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('ai.insights_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {insights.length > 0 && isConfigured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGenerate(true)}
              disabled={isLoading}
              title={t('ai.refresh_insights')}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('ai.refresh_insights')}</span>
            </Button>
          )}
          {onOpenAssistant && (
            <Button variant="secondary" size="sm" onClick={onOpenAssistant}>
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>{t('ai.ask_assistant')}</span>
            </Button>
          )}
        </div>
      </div>

      {!isConfigured ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-700/80 text-sm text-slate-300">
          <KeyRound className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-slate-100 mb-1">{t('ai.setup_required_title')}</p>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {t('ai.setup_required_desc')}
            </p>
          </div>
        </div>
      ) : !hasTransactions ? (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 text-center text-sm text-slate-400">
          {t('ai.empty_month_desc')}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 animate-pulse space-y-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-700" />
                <div className="h-4 bg-slate-700 rounded w-2/3" />
              </div>
              <div className="h-3 bg-slate-700/70 rounded w-full" />
              <div className="h-3 bg-slate-700/70 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <p className="text-sm text-rose-300">{getErrorMessage(error)}</p>
          <Button variant="secondary" size="sm" onClick={() => onGenerate(true)}>
            {t('ai.try_again')}
          </Button>
        </div>
      ) : insights.length === 0 ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/60">
          <p className="text-sm text-slate-300">{t('ai.insights_cta_desc')}</p>
          <Button variant="primary" size="sm" onClick={() => onGenerate(false)} className="shrink-0">
            <Sparkles className="w-4 h-4" />
            <span>{t('ai.generate_insights')}</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight) => {
            const style = getInsightStyle(insight.type);
            const Icon = style.icon;
            return (
              <div
                key={insight.id}
                className={`p-4 rounded-xl border ${style.border} ${style.bg} transition-colors flex flex-col justify-between gap-2`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${style.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                        {insight.title}
                      </h4>
                      {insight.impact && (
                        <Badge variant={style.badgeVariant}>{insight.impact}</Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
