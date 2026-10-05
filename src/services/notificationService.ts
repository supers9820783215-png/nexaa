import { NotificationItem, NotificationCategory } from '../types.ts';
import { mockNotifications } from '../data/notifications.ts';

export type { NotificationItem, NotificationCategory };

const STORAGE_NOTIFS_KEY = 'alumnexa_notifications_v2';

function getStoredNotifications(): NotificationItem[] {
  try {
    const data = localStorage.getItem(STORAGE_NOTIFS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('[NotificationService] Failed to read stored notifications', e);
  }
  return [...mockNotifications];
}

export const notificationService = {
  async getNotifications(userId?: string, category?: NotificationCategory | 'ALL'): Promise<NotificationItem[]> {
    await new Promise(r => setTimeout(r, 40));
    let list = getStoredNotifications();
    if (userId) {
      list = list.filter(n => !n.userId || n.userId === userId);
    }
    if (category && category !== 'ALL') {
      list = list.filter(n => n.type === category);
    }
    return list;
  },

  async markAsRead(id: string): Promise<void> {
    const list = getStoredNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].isRead = true;
      localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(list));
    }
  },

  async markAllAsRead(_userId?: string): Promise<void> {
    const list = getStoredNotifications().map(n => ({ ...n, isRead: true }));
    localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(list));
  },

  async getUnreadCount(userId?: string): Promise<number> {
    let list = getStoredNotifications();
    if (userId) {
      list = list.filter(n => !n.userId || n.userId === userId);
    }
    return list.filter(n => !n.isRead).length;
  }
};
