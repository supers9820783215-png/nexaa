import { User } from '../types.ts';
import { getAllUsers } from './authService.ts';
import { db } from '../lib/firebase.ts';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  partner: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const STORAGE_KEY = 'alumnexa_chat_messages_v1';

function getStoredMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function getAllMessagesAcrossSources(): Promise<ChatMessage[]> {
  const localMsgs = getStoredMessages();
  const firestoreMsgs: ChatMessage[] = [];

  try {
    const snap = await getDocs(collection(db, 'messages'));
    snap.forEach(d => {
      const data = d.data() as ChatMessage;
      firestoreMsgs.push({ ...data, id: data.id || d.id });
    });
  } catch (err) {
    console.warn('[MessageService] Firestore messages fetch failed, using local:', err);
  }

  // Merge by message ID
  const map = new Map<string, ChatMessage>();
  localMsgs.forEach(m => map.set(m.id, m));
  firestoreMsgs.forEach(m => map.set(m.id, m));
  return Array.from(map.values());
}

export const messageService = {
  getConversations: async (currentUserId?: string): Promise<ChatConversation[]> => {
    if (!currentUserId) return [];
    const target = currentUserId.trim().toLowerCase();
    const messages = await getAllMessagesAcrossSources();
    const users = getAllUsers();

    // Identify unique partner IDs in conversation with currentUserId
    const partnerIds = Array.from(
      new Set(
        messages
          .filter(m => (m.senderId || '').trim().toLowerCase() === target || (m.receiverId || '').trim().toLowerCase() === target)
          .map(m => ((m.senderId || '').trim().toLowerCase() === target ? m.receiverId : m.senderId))
      )
    );

    const conversations: ChatConversation[] = [];
    for (const partnerId of partnerIds) {
      const pTarget = (partnerId || '').trim().toLowerCase();
      const partner = users.find(u =>
        u.id.toLowerCase() === pTarget ||
        u.uid.toLowerCase() === pTarget
      );
      if (!partner) continue;

      const thread = messages.filter(
        m =>
          ((m.senderId || '').trim().toLowerCase() === pTarget && (m.receiverId || '').trim().toLowerCase() === target) ||
          ((m.senderId || '').trim().toLowerCase() === target && (m.receiverId || '').trim().toLowerCase() === pTarget)
      );
      const lastMsg = thread[thread.length - 1];
      const unreadCount = thread.filter(m => (m.senderId || '').trim().toLowerCase() === pTarget && !m.isRead).length;

      conversations.push({
        partner,
        lastMessage: lastMsg ? lastMsg.text : 'Start a conversation...',
        lastMessageTime: lastMsg ? lastMsg.timestamp : 'Just now',
        unreadCount
      });
    }

    return conversations;
  },

  getMessages: async (currentUserId: string, partnerId: string): Promise<ChatMessage[]> => {
    if (!currentUserId || !partnerId) return [];
    const cTarget = currentUserId.trim().toLowerCase();
    const pTarget = partnerId.trim().toLowerCase();
    const messages = await getAllMessagesAcrossSources();

    return messages.filter(
      m =>
        ((m.senderId || '').trim().toLowerCase() === cTarget && (m.receiverId || '').trim().toLowerCase() === pTarget) ||
        ((m.senderId || '').trim().toLowerCase() === pTarget && (m.receiverId || '').trim().toLowerCase() === cTarget)
    );
  },

  sendMessage: async (senderId: string, receiverId: string, text: string): Promise<ChatMessage> => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      receiverId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    // Save to Firestore for cross-session/cross-device delivery
    try {
      await setDoc(doc(db, 'messages', newMsg.id), newMsg);
      console.log('[MessageService] Stored message in Firestore collection messages:', newMsg.id);
    } catch (err) {
      console.error('[MessageService] Firestore setDoc error (saved to local):', err);
    }

    // Persist locally
    const messages = getStoredMessages();
    messages.push(newMsg);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    return newMsg;
  }
};
