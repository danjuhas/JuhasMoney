import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  isInstallment?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ isOpen, isInstallment, onClose, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" className="p-6" zIndex="z-[60]">
        <h3 className="text-lg font-semibold text-slate-100 mb-2">{t('modal.delete_title')}</h3>
        <p className="text-slate-400 text-sm mb-6">
          {isInstallment ? t('modal.delete_installment_desc') : t('modal.delete_desc')}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>{t('modal.cancel')}</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{t('modal.delete')}</Button>
        </div>
      </Modal>
  );
}

