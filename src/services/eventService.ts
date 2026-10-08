import { EventItem, EventType } from '../types.ts';
import { db } from '../lib/firebase.ts';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_EVENTS_KEY = 'alumnexa_events_v2';

function getStoredEvents(): EventItem[] {
  try {
    const data = localStorage.getItem(STORAGE_EVENTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Exclude any legacy mock items
        return parsed.filter((e: any) =>
          e &&
          !e.title?.includes('Distributed Systems') &&
          !e.title?.includes('Annual Grand Alumni') &&
          !e.title?.includes('Navigating Careers in Generative AI')
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export interface EventFilterOptions {
  search?: string;
  type?: EventType | 'ALL';
  institution?: string;
  timeframe?: 'ALL' | 'UPCOMING' | 'PAST';
  format?: 'ALL' | 'ONLINE' | 'IN_PERSON';
}

export const eventService = {
  async getEvents(filter?: EventType | 'ALL' | EventFilterOptions): Promise<EventItem[]> {
    let list: EventItem[] = [];
    try {
      const snap = await getDocs(collection(db, 'events'));
      snap.forEach(d => {
        const item = { id: d.id, ...d.data() } as EventItem;
        // Purge mock events if any linger in firestore
        if (
          !item.title?.includes('Distributed Systems') &&
          !item.title?.includes('Annual Grand Alumni') &&
          !item.title?.includes('Navigating Careers in Generative AI')
        ) {
          list.push(item);
        }
      });
    } catch (e) {
      console.warn('Firestore getEvents error, using verified local events:', e);
      list = getStoredEvents();
    }

    if (!filter) return list;

    if (typeof filter === 'string') {
      if (filter === 'ALL') return list;
      return list.filter(e => e.eventType === filter);
    }

    if (filter.type && filter.type !== 'ALL') {
      list = list.filter(e => e.eventType === filter.type);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.date && e.date.toLowerCase().includes(q)) ||
        (e.eventType && e.eventType.toLowerCase().includes(q)) ||
        (e.organizer && e.organizer.toLowerCase().includes(q)) ||
        (e.speakers && e.speakers.some(s => s.name?.toLowerCase().includes(q)))
      );
    }

    if (filter.institution && filter.institution !== 'ALL') {
      list = list.filter(e => e.institution.toLowerCase().includes(filter.institution!.toLowerCase()));
    }

    if (filter.format && filter.format !== 'ALL') {
      if (filter.format === 'ONLINE') list = list.filter(e => e.isOnline);
      if (filter.format === 'IN_PERSON') list = list.filter(e => !e.isOnline);
    }

    if (filter.timeframe && filter.timeframe !== 'ALL') {
      const today = new Date().toISOString().split('T')[0];
      if (filter.timeframe === 'UPCOMING') {
        list = list.filter(e => e.date >= '2026-01-01');
      } else if (filter.timeframe === 'PAST') {
        list = list.filter(e => e.date < '2026-01-01');
      }
    }

    return list;
  },

  async getEventById(id: string): Promise<EventItem | null> {
    const list = await this.getEvents();
    return list.find(e => e.id === id) || null;
  },

  async registerForEvent(id: string): Promise<EventItem> {
    const list = getStoredEvents();
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Event not found');
    const isReg = !list[idx].isRegistered;
    list[idx].isRegistered = isReg;
    list[idx].attendeesCount += isReg ? 1 : -1;
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(list));
    return list[idx];
  },

  async toggleRegister(id: string, _userId?: string): Promise<EventItem> {
    return this.registerForEvent(id);
  },

  async createEvent(payload: Omit<EventItem, 'id' | 'attendeesCount' | 'isRegistered'>): Promise<EventItem> {
    const newEvent: EventItem = {
      ...payload,
      id: `evt-${Date.now()}`,
      attendeesCount: 1,
      isRegistered: true,
      createdAt: payload.createdAt || new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'events', newEvent.id), newEvent);
    } catch (e) {
      console.warn('Firestore setDoc event error:', e);
    }
    const list = getStoredEvents();
    list.unshift(newEvent);
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(list));
    return newEvent;
  },

  async deleteEvent(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      console.warn('Firestore deleteDoc event error:', e);
    }
    const list = getStoredEvents().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(list));
  }
};
