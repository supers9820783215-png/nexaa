import React, { useState, useEffect, useCallback } from 'react';
import { User, MentorshipRequest, MentorshipStatus } from '../types.ts';
import { mentorshipService, MentorFilterParams } from '../services/mentorshipService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { LoadingState, EmptyState } from '../components/common/StateFeedback.tsx';
import {
  HeartHandshake,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Building2,
  GraduationCap,
  Calendar,
  AlertCircle,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  X,
  FileText,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface MentorshipViewProps {
  onOpenAuth: () => void;
}

export const MentorshipView: React.FC<MentorshipViewProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'find-mentors' | 'requests'>('find-mentors');
  const [mentors, setMentors] = useState<Array<User & { activeMentees: number; mentorshipAvailability: boolean; experienceYears: number; industry: string }>>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [skillInput, setSkillInput] = useState('');

  // Request Mentorship Modal
  const [targetMentor, setTargetMentor] = useState<any | null>(null);
  const [requestTopic, setRequestTopic] = useState('Cloud Architecture & System Design');
  const [requestGoals, setRequestGoals] = useState('Prepare for high-scale backend internship interviews');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');

  // Alumni notes modal
  const [noteModalRequest, setNoteModalRequest] = useState<MentorshipRequest | null>(null);
  const [noteText, setNoteText] = useState('');

  const isAlumni = user?.role === 'ALUMNI';

  const loadMentors = useCallback(async () => {
    setLoading(true);
    try {
      const list = await mentorshipService.getMentors({
        search,
        industry: selectedIndustry,
        company: selectedCompany,
        location: selectedLocation,
        skills: skillInput,
      });
      setMentors(list);
    } catch (err) {
      console.error('Failed to load mentors:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedIndustry, selectedCompany, selectedLocation, skillInput]);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    try {
      const list = await mentorshipService.getRequestsForUser(user.id, user.role);
      setRequests(list);
    } catch (err) {
      console.error('Failed to load mentorship requests:', err);
    }
  }, [user]);

  useEffect(() => {
    loadMentors();
    loadRequests();
  }, [loadMentors, loadRequests]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMentor || !user) return;

    await mentorshipService.requestMentorship({
      mentorId: targetMentor.id,
      mentorName: targetMentor.name,
      mentorUid: targetMentor.uid,
      mentorAvatar: targetMentor.avatar,
      mentorCompany: targetMentor.company || 'Enterprise',
      mentorRole: targetMentor.currentRole || 'Software Professional',
      menteeId: user.id,
      menteeName: user.name,
      menteeUid: user.uid,
      menteeAvatar: user.avatar,
      menteeCourse: user.course || 'BSc Information Technology',
      menteeYear: '3rd Year',
      topic: `${requestTopic} · Goals: ${requestGoals}`,
      message: requestMessage
    });

    setRequestSuccessMsg(`Mentorship request submitted to ${targetMentor.name}! Status: PENDING.`);
    setTimeout(() => {
      setRequestSuccessMsg('');
      setTargetMentor(null);
      setRequestMessage('');
      loadRequests();
    }, 2200);
  };

  const handleUpdateRequestStatus = async (reqId: string, status: MentorshipStatus, notes?: string) => {
    await mentorshipService.updateStatus(reqId, status, notes);
    await loadRequests();
  };

  const handleSaveNote = async () => {
    if (!noteModalRequest) return;
    await mentorshipService.updateStatus(noteModalRequest.id, noteModalRequest.status, noteText);
    setNoteModalRequest(null);
    setNoteText('');
    await loadRequests();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E1D7] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F242D] font-heading tracking-tight">
            Mentorship Platform
          </h1>
          <p className="text-xs sm:text-sm text-[#565D6D] mt-1">
            Connect with seasoned alumni mentors for code reviews, portfolio teardowns, and interview roadmaps.
          </p>
        </div>

        {/* Tab Switcher: Find Mentors vs My Requests */}
        <div className="inline-flex rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] p-1 text-xs">
          <button
            onClick={() => setActiveTab('find-mentors')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'find-mentors'
                ? 'bg-[#1F242D] text-white'
                : 'text-[#565D6D] hover:text-[#1F242D]'
            }`}
          >
            Find Mentors
          </button>
          <button
            onClick={() => {
              if (!user) {
                onOpenAuth();
                return;
              }
              setActiveTab('requests');
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#1F242D] text-white'
                : 'text-[#565D6D] hover:text-[#1F242D]'
            }`}
          >
            <span>Mentorship Requests</span>
            {requests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FAF8F5] text-[#1F242D] font-bold">
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: FIND MENTORS
          ========================================================================= */}
      {activeTab === 'find-mentors' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#7E8696] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mentors by name, company, skill or engineering focus..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Industry</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                >
                  <option value="ALL">All Industries</option>
                  <option value="Technology">Technology & Software</option>
                  <option value="AI">AI & Machine Learning</option>
                  <option value="Fintech">Fintech</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                >
                  <option value="ALL">All Companies</option>
                  <option value="Microsoft">Microsoft</option>
                  <option value="Google">Google</option>
                  <option value="Swiggy">Swiggy</option>
                  <option value="Razorpay">Razorpay</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Skill</label>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                />
              </div>
            </div>
          </div>

          {/* Mentors Grid */}
          {loading ? (
            <LoadingState message="Finding available collegiate mentors..." />
          ) : mentors.length === 0 ? (
            <div className="py-16 text-center text-gray-500 font-medium">
              No alumni or faculty mentors registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#E6E1D7]"
                      />
                    </div>

                    <h3 className="text-base font-bold text-[#1F242D]">{mentor.name}</h3>
                    <p className="text-xs font-semibold text-[#5A7458]">
                      {mentor.currentRole} at {mentor.company}
                    </p>
                    <p className="text-[11px] text-[#7E8696] mt-0.5">
                      {mentor.institutionName} · {mentor.experienceYears} Years Exp
                    </p>

                    <p className="text-xs text-[#565D6D] mt-3 line-clamp-2 leading-relaxed">
                      {mentor.bio}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#E6E1D7] flex items-center justify-between text-xs text-[#565D6D]">
                      <span className="text-[#7E8696]">Active Mentees:</span>
                      <span className="font-semibold text-[#1F242D]">{mentor.activeMentees} Scholars</span>
                    </div>

                    {/* Topics/Skills */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {mentor.skills?.slice(0, 3).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#1F242D] text-[10px] font-medium border border-[#E6E1D7]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-[#FAF8F5] border-t border-[#E6E1D7] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#345932] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Accepting Mentees
                    </span>
                    <button
                      onClick={() => {
                        if (!user) {
                          onOpenAuth();
                          return;
                        }
                        setTargetMentor(mentor);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] transition-colors cursor-pointer"
                    >
                      Request Mentorship
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: MENTORSHIP REQUESTS SCREEN (STUDENT & ALUMNI VIEWS)
          ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-xs text-[#565D6D] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#1F242D]">Current View Mode: </span>
              <span className="font-semibold text-[#5A7458]">{isAlumni ? 'Alumni Mentor Review Portal' : 'Student Applications Portal'}</span>
            </div>
            <span className="text-[11px] text-[#7E8696]">
              {requests.length} Total Applications Indexed
            </span>
          </div>

          {requests.length === 0 ? (
            <EmptyState
              title="No mentorship requests yet"
              description={isAlumni ? "You don't have any incoming mentorship applications right now." : "You haven't sent any mentorship applications yet. Explore the Find Mentors tab to connect with an alumnus."}
              actionLabel={isAlumni ? undefined : "Browse Mentors"}
              onAction={() => setActiveTab('find-mentors')}
            />
          ) : (
            <div className="space-y-4">
              {requests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isAccepted = req.status === 'ACCEPTED';
                const isRejected = req.status === 'REJECTED';

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4"
                  >
                    {/* Header: Parties Involved */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E1D7] pb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={isAlumni ? req.menteeAvatar : req.mentorAvatar}
                          alt="Party"
                          className="w-12 h-12 rounded-xl object-cover border border-[#E6E1D7]"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-[#1F242D]">
                            {isAlumni ? req.menteeName : req.mentorName}
                          </h4>
                          <p className="text-xs text-[#565D6D]">
                            {isAlumni
                              ? `${req.menteeCourse} · ${req.menteeYear}`
                              : `${req.mentorRole} at ${req.mentorCompany}`}
                          </p>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <div>
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FFF6E5] text-[#8C6212] border border-[#FFE6B3] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            PENDING REVIEW
                          </span>
                        )}
                        {isAccepted && (
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ACCEPTED & ACTIVE
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FBEAEA] text-[#932F2F] border border-[#F4C5C5] flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            DECLINED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Topic & Message */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-[#7E8696] uppercase text-[10px]">Mentorship Focus:</span>
                        <p className="text-xs font-bold text-[#1F242D] mt-0.5">{req.topic}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-[#7E8696] uppercase text-[10px]">Mentee Statement:</span>
                        <p className="text-xs text-[#565D6D] mt-0.5 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#E6E1D7]">
                          "{req.message}"
                        </p>
                      </div>
                    </div>

                    {/* Notes & Meeting info if accepted */}
                    {req.notes && (
                      <div className="p-3 rounded-xl bg-[#F4F9F3] border border-[#CDE5CC] text-xs">
                        <span className="font-bold text-[#345932] block mb-0.5">Mentorship Notes & Schedule:</span>
                        <p className="text-[#565D6D]">{req.notes}</p>
                      </div>
                    )}

                    {/* Alumni action buttons */}
                    {isAlumni && isPending && (
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateRequestStatus(req.id, 'REJECTED')}
                          className="px-3 py-1.5 rounded-lg border border-[#E6E1D7] hover:bg-[#FBEAEA] hover:text-[#932F2F] text-xs font-semibold text-[#565D6D] transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleUpdateRequestStatus(req.id, 'ACCEPTED', 'Accepted! 1:1 onboarding session scheduled for this weekend.')}
                          className="px-4 py-1.5 rounded-lg bg-[#5A7458] hover:bg-[#485E46] text-white text-xs font-semibold transition-colors shadow-2xs"
                        >
                          Accept Mentorship
                        </button>
                      </div>
                    )}

                    {/* Alumni note adding option if accepted */}
                    {isAlumni && isAccepted && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setNoteModalRequest(req);
                            setNoteText(req.notes || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-xs font-semibold text-[#1F242D] hover:bg-[#EFEBE3]"
                        >
                          {req.notes ? 'Update Scheduling Notes' : 'Add Meeting Link / Notes'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          REQUEST MENTORSHIP MODAL
          ========================================================================= */}
      {targetMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F242D]">Apply for Mentorship</h3>
                <p className="text-xs text-[#565D6D]">
                  Application to {targetMentor.name} ({targetMentor.company})
                </p>
              </div>
              <button
                onClick={() => setTargetMentor(null)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EBF2EA] text-[#3D5B3B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#1F242D]">Request Submitted</h4>
                <p className="text-xs text-[#565D6D]">{requestSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="p-6 space-y-4 text-xs">
                {/* Auto-attached student profile summary */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-1">
                  <span className="text-[10px] font-bold text-[#7E8696] uppercase tracking-wider block">
                    Student Profile:
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1F242D]">{user?.name} ({user?.course || 'BSc IT'})</span>
                  </div>
                  <p className="text-[11px] text-[#7E8696]">{user?.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'}</p>
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Guidance Topic *</label>
                  <input
                    type="text"
                    required
                    value={requestTopic}
                    onChange={(e) => setRequestTopic(e.target.value)}
                    placeholder="e.g. Distributed Systems Architecture or Resume Review"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Key Learning Goals *</label>
                  <input
                    type="text"
                    required
                    value={requestGoals}
                    onChange={(e) => setRequestGoals(e.target.value)}
                    placeholder="e.g. Preparing for cloud engineering interviews by June 2026"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Detailed Message to Mentor *</label>
                  <textarea
                    rows={4}
                    required
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Describe what projects you have built, why you chose this mentor, and how often you would like to connect..."
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetMentor(null)}
                    className="px-4 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#565D6D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1F242D] text-white font-semibold hover:bg-[#343A46]"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          UPDATE NOTES MODAL (FOR ALUMNI)
          ========================================================================= */}
      {noteModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-[#1F242D]">Mentorship Schedule & Notes</h3>
            <p className="text-xs text-[#565D6D]">
              Add recurring 1:1 meeting dates, Google Meet links, or action items for {noteModalRequest.menteeName}.
            </p>
            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Bi-weekly on Saturday 10:30 AM IST. Link: https://meet.google.com/alm-..."
              className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-xs text-[#1F242D]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNoteModalRequest(null)}
                className="px-3 py-1.5 rounded-lg border border-[#E6E1D7] text-xs font-semibold text-[#565D6D]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-lg bg-[#5A7458] text-white text-xs font-semibold hover:bg-[#485E46]"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
