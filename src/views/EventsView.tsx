import React, { useState, useEffect, useCallback } from 'react';
import { EventItem, EventType } from '../types.ts';
import { eventService } from '../services/eventService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { UserUIDBadge } from '../components/common/UserUIDBadge.tsx';
import { LoadingState, EmptyState } from '../components/common/StateFeedback.tsx';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Building2,
  Video,
  ExternalLink,
  X,
  Share2,
  Lock,
  Globe,
  Sparkles,
  CalendarCheck
} from 'lucide-react';

interface EventsViewProps {
  onOpenAuth: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'ALL'>('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('UPCOMING');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'ONLINE' | 'IN_PERSON'>('ALL');

  // Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Create Event Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('WEBINAR');
  const [newDate, setNewDate] = useState('2026-06-15');
  const [newTime, setNewTime] = useState('11:00 AM - 1:00 PM IST');
  const [newLocation, setNewLocation] = useState('Virtual via Google Meet');
  const [newFormat, setNewFormat] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [newCapacity, setNewCapacity] = useState('150');
  const [newDesc, setNewDesc] = useState('');
  const [newAgenda, setNewAgenda] = useState('11:00 - Introduction\n11:30 - Keynote Session\n12:30 - Live Q&A and Networking');
  const [newExclusive, setNewExclusive] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  const canCreate = user && (user.role === 'ALUMNI' || user.role === 'FACULTY' || user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await eventService.getEvents({
        search,
        type: typeFilter,
        timeframe: timeframeFilter,
        format: formatFilter
      });
      setEvents(list);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, timeframeFilter, formatFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleToggleRSVP = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    const updated = await eventService.toggleRegister(eventId, user.id);
    setEvents(prev => prev.map(ev => (ev.id === eventId ? updated : ev)));
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(updated);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await eventService.createEvent({
      title: newTitle.trim(),
      eventType: newType,
      date: newDate.trim(),
      time: newTime.trim() || '11:00 AM - 1:00 PM IST',
      location: newLocation.trim() || 'DTSS College Seminar Hall',
      isOnline: newFormat === 'ONLINE',
      institution: newExclusive ? (user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)') : (user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'),
      description: newDesc.trim(),
      agenda: newAgenda.split('\n').filter(Boolean),
      organizer: user.name,
      organizerRole: user.role,
      authorUid: user.uid,
      authorName: user.name,
      authorRole: user.role,
      institutionId: user.institutionId || 'inst-dtss-01',
      createdAt: new Date().toISOString(),
      speakers: [
        {
          name: user.name,
          role: user.role,
          company: user.company || user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
          avatar: user.avatar || ''
        }
      ],
      maxCapacity: Number(newCapacity) || 100,
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      registrationDeadline: newDate.trim(),
      meetingLink: newFormat === 'ONLINE' ? 'https://meet.google.com/alm-nexa-demo' : undefined
    });

    setCreateSuccessMsg('Event published to collegiate calendar successfully!');
    setTimeout(() => {
      setCreateSuccessMsg('');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchEvents();
    }, 1800);
  };

  const generateGoogleCalendarUrl = (ev: EventItem) => {
    const title = encodeURIComponent(ev.title);
    const details = encodeURIComponent(`${ev.description}\n\nOrganizer: ${ev.organizer}`);
    const location = encodeURIComponent(ev.location);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E1D7] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F242D] font-heading tracking-tight">
            Campus & Alumni Events
          </h1>
          <p className="text-xs sm:text-sm text-[#565D6D] mt-1">
            Webinars, workshops, campus drives, alumni reunions, and technical masterclasses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#A8B2C0]" />
              <span>+ Create Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#7E8696] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, topic, or speaker..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D] focus:outline-hidden"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Event Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="ALL">All Formats</option>
              <option value="WEBINAR">Webinar</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="MEETUP">Meetup</option>
              <option value="COLLEGE_EVENT">Campus Drive</option>
              <option value="CAREER_EVENT">Reunion</option>
              <option value="MENTORSHIP_SESSION">Mentorship Session</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Schedule</label>
            <select
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value as any)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="UPCOMING">Upcoming Events</option>
              <option value="PAST">Past Archives</option>
              <option value="ALL">All Events</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Format</label>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as any)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="ALL">All Formats</option>
              <option value="ONLINE">Virtual / Online</option>
              <option value="IN_PERSON">In-Person Campus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <LoadingState message="Loading campus calendar & guest sessions..." />
      ) : events.length === 0 ? (
        <div className="py-16 text-center text-gray-500 font-medium">
          No campus events scheduled yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => {
            const firstSpeaker = ev.speakers && ev.speakers[0];
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                {/* Image banner */}
                <div className="h-36 relative overflow-hidden bg-[#EAE6DE]">
                  <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#1F242D] leading-snug">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-[#565D6D] mt-2 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-[#E6E1D7] space-y-1.5 text-xs text-[#565D6D]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                        <span>{ev.date} · {ev.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                        <span className="line-clamp-1">{ev.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                        <span>
                          <strong className="text-[#1F242D]">{ev.attendeesCount}</strong> of {ev.maxCapacity} Attendees RSVP'd
                        </span>
                      </div>
                    </div>

                    {/* Speaker Info */}
                    <div className="mt-3 p-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#7E8696] block">Organizer / Host</span>
                        <span className="font-semibold text-[#1F242D]">{firstSpeaker ? firstSpeaker.name : ev.organizer}</span>
                      </div>
                      <span className="text-[10px] text-[#5A7458] font-semibold">{firstSpeaker ? firstSpeaker.company : ev.institution}</span>
                    </div>
                  </div>

                  {/* Footer RSVP */}
                  <div className="mt-4 pt-3 border-t border-[#E6E1D7] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1F242D] hover:underline">
                      View Agenda
                    </span>
                    <button
                      onClick={(e) => handleToggleRSVP(ev.id, e)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        ev.isRegistered
                          ? 'bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD]'
                          : 'bg-[#1F242D] hover:bg-[#343A46] text-white'
                      }`}
                    >
                      {ev.isRegistered ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>RSVP Confirmed</span>
                        </>
                      ) : (
                        <span>Reserve Spot</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          EVENT DETAIL MODAL
          ========================================================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#5A7458] mb-1">
                  {selectedEvent.eventType} · {selectedEvent.isOnline ? 'Online' : 'On-Campus'}
                </p>
                <h2 className="text-xl font-bold text-[#1F242D]">{selectedEvent.title}</h2>
                <p className="text-xs text-[#565D6D] mt-1">{selectedEvent.institution}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Date & Time</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">{selectedEvent.date} · {selectedEvent.time}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Venue / Link</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">{selectedEvent.location}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider mb-1.5">Overview</h4>
                <p className="text-xs text-[#565D6D] leading-relaxed whitespace-pre-line">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Agenda */}
              {selectedEvent.agenda && selectedEvent.agenda.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider mb-2">Program Agenda</h4>
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-1.5">
                    {selectedEvent.agenda.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1F242D] mt-1.5 shrink-0" />
                        <span className="text-[#1F242D]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speaker Bio */}
              {selectedEvent.speakers && selectedEvent.speakers.length > 0 && (
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] text-[#7E8696]">Featured Speaker</span>
                      <h5 className="text-xs font-bold text-[#1F242D]">{selectedEvent.speakers[0].name}</h5>
                    </div>
                    <span className="text-xs text-[#5A7458] font-bold">{selectedEvent.speakers[0].company}</span>
                  </div>
                  <p className="text-xs text-[#565D6D]">{selectedEvent.speakers[0].role}</p>
                </div>
              )}

              {/* Add to Google Calendar button */}
              <div className="pt-1">
                <a
                  href={generateGoogleCalendarUrl(selectedEvent)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-xs font-semibold text-[#1F242D] hover:bg-[#EFEBE3]"
                >
                  <CalendarCheck className="w-4 h-4 text-[#5A7458]" />
                  <span>Add to Google Calendar</span>
                  <ExternalLink className="w-3 h-3 text-[#7E8696]" />
                </a>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E6E1D7] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565D6D] hover:bg-[#EFEBE3]"
              >
                Close
              </button>
              <button
                onClick={(e) => handleToggleRSVP(selectedEvent.id, e)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  selectedEvent.isRegistered
                    ? 'bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD]'
                    : 'bg-[#1F242D] text-white hover:bg-[#343A46]'
                }`}
              >
                {selectedEvent.isRegistered ? 'Cancel RSVP' : 'Confirm RSVP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE EVENT MODAL (FACULTY / ALUMNI / ADMIN)
          ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F242D]">Create Collegiate Event</h3>
                <p className="text-xs text-[#565D6D]">Organize a masterclass, campus drive, or alumni reunion.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createSuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EBF2EA] text-[#3D5B3B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#1F242D]">Event Published</h4>
                <p className="text-xs text-[#565D6D]">{createSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateEvent} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Scaling Distributed Systems in Fintech"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Event Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as EventType)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    >
                      <option value="WEBINAR">Webinar</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="MEETUP">Meetup</option>
                      <option value="COLLEGE_EVENT">Campus Drive</option>
                      <option value="CAREER_EVENT">Reunion</option>
                      <option value="MENTORSHIP_SESSION">Mentorship Session</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Format</label>
                    <select
                      value={newFormat}
                      onChange={(e) => setNewFormat(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    >
                      <option value="ONLINE">Virtual / Online</option>
                      <option value="IN_PERSON">In-person Campus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Attendee Capacity</label>
                    <input
                      type="number"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Time & Timezone</label>
                    <input
                      type="text"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder="e.g. 5:00 PM - 7:00 PM IST"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Location / Video Link</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Campus Seminar Hall 2 or Google Meet URL"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="What attendees will learn, prerequisites, and key takeaways..."
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Agenda (one item per line)</label>
                  <textarea
                    rows={3}
                    value={newAgenda}
                    onChange={(e) => setNewAgenda(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#1F242D] block">Institution-Exclusive Event</span>
                    <span className="text-[11px] text-[#7E8696]">Restrict registrations to students & alumni of your college</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newExclusive}
                    onChange={(e) => setNewExclusive(e.target.checked)}
                    className="w-4 h-4 accent-[#1F242D] cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#565D6D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1F242D] text-white font-semibold hover:bg-[#343A46]"
                  >
                    Publish Event
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
