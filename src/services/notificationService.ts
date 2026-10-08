import { NotificationItem, NotificationCategory } from '../types.ts';
import { mockNotifications } from '../data/notifications.ts';
import { db } from '../lib/firebase.ts';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

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

async function getAllNotificationsAcrossSources(): Promise<NotificationItem[]> {
  const localList = getStoredNotifications();
  const firestoreList: NotificationItem[] = [];

  try {
    const snap = await getDocs(collection(db, 'notifications'));
    snap.forEach(d => {
      const data = d.data() as NotificationItem;
      firestoreList.push({ ...data, id: data.id || d.id });
    });
  } catch (err) {
    // Firestore might fail in offline/mock mode; fallback safely to local
  }

  const map = new Map<string, NotificationItem>();
  localList.forEach(n => map.set(n.id, n));
  firestoreList.forEach(n => map.set(n.id, n));

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
  );
}

export const notificationService = {
  async getNotifications(userId?: string, category?: NotificationCategory | 'ALL'): Promise<NotificationItem[]> {
    const list = await getAllNotificationsAcrossSources();
    let filtered = list;
    if (userId) {
      const uTarget = userId.trim().toLowerCase();
      filtered = filtered.filter(n => !n.userId || n.userId.toLowerCase() === uTarget);
    }
    if (category && category !== 'ALL') {
      filtered = filtered.filter(n => n.type === category);
    }
    return filtered;
  },

  async createNotification(item: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationCategory;
    linkUrl?: string;
    actionLabel?: string;
  }): Promise<NotificationItem> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newNotif: NotificationItem = {
      id,
      userId: item.userId,
      title: item.title,
      message: item.message,
      type: item.type || 'MENTORSHIP',
      isRead: false,
      is_read: false,
      createdAt: now,
      created_at: now,
      timestamp: 'Just now',
      linkUrl: item.linkUrl || 'mentorship',
      actionLabel: item.actionLabel || 'View Mentorship'
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
    } catch (e) {
      console.warn('[NotificationService] Firestore notification save failed:', e);
    }

    // Save to local storage
    const list = getStoredNotifications();
    list.unshift(newNotif);
    localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(list));

    // Dispatch real-time custom event across views and navbars
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alumnexa_notification_added', { detail: newNotif }));
    }

    return newNotif;
  },

  async markAsRead(id: string): Promise<void> {
    const list = getStoredNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].isRead = true;
      list[idx].is_read = true;
      localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(list));
    }
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true, is_read: true });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alumnexa_notification_added'));
    }
  },

  async markAllAsRead(userId?: string): Promise<void> {
    const list = getStoredNotifications().map(n => {
      if (!userId || n.userId === userId) {
        return { ...n, isRead: true, is_read: true };
      }
      return n;
    });
    localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alumnexa_notification_added'));
    }
  },

  async getUnreadCount(userId?: string): Promise<number> {
    const list = await getAllNotificationsAcrossSources();
    let filtered = list;
    if (userId) {
      const uTarget = userId.trim().toLowerCase();
      filtered = filtered.filter(n => !n.userId || n.userId.toLowerCase() === uTarget);
    }
    return filtered.filter(n => !n.isRead && !n.is_read).length;
  }
};
