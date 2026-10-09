import React, { useState, useEffect } from 'react';
import { Opportunity, OpportunityType, WorkplaceType } from '../types.ts';
import { opportunityService } from '../services/opportunityService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { LoadingState } from '../components/common/StateFeedback.tsx';
import { UserAvatar } from '../components/common/UserAvatar.tsx';
import {
  Briefcase,
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  Plus,
  CheckCircle2,
  X,
  DollarSign,
  Trash2
} from 'lucide-react';

interface OpportunitiesViewProps {
  onOpenAuth: () => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab: All Opportunities vs Jobs Posted by Me (for Alumni / Faculty)
  const [viewTab, setViewTab] = useState<'ALL' | 'MY_POSTS'>('ALL');

  // Filters - default to ALL / empty so newly created posts are never blocked
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
  const [postEmploymentType, setPostEmploymentType] = useState('Full-time');
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

  const canPost = Boolean(
    user && (user.role === 'ALUMNI' || user.role === 'FACULTY' || user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN')
  );

  // Real-time subscription to opportunities with unrestricted visibility
  useEffect(() => {
    setLoading(true);
    const unsubscribe = opportunityService.subscribeOpportunities((list) => {
      setOpportunities(list);
      setLoading(false);
    }, {
      type: typeFilter,
      workplaceType: workplaceFilter,
      department: departmentFilter,
      skills: skillsInput,
      search,
    });

    return () => {
      unsubscribe();
    };
  }, [typeFilter, workplaceFilter, departmentFilter, skillsInput, search]);

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
      workplace: postWorkplace,
      workplaceType: postWorkplace,
      employmentType: postEmploymentType || (postType === 'INTERNSHIP' ? 'Internship' : 'Full-time'),
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
      exclusiveInstitutionId: postIsExclusive ? (user.institutionId || 'GLOBAL') : undefined,
      postedBy: user.uid,
      postedById: user.id,
      posterName: user.name,
      posterUid: user.uid,
      posterRole: user.role,
      posterAvatar: user.avatar || '',
      authorUid: user.uid,
      authorName: user.name,
      authorRole: user.role,
      institutionId: user.institutionId || 'GLOBAL',
      createdAt: new Date().toISOString(),
      institution: user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
      status: 'active'
    });

    setPostSuccessMsg('Opportunity published to collegiate network successfully!');
    setTimeout(() => {
      setPostSuccessMsg('');
      setShowPostModal(false);
      setPostTitle('');
      setPostCompany('');
      setPostDesc('');
      setPostLink('https://careers.company.com/apply');
    }, 1500);
  };

  const handleDeleteOpportunity = async (oppId: string, oppTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${oppTitle}"? This will remove the listing permanently.`)) {
      return;
    }
    try {
      await opportunityService.deleteOpportunity(oppId);
    } catch (err) {
      console.error('Failed to delete opportunity:', err);
    }
  };

  // Filter based on viewTab (ALL vs MY_POSTS)
  const myPostsCount = opportunities.filter(o =>
    user && (
      (o.postedBy && (o.postedBy === user.uid || o.postedBy === user.id)) ||
      (o.posterUid && (o.posterUid === user.uid || o.posterUid === user.id)) ||
      (o.postedById && (o.postedById === user.id || o.postedById === user.uid)) ||
      (o.authorUid && (o.authorUid === user.uid || o.authorUid === user.id))
    )
  ).length;

  const displayedOpportunities = opportunities.filter(opp => {
    if (viewTab === 'MY_POSTS') {
      if (!user) return false;
      return (
        (opp.postedBy && (opp.postedBy === user.uid || opp.postedBy === user.id)) ||
        (opp.posterUid && (opp.posterUid === user.uid || opp.posterUid === user.id)) ||
        (opp.postedById && (opp.postedById === user.id || opp.postedById === user.uid)) ||
        (opp.authorUid && (opp.authorUid === user.uid || opp.authorUid === user.id))
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E1D7] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F242D] tracking-tight">
            Opportunities & Job Board
          </h1>
          <p className="text-xs text-[#565D6D] mt-0.5">
            Verified campus placements, alumni referrals, engineering internships, and research grants.
          </p>
        </div>

        {canPost && (
          <button
            onClick={() => setShowPostModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#A8B2C0]" />
            <span>+ Post Opportunity</span>
          </button>
        )}
      </div>

      {/* Alumni / Faculty Filter Tabs: All Opportunities vs Jobs Posted by Me */}
      {canPost && (
        <div className="flex items-center gap-2 border-b border-[#E6E1D7] pb-2.5">
          <button
            onClick={() => setViewTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewTab === 'ALL'
                ? 'bg-[#1F242D] text-white shadow-2xs'
                : 'bg-[#FAF8F5] text-[#565D6D] hover:bg-[#EFEBE3] border border-[#E6E1D7]'
            }`}
          >
            <span>All Opportunities</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                viewTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#E6E1D7] text-[#1F242D]'
              }`}
            >
              {opportunities.length}
            </span>
          </button>

          <button
            onClick={() => setViewTab('MY_POSTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewTab === 'MY_POSTS'
                ? 'bg-[#1F242D] text-white shadow-2xs'
                : 'bg-[#FAF8F5] text-[#565D6D] hover:bg-[#EFEBE3] border border-[#E6E1D7]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-[#5A7458]" />
            <span>Jobs Posted by Me</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                viewTab === 'MY_POSTS' ? 'bg-white/20 text-white' : 'bg-[#E6E1D7] text-[#1F242D]'
              }`}
            >
              {myPostsCount}
            </span>
          </button>
        </div>
      )}

      {/* Filter Panel & Search Bar */}
      <div className="p-4 rounded-xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-3">
        {/* Search Bar with prominent Post Button beside it */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7E8696] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, hiring company, role keywords..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D] focus:outline-hidden"
            />
          </div>
          {canPost && (
            <button
              onClick={() => setShowPostModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#A8B2C0]" />
              <span>+ Add Job Opening</span>
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
              <option value="JOB">Job</option>
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
              <option value="Commerce">Commerce</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#7E8696] uppercase mb-1">Required Skill</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. React, Python"
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            />
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <LoadingState message="Loading campus opportunities and verified job postings..." />
      ) : displayedOpportunities.length === 0 ? (
        <div className="py-12 text-center text-[#7E8696] font-medium bg-[#FCFBF8] border border-[#E6E1D7] rounded-xl p-6 space-y-2.5">
          <Briefcase className="w-9 h-9 text-[#A8B2C0] mx-auto" />
          <h3 className="text-sm font-bold text-[#1F242D]">
            {viewTab === 'MY_POSTS' ? 'You have not posted any opportunities yet.' : 'No opportunities found.'}
          </h3>
          <p className="text-xs text-[#565D6D] max-w-sm mx-auto">
            {viewTab === 'MY_POSTS'
              ? 'Click "+ Post Opportunity" to share openings, internships, or referral opportunities.'
              : 'Try clearing your filters or check back later for newly published collegiate positions.'}
          </p>
          {canPost && viewTab === 'MY_POSTS' && (
            <button
              onClick={() => setShowPostModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer mt-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#A8B2C0]" />
              <span>Post Your First Job</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayedOpportunities.map((opp) => {
            const isOwner = Boolean(
              user && (
                (opp.postedBy && (opp.postedBy === user.uid || opp.postedBy === user.id)) ||
                (opp.posterUid && (opp.posterUid === user.uid || opp.posterUid === user.id)) ||
                (opp.postedById && (opp.postedById === user.id || opp.postedById === user.uid)) ||
                (opp.authorUid && (opp.authorUid === user.uid || opp.authorUid === user.id))
              )
            );
            const posterDisplayName = opp.postedByName || opp.posterName || opp.authorName || 'Alumni Member';
            const posterRoleLabel = opp.postedByRole || opp.posterRole || opp.authorRole || 'ALUMNI';

            return (
              <div
                key={opp.id}
                className="rounded-xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EBF2EA] text-[#3D5B3B] border border-[#CFE1CD]">
                        {opp.type.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF8F5] text-[#565D6D] border border-[#E6E1D7]">
                        {opp.workplaceType || opp.workplace || 'HYBRID'}
                      </span>
                      {isOwner && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8EFF7] text-[#2A537A] border border-[#BACFE6]">
                          Your Listing
                        </span>
                      )}
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteOpportunity(opp.id, opp.title)}
                        title="Delete Listing"
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#1F242D] leading-snug">
                    {opp.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#5A7458] mt-0.5">
                    {opp.company}
                  </p>

                  {/* Poster Initials Badge with UserAvatar */}
                  <div className="mt-3 p-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar name={posterDisplayName} size="sm" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#7E8696] block truncate leading-none mb-0.5">Posted by</span>
                        <span className="font-semibold text-[#1F242D] block truncate leading-none">{posterDisplayName}</span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#EAE7DF] text-[#565D6D] shrink-0">
                      {posterRoleLabel}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-3 space-y-1 text-xs text-[#565D6D]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                      <span>{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                      <span className="font-semibold text-[#1F242D]">
                        {opp.stipendSalary || opp.salaryRange || opp.stipend || 'Competitive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#7E8696] shrink-0" />
                      <span>Deadline: <span className="font-medium text-[#1F242D]">{opp.deadline || 'Rolling'}</span></span>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-1.5 text-[#2A537A] font-semibold text-[11px] pt-0.5">
                        <span>Applicants Tracked: {opp.applicantsCount || 0}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(opp.requiredSkills || opp.skills || []).slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#1F242D] text-[10px] border border-[#E6E1D7]"
                      >
                        {s}
                      </span>
                    ))}
                    {(opp.requiredSkills || opp.skills || []).length > 3 && (
                      <span className="px-1 py-0.5 rounded bg-[#FAF8F5] text-[#7E8696] text-[10px]">
                        +{(opp.requiredSkills || opp.skills || []).length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: View Details / Apply */}
                <div className="px-5 py-3 bg-[#FAF8F5] border-t border-[#E6E1D7] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedOpp(opp)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E6E1D7] hover:bg-[#EFEBE3] text-[#1F242D] text-xs font-semibold transition-colors cursor-pointer"
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
                    className="px-3 py-1.5 rounded-lg bg-[#1F242D] hover:bg-[#343A46] text-white text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>{opp.type === 'REFERRAL' ? 'Request Referral' : 'Apply / Details'}</span>
                    <ExternalLink className="w-3 h-3 text-[#A8B2C0]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          OPPORTUNITY DETAIL MODAL
          ========================================================================= */}
      {selectedOpp && !isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#5A7458] mb-0.5">
                  {selectedOpp.type}
                </p>
                <h2 className="text-lg font-bold text-[#1F242D]">{selectedOpp.title}</h2>
                <p className="text-xs font-semibold text-[#5A7458] mt-0.5">{selectedOpp.company} · {selectedOpp.location}</p>
              </div>
              <button
                onClick={() => setSelectedOpp(null)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <h4 className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider mb-1.5">Role Overview</h4>
                <p className="text-xs text-[#565D6D] leading-relaxed whitespace-pre-line">
                  {selectedOpp.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Compensation</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">{selectedOpp.stipendSalary || selectedOpp.salaryRange || selectedOpp.stipend || 'Competitive'}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Target Batches</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">{selectedOpp.targetBatches ? selectedOpp.targetBatches.join(', ') : 'All Batches'}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7]">
                  <span className="text-[10px] text-[#7E8696]">Application Deadline</span>
                  <p className="text-xs font-bold text-[#1F242D] mt-0.5">{selectedOpp.deadline}</p>
                </div>
              </div>

              {selectedOpp.applicationLink && (
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-[#7E8696] block">Direct Application Link / Email</span>
                    <p className="text-xs font-semibold text-[#1F242D] truncate">{selectedOpp.applicationLink}</p>
                  </div>
                  {selectedOpp.applicationLink.startsWith('http') && (
                    <a
                      href={selectedOpp.applicationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-[#1F242D] text-white font-semibold text-[11px] flex items-center gap-1 shrink-0"
                    >
                      <span>Visit Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-[11px] font-bold text-[#7E8696] uppercase tracking-wider mb-1.5">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedOpp.requiredSkills || selectedOpp.skills || []).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserAvatar name={selectedOpp.postedByName || selectedOpp.posterName} size="md" />
                  <div>
                    <span className="text-[10px] text-[#7E8696]">Listing Poster:</span>
                    <p className="text-xs font-bold text-[#1F242D]">{selectedOpp.postedByName || selectedOpp.posterName}</p>
                    <span className="text-[10px] text-[#5A7458] font-semibold">{selectedOpp.postedByRole || selectedOpp.posterRole || 'ALUMNI'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] border-t border-[#E6E1D7] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedOpp(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#565D6D] hover:bg-[#EFEBE3] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1F242D] text-white hover:bg-[#343A46] cursor-pointer"
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
            <div className="p-4 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1F242D]">
                  {selectedOpp.type === 'REFERRAL' ? 'Request Referral' : 'Apply for Opportunity'}
                </h3>
                <p className="text-xs text-[#565D6D]">
                  {selectedOpp.title} at {selectedOpp.company}
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applySuccessMsg ? (
              <div className="p-6 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-[#EBF2EA] text-[#3D5B3B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#1F242D]">Application Dispatched</h4>
                <p className="text-xs text-[#565D6D]">{applySuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="p-5 space-y-3.5 text-xs">
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] space-y-0.5">
                  <span className="text-[10px] font-bold text-[#7E8696] uppercase block">
                    Applicant Information:
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1F242D]">{user?.name}</span>
                    <span className="text-[10px] text-[#5A7458] font-bold">{user?.role}</span>
                  </div>
                  <p className="text-[11px] text-[#7E8696]">{user?.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'}</p>
                </div>

                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">
                    {selectedOpp.type === 'REFERRAL' ? 'Pitch to Referrer *' : 'Cover Note / Resume & Portfolio Link *'}
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

                <div className="pt-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#565D6D] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-[#1F242D] text-white font-semibold hover:bg-[#343A46] cursor-pointer"
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
          <div className="w-full max-w-xl rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-[#E6E1D7] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F242D]">Post Career Opportunity</h3>
                <p className="text-xs text-[#565D6D]">Publish an internship, full-time role, or alumni referral directly to students & alumni.</p>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postSuccessMsg ? (
              <div className="p-6 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-[#EBF2EA] text-[#3D5B3B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#1F242D]">Opportunity Published</h4>
                <p className="text-xs text-[#565D6D]">{postSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handlePostOpportunity} className="p-5 overflow-y-auto space-y-3.5 text-xs">
                {/* Title & Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Job / Opportunity Title *</label>
                    <input
                      type="text"
                      required
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="e.g. Associate Cloud Solutions Engineer"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Company / Hiring Organization *</label>
                    <input
                      type="text"
                      required
                      value={postCompany}
                      onChange={(e) => setPostCompany(e.target.value)}
                      placeholder="e.g. Razorpay / Microsoft"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                {/* Type, Employment Type & Workplace Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Opportunity Type *</label>
                    <select
                      value={postType}
                      onChange={(e) => setPostType(e.target.value as OpportunityType)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    >
                      <option value="INTERNSHIP">Internship</option>
                      <option value="FULL_TIME">Full-time Job</option>
                      <option value="REFERRAL">Alumni Referral</option>
                      <option value="PROJECT">Paid Project</option>
                      <option value="RESEARCH">Research</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Employment Type</label>
                    <select
                      value={postEmploymentType}
                      onChange={(e) => setPostEmploymentType(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract / Project</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Workplace Mode *</label>
                    <select
                      value={postWorkplace}
                      onChange={(e) => setPostWorkplace(e.target.value as WorkplaceType)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    >
                      <option value="HYBRID">Hybrid</option>
                      <option value="REMOTE">Remote</option>
                      <option value="ON_SITE">On-site</option>
                    </select>
                  </div>
                </div>

                {/* Stipend/Salary & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Stipend / Salary *</label>
                    <input
                      type="text"
                      value={postSalary}
                      onChange={(e) => setPostSalary(e.target.value)}
                      placeholder="e.g. ₹45,000 / month or ₹8 - 12 LPA"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Location *</label>
                    <input
                      type="text"
                      value={postLocation}
                      onChange={(e) => setPostLocation(e.target.value)}
                      placeholder="e.g. Mumbai, Bengaluru, or Remote"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                {/* Application Link / Email & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Application Link / Email *</label>
                    <input
                      type="text"
                      required
                      value={postLink}
                      onChange={(e) => setPostLink(e.target.value)}
                      placeholder="e.g. https://careers.company.com/apply or jobs@company.com"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Application Deadline</label>
                    <input
                      type="date"
                      value={postDeadline}
                      onChange={(e) => setPostDeadline(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                {/* Target Batches & Required Skills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Target Batches</label>
                    <input
                      type="text"
                      value={postBatches}
                      onChange={(e) => setPostBatches(e.target.value)}
                      placeholder="2025, 2026"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1F242D] mb-1">Required Skills</label>
                    <input
                      type="text"
                      value={postSkills}
                      onChange={(e) => setPostSkills(e.target.value)}
                      placeholder="React, TypeScript, SQL"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-[#1F242D] mb-1">Job Description & Qualifications *</label>
                  <textarea
                    rows={4}
                    required
                    value={postDesc}
                    onChange={(e) => setPostDesc(e.target.value)}
                    placeholder="State responsibilities, day-to-day work, minimum qualifications or requirements..."
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>

                <div className="pt-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#565D6D] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-[#1F242D] text-white font-semibold hover:bg-[#343A46] cursor-pointer"
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
