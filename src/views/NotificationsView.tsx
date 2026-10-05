import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { notificationService, NotificationItem } from '../services/notificationService.ts';
import { LoadingState, EmptyState } from '../components/common/StateFeedback.tsx';
import {
  Bell,
  CheckCheck,
  HeartHandshake,
  UserPlus,
  Briefcase,
  Calendar,
  Building2,
  Clock,
  ExternalLink,
  Trash2,
  Sparkles
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigate: (tab: string, extraData?: any) => void;
  onOpenAuth?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'MENTORSHIP' | 'OPPORTUNITIES' | 'EVENTS'>('ALL');

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const list = await notificationService.getNotifications();
      setNotifications(list);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleAction = async (notif: NotificationItem) => {
    await handleMarkAsRead(notif.id);
    if (notif.linkUrl) {
      // e.g. "mentorship", "events", "opportunities", "institutions"
      onNavigate(notif.linkUrl);
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'MENTORSHIP') return n.type.includes('MENTORSHIP');
    if (filter === 'OPPORTUNITIES') return n.type.includes('OPPORTUNITY');
    if (filter === 'EVENTS') return n.type.includes('EVENT');
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'MENTORSHIP_REQUEST':
      case 'MENTORSHIP_ACCEPTED':
      case 'MENTORSHIP_REJECTED':
        return <HeartHandshake className="w-4 h-4 text-[#8E82A8]" />;
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
        return <UserPlus className="w-4 h-4 text-[#5B7C99]" />;
      case 'NEW_OPPORTUNITY':
        return <Briefcase className="w-4 h-4 text-[#5A7458]" />;
      case 'EVENT_REMINDER':
        return <Calendar className="w-4 h-4 text-[#D88A58]" />;
      case 'INSTITUTION_VERIFIED':
        return <Building2 className="w-4 h-4 text-[#345932]" />;
      default:
        return <Bell className="w-4 h-4 text-[#7E8696]" />;
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <Bell className="w-12 h-12 text-[#7E8696] mx-auto" />
        <h2 className="text-xl font-bold text-[#1F242D]">Sign In to View Notifications</h2>
        <p className="text-xs text-[#565D6D]">Stay informed on mentorship invites, opportunities, and campus updates.</p>
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="px-5 py-2.5 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E1D7] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#5A7458] uppercase tracking-wider">
              Activity Feed
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD]">
              UPDATES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F242D] font-heading tracking-tight">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-[#565D6D] mt-1">
            Mentorship invites, campus events, connection approvals, and verified placement alerts.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EFEBE3] border border-[#E6E1D7] text-xs font-semibold text-[#1F242D] transition-colors cursor-pointer"
        >
          <CheckCheck className="w-4 h-4 text-[#5A7458]" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {(['ALL', 'UNREAD', 'MENTORSHIP', 'OPPORTUNITIES', 'EVENTS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              filter === tab
                ? 'bg-[#1F242D] text-white'
                : 'bg-[#FAF8F5] text-[#565D6D] hover:bg-[#EFEBE3] border border-[#E6E1D7]'
            }`}
          >
            {tab === 'ALL' ? 'All Updates' :
             tab === 'UNREAD' ? 'Unread Only' :
             tab === 'MENTORSHIP' ? 'Mentorship' :
             tab === 'OPPORTUNITIES' ? 'Opportunities' :
             'Events'}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <LoadingState message="Loading your activity feed..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up! As collegiate activities happen, your updates will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleAction(notif)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                notif.isRead
                  ? 'bg-[#FCFBF8] border-[#E6E1D7] text-[#565D6D]'
                  : 'bg-[#FAF8F5] border-[#DCD6C9] shadow-2xs text-[#1F242D] ring-1 ring-[#5A7458]/20'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-[#E6E1D7] shrink-0 mt-0.5 shadow-2xs">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#1F242D] leading-snug">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-[#7E8696] font-medium shrink-0">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-[#565D6D] mt-1 leading-relaxed">
                  {notif.message}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#5A7458] hover:underline flex items-center gap-1">
                    <span>{notif.actionLabel || 'View Details'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>

                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      className="text-[11px] text-[#7E8696] hover:text-[#1F242D] underline cursor-pointer"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
