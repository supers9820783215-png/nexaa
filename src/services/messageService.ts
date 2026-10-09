import { User } from '../types.ts';
import { getAllUsers } from './authService.ts';
import { db } from '../lib/firebase.ts';
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  conversationId?: string;
}

export interface ChatConversation {
  id?: string;
  conversationId?: string;
  partner: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface FirestoreConversation {
  id: string;
  conversationId?: string;
  participants: string[];
  participantDetails?: Record<string, {
    name?: string;
    role?: string;
    avatar?: string;
    uid?: string;
  }>;
  lastMessage: string;
  lastMessageTime?: string;
  updatedAt?: any;
  createdAt?: any;
}

const STORAGE_MSGS_KEY = 'alumnexa_chat_messages_v1';
const STORAGE_CONVS_KEY = 'alumnexa_chat_conversations_v1';

function getStoredMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_MSGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function getStoredConversations(): FirestoreConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_CONVS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function saveStoredConversation(conv: FirestoreConversation) {
  try {
    const list = getStoredConversations();
    const idx = list.findIndex(c => c.id === conv.id);
    if (idx >= 0) {
      list[idx] = conv;
    } else {
      list.unshift(conv);
    }
    localStorage.setItem(STORAGE_CONVS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
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
    console.warn('[MessageService] Firestore messages fetch warning, using local:', err);
  }

  // Merge by message ID
  const map = new Map<string, ChatMessage>();
  localMsgs.forEach(m => map.set(m.id, m));
  firestoreMsgs.forEach(m => map.set(m.id, m));
  return Array.from(map.values());
}

async function getAllFirestoreConversations(): Promise<FirestoreConversation[]> {
  const localConvs = getStoredConversations();
  const firestoreConvs: FirestoreConversation[] = [];

  try {
    const snap = await getDocs(collection(db, 'conversations'));
    snap.forEach(d => {
      const data = d.data() as FirestoreConversation;
      firestoreConvs.push({ ...data, id: data.id || d.id, conversationId: data.conversationId || d.id });
    });
  } catch (err) {
    console.warn('[MessageService] Firestore conversations fetch warning, using local:', err);
  }

  const map = new Map<string, FirestoreConversation>();
  localConvs.forEach(c => map.set(c.id, c));
  firestoreConvs.forEach(c => map.set(c.id, c));
  return Array.from(map.values());
}

export const messageService = {
  /**
   * Initializes or retrieves an active conversation thread between current user and target mentor.
   * Writes participants, participantDetails, and timestamps to Firestore 'conversations'.
   */
  initializeConversation: async (
    currentUserId: string,
    targetMentorId: string,
    currentUserDetails?: { name?: string; role?: string; avatar?: string; uid?: string },
    mentorDetails?: { name?: string; role?: string; avatar?: string; uid?: string }
  ): Promise<string> => {
    if (!currentUserId || !targetMentorId) {
      throw new Error('Both currentUserId and targetMentorId are required to initialize a conversation.');
    }

    const cId = currentUserId.trim();
    const tId = targetMentorId.trim();
    const sortedKey = [cId, tId].sort().join('___');
    const deterministicConvId = `conv_${sortedKey}`;

    // 1. Check if conversation already exists in Firestore
    try {
      const existingDoc = await getDoc(doc(db, 'conversations', deterministicConvId));
      if (existingDoc.exists()) {
        const data = existingDoc.data();
        const convId = data.id || existingDoc.id;
        saveStoredConversation({ id: convId, conversationId: convId, ...data } as FirestoreConversation);
        return convId;
      }
    } catch (err) {
      console.warn('[MessageService] Error checking existing conversation in Firestore:', err);
    }

    // 2. Also check all conversations in case an alternative id format exists
    const allConvs = await getAllFirestoreConversations();
    const matched = allConvs.find(c =>
      c.participants &&
      c.participants.some(p => p.toLowerCase() === cId.toLowerCase()) &&
      c.participants.some(p => p.toLowerCase() === tId.toLowerCase())
    );

    if (matched) {
      return matched.id || matched.conversationId || deterministicConvId;
    }

    // 3. Immediately create a new conversation document in Firestore
    const newConv: FirestoreConversation = {
      id: deterministicConvId,
      conversationId: deterministicConvId,
      participants: [cId, tId],
      participantDetails: {
        [cId]: {
          name: currentUserDetails?.name || 'User',
          role: currentUserDetails?.role || 'STUDENT',
          avatar: currentUserDetails?.avatar || '',
          uid: currentUserDetails?.uid || cId
        },
        [tId]: {
          name: mentorDetails?.name || 'Mentor',
          role: mentorDetails?.role || 'ALUMNI',
          avatar: mentorDetails?.avatar || '',
          uid: mentorDetails?.uid || tId
        }
      },
      lastMessage: '',
      lastMessageTime: 'Just now'
    };

    try {
      await setDoc(doc(db, 'conversations', deterministicConvId), {
        ...newConv,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('[MessageService] Created conversation document in Firestore:', deterministicConvId);
    } catch (err) {
      console.warn('[MessageService] Firestore setDoc conversations error (saved locally):', err);
    }

    saveStoredConversation(newConv);
    return deterministicConvId;
  },

  getConversations: async (currentUserId?: string): Promise<ChatConversation[]> => {
    if (!currentUserId) return [];
    const target = currentUserId.trim().toLowerCase();
    const messages = await getAllMessagesAcrossSources();
    const firestoreConvs = await getAllFirestoreConversations();
    const users = getAllUsers();

    // Map of partnerId -> ChatConversation
    const convsMap = new Map<string, ChatConversation>();

    // 1. Process explicit conversation documents from Firestore 'conversations'
    for (const fConv of firestoreConvs) {
      if (!fConv.participants || !Array.isArray(fConv.participants)) continue;
      const isParticipant = fConv.participants.some(p => p.trim().toLowerCase() === target);
      if (!isParticipant) continue;

      const partnerId = fConv.participants.find(p => p.trim().toLowerCase() !== target) || '';
      if (!partnerId) continue;

      const pTarget = partnerId.trim().toLowerCase();
      let partner = users.find(u =>
        u.id.toLowerCase() === pTarget ||
        u.uid.toLowerCase() === pTarget
      );

      // If partner is not in local memory, fallback to participantDetails from Firestore doc
      if (!partner && fConv.participantDetails && fConv.participantDetails[partnerId]) {
        const pd = fConv.participantDetails[partnerId];
        partner = {
          id: partnerId,
          uid: pd.uid || partnerId,
          name: pd.name || 'Member',
          role: (pd.role as any) || 'ALUMNI',
          email: `${partnerId}@alumnexa.edu`,
          institutionName: 'Collegiate Network',
          institutionId: 'inst-dtss-01',
          isVerified: true,
          verificationStatus: 'VERIFIED',
          avatar: pd.avatar || '',
          createdAt: new Date().toISOString()
        };
      }

      if (!partner) continue;

      const thread = messages.filter(
        m =>
          ((m.senderId || '').trim().toLowerCase() === pTarget && (m.receiverId || '').trim().toLowerCase() === target) ||
          ((m.senderId || '').trim().toLowerCase() === target && (m.receiverId || '').trim().toLowerCase() === pTarget)
      );

      const lastMsg = thread[thread.length - 1];
      const unreadCount = thread.filter(m => (m.senderId || '').trim().toLowerCase() === pTarget && !m.isRead).length;

      convsMap.set(pTarget, {
        id: fConv.id,
        conversationId: fConv.id || fConv.conversationId,
        partner,
        lastMessage: lastMsg ? lastMsg.text : (fConv.lastMessage || 'Start a conversation...'),
        lastMessageTime: lastMsg ? lastMsg.timestamp : (fConv.lastMessageTime || 'Just now'),
        unreadCount
      });
    }

    // 2. Identify partner IDs from messages that may not have an explicit conversation doc yet
    const messagePartnerIds = Array.from(
      new Set(
        messages
          .filter(m => (m.senderId || '').trim().toLowerCase() === target || (m.receiverId || '').trim().toLowerCase() === target)
          .map(m => ((m.senderId || '').trim().toLowerCase() === target ? m.receiverId : m.senderId))
      )
    );

    for (const partnerId of messagePartnerIds) {
      const pTarget = (partnerId || '').trim().toLowerCase();
      if (convsMap.has(pTarget)) continue;

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

      convsMap.set(pTarget, {
        id: `conv_${[target, pTarget].sort().join('___')}`,
        conversationId: `conv_${[target, pTarget].sort().join('___')}`,
        partner,
        lastMessage: lastMsg ? lastMsg.text : 'Start a conversation...',
        lastMessageTime: lastMsg ? lastMsg.timestamp : 'Just now',
        unreadCount
      });
    }

    return Array.from(convsMap.values());
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

  sendMessage: async (senderId: string, receiverId: string, text: string, conversationId?: string): Promise<ChatMessage> => {
    const sId = senderId.trim();
    const rId = receiverId.trim();
    const convId = conversationId || `conv_${[sId, rId].sort().join('___')}`;
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: sId,
      receiverId: rId,
      text,
      timestamp: timestampStr,
      isRead: false,
      conversationId: convId
    };

    // Save to Firestore 'messages'
    try {
      await setDoc(doc(db, 'messages', newMsg.id), newMsg);
    } catch (err) {
      console.warn('[MessageService] Firestore setDoc error (saved to local):', err);
    }

    // Update conversation metadata in Firestore 'conversations'
    try {
      await setDoc(doc(db, 'conversations', convId), {
        id: convId,
        conversationId: convId,
        participants: [sId, rId],
        lastMessage: text,
        lastMessageTime: timestampStr,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('[MessageService] Error updating conversation document in Firestore:', err);
    }

    // Persist locally
    const messages = getStoredMessages();
    messages.push(newMsg);
    localStorage.setItem(STORAGE_MSGS_KEY, JSON.stringify(messages));

    saveStoredConversation({
      id: convId,
      conversationId: convId,
      participants: [sId, rId],
      lastMessage: text,
      lastMessageTime: timestampStr
    });

    return newMsg;
  },

  getOrCreateConversation: async (currentUserId: string, partnerId: string, initialMessage?: string): Promise<ChatMessage | null> => {
    if (!currentUserId || !partnerId) return null;
    await messageService.initializeConversation(currentUserId, partnerId);
    const existing = await messageService.getMessages(currentUserId, partnerId);
    if (existing.length === 0 && initialMessage) {
      return await messageService.sendMessage(currentUserId, partnerId, initialMessage);
    }
    return existing[0] || null;
  }
};
