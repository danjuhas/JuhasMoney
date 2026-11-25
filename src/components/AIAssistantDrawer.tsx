import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Loader2,
  KeyRound,
  AlertCircle,
  PiggyBank,
  BarChart3,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AIChatMessage, AIErrorCode } from '../services/ai';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
  selectedMonthLabel: string;
  messages: AIChatMessage[];
  isLoading: boolean;
  error: AIErrorCode | null;
  onSendMessage: (question: string) => void;
  onClearChat: () => void;
}

/**
 * Lightweight, XSS-safe text renderer supporting **bold** segments and line breaks.
 */
function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={lineIdx} className="block min-h-[1.25rem]">
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return (
              <strong key={partIdx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={partIdx}>{part}</React.Fragment>;
        })}
      </span>
    );
  });
}

export function AIAssistantDrawer({
  isOpen,
  onClose,
  isConfigured,
  selectedMonthLabel,
  messages,
  isLoading,
  error,
  onSendMessage,
  onClearChat,
}: AIAssistantDrawerProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      icon: PiggyBank,
      label: t('ai.prompt_save_label'),
      prompt: t('ai.prompt_save_text'),
    },
    {
      icon: BarChart3,
      label: t('ai.prompt_summary_label'),
      prompt: t('ai.prompt_summary_text'),
    },
    {
      icon: CreditCard,
      label: t('ai.prompt_cards_label'),
      prompt: t('ai.prompt_cards_text'),
    },
    {
      icon: ShoppingBag,
      label: t('ai.prompt_afford_label'),
      prompt: t('ai.prompt_afford_text'),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || !isConfigured) return;
    setInput('');
    onSendMessage(trimmed);
  };

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
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-stretch sm:justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('ai.assistant_title')}
    >
      <div
        className="w-full sm:max-w-md h-[88dvh] sm:h-[calc(100dvh-2rem)] sm:my-4 sm:mr-4 bg-slate-900/95 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {t('ai.assistant_title')}
              </h2>
              <p className="text-xs text-slate-400 truncate capitalize">
                {t('ai.context_month', { month: selectedMonthLabel })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearChat}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title={t('ai.clear_chat')}
                aria-label={t('ai.clear_chat')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={t('dashboard.cancel')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {!isConfigured ? (
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-medium text-sm">
                <KeyRound className="w-4 h-4" />
                <span>{t('ai.setup_required_title')}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t('ai.setup_required_desc')}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col h-full justify-between gap-6 py-2">
              <div className="text-center space-y-2 px-2 pt-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {t('ai.welcome_title')}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {t('ai.welcome_desc')}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 px-1">
                  {t('ai.quick_prompts_title')}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {quickPrompts.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSendMessage(item.prompt)}
                        className="flex items-center gap-3 w-full text-left px-3.5 py-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/40 text-slate-200 transition-all group"
                      >
                        <div className="p-1.5 rounded-lg bg-slate-700/80 group-hover:bg-emerald-500/15 text-emerald-400 shrink-0 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm leading-snug">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-br-md'
                          : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-md'
                      }`}
                    >
                      {msg.content ? (
                        <div className="space-y-1">{renderFormattedText(msg.content)}</div>
                      ) : msg.isStreaming ? (
                        <div className="flex items-center gap-2 text-slate-400 py-0.5">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          <span className="text-xs">{t('ai.thinking')}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{getErrorMessage(error)}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Footer */}
        <form
          onSubmit={handleSubmit}
          className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 shrink-0"
        >
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 focus-within:border-emerald-500/70 rounded-2xl px-3 py-1.5 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.input_placeholder')}
              disabled={!isConfigured || isLoading}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none py-1.5 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isConfigured || isLoading || !input.trim()}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-white transition-colors shrink-0"
              aria-label={t('ai.send')}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 text-center mt-2">
            {t('ai.disclaimer')}
          </p>
        </form>
      </div>
    </div>
  );
}
