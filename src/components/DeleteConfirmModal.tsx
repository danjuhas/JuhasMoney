import { useTranslation } from 'react-i18next';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/40 p-6 w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-slate-100 mb-2">{t('modal.delete_title')}</h3>
        <p className="text-slate-400 text-sm mb-6">
          {t('modal.delete_desc')}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            {t('modal.cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-lg shadow-rose-500/25 transition-colors"
          >
            {t('modal.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

