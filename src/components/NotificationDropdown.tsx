import { CheckCircle2, AlertTriangle, Info, Check } from 'lucide-react';
import type { AppNotification } from '../types';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  onNotificationClick?: (ids: string[]) => void;
}

export function NotificationDropdown({ notifications, onMarkAsRead, onMarkAllAsRead, onClose, onNotificationClick }: NotificationDropdownProps) {
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

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden origin-top-right transition-all">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-gray-900">Notificações</h3>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={onMarkAllAsRead}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Marcar todas lidas
          </button>
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Tudo certo por aqui!</p>
            <p className="text-xs text-gray-400">Você não tem novas notificações.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-blue-50/30 cursor-pointer' : 'opacity-70'}`}
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
                  <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
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
