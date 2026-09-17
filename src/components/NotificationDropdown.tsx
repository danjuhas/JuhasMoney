import { CheckCircle2, AlertTriangle, Info, Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AppNotification } from '../types';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  onClearAll: () => void;
  onNotificationClick?: (ids: string[]) => void;
}

export function NotificationDropdown({ notifications, onMarkAsRead, onMarkAllAsRead, onClose, onClearAll, onNotificationClick }: NotificationDropdownProps) {
  const { t } = useTranslation();

  const getIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'ERROR':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <div className="absolute -right-2 sm:right-0 mt-2 w-[calc(100vw-2rem)] max-w-[340px] sm:max-w-none sm:w-96 bg-slate-900 backdrop-blur-sm rounded-xl shadow-2xl shadow-black/40 border border-slate-700 z-50 overflow-hidden origin-top-right transition-all">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <h3 className="font-semibold text-slate-100">{t('notifications.title')}</h3>
        {notifications.length > 0 && (
          hasUnread ? (
            <button 
              onClick={onMarkAllAsRead}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              {t('notifications.mark_read')}
            </button>
          ) : (
            <button 
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-red-400 font-medium flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              {t('notifications.clear_history')}
            </button>
          )
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-700 mb-2" />
            <p className="text-sm">{t('notifications.all_good')}</p>
            <p className="text-xs text-slate-600">{t('notifications.no_new')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 hover:bg-slate-800/50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-slate-800/80 cursor-pointer' : 'opacity-70'}`}
                onClick={() => {
                  if (!notif.is_read) onMarkAsRead(notif.id);
                  if (onNotificationClick && notif.related_expense_ids) {
                    onNotificationClick(notif.related_expense_ids);
                  }
                  onClose();
                }}
              >
                <div className="shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-100' : 'font-medium text-slate-300'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="shrink-0 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
