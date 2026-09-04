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
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('modal.delete_title')}</h3>
        <p className="text-gray-600 text-sm mb-6">
          {t('modal.delete_desc')}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t('modal.cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            {t('modal.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

