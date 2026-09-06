import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationBellProps {
  userId: string | null;
  onNotificationClick?: (ids: string[]) => void;
}

export function NotificationBell({ userId, onNotificationClick }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!userId) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-900 transition-colors relative focus:outline-none"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown 
          notifications={notifications} 
          onMarkAsRead={markAsRead} 
          onMarkAllAsRead={markAllAsRead} 
          onClose={() => setIsOpen(false)}
          onNotificationClick={onNotificationClick}
        />
      )}
    </div>
  );
}
