import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { networkService, ConnectionRecord } from '../services/networkService.ts';
import { UserUIDBadge } from '../components/common/UserUIDBadge.tsx';
import { UserAvatar } from '../components/common/UserAvatar.tsx';
import { LoadingState, EmptyState } from '../components/common/StateFeedback.tsx';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  GraduationCap,
  Mail,
  UserPlus,
  MessageSquare,
  Building2,
  Trash2
} from 'lucide-react';

interface MyNetworkViewProps {
  onOpenAuth: () => void;
  onNavigateToChat?: (userId: string) => void;
}

export const MyNetworkView: React.FC<MyNetworkViewProps> = ({ onOpenAuth, onNavigateToChat }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState<ConnectionRecord[]>([]);
  const [incoming, setIncoming] = useState<ConnectionRecord[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'connected' | 'incoming' | 'outgoing'>('connected');

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await networkService.getConnections(user.id);
      setConnected(res.connected);
      setIncoming(res.incoming);
      setOutgoing(res.outgoing);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleRespond = async (connectionId: string, action: 'ACCEPT' | 'REJECT') => {
    await networkService.respondToConnection(connectionId, action);
    await fetchConnections();
  };

  const handleRemove = async (connectionId: string) => {
    await networkService.removeConnection(connectionId);
    await fetchConnections();
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <Users className="w-12 h-12 text-[#7E8696] mx-auto" />
        <h2 className="text-xl font-bold text-[#1F242D]">Sign In to View Connections</h2>
        <p className="text-xs text-[#565D6D]">Build relationships with verified alumni, peers, and collegiate mentors.</p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46]"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E1D7] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#5A7458] uppercase tracking-wider">
              Collegiate Graph
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD]">
              VERIFIED MEMBERS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F242D] font-heading tracking-tight">
            My Connections & Network
          </h1>
          <p className="text-xs sm:text-sm text-[#565D6D] mt-1">
            Manage your peer and alumni contacts across collegiate clusters.
          </p>
        </div>

        <div className="text-xs font-semibold text-[#565D6D]">
          <span className="text-[#1F242D] font-bold">{connected.length}</span> Active Connections
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6E1D7] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('connected')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'connected'
              ? 'bg-[#1F242D] text-white'
              : 'text-[#565D6D] hover:bg-[#EFEBE3]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Connected ({connected.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'incoming'
              ? 'bg-[#1F242D] text-white'
              : 'text-[#565D6D] hover:bg-[#EFEBE3]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Incoming Requests ({incoming.length})</span>
          {incoming.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#9E4D3E] text-white">
              {incoming.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'outgoing'
              ? 'bg-[#1F242D] text-white'
              : 'text-[#565D6D] hover:bg-[#EFEBE3]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Sent Requests ({outgoing.length})</span>
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <LoadingState message="Loading your collegiate connections..." />
      ) : (
        <div>
          {/* TAB 1: CONNECTED */}
          {activeTab === 'connected' && (
            connected.length === 0 ? (
              <EmptyState
                title="No connections yet"
                description="Explore the alumni directory to connect with verified mentors, seniors, and industry experts."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connected.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={item.user.name}
                            size="md"
                            className="w-12 h-12 text-base shadow-xs"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-[#1F242D]">{item.user.name}</h3>
                            <p className="text-[11px] text-[#565D6D]">{item.user.currentRole || item.user.course}</p>
                            <p className="text-[11px] text-[#7E8696]">{item.user.company || item.user.institutionName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#E6E1D7] flex items-center justify-between">
                        <UserUIDBadge uid={item.user.uid} role={item.user.role} size="sm" />
                        <span className="text-[10px] text-[#7E8696]">Connected {item.createdAt}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E6E1D7] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-2 rounded-lg text-[#7E8696] hover:text-[#9E4D3E] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                        title="Remove Connection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => alert(`Direct conversation with ${item.user.name} opened in Messages.`)}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] hover:bg-[#EFEBE3] text-xs font-semibold text-[#1F242D] flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#5A7458]" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 2: INCOMING */}
          {activeTab === 'incoming' && (
            incoming.length === 0 ? (
              <EmptyState
                title="No pending requests"
                description="You don't have any incoming connection requests right now."
              />
            ) : (
              <div className="space-y-3 max-w-3xl">
                {incoming.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={item.user.name}
                        size="md"
                        className="w-12 h-12 text-base shadow-xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#1F242D]">{item.user.name}</h4>
                          <UserUIDBadge uid={item.user.uid} role={item.user.role} size="sm" showLabel={false} />
                        </div>
                        <p className="text-xs text-[#565D6D]">{item.user.currentRole || item.user.course} · {item.user.institutionName}</p>
                        <span className="text-[10px] text-[#7E8696]">Requested {item.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(item.id, 'REJECT')}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-xs font-semibold text-[#565D6D] hover:bg-[#EFEBE3] cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespond(item.id, 'ACCEPT')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] cursor-pointer"
                      >
                        Accept Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 3: OUTGOING */}
          {activeTab === 'outgoing' && (
            outgoing.length === 0 ? (
              <EmptyState
                title="No sent requests"
                description="You haven't sent any pending connection requests."
              />
            ) : (
              <div className="space-y-3 max-w-3xl">
                {outgoing.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={item.user.name}
                        size="md"
                        className="w-12 h-12 text-base shadow-xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#1F242D]">{item.user.name}</h4>
                          <UserUIDBadge uid={item.user.uid} role={item.user.role} size="sm" showLabel={false} />
                        </div>
                        <p className="text-xs text-[#565D6D]">{item.user.currentRole || item.user.course}</p>
                        <span className="text-[10px] text-[#8C6212] font-semibold">Pending Approval</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="px-3 py-1.5 rounded-lg border border-[#E6E1D7] text-xs font-semibold text-[#565D6D] hover:bg-[#EFEBE3] cursor-pointer"
                    >
                      Withdraw Request
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
