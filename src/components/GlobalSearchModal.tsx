import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService.ts';
import { opportunityService } from '../services/opportunityService.ts';
import { eventService } from '../services/eventService.ts';
import { User, Opportunity, EventItem } from '../types.ts';
import { UserUIDBadge } from './common/UserUIDBadge.tsx';
import {
  Search,
  X,
  User as UserIcon,
  Briefcase,
  Calendar,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, extraData?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'PEOPLE' | 'OPPORTUNITIES' | 'EVENTS'>('ALL');
  
  // Results
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [uidMatch, setUidMatch] = useState<User | null>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const timer = setTimeout(async () => {
      if (!query.trim()) {
        // Load defaults
        const [uList, oppList, evList] = await Promise.all([
          userService.getAlumni(),
          opportunityService.getOpportunities(),
          eventService.getEvents()
        ]);
        setUsers(uList.slice(0, 4));
        setOpportunities(oppList.slice(0, 3));
        setEvents(evList.slice(0, 3));
        setUidMatch(null);
        return;
      }

      // Check UID direct search
      const trimmed = query.trim().toUpperCase();
      if (trimmed.startsWith('AN-')) {
        const found = await userService.getUser(trimmed);
        setUidMatch(found || null);
      } else {
        setUidMatch(null);
      }

      // Search across entities
      const [uList, oppList, evList] = await Promise.all([
        userService.getAlumni({ search: query }),
        opportunityService.getOpportunities({ search: query }),
        eventService.getEvents({ search: query })
      ]);

      setUsers(uList);
      setOpportunities(oppList);
      setEvents(evList);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#5A7458]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alumni by name, skill, company, job title, or UID (e.g., AN-ALU-9X2M41)..."
            className="flex-1 bg-transparent text-sm text-[#1F242D] placeholder-[#7E8696] focus:outline-none font-medium"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md hover:bg-[#EFEBE3] text-[#7E8696] hover:text-[#1F242D]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-[#7E8696] bg-white border border-[#E6E1D7] rounded-md shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-2 border-b border-[#E6E1D7] bg-[#F7F5F0] flex items-center gap-1.5 overflow-x-auto text-xs">
          {(['ALL', 'PEOPLE', 'OPPORTUNITIES', 'EVENTS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#1F242D] text-white'
                  : 'text-[#565D6D] hover:bg-[#EFEBE3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Direct UID match banner */}
          {uidMatch && (
            <div className="p-4 rounded-xl bg-[#EBF2EA] border border-[#CFE2CD] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#345932] uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Exact UID Verified Academic Profile</span>
                </span>
                <UserUIDBadge uid={uidMatch.uid} role={uidMatch.role} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1F242D]">{uidMatch.name}</h4>
                  <p className="text-xs text-[#565D6D]">{uidMatch.currentRole || uidMatch.course} · {uidMatch.company || uidMatch.institutionName}</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('directory');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46]"
                >
                  View Profile →
                </button>
              </div>
            </div>
          )}

          {/* People / Alumni */}
          {(activeCategory === 'ALL' || activeCategory === 'PEOPLE') && users.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#8E82A8]" />
                  <span>Verified Alumni & Members ({users.length})</span>
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('directory');
                  }}
                  className="text-[11px] text-[#5A7458] font-semibold hover:underline"
                >
                  View all in Directory →
                </button>
              </div>

              <div className="space-y-2">
                {users.slice(0, 4).map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onClose();
                      onNavigate('directory');
                    }}
                    className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] hover:border-[#DCD6C9] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-xl object-cover border border-[#E6E1D7]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F242D]">{u.name}</span>
                          <UserUIDBadge uid={u.uid} role={u.role} size="sm" showLabel={false} />
                        </div>
                        <p className="text-[11px] text-[#565D6D]">{u.currentRole} at {u.company}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7E8696]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {(activeCategory === 'ALL' || activeCategory === 'OPPORTUNITIES') && opportunities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#5A7458]" />
                  <span>Opportunities & Internships ({opportunities.length})</span>
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('opportunities');
                  }}
                  className="text-[11px] text-[#5A7458] font-semibold hover:underline"
                >
                  Explore All →
                </button>
              </div>

              <div className="space-y-2">
                {opportunities.slice(0, 3).map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => {
                      onClose();
                      onNavigate('opportunities');
                    }}
                    className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] hover:border-[#DCD6C9] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-[#1F242D] block">{opp.title}</span>
                      <p className="text-[11px] text-[#7E8696]">{opp.company} · {opp.type} · {opp.location}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7E8696]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {(activeCategory === 'ALL' || activeCategory === 'EVENTS') && events.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D88A58]" />
                  <span>Events & Webinars ({events.length})</span>
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('events');
                  }}
                  className="text-[11px] text-[#5A7458] font-semibold hover:underline"
                >
                  Calendar →
                </button>
              </div>

              <div className="space-y-2">
                {events.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      onClose();
                      onNavigate('events');
                    }}
                    className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] hover:border-[#DCD6C9] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-[#1F242D] block">{ev.title}</span>
                      <p className="text-[11px] text-[#7E8696]">{ev.date} · {ev.eventType} · {ev.location}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7E8696]" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#FAF8F5] border-t border-[#E6E1D7] text-[11px] text-[#7E8696] flex items-center justify-between">
          <span>Pro tip: Type any UID prefix like <code className="font-mono bg-[#FAF8F5] px-1 py-0.5 rounded border border-[#E6E1D7] text-[#1F242D]">AN-ALU-</code> to filter roles</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
