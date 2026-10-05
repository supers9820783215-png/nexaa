import { User } from '../types.ts';

export interface ConnectionRecord {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  user: User;
}

const STORAGE_KEY = 'alumnexa_connections_v1';

const defaultConnections: ConnectionRecord[] = [];

export const networkService = {
  getConnections: async (currentUserId?: string): Promise<{
    connected: ConnectionRecord[];
    incoming: ConnectionRecord[];
    outgoing: ConnectionRecord[];
  }> => {
    try {
      if (!currentUserId) {
        return { connected: [], incoming: [], outgoing: [] };
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: ConnectionRecord[] = raw ? JSON.parse(raw) : defaultConnections;

      const connected = list.filter(c => c.status === 'ACCEPTED' && (c.senderId === currentUserId || c.receiverId === currentUserId));
      const incoming = list.filter(c => c.status === 'PENDING' && c.receiverId === currentUserId);
      const outgoing = list.filter(c => c.status === 'PENDING' && c.senderId === currentUserId);

      return { connected, incoming, outgoing };
    } catch {
      return { connected: [], incoming: [], outgoing: [] };
    }
  },

  sendConnectionRequest: async (senderId: string, receiver: User): Promise<ConnectionRecord> => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: ConnectionRecord[] = raw ? JSON.parse(raw) : defaultConnections;

    const newConn: ConnectionRecord = {
      id: `conn-${Date.now()}`,
      senderId,
      receiverId: receiver.id,
      status: 'PENDING',
      createdAt: 'Just now',
      user: receiver
    };

    list.unshift(newConn);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newConn;
  },

  respondToConnection: async (connectionId: string, action: 'ACCEPT' | 'REJECT'): Promise<void> => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: ConnectionRecord[] = raw ? JSON.parse(raw) : defaultConnections;

    list = list.map(c => {
      if (c.id === connectionId) {
        return { ...c, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' };
      }
      return c;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  removeConnection: async (connectionId: string): Promise<void> => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: ConnectionRecord[] = raw ? JSON.parse(raw) : defaultConnections;
    list = list.filter(c => c.id !== connectionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
};
