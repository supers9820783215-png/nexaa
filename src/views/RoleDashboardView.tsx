import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole, User, EventItem, Opportunity, MentorshipRequest, InstitutionRequest } from '../types.ts';
import { userService } from '../services/userService.ts';
import { eventService } from '../services/eventService.ts';
import { opportunityService } from '../services/opportunityService.ts';
import { mentorshipService } from '../services/mentorshipService.ts';
import { institutionService } from '../services/institutionService.ts';
import { UserUIDBadge } from '../components/common/UserUIDBadge.tsx';
import { UserAvatar } from '../components/common/UserAvatar.tsx';
import { LoadingState } from '../components/common/StateFeedback.tsx';
import { JoinCampusModal } from '../components/JoinCampusModal.tsx';
import {
  Users,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Plus,
  ShieldCheck,
  TrendingUp,
  Award,
  BookOpen,
  Bell,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  MapPin,
  Trash2,
  X
} from 'lucide-react';

interface RoleDashboardViewProps {
  onNavigate: (tab: string, extraData?: any) => void;
  onOpenAuth: () => void;
}

export const RoleDashboardView: React.FC<RoleDashboardViewProps> = ({ onNavigate, onOpenAuth }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // Modals for post-login campus onboarding
  const [showJoinCampusModal, setShowJoinCampusModal] = useState(false);
  const [dismissedCampusModal, setDismissedCampusModal] = useState(false);

  // Data sources
  const [events, setEvents] = useState<EventItem[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [institutionRequests, setInstitutionRequests] = useState<InstitutionRequest[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);

  // Interactive campus events modal
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState<EventItem | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'WORKSHOP' | 'MEETUP' | 'WEBINAR' | 'COLLEGE_EVENT'>('WORKSHOP');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Verification request state & feedback
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user?.role]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [evList, alumniList, oppList, instReqList, pendingUsersList] = await Promise.all([
        eventService.getEvents({ timeframe: 'UPCOMING' }),
        userService.getAlumni(),
        opportunityService.getOpportunities(),
        institutionService.getInstitutionRequests(),
        (user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN')
          ? userService.getPendingVerifications(user?.institutionId || undefined)
          : Promise.resolve([])
      ]);

      setEvents(evList);
      setMentors(alumniList.slice(0, 3));
      setOpportunities(oppList.slice(0, 3));
      setInstitutionRequests(instReqList);
      setPendingUsers(pendingUsersList);

      if (user) {
        const reqs = await mentorshipService.getRequestsForUser(user.id || user.uid, user.role);
        setMentorshipRequests(reqs);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleRequestVerification = async () => {
    if (!user) return;
    setRequestingVerification(true);
    try {
      const res = await userService.requestVerification();
      const updatedUser = { ...user, verificationStatus: 'PENDING' as const, isVerified: false };
      updateUser(updatedUser);
      setVerificationNotice(res.message || 'Verification request submitted to your institution admin.');
      setTimeout(() => setVerificationNotice(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification request.');
    } finally {
      setRequestingVerification(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await userService.verifyUser(userId, 'VERIFIED');
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setFeedbackToast('User account successfully approved and verified!');
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to approve user.');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await userService.verifyUser(userId, 'REJECTED');
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setFeedbackToast('User verification request marked as rejected.');
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to reject user.');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    try {
      setIsCreatingEvent(true);
      const created = await eventService.createEvent({
        title: newEventTitle.trim(),
        eventType: newEventType,
        date: newEventDate.trim(),
        time: newEventTime.trim() || '11:00 AM - 1:00 PM IST',
        location: newEventLocation.trim() || 'DTSS College Seminar Hall',
        isOnline: false,
        organizer: user?.name || 'DTSS College Admin',
        organizerRole: 'College Administration',
        institution: user?.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
        description: newEventDescription.trim() || 'Official campus event for students and alumni.',
        maxCapacity: 150,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        registrationDeadline: newEventDate.trim()
      });

      setEvents(prev => [created, ...prev]);
      setIsAddingEvent(false);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventLocation('');
      setNewEventDescription('');
      setFeedbackToast('Campus event scheduled successfully!');
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to remove this scheduled campus event?')) return;
    try {
      await eventService.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      if (selectedEventDetail?.id === eventId) setSelectedEventDetail(null);
      setFeedbackToast('Event removed from campus schedule.');
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <GraduationCap className="w-12 h-12 text-[#7E8696] mx-auto" />
        <h2 className="text-xl font-bold text-[#1F242D]">Sign In to View Dashboard</h2>
        <p className="text-xs text-[#565D6D]">Access role-tailored metrics, pending applications, and collegiate networks.</p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46]"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Aggregating role-based metrics and activity..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Role Indicator and Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E1D7] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#5A7458] uppercase tracking-wider">
              Central Portal
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD]">
              {user.role} DASHBOARD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F242D] font-heading tracking-tight">
            {user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN' ? 'Welcome back, DTSS College Admin' : `Welcome back, ${user.name}`}
          </h1>
          <div className="text-xs sm:text-sm text-[#565D6D] mt-1 flex items-center gap-2">
            <span>{user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'}</span>
            <span>·</span>
            <UserUIDBadge
              uid={user.uid}
              role={user.role}
              size="sm"
              isVerified={user.isVerified}
              verificationStatus={user.verificationStatus}
            />
          </div>
        </div>
      </div>

      {/* Global Toast Feedback */}
      {feedbackToast && (
        <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-xs text-[#166534] flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
          <span className="font-semibold">{feedbackToast}</span>
        </div>
      )}

      {/* Post-Login Onboarding: Join Campus Community Banner */}
      {user.role !== 'SUPER_ADMIN' && user.role !== 'INSTITUTION_ADMIN' && !user.isOnboardingComplete && !user.institutionId && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#1F242D] to-[#2E3644] text-white shadow-lg border border-[#343A46] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#A0D2EB] shrink-0 border border-white/10">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold font-heading text-white">
                  Join Your Campus Community
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A0D2EB]/20 text-[#A0D2EB] border border-[#A0D2EB]/30 uppercase tracking-wider">
                  Step 2: Connect College
                </span>
              </div>
              <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
                You haven't joined a college or university network yet. Connect your account to your campus to unlock peer discovery, verified alumni mentorship, and placement listings.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setDismissedCampusModal(false);
              setShowJoinCampusModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#1F242D] text-xs font-bold shadow-md transition-all shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Connect with Your College</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Unverified Account Alert Banner (Only if already associated with an institution) */}
      {user.role !== 'SUPER_ADMIN' && user.role !== 'INSTITUTION_ADMIN' && user.institutionId && user.verificationStatus !== 'NOT_ASSOCIATED' && (!user.isVerified || user.verificationStatus !== 'VERIFIED') && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          user.verificationStatus === 'PENDING'
            ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
            : 'bg-[#FFF5F2] border-[#FED7AA] text-[#9A3412]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                user.verificationStatus === 'PENDING' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#FFEDD5] text-[#EA580C]'
              }`}>
                {user.verificationStatus === 'PENDING' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-[#1F242D]">
                    {user.verificationStatus === 'PENDING'
                      ? 'Institutional Verification Under Review'
                      : 'Account Status: Not Verified'}
                  </h3>
                  <UserUIDBadge
                    uid={user.uid}
                    role={user.role}
                    size="sm"
                    isVerified={user.isVerified}
                    verificationStatus={user.verificationStatus}
                  />
                </div>
                <p className="text-xs text-[#565D6D] max-w-2xl leading-relaxed">
                  {user.verificationStatus === 'PENDING'
                    ? `Your verification request has been submitted to your campus administration at ${user.institutionName || 'your college'}. Full access to direct messaging and unrestricted alumni mentorship will unlock upon approval.`
                    : `Your account is registered with ${user.institutionName || 'your institution'} but has not yet been verified. Direct messaging and mentorship connections are restricted until your collegiate identity is confirmed.`}
                </p>
                {verificationNotice && (
                  <p className="text-xs font-semibold text-[#166534] mt-1 bg-[#DCFCE7] px-2.5 py-1 rounded-md inline-block">
                    ✓ {verificationNotice}
                  </p>
                )}
              </div>
            </div>

            {user.verificationStatus !== 'PENDING' && (
              <button
                onClick={handleRequestVerification}
                disabled={requestingVerification}
                className="px-4 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {requestingVerification ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Request for Verification</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE 1: STUDENT DASHBOARD
          ========================================================================= */}
      {user.role === 'STUDENT' && (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Upcoming Campus Events</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-[#1F242D]">{events.length}</span>
                <span className="text-xs text-[#345932] font-semibold flex items-center gap-0.5">
                  Scheduled
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Active Opportunities</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-[#1F242D]">{opportunities.length}</span>
                <span className="text-xs text-[#8C6212] font-medium">Campus Careers</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Active 1:1 Mentorships</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-[#1F242D]">
                  {mentorshipRequests.filter(r => r.status === 'ACCEPTED').length}
                </span>
                <span className="text-xs text-[#5A7458] font-semibold">Active Sessions</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recommended Mentors */}
            <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-[#8E82A8]" />
                  <span>Recommended Mentors for You</span>
                </h3>
                <button
                  onClick={() => onNavigate('mentorship')}
                  className="text-xs font-semibold text-[#5A7458] hover:underline"
                >
                  View All
                </button>
              </div>

              {mentors.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#FAF8F5] border border-dashed border-[#DCD6C9] space-y-1">
                  <p className="text-xs font-bold text-[#1F242D]">No alumni found in your campus directory.</p>
                  <p className="text-[11px] text-[#7E8696]">
                    Verified alumni mentors from your college will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mentors.map((m, idx) => (
                    <div key={m.id || m.uid || `mentor-${idx}`} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={m.name} size="md" className="w-11 h-11 text-base shadow-xs" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F242D]">{m.name}</span>
                            <UserUIDBadge uid={m.uid} role="ALUMNI" size="sm" showLabel={false} />
                          </div>
                          <p className="text-[11px] text-[#565D6D]">{m.currentRole} at {m.company}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate('mentorship')}
                        className="px-3 py-1.5 rounded-lg bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46]"
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved & Recommended Opportunities */}
            <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#5A7458]" />
                  <span>Featured Placements & Internships</span>
                </h3>
                <button
                  onClick={() => onNavigate('opportunities')}
                  className="text-xs font-semibold text-[#5A7458] hover:underline"
                >
                  View All
                </button>
              </div>

              {opportunities.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#FAF8F5] border border-dashed border-[#DCD6C9] space-y-1">
                  <p className="text-xs font-bold text-[#1F242D]">No opportunities posted yet.</p>
                  <p className="text-[11px] text-[#7E8696]">
                    Campus-gated job and internship postings will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opp, idx) => (
                    <div key={opp.id || `opp-${idx}`} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1F242D]">{opp.title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FAF8F5] border border-[#E6E1D7]">
                            {opp.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#565D6D]">{opp.company} · {opp.stipendSalary}</p>
                      </div>
                      <button
                        onClick={() => onNavigate('opportunities')}
                        className="px-3 py-1.5 rounded-lg border border-[#E6E1D7] hover:bg-[#EFEBE3] text-xs font-semibold text-[#1F242D]"
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Campus Events */}
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D88A58]" />
                <span>Upcoming Masterclasses & Campus Sessions</span>
              </h3>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-semibold text-[#5A7458] hover:underline"
              >
                Calendar
              </button>
            </div>

            {events.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#FAF8F5] border border-dashed border-[#DCD6C9] space-y-1">
                <p className="text-xs font-bold text-[#1F242D]">No upcoming campus events.</p>
                <p className="text-[11px] text-[#7E8696]">
                  Campus masterclasses, webinars, and reunions will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {events.slice(0, 3).map((ev, idx) => (
                  <div key={ev.id || `event-${idx}`} className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#7E8696] uppercase">{ev.eventType}</span>
                      <h4 className="text-xs font-bold text-[#1F242D] mt-1">{ev.title}</h4>
                      <p className="text-[11px] text-[#565D6D] mt-1">{ev.date} · {ev.time}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('events')}
                      className="mt-3 text-xs font-semibold text-[#5A7458] hover:underline text-left"
                    >
                      View Details →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE 2: ALUMNI DASHBOARD
          ========================================================================= */}
      {user.role === 'ALUMNI' && (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Total Mentees Guided</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-[#1F242D]">14</span>
                <span className="text-xs font-semibold text-[#345932]">✓ Eligible for Mentor Community</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Alumni Network Connections</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-[#1F242D]">56</span>
                <span className="text-xs text-[#565D6D]">Across 12 tech firms</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Referrals / Jobs Posted</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-[#1F242D]">3</span>
                <span className="text-xs text-[#5A7458] font-semibold">18 Student Applicants</span>
              </div>
            </div>
          </div>

          {/* Incoming Mentorship Requests (Alumni Action) */}
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#8E82A8]" />
                <span>Pending Mentorship Applications ({mentorshipRequests.length})</span>
              </h3>
              <button
                onClick={() => onNavigate('mentorship')}
                className="text-xs font-semibold text-[#5A7458] hover:underline"
              >
                Manage Requests
              </button>
            </div>

            <div className="space-y-3">
              {mentorshipRequests.slice(0, 2).map((req, idx) => (
                <div key={req.id || `mnt-${idx}`} className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={req.menteeName} size="md" className="w-11 h-11 text-base shadow-xs" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1F242D]">{req.menteeName}</span>
                        <UserUIDBadge uid={req.menteeUid} role="STUDENT" size="sm" showLabel={false} />
                      </div>
                      <p className="text-[11px] text-[#565D6D]">{req.menteeCourse} · Focus: {req.topic}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('mentorship')}
                      className="px-3 py-1.5 rounded-lg bg-[#5A7458] text-white text-xs font-semibold hover:bg-[#485E46]"
                    >
                      Review Application
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#1F242D]">Have an opening at your company?</h3>
              <p className="text-xs text-[#565D6D]">Post a referral or campus-exclusive internship for your alma mater juniors.</p>
            </div>
            <button
              onClick={() => onNavigate('opportunities')}
              className="px-4 py-2 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#A8B2C0]" />
              <span>Post Opportunity</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE 3: FACULTY DASHBOARD
          ========================================================================= */}
      {user.role === 'FACULTY' && (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Department Alumni</span>
              <span className="text-2xl font-extrabold text-[#1F242D] mt-2 block">420</span>
              <span className="text-[11px] text-[#345932] font-semibold">100% Verified UIDs</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Enrolled Students</span>
              <span className="text-2xl font-extrabold text-[#1F242D] mt-2 block">180</span>
              <span className="text-[11px] text-[#7E8696]">BSc IT & Computer Science</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Campus Placement Rate</span>
              <span className="text-2xl font-extrabold text-[#1F242D] mt-2 block">94.2%</span>
              <span className="text-[11px] text-[#345932] font-semibold">+6.1% vs last academic year</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Active Faculty Mentors</span>
              <span className="text-2xl font-extrabold text-[#1F242D] mt-2 block">12</span>
              <span className="text-[11px] text-[#565D6D]">4 Departments</span>
            </div>
          </div>

          {/* Department Analytics & Placement Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#5A7458]" />
                <span>Top Alumni Employers</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { name: 'Microsoft', count: 18, pct: '18%' },
                  { name: 'Google', count: 14, pct: '14%' },
                  { name: 'Swiggy & Zomato', count: 12, pct: '12%' },
                  { name: 'Razorpay & CRED', count: 10, pct: '10%' },
                  { name: 'J.P. Morgan & Morgan Stanley', count: 15, pct: '15%' }
                ].map((co, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between">
                    <span className="font-semibold text-[#1F242D]">{co.name}</span>
                    <span className="font-mono text-[#5A7458] font-bold">{co.count} Alumni ({co.pct})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#8E82A8]" />
                <span>Recent Placement Highlights</span>
              </h3>
              <div className="space-y-3">
                {[
                  { student: 'Aarav Mehta', role: 'Software Engineer', comp: 'Microsoft', package: '₹28 LPA' },
                  { student: 'Pooja Iyer', role: 'Product Analyst', comp: 'Swiggy', package: '₹16 LPA' },
                  { student: 'Rohan Deshmukh', role: 'Fintech SDE', comp: 'Razorpay', package: '₹22 LPA' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#1F242D]">{item.student}</span>
                      <p className="text-[11px] text-[#565D6D]">{item.role} at {item.comp}</p>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-[#EBF2EA] text-[#345932] font-bold border border-[#CFE2CD]">
                      {item.package}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE 4: ADMIN DASHBOARD
          ========================================================================= */}
      {(user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN') && (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Pending Verifications</span>
              <span className="text-2xl font-extrabold text-[#1F242D] mt-2 block">{pendingUsers.length}</span>
              <span className="text-[11px] text-[#8C6212] font-semibold">{pendingUsers.length > 0 ? 'Requires Review' : 'All Requests Processed'}</span>
            </div>

            <div
              onClick={() => setIsEventsModalOpen(true)}
              className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs cursor-pointer hover:border-[#8458B3] transition-all group"
              title="Click to view and manage campus events"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7E8696] block">Campus Events</span>
                <span className="text-[10px] font-bold text-[#8458B3] group-hover:underline">Manage Schedules →</span>
              </div>
              <span className="text-2xl font-extrabold text-[#1F242D] mt-2 block">{events.length}</span>
              <span className="text-[11px] text-[#345932] font-semibold">Active Schedules (Click to Manage)</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Job & Internship Postings</span>
              <span className="text-2xl font-extrabold text-[#1F242D] mt-2 block">{opportunities.length}</span>
              <span className="text-[11px] text-[#5A7458] font-semibold">Career Opportunities</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs">
              <span className="text-xs font-semibold text-[#7E8696] block">Active Mentors</span>
              <span className="text-2xl font-extrabold text-[#1F242D] mt-2 block">{mentors.length}</span>
              <span className="text-[11px] text-[#345932] font-semibold">Verified Alumni</span>
            </div>
          </div>

          {/* Pending User Verifications Queue */}
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#8458B3]" />
                  <span>Pending User Verifications Queue ({pendingUsers.length})</span>
                </h3>
                <p className="text-xs text-[#7E8696] mt-0.5">
                  Review student and alumni requests submitted for {user.institutionName || 'your institution'}.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF6E5] text-[#8C6212] border border-[#FFE6B3]">
                {pendingUsers.length} Pending
              </span>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#FAF8F5] border border-dashed border-[#DCD6C9] space-y-1">
                <CheckCircle2 className="w-8 h-8 text-[#5A7458] mx-auto opacity-70" />
                <p className="text-xs font-bold text-[#1F242D]">No pending verification requests.</p>
                <p className="text-[11px] text-[#7E8696]">
                  There are no pending verification requests for {user.institutionName || 'your institution'}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((pendingUser, idx) => (
                  <div
                    key={pendingUser.id || pendingUser.uid || `pending-${idx}`}
                    className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-[#D0C9BA]"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        name={pendingUser.name}
                        avatar={pendingUser.avatar}
                        size="lg"
                        className="w-12 h-12 rounded-xl text-base"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#1F242D]">{pendingUser.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFEBE3] text-[#565D6D] border border-[#DCD6C9]">
                            {pendingUser.role}
                          </span>
                          <UserUIDBadge
                            uid={pendingUser.uid}
                            role={pendingUser.role}
                            size="sm"
                            isVerified={false}
                            verificationStatus="PENDING"
                          />
                        </div>
                        <p className="text-[11px] text-[#565D6D]">
                          {pendingUser.email}
                          {pendingUser.department && ` · ${pendingUser.department}`}
                          {pendingUser.course && ` · ${pendingUser.course}`}
                          {pendingUser.graduationYear && ` (Class of ${pendingUser.graduationYear})`}
                          {pendingUser.company && ` · ${pendingUser.currentRole || 'Works'} at ${pendingUser.company}`}
                        </p>
                        <p className="text-[10px] text-[#7E8696]">
                          College: <span className="font-semibold text-[#1F242D]">{pendingUser.institutionName || 'DTSS College'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleRejectUser(pendingUser.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEF2F2] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveUser(pendingUser.id)}
                        className="px-4 py-1.5 rounded-lg bg-[#5A7458] hover:bg-[#485E46] text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post-Login Join Campus Modal */}
      <JoinCampusModal
        isOpen={showJoinCampusModal || (!dismissedCampusModal && Boolean(user && user.role !== 'SUPER_ADMIN' && user.role !== 'INSTITUTION_ADMIN' && !user.isOnboardingComplete && !user.institutionId))}
        onClose={() => {
          setShowJoinCampusModal(false);
          setDismissedCampusModal(true);
          onNavigate('dashboard');
        }}
        onNavigate={onNavigate}
      />

      {/* Interactive Campus Events Management Modal */}
      {isEventsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F242D]/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E6E1D7] w-full max-w-2xl overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-br from-[#FAF8F5] to-[#F2EFE8] border-b border-[#E6E1D7] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1F242D] text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-5 h-5 text-[#8458B3]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1F242D] font-heading">
                    Campus Events & Schedules
                  </h3>
                  <p className="text-xs text-[#565D6D]">
                    Manage active campus workshops, seminars, and conclaves for {user?.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEventsModalOpen(false);
                  setIsAddingEvent(false);
                  setSelectedEventDetail(null);
                }}
                className="p-2 rounded-xl text-[#7E8696] hover:text-[#1F242D] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Action Bar */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-[#1F242D]">
                  Active Campus Events ({events.length})
                </span>
                <button
                  onClick={() => setIsAddingEvent(!isAddingEvent)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#8458B3] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#71489d] transition-colors cursor-pointer"
                >
                  {isAddingEvent ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isAddingEvent ? 'Cancel' : '+ Add Campus Event'}</span>
                </button>
              </div>

              {/* Add Event Form (Collapsible) */}
              {isAddingEvent && (
                <form onSubmit={handleCreateEvent} className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-3.5 animate-in fade-in">
                  <h4 className="text-xs font-bold text-[#1F242D] uppercase tracking-wider">
                    New Campus Schedule Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                        Event Title <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        placeholder="e.g. Alumni Guest Lecture on FinTech"
                        className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                        Event Type
                      </label>
                      <select
                        value={newEventType}
                        onChange={(e) => setNewEventType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                      >
                        <option value="WORKSHOP">Workshop</option>
                        <option value="MEETUP">Meetup</option>
                        <option value="WEBINAR">Webinar</option>
                        <option value="COLLEGE_EVENT">Campus Drive / Conclave</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                        Date <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                        Time Slot
                      </label>
                      <input
                        type="text"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        placeholder="e.g. 10:00 AM - 1:00 PM"
                        className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                      Venue / Location
                    </label>
                    <input
                      type="text"
                      value={newEventLocation}
                      onChange={(e) => setNewEventLocation(e.target.value)}
                      placeholder="e.g. DTSS College Seminar Hall / Zoom Live"
                      className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                    />
                  </div>

                  <div className="text-xs">
                    <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                      Event Description
                    </label>
                    <textarea
                      rows={2}
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      placeholder="Brief agenda, topics covered, and target batch..."
                      className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingEvent(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-[#DCD6C9] text-xs font-semibold text-[#565D6D] hover:bg-black/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingEvent}
                      className="px-4 py-1.5 rounded-xl bg-[#1F242D] text-white text-xs font-bold hover:bg-[#343A46] disabled:opacity-50"
                    >
                      {isCreatingEvent ? 'Scheduling...' : 'Save & Publish Event'}
                    </button>
                  </div>
                </form>
              )}

              {/* Event Detailed Preview (if selected) */}
              {selectedEventDetail && (
                <div className="p-4 rounded-2xl bg-[#EBF2EA] border border-[#CFE2CD] space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#345932] uppercase">
                      Event Details
                    </span>
                    <button
                      onClick={() => setSelectedEventDetail(null)}
                      className="text-[#345932] hover:text-[#1F242D] text-xs font-bold"
                    >
                      Close Details
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-[#1F242D]">{selectedEventDetail.title}</h4>
                  <p className="text-xs text-[#565D6D]">{selectedEventDetail.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#345932] pt-1">
                    <span>📅 Date: {selectedEventDetail.date} ({selectedEventDetail.time})</span>
                    <span>📍 Venue: {selectedEventDetail.location || (selectedEventDetail.isOnline ? 'Online Event' : 'Campus')}</span>
                    <span>👥 Attendees: {selectedEventDetail.attendeesCount || 0} registered</span>
                    <span>🏛️ Organizer: {selectedEventDetail.organizer || 'College Admin'}</span>
                  </div>
                </div>
              )}

              {/* Event List */}
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#FAF8F5] border border-dashed border-[#DCD6C9] text-xs text-[#7E8696]">
                    No campus events scheduled. Click "+ Add Campus Event" above to create one.
                  </div>
                ) : (
                  events.map(ev => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-white border border-[#E6E1D7] hover:border-[#8458B3] transition-colors flex items-start justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2EA] text-[#345932]">
                            {ev.eventType}
                          </span>
                          <h4 className="text-xs font-bold text-[#1F242D]">{ev.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#565D6D]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#7E8696]" />
                            {ev.date} · {ev.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#7E8696]" />
                            {ev.location || (ev.isOnline ? 'Online' : 'Campus Venue')}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7E8696] line-clamp-1">{ev.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedEventDetail(ev)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EFE8] text-[11px] font-bold text-[#1F242D] border border-[#DCD6C9] cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#E6E1D7] flex justify-end">
              <button
                onClick={() => {
                  setIsEventsModalOpen(false);
                  setIsAddingEvent(false);
                  setSelectedEventDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#1F242D] text-white text-xs font-bold hover:bg-[#343A46] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
