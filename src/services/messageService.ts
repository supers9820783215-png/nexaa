import { User } from '../types.ts';
import { getAllUsers } from './authService.ts';

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

export const messageService = {
  getConversations: async (currentUserId?: string): Promise<ChatConversation[]> => {
    if (!currentUserId) return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];
    const users = getAllUsers();

    // Identify unique partner IDs in conversation with currentUserId
    const partnerIds = Array.from(
      new Set(
        messages
          .filter(m => m.senderId === currentUserId || m.receiverId === currentUserId)
          .map(m => (m.senderId === currentUserId ? m.receiverId : m.senderId))
      )
    );

    const conversations: ChatConversation[] = [];
    for (const partnerId of partnerIds) {
      const partner = users.find(u => u.id === partnerId);
      if (!partner) continue;

      const thread = messages.filter(
        m =>
          (m.senderId === partnerId && m.receiverId === currentUserId) ||
          (m.senderId === currentUserId && m.receiverId === partnerId)
      );
      const lastMsg = thread[thread.length - 1];
      const unreadCount = thread.filter(m => m.senderId === partnerId && !m.isRead).length;

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
    const raw = localStorage.getItem(STORAGE_KEY);
    const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];

    return messages.filter(
      m => (m.senderId === currentUserId && m.receiverId === partnerId) || (m.senderId === partnerId && m.receiverId === currentUserId)
    );
  },

  sendMessage: async (senderId: string, receiverId: string, text: string): Promise<ChatMessage> => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId,
      receiverId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    messages.push(newMsg);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    return newMsg;
  }
};
