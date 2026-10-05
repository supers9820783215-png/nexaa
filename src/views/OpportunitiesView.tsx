import React, { useState, useEffect, useCallback } from 'react';
import { Opportunity, OpportunityType, WorkplaceType } from '../types.ts';
import { opportunityService } from '../services/opportunityService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { LoadingState, EmptyState } from '../components/common/StateFeedback.tsx';
import {
  Briefcase,
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  Plus,
  Building2,
  Clock,
  CheckCircle2,
  X,
  Lock,
  Globe,
  DollarSign,
  GraduationCap,
  ShieldCheck,
  Send,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

interface OpportunitiesViewProps {
  onOpenAuth: () => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'ALL'>('ALL');
  const [workplaceFilter, setWorkplaceFilter] = useState<WorkplaceType | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [skillsInput, setSkillsInput] = useState('');

  // Selected for details / application
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyNote, setApplyNote] = useState('');
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  // Post Opportunity modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCompany, setPostCompany] = useState('');
  const [postType, setPostType] = useState<OpportunityType>('INTERNSHIP');
  const [postLocation, setPostLocation] = useState('Mumbai / Remote');
  const [postWorkplace, setPostWorkplace] = useState<WorkplaceType>('HYBRID');
  const [postSalary, setPostSalary] = useState('₹40,000 / month');
  const [postDept, setPostDept] = useState('Information Technology, Computer Science');
  const [postBatches, setPostBatches] = useState('2025, 2026');
  const [postSkills, setPostSkills] = useState('React, TypeScript, Python');
  const [postDeadline, setPostDeadline] = useState('2026-06-30');
  const [postLink, setPostLink] = useState('https://careers.company.com/apply');
  const [postDesc, setPostDesc] = useState('');
  const [postIsExclusive, setPostIsExclusive] = useState(false);
  const [postSuccessMsg, setPostSuccessMsg] = useState('');

  const canPost = user && (user.role === 'ALUMNI' || user.role === 'FACULTY' || user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN');

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const list = await opportunityService.getOpportunities({
        type: typeFilter,
        workplaceType: workplaceFilter,
        department: departmentFilter,
        skills: skillsInput,
        search,
      });
      setOpportunities(list);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, workplaceFilter, departmentFilter, skillsInput, search]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp || !user) return;

    await opportunityService.applyToOpportunity(selectedOpp.id, {
      applicantId: user.id,
      applicantName: user.name,
      applicantUid: user.uid,
      note: applyNote
    });

    setApplySuccessMsg(`Application logged for "${selectedOpp.title}". Referral request submitted.`);
    setTimeout(() => {
      setApplySuccessMsg('');
      setIsApplyModalOpen(false);
      setApplyNote('');
      fetchOpportunities();
    }, 2200);
  };

  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const skillsArr = postSkills.split(',').map(s => s.trim()).filter(Boolean);
    const batchesArr = postBatches.split(',').map(b => b.trim()).filter(Boolean);

    await opportunityService.createOpportunity({
      title: postTitle,
      company: postCompany,
      type: postType,
      location: postLocation,
      workplaceType: postWorkplace,
      employmentType: postType === 'INTERNSHIP' ? 'Internship' : 'Full-time',
      experienceRequired: '0 - 2 Years',
      stipendSalary: postSalary,
      departmentPreference: postDept,
      targetBatches: batchesArr,
      requiredSkills: skillsArr,
      skills: skillsArr,
      requirements: ['Enthusiasm to build and learn', 'Relevant coursework or projects'],
      deadline: postDeadline,
      description: postDesc,
      applicationLink: postLink,
      isExclusive: postIsExclusive,
      exclusiveInstitutionName: postIsExclusive ? (user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)') : undefined,
      exclusiveInstitutionId: postIsExclusive ? (user.institutionId || 'inst-dtss-01') : undefined,
      postedById: user.id,
      posterName: user.name,
      posterUid: user.uid,
      posterRole: user.role,
      posterAvatar: user.avatar || '',
      authorUid: user.uid,
      authorName: user.name,
      authorRole: user.role,
      institutionId: user.institutionId || 'inst-dtss-01',
      createdAt: new Date().toISOString(),
      institution: user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'
    });

    setPostSuccessMsg('Opportunity published to collegiate network successfully!');
    setTimeout(() => {
      setPostSuccessMsg('');
      setShowPostModal(false);
      setPostTitle('');
      setPostCompany('');
      setPostDesc('');
      fetchOpportunities();
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E1D7] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F242D] font-heading tracking-tight">
            Opportunities & Job Board
          </h1>
          <p className="text-xs sm:text-sm text-[#565D6D] mt-1">
            Browse campus placements, verified alumni referrals, engineering internships, and research grants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canPost && (
            <button
              onClick={() => setShowPostModal(true)}
              className="px-4 py-2 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#A8B2C0]" />
              <span>+ Post Opportunity</span>
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
            placeholder="Search by job title, hiring company, role keywords..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D] focus:outline-hidden"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="ALL">All Types</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="FULL_TIME">Full-time Job</option>
              <option value="REFERRAL">Alumni Referral</option>
              <option value="PROJECT">Paid Project</option>
              <option value="RESEARCH">Research Opportunity</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Workplace</label>
            <select
              value={workplaceFilter}
              onChange={(e) => setWorkplaceFilter(e.target.value as any)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="ALL">All Modes</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ON_SITE">On-site</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            >
              <option value="ALL">All Disciplines</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Management Studies">Management Studies</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Required Skill</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. React, Go, Docker"
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            />
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <LoadingState message="Loading campus opportunities and verified job postings..." />
      ) : opportunities.length === 0 ? (
        <div className="py-16 text-center text-gray-500 font-medium">
          No job or internship opportunities posted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                {/* Header: Type */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#5A7458]">
                    {opp.type.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#1F242D] leading-snug">
                  {opp.title}
                </h3>
                <p className="text-xs font-semibold text-[#5A7458] mt-0.5">
                  {opp.company}
                </p>

                {/* Posted by */}
                <div className="mt-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#7E8696] block">Posted by</span>
                    <span className="font-semibold text-[#1F242D]">{opp.postedByName || opp.posterName}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3.5 space-y-1.5 text-xs text-[#565D6D]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                    <span>{opp.location} · <span className="font-medium text-[#1F242D]">{opp.workplaceType}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                    <span className="font-semibold text-[#1F242D]">{opp.stipendSalary || opp.salaryRange || opp.stipend || 'Competitive'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                    <span>Deadline: {opp.deadline}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mt-4">
                  {(opp.requiredSkills || opp.skills || []).slice(0, 3).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#1F242D] text-[10px] border border-[#E6E1D7]"
                    >
                      {s}
                    </span>
                  ))}
                  {(opp.requiredSkills || opp.skills || []).length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#7E8696] text-[10px]">
                      +{(opp.requiredSkills || opp.skills || []).length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions: View Details / Apply */}
              <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E6E1D7] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedOpp(opp)}
                  className="px-3 py-1.5 rounded-lg border border-[#E6E1D7] hover:bg-[#EFEBE3] text-[#1F242D] text-xs font-semibold transition-colors cursor-pointer"
                >
                  View Details
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      onOpenAuth();
                      return;
                    }
                    setSelectedOpp(opp);
                    setIsApplyModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1F242D] hover:bg-[#343A46] text-white text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <span>{opp.type === 'REFERRAL' ? 'Request Referral' : 'Apply Now'}</span>
                  <ExternalLink className="w-3 h-3 text-[#A8B2C0]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          OPPORTUNITY DETAIL MODAL
          ========================================================================= */}
      {selectedOpp && !isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#5A7458] mb-1">
                  {selectedOpp.type}
                </p>
                <h2 className="text-xl font-bold text-[#1F242D]">{selectedOpp.title}</h2>
                <p className="text-xs font-semibold text-[#5A7458] mt-0.5">{selectedOpp.company} · {selectedOpp.location}</p>
              </div>
              <button
                onClick={() => setSelectedOpp(null)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div>
                <h4 className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider mb-2">Role Overview</h4>
                <p className="text-xs text-[#565D6D] leading-relaxed whitespace-pre-line">
                  {selectedOpp.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Compensation</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">{selectedOpp.stipendSalary || selectedOpp.salaryRange || selectedOpp.stipend || 'Competitive'}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Target Batches</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">{selectedOpp.targetBatches ? selectedOpp.targetBatches.join(', ') : 'All Batches'}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Application Deadline</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">{selectedOpp.deadline}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedOpp.requiredSkills || selectedOpp.skills || []).map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#7E8696]">Listing Referrer:</span>
                  <p className="text-xs font-bold text-[#1F242D]">{selectedOpp.postedByName || selectedOpp.posterName}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E6E1D7] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedOpp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565D6D] hover:bg-[#EFEBE3]"
              >
                Close
              </button>
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1F242D] text-white hover:bg-[#343A46]"
              >
                {selectedOpp.type === 'REFERRAL' ? 'Request Referral' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          APPLY / REFERRAL REQUEST MODAL
          ========================================================================= */}
      {selectedOpp && isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F242D]">
                  {selectedOpp.type === 'REFERRAL' ? 'Request Referral' : 'Apply for Opportunity'}
                </h3>
                <p className="text-xs text-[#565D6D]">
                  {selectedOpp.title} at {selectedOpp.company}
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applySuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EBF2EA] text-[#3D5B3B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#1F242D]">Application Dispatched</h4>
                <p className="text-xs text-[#565D6D]">{applySuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="p-6 space-y-4 text-xs">
                {/* Auto student info attached */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-1">
                  <span className="text-[10px] font-bold text-[#7E8696] uppercase block">
                    Applicant Information:
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1F242D]">{user?.name}</span>
                  </div>
                  <p className="text-[11px] text-[#7E8696]">{user?.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'}</p>
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">
                    {selectedOpp.type === 'REFERRAL' ? 'Pitch to Referrer *' : 'Cover Note / Portfolio Link *'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={applyNote}
                    onChange={(e) => setApplyNote(e.target.value)}
                    placeholder="Provide your GitHub/Portfolio URL, brief summary of matching skills, and why you are a top candidate..."
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#565D6D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1F242D] text-white font-semibold hover:bg-[#343A46]"
                  >
                    Confirm Submission
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          POST OPPORTUNITY MODAL (FACULTY / ALUMNI / ADMIN ONLY)
          ========================================================================= */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F242D]">Post Career Opportunity</h3>
                <p className="text-xs text-[#565D6D]">Publish an internship, full-time role, or alumni referral.</p>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postSuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EBF2EA] text-[#3D5B3B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#1F242D]">Opportunity Published</h4>
                <p className="text-xs text-[#565D6D]">{postSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handlePostOpportunity} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Opportunity Title *</label>
                    <input
                      type="text"
                      required
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="e.g., Associate Cloud Solutions Engineer"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Hiring Organization / Company *</label>
                    <input
                      type="text"
                      required
                      value={postCompany}
                      onChange={(e) => setPostCompany(e.target.value)}
                      placeholder="e.g., Razorpay / Microsoft"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Opportunity Type</label>
                    <select
                      value={postType}
                      onChange={(e) => setPostType(e.target.value as OpportunityType)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    >
                      <option value="INTERNSHIP">Internship</option>
                      <option value="FULL_TIME">Full-time Job</option>
                      <option value="REFERRAL">Alumni Referral</option>
                      <option value="PROJECT">Paid Project</option>
                      <option value="RESEARCH">Research</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Workplace Mode</label>
                    <select
                      value={postWorkplace}
                      onChange={(e) => setPostWorkplace(e.target.value as WorkplaceType)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    >
                      <option value="HYBRID">Hybrid</option>
                      <option value="REMOTE">Remote</option>
                      <option value="ON_SITE">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Salary / Stipend</label>
                    <input
                      type="text"
                      value={postSalary}
                      onChange={(e) => setPostSalary(e.target.value)}
                      placeholder="e.g. ₹45,000 / month"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Location</label>
                    <input
                      type="text"
                      value={postLocation}
                      onChange={(e) => setPostLocation(e.target.value)}
                      placeholder="Mumbai / Bengaluru"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Application Deadline</label>
                    <input
                      type="date"
                      value={postDeadline}
                      onChange={(e) => setPostDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Target Batches (comma separated)</label>
                    <input
                      type="text"
                      value={postBatches}
                      onChange={(e) => setPostBatches(e.target.value)}
                      placeholder="2025, 2026"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Required Skills (comma separated)</label>
                    <input
                      type="text"
                      value={postSkills}
                      onChange={(e) => setPostSkills(e.target.value)}
                      placeholder="React, TypeScript, SQL"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Job Description & Qualifications *</label>
                  <textarea
                    rows={4}
                    required
                    value={postDesc}
                    onChange={(e) => setPostDesc(e.target.value)}
                    placeholder="State responsibilities, day-to-day work, minimum GPA or requirements..."
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#565D6D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1F242D] text-white font-semibold hover:bg-[#343A46]"
                  >
                    Publish Listing
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
