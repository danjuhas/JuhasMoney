import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useCSVImport } from '../hooks/useCSVImport';
import type { Category, Expense } from '../types';
import { useToast } from '../contexts/ToastContext';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  categories: Category[];
  upsertExpenses: (items: Expense[]) => Promise<void>;
  onSuccess?: () => void;
};

export const CSVImportModal = ({ isOpen, onClose, userId, categories, upsertExpenses, onSuccess }: Props) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  
  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  const {
    processFile,
    executeImport,
    cancelImport,
    isImporting,
    importSummary,
    hasFile
  } = useCSVImport(userId, handleSuccess, (msg) => addToast(msg));

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    } else {
      addToast(t('import.error_csv'));
    }
  };

  const handleClose = () => {
    cancelImport();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl relative">
        <button
          onClick={handleClose}
          disabled={isImporting}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">{t('import.title')}</h2>

        {!hasFile ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:bg-emerald-500/5 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-200 font-medium mb-1">{t('import.drag_drop')}</p>
            <p className="text-sm text-slate-500">{t('import.format_help')}</p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        ) : isImporting ? (
          <div className="py-8 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-200 font-medium">{t('import.loading')}</p>
            <p className="text-sm text-slate-500 mt-2">{t('import.loading_desc')}</p>
          </div>
        ) : (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-6 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-emerald-400 font-medium">{t('import.ready_title')}</h3>
                <p className="text-sm text-slate-300 mt-1">
                  {t('import.ready_desc', { expenses: importSummary?.expenses, incomes: importSummary?.incomes, categories: importSummary?.newCategories })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-8 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/80">
                {t('import.warning')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelImport}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                {t('dashboard.cancel')}
              </button>
              <button
                onClick={() => executeImport(categories, upsertExpenses)}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                {t('import.confirm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
