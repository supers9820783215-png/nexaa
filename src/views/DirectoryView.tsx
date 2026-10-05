import React, { useState, useEffect, useCallback } from 'react';
import { User, MentorshipRequest } from '../types.ts';
import { userService } from '../services/userService.ts';
import { mentorshipService } from '../services/mentorshipService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { LoadingState, EmptyState } from '../components/common/StateFeedback.tsx';
import {
  Search,
  Filter,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Building2,
  X,
  UserPlus,
  Send,
  ExternalLink,
  SlidersHorizontal,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

interface DirectoryViewProps {
  onOpenAuth: () => void;
  onNavigate?: (tab: string, extraData?: any) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({ onOpenAuth, onNavigate }) => {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [uidQuery, setUidQuery] = useState('');
  const isUnverified = Boolean(user && (!user.isVerified || user.verificationStatus !== 'VERIFIED'));
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [skillInput, setSkillInput] = useState('');

  // Selected for detailed modal
  const [selectedAlumni, setSelectedAlumni] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  // Mentorship request modal
  const [mentorshipTarget, setMentorshipTarget] = useState<User | null>(null);
  const [mentorshipTopic, setMentorshipTopic] = useState('');
  const [mentorshipMessage, setMentorshipMessage] = useState('');
  const [mentorshipSentMsg, setMentorshipSentMsg] = useState('');

  // Local connection state map
  const [connectedMap, setConnectedMap] = useState<Record<string, 'CONNECTED' | 'PENDING'>>({});

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getAlumni({
        search,
        uid: uidQuery,
        company: selectedCompany,
        industry: selectedIndustry,
        graduationYear: selectedYear,
        department: selectedDept,
        location: selectedLocation,
        skills: skillInput,
      });
      setAlumni(res);
    } catch (err) {
      console.error('Failed to fetch alumni directory:', err);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    uidQuery,
    selectedCompany,
    selectedIndustry,
    selectedYear,
    selectedDept,
    selectedLocation,
    skillInput
  ]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  const handleOpenProfile = async (alumnus: User) => {
    setSelectedAlumni(alumnus);
    const prof = await userService.getAlumniProfile(alumnus.id);
    setSelectedProfile(prof);
  };

  const handleConnect = (alumnusId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (isUnverified) {
      alert(`Institutional verification required. Your account at ${user.institutionName || 'your college'} is currently not verified. Please submit a verification request from your dashboard before connecting with alumni.`);
      return;
    }
    setConnectedMap(prev => ({ ...prev, [alumnusId]: 'PENDING' }));
  };

  const handleSendMentorshipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorshipTarget || !user) return;
    if (isUnverified) {
      alert(`Institutional verification required. Your account at ${user.institutionName || 'your college'} is currently not verified. Mentorship requests require institutional verification.`);
      return;
    }

    await mentorshipService.requestMentorship({
      mentorId: mentorshipTarget.id,
      mentorName: mentorshipTarget.name,
      mentorUid: mentorshipTarget.uid,
      mentorAvatar: mentorshipTarget.avatar,
      mentorCompany: mentorshipTarget.company || 'Enterprise',
      mentorRole: mentorshipTarget.currentRole || 'Software Professional',
      menteeId: user.id,
      menteeName: user.name,
      menteeUid: user.uid,
      menteeAvatar: user.avatar,
      menteeCourse: user.course || 'BSc Information Technology',
      menteeYear: '3rd Year',
      topic: mentorshipTopic,
      message: mentorshipMessage
    });

    setMentorshipSentMsg(`Mentorship request dispatched to ${mentorshipTarget.name}. Status: PENDING review.`);
    setTimeout(() => {
      setMentorshipSentMsg('');
      setMentorshipTarget(null);
      setMentorshipTopic('');
      setMentorshipMessage('');
    }, 2200);
  };

  const resetFilters = () => {
    setSearch('');
    setUidQuery('');
    setSelectedCompany('ALL');
    setSelectedIndustry('ALL');
    setSelectedYear('ALL');
    setSelectedDept('ALL');
    setSelectedLocation('ALL');
    setSkillInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[#E6E1D7] pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F242D] font-heading tracking-tight">
          Alumni Directory
        </h1>
        <p className="text-xs sm:text-sm text-[#565D6D] mt-1">
          Search and connect with thousands of verified collegiate alumni across companies, engineering disciplines, and industries.
        </p>
      </div>

      {/* Network Isolation & Unverified Warning */}
      {isUnverified && (
        <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] text-xs text-[#9A3412] flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-[#1F242D]">Institutional Directory Notice</h4>
            <p className="text-[#565D6D] leading-relaxed">
              Your account is currently <strong>NOT VERIFIED</strong> by {user?.institutionName || 'your college'}. Directory results are scoped to your institution workspace. Direct mentorship requests and detailed contact cards are restricted until your status is verified by campus administrators.
            </p>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="p-5 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
        {/* Row 1: Search and UID input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#7E8696] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by alumni name, job title, company..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-xs text-[#1F242D] focus:outline-hidden focus:border-[#5A7458]"
            />
          </div>
          <div className="relative">
            <span className="text-[10px] font-mono text-[#7E8696] absolute left-3 top-1/2 -translate-y-1/2 select-none">
              UID:
            </span>
            <input
              type="text"
              value={uidQuery}
              onChange={(e) => setUidQuery(e.target.value)}
              placeholder="Filter by exact or partial UID (e.g. AN-ALU-4M8Q21)..."
              className="w-full pl-12 pr-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-xs font-mono text-[#1F242D] focus:outline-hidden focus:border-[#5A7458]"
            />
          </div>
        </div>

        {/* Row 2: Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">

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
              <option value="CRED">CRED</option>
              <option value="J.P. Morgan">J.P. Morgan</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="ALL">All Industries</option>
              <option value="Technology">Technology & Software</option>
              <option value="Artificial Intelligence">AI & Machine Learning</option>
              <option value="Fintech">Fintech & Payments</option>
              <option value="Investment Banking">Banking & Finance</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Graduation Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="ALL">All Years</option>
              <option value="2018">2018</option>
              <option value="2019">2019</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="ALL">All Departments</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Management Studies">Management Studies</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="ALL">All Locations</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Row 3: Skills filter + Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E6E1D7]">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <span className="text-[10px] font-semibold text-[#7E8696] uppercase">Skill Tag:</span>
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="e.g. Distributed Systems, React, Python..."
              className="px-2.5 py-1 text-xs rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] flex-1 text-[#1F242D]"
            />
          </div>
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-[#7E8696] hover:text-[#1F242D] underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Main Alumni Cards Grid */}
      {loading ? (
        <LoadingState message="Filtering verified collegiate alumni directory..." />
      ) : alumni.length === 0 ? (
        <div className="py-16 text-center text-gray-500 font-medium">
          No alumni or faculty mentors registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumni.map((alumnus) => {
            const connectionStatus = connectedMap[alumnus.id];
            return (
              <div
                key={alumnus.id}
                onClick={() => handleOpenProfile(alumnus)}
                className="rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs hover:shadow-md hover:border-[#DCD6C9] transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="p-6">
                  {/* Card Header: Avatar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <img
                      src={alumnus.avatar}
                      alt={alumnus.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#E6E1D7] shrink-0"
                    />
                  </div>

                  <h3 className="text-base font-bold text-[#1F242D] tracking-tight">
                    {alumnus.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#5A7458]">
                    {alumnus.currentRole}
                  </p>
                  <p className="text-xs text-[#565D6D] mt-0.5">
                    {alumnus.company}
                  </p>

                  <div className="mt-3 pt-3 border-t border-[#E6E1D7] space-y-1.5 text-xs text-[#565D6D]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                      <span className="line-clamp-1">{alumnus.institutionName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                      <span>{alumnus.department} · Class of {alumnus.graduationYear}</span>
                    </div>
                    {alumnus.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                        <span>{alumnus.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills Pills */}
                  {alumnus.skills && alumnus.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {alumnus.skills.slice(0, 3).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#1F242D] text-[10px] font-medium border border-[#E6E1D7]"
                        >
                          {s}
                        </span>
                      ))}
                      {alumnus.skills.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#7E8696] text-[10px]">
                          +{alumnus.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions: Connect, Request Mentorship, View Profile */}
                <div className="px-5 py-3 bg-[#FAF8F5] border-t border-[#E6E1D7] flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProfile(alumnus);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1F242D] hover:bg-[#EFEBE3] transition-colors"
                  >
                    View Profile
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleConnect(alumnus.id, e)}
                      disabled={!!connectionStatus}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                        connectionStatus === 'PENDING'
                          ? 'bg-[#FFF6E5] text-[#8C6212] border-[#FFE6B3]'
                          : 'bg-[#FAF8F5] text-[#1F242D] border-[#E6E1D7] hover:bg-[#EFEBE3]'
                      }`}
                    >
                      {connectionStatus === 'PENDING' ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 text-[#565D6D]" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          onOpenAuth();
                          return;
                        }
                        if (isUnverified) {
                          alert(`Institutional verification required. Your account at ${user.institutionName || 'your college'} is currently not verified. 1:1 mentorship requests require campus administrative verification.`);
                          return;
                        }
                        setMentorshipTarget(alumnus);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1F242D] hover:bg-[#343A46] text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-[#8E82A8]" />
                      <span>Mentor</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          ALUMNI PROFILE DETAIL MODAL
          ========================================================================= */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedAlumni.avatar}
                  alt={selectedAlumni.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-[#E6E1D7]"
                />
                <div>
                  <h2 className="text-lg font-bold text-[#1F242D]">{selectedAlumni.name}</h2>
                  <p className="text-xs font-semibold text-[#5A7458]">
                    {selectedAlumni.currentRole} at {selectedAlumni.company}
                  </p>
                  <p className="text-xs text-[#7E8696] mt-0.5">
                    {selectedAlumni.institutionName} · Class of {selectedAlumni.graduationYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlumni(null)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div>
                <h4 className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider mb-1.5">Professional Bio</h4>
                <p className="text-xs text-[#565D6D] leading-relaxed">
                  {selectedAlumni.bio || 'Alumnus actively participating in the AlumNexa collegiate mentorship network.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Department</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">{selectedAlumni.department}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Mentorship Status</span>
                  <p className="text-xs font-bold text-[#345932] mt-0.5">✓ Accepting Mentees</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Active Mentees</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">
                    {selectedProfile ? selectedProfile.activeMentees : 4} Scholars
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider mb-2">Technical Skills & Expertise</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAlumni.skills?.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E6E1D7] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedAlumni(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565D6D] hover:bg-[#EFEBE3]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = selectedAlumni;
                  setSelectedAlumni(null);
                  setMentorshipTarget(target);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1F242D] text-white hover:bg-[#343A46]"
              >
                Request Mentorship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REQUEST MENTORSHIP MODAL
          ========================================================================= */}
      {mentorshipTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F242D]">Request 1:1 Mentorship</h3>
                <p className="text-xs text-[#565D6D]">
                  Mentoring application with {mentorshipTarget.name} ({mentorshipTarget.company})
                </p>
              </div>
              <button
                onClick={() => setMentorshipTarget(null)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mentorshipSentMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EBF2EA] text-[#3D5B3B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#1F242D]">Application Dispatched</h4>
                <p className="text-xs text-[#565D6D]">{mentorshipSentMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSendMentorshipRequest} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Primary Guidance Topic *</label>
                  <input
                    type="text"
                    required
                    value={mentorshipTopic}
                    onChange={(e) => setMentorshipTopic(e.target.value)}
                    placeholder="e.g., Cloud Architecture, Resume Review, or Interview Prep"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Statement of Purpose / Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={mentorshipMessage}
                    onChange={(e) => setMentorshipMessage(e.target.value)}
                    placeholder="Introduce yourself, your current year of study, projects built, and what specific advice you are seeking..."
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-[11px] text-[#565D6D]">
                  <span className="font-semibold text-[#1F242D] block mb-0.5">Note on Verified Mentorship:</span>
                  Requests are logged under your permanent student UID ({user?.uid || 'AN-STU-...'}). Mentors typically respond within 48-72 hours.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMentorshipTarget(null)}
                    className="px-4 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#565D6D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1F242D] text-white font-semibold hover:bg-[#343A46]"
                  >
                    Send Request
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
