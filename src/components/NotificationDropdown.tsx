import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { notificationsApi } from '../services/api.ts';
import { notificationService } from '../services/notificationService.ts';
import { NotificationItem } from '../types.ts';
import { Bell, CheckCheck, Clock, ShieldCheck, UserPlus, Calendar, HeartHandshake } from 'lucide-react';

export const NotificationDropdown: React.FC = () => {
  const { user, unreadCount, refreshNotifications } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let items: NotificationItem[] = [];
      try {
        const res = await notificationsApi.list();
        if (res && res.notifications && res.notifications.length > 0) {
          items = res.notifications;
        }
      } catch {
        // backend unavailable, fallback to notificationService
      }
      if (items.length === 0) {
        items = await notificationService.getNotifications(user.id);
      }
      setNotifications(items);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      try { await notificationsApi.markRead(id); } catch {}
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, is_read: true } : n))
      );
      await refreshNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user?.id);
      try { await notificationsApi.markAllRead(); } catch {}
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
      await refreshNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
        return <UserPlus className="w-4 h-4 text-[#8458B3]" />;
      case 'MENTORSHIP_REQUEST':
      case 'MENTORSHIP_ACCEPTED':
      case 'MENTORSHIP_REJECTED':
        return <HeartHandshake className="w-4 h-4 text-[#8458B3]" />;
      case 'EVENT_REGISTRATION':
        return <Calendar className="w-4 h-4 text-[#255b7c]" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#8458B3]" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        onClick={handleToggle}
        className="relative p-2 rounded-full text-[#494D5F] hover:text-[#8458B3] hover:bg-[#E5EAF5] transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            id="notification-badge"
            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8458B3] text-[10px] font-bold text-white shadow-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-popover"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E5EAF5] py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-4 py-2.5 border-b border-[#E5EAF5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#494D5F] text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-[#E5EAF5] text-[#8458B3] border border-[#D0BDF4] px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-[#8458B3] hover:text-[#494D5F] flex items-center gap-1 transition-colors font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#E5EAF5]">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#494D5F]/60">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#494D5F]/60">
                No notifications yet. You're all caught up!
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  id={`notif-${item.id}`}
                  className={`p-3.5 hover:bg-[#E5EAF5]/50 transition-colors flex items-start gap-3 ${
                    !item.isRead ? 'bg-[#E5EAF5]/30' : ''
                  }`}
                >
                  <div className="p-2 bg-[#E5EAF5] rounded-xl flex-shrink-0 mt-0.5 border border-[#D0BDF4]/40">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-[#494D5F] truncate">{item.title}</p>
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          className="text-[11px] font-bold text-[#8458B3] hover:underline flex-shrink-0"
                          title="Mark as read"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#494D5F]/80 mt-0.5 leading-relaxed break-words">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-[#494D5F]/50 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
