import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { messageService, ChatConversation, ChatMessage } from '../services/messageService.ts';
import { getAllUsers } from '../services/authService.ts';
import { userService } from '../services/userService.ts';
import { UserUIDBadge } from '../components/common/UserUIDBadge.tsx';
import { UserAvatar } from '../components/common/UserAvatar.tsx';
import { LoadingState } from '../components/common/StateFeedback.tsx';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCheck,
  Search,
  Building2,
  ExternalLink,
  Sparkles,
  Lock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface MessagesViewProps {
  onOpenAuth: () => void;
  onNavigateToProfile?: (uid: string) => void;
  initialPartnerId?: string | null;
  onClearInitialPartner?: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  onOpenAuth,
  onNavigateToProfile,
  initialPartnerId,
  onClearInitialPartner
}) => {
  const { user, updateUser } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [activePartner, setActivePartner] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const partnerToSelect = initialPartnerId || (typeof window !== 'undefined' ? sessionStorage.getItem('alumnexa_active_chat_partner') : null);
    loadConversations(partnerToSelect);
  }, [user, initialPartnerId]);

  async function loadConversations(targetPartnerId?: string | null) {
    if (!user) return;
    setLoading(true);
    try {
      const convs = await messageService.getConversations(user.id);
      let selectedConv: ChatConversation | null = null;

      if (targetPartnerId) {
        const tId = targetPartnerId.trim().toLowerCase();
        selectedConv = convs.find(c =>
          (c.partner.id || '').toLowerCase() === tId ||
          (c.partner.uid || '').toLowerCase() === tId
        ) || null;

        // If no message thread exists yet, look up partner and initialize virtual thread
        if (!selectedConv) {
          const allUsers = getAllUsers();
          const targetUser = allUsers.find(u =>
            (u.id || '').toLowerCase() === tId ||
            (u.uid || '').toLowerCase() === tId
          );
          if (targetUser) {
            selectedConv = {
              partner: targetUser,
              lastMessage: 'Conversation active.',
              lastMessageTime: 'Just now',
              unreadCount: 0
            };
            convs.unshift(selectedConv);
          }
        }
      }

      setConversations(convs);

      if (selectedConv) {
        setActivePartner(selectedConv);
        loadMessages(selectedConv.partner.id);
        sessionStorage.removeItem('alumnexa_active_chat_partner');
        if (onClearInitialPartner) onClearInitialPartner();
      } else if (convs.length > 0 && !activePartner) {
        setActivePartner(convs[0]);
        loadMessages(convs[0].partner.id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(partnerId: string) {
    if (!user) return;
    const msgs = await messageService.getMessages(user.id, partnerId);
    setMessages(msgs);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  const handleSelectConversation = (conv: ChatConversation) => {
    setActivePartner(conv);
    loadMessages(conv.partner.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activePartner) return;

    const newMsg = await messageService.sendMessage(user.id, activePartner.partner.id, inputText.trim());
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Update conversation snippet
    setConversations(prev =>
      prev.map(c =>
        c.partner.id === activePartner.partner.id
          ? { ...c, lastMessage: newMsg.text, lastMessageTime: 'Just now' }
          : c
      )
    );

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <MessageSquare className="w-12 h-12 text-[#7E8696] mx-auto" />
        <h2 className="text-xl font-bold text-[#1F242D]">Sign In to Open Inbox</h2>
        <p className="text-xs text-[#565D6D]">Send direct messages and coordinate mentorship sessions with verified members.</p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46]"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    try {
      const res = await userService.requestVerification();
      const updatedUser = { ...user, verificationStatus: 'PENDING' as const, isVerified: false };
      updateUser(updatedUser);
      alert(res.message || 'Verification request submitted to your campus administration.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification request.');
    } finally {
      setRequestingVerification(false);
    }
  };

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'INSTITUTION_ADMIN' && (!user.isVerified || user.verificationStatus !== 'VERIFIED')) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF5F2] border border-[#FED7AA] flex items-center justify-center mx-auto text-[#EA580C] shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider">Access Restricted</span>
            <UserUIDBadge
              uid={user.uid}
              role={user.role}
              size="sm"
              isVerified={user.isVerified}
              verificationStatus={user.verificationStatus}
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F242D] tracking-tight font-heading">
            Direct Messaging Requires Institutional Verification
          </h2>
          <p className="text-xs sm:text-sm text-[#565D6D] max-w-lg mx-auto mt-2 leading-relaxed">
            {user.verificationStatus === 'PENDING'
              ? `Your verification request has been submitted to ${user.institutionName || 'your institution'} and is currently awaiting administrator review. Direct messaging will unlock once approved.`
              : `To preserve high-trust communication across ${user.institutionName || 'collegiate'} networks and prevent unauthorized outreach, direct messaging is restricted to verified campus members.`}
          </p>
        </div>

        {user.verificationStatus !== 'PENDING' && (
          <div className="pt-2">
            <button
              onClick={handleRequestVerification}
              disabled={requestingVerification}
              className="px-5 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{requestingVerification ? 'Submitting Request...' : 'Request for Verification'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const filteredConvs = conversations.filter(c =>
    c.partner.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.partner.uid.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[#E6E1D7] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[#5A7458] uppercase tracking-wider">
            Verified Messaging
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD]">
            END-TO-END VERIFIED CHATS
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#1F242D] font-heading tracking-tight">
          Direct Messages & Mentorship Inbox
        </h1>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs overflow-hidden flex flex-col md:flex-row h-[650px]">
        {/* Left Side: Conversation List */}
        <div className="w-full md:w-80 border-r border-[#E6E1D7] flex flex-col bg-[#FAF8F5]">
          {/* Search bar */}
          <div className="p-3 border-b border-[#E6E1D7]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#7E8696] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats by name or UID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#FCFBF8] border border-[#E6E1D7] text-[#1F242D] focus:outline-hidden"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E6E1D7]">
            {loading ? (
              <div className="p-6 text-center text-xs text-[#7E8696]">Loading conversations...</div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#7E8696]">No conversations found</div>
            ) : (
              filteredConvs.map((conv) => {
                const isActive = activePartner?.partner.id === conv.partner.id;
                return (
                  <button
                    key={conv.partner.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                      isActive ? 'bg-[#F2EFE9]' : 'hover:bg-[#F7F5F0]'
                    }`}
                  >
                    <UserAvatar
                      name={conv.partner.name}
                      size="md"
                      className="w-10 h-10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[#1F242D] truncate">
                          {conv.partner.name}
                        </span>
                        <span className="text-[10px] text-[#7E8696] shrink-0">
                          {conv.lastMessageTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <UserUIDBadge uid={conv.partner.uid} role={conv.partner.role} size="sm" showLabel={false} />
                      </div>
                      <p className="text-[11px] text-[#565D6D] truncate mt-1">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Window */}
        <div className="flex-1 flex flex-col bg-[#FCFBF8]">
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={activePartner.partner.name}
                    size="md"
                    className="w-9 h-9"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-[#1F242D]">{activePartner.partner.name}</h3>
                      <UserUIDBadge uid={activePartner.partner.uid} role={activePartner.partner.role} size="sm" />
                    </div>
                    <p className="text-[11px] text-[#7E8696] flex items-center gap-1">
                      <span>{activePartner.partner.currentRole || activePartner.partner.course}</span>
                      <span>·</span>
                      <span>{activePartner.partner.company || activePartner.partner.institutionName}</span>
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-[#5A7458]">
                  Verified Direct Channel
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#1F242D] text-white rounded-br-xs'
                            : 'bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D] rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-[#7E8696] mt-1 px-1 flex items-center gap-1">
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-[#5A7458]" />}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[#E6E1D7] bg-[#FAF8F5] flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Reply to ${activePartner.partner.name}...`}
                  className="flex-1 px-4 py-2 text-xs rounded-xl bg-[#FCFBF8] border border-[#E6E1D7] text-[#1F242D] focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#A8B2C0]" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-[#7E8696]" />
              <h3 className="text-sm font-bold text-[#1F242D]">No Conversation Selected</h3>
              <p className="text-xs text-[#565D6D]">Select a contact from the left list to begin messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
