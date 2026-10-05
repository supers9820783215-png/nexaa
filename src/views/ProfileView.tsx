import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { userService } from '../services/userService.ts';
import { institutionService } from '../services/institutionService.ts';
import { UserUIDBadge } from '../components/common/UserUIDBadge.tsx';
import {
  User as UserIcon,
  GraduationCap,
  Briefcase,
  MapPin,
  Save,
  CheckCircle2,
  ShieldCheck,
  HeartHandshake,
  Globe,
  Mail,
  Lock,
  MessageSquare,
  Building2,
  Sliders,
  Sparkles,
  Clock,
  AlertTriangle,
  BookOpen,
  Plus,
  X
} from 'lucide-react';

interface ProfileViewProps {
  onOpenAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAuth }) => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.currentRole ? `${user.currentRole}${user.company ? ` at ${user.company}` : ''}` : '');
  const [company, setCompany] = useState(user?.company || '');
  const [currentRole, setCurrentRole] = useState(user?.currentRole || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [department, setDepartment] = useState(user?.department || 'Information Technology');
  const [course, setCourse] = useState(user?.course || 'BSc Information Technology');
  const [graduationYear, setGraduationYear] = useState(String(user?.graduationYear || new Date().getFullYear()));
  const [location, setLocation] = useState(user?.location || '');
  const [skillsStr, setSkillsStr] = useState(user?.skills ? user.skills.join(', ') : '');
  const [mentorshipAvailability, setMentorshipAvailability] = useState(true);

  // Social / External links
  const [instagramUrl, setInstagramUrl] = useState(user?.instagram || '');
  const [youtubeUrl, setYoutubeUrl] = useState(user?.youtube || '');
  const [customLinkTitle, setCustomLinkTitle] = useState(user?.customLinkTitle || 'Personal Portfolio');
  const [customLinkUrl, setCustomLinkUrl] = useState(user?.customLinkUrl || user?.portfolio || '');

  // Course offerings management (for College Admin)
  const [collegeCourses, setCollegeCourses] = useState<string[]>([]);
  const [newCourseInput, setNewCourseInput] = useState('');

  // Privacy settings
  const [visibility, setVisibility] = useState<'PUBLIC' | 'INSTITUTION_ONLY'>('PUBLIC');
  const [allowDMs, setAllowDMs] = useState(true);
  const [showEmailPublicly, setShowEmailPublicly] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCompany(user.company || '');
      setCurrentRole(user.currentRole || '');
      setBio(user.bio || '');
      setDepartment(user.department || 'Commerce');
      setCourse(user.course || 'B.Com');
      setGraduationYear(String(user.graduationYear || 2026));
      setLocation(user.location || 'Mumbai, India');
      if (user.skills) setSkillsStr(user.skills.join(', '));
      setInstagramUrl(user.instagram || '');
      setYoutubeUrl(user.youtube || '');
      setCustomLinkTitle(user.customLinkTitle || 'Personal Portfolio');
      setCustomLinkUrl(user.customLinkUrl || user.portfolio || '');

      if (user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN') {
        institutionService.getCourses(user.institutionId || 'inst-dtss-01').then(setCollegeCourses);
      }
    }
  }, [user]);

  const handleAddCourse = async () => {
    if (!newCourseInput.trim()) return;
    const updated = await institutionService.addCourse(user?.institutionId || 'inst-dtss-01', newCourseInput.trim());
    setCollegeCourses(updated);
    setNewCourseInput('');
  };

  const handleRemoveCourse = async (courseName: string) => {
    const updated = await institutionService.removeCourse(user?.institutionId || 'inst-dtss-01', courseName);
    setCollegeCourses(updated);
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <UserIcon className="w-12 h-12 text-[#7E8696] mx-auto" />
        <h2 className="text-xl font-bold text-[#1F242D]">Sign In Required</h2>
        <p className="text-xs text-[#565D6D]">Please sign in to view and manage your verified collegiate profile.</p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46]"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const skillsArr = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    const updated = await userService.updateProfile(user.id, {
      name,
      company: user.role === 'ALUMNI' ? company : undefined,
      currentRole,
      bio,
      department,
      course,
      graduationYear: Number(graduationYear),
      location,
      skills: skillsArr,
      instagram: instagramUrl,
      youtube: youtubeUrl,
      customLinkTitle,
      customLinkUrl,
      portfolio: customLinkUrl
    });

    updateUser(updated);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E6E1D7] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[#5A7458] uppercase tracking-wider">
            Verified Identity
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD]">
            PERMANENT ACADEMIC ID
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F242D] font-heading tracking-tight">
          Profile & Privacy Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#565D6D] mt-1">
          Manage your verified collegiate identity, bio, skills, and institutional visibility.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Read-only Identity Card */}
        <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border border-[#E6E1D7]"
              />
              <div>
                <h3 className="text-base font-bold text-[#1F242D]">{user.name}</h3>
                <p className="text-xs text-[#565D6D]">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <UserUIDBadge
                    uid={user.uid}
                    role={user.role}
                    size="md"
                    isVerified={user.isVerified}
                    verificationStatus={user.verificationStatus}
                  />
                </div>

                {user.role !== 'SUPER_ADMIN' && user.role !== 'INSTITUTION_ADMIN' && (!user.isVerified || user.verificationStatus !== 'VERIFIED') && (
                  <div className="mt-2.5">
                    {user.verificationStatus === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF6E5] text-[#8C6212] text-[11px] font-semibold border border-[#FFE6B3]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Verification Under Review</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await userService.requestVerification();
                          updateUser({ ...user, verificationStatus: 'PENDING', isVerified: false });
                          alert(res.message || 'Verification request submitted to your college administration.');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Request for Verification</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] text-xs space-y-1">
              <span className="text-[10px] text-[#7E8696] uppercase font-bold block">Institution Affiliation</span>
              <p className="font-bold text-[#1F242D] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#5A7458]" />
                <span>{user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'}</span>
              </p>
              {user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN' ? (
                user.isVerified ? (
                  <span className="text-[10px] text-[#345932] font-semibold block">✓ Verified Campus Member</span>
                ) : (
                  <span className="text-[10px] text-[#C2410C] font-semibold block">
                    Status: {user.verificationStatus === 'PENDING' ? 'Verification Pending' : 'Not Verified'}
                  </span>
                )
              ) : (
                <span className="text-[10px] text-[#5A7458] font-semibold block">Autonomous Higher Educational Institution</span>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
          <h4 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider">
            Public Credentials
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1F242D] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1F242D] mb-1">Headline / Role Subtitle</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
              />
            </div>
          </div>

          {user.role === 'ALUMNI' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1F242D] mb-1">Current Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Microsoft / Swiggy"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#1F242D] mb-1">Job Title</label>
                <input
                  type="text"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                />
              </div>
            </div>
          )}

          <div className="text-xs">
            <label className="block font-semibold text-[#1F242D] mb-1">Bio / Statement of Purpose</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief professional or academic summary..."
              className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            />
          </div>

          {/* Academic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#1F242D] mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1F242D] mb-1">Course / Program</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1F242D] mb-1">Graduation Year</label>
              <input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-[#1F242D] mb-1">Skills (comma separated)</label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g. React, Docker, Python, SQL"
              className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
            />
          </div>
        </div>

        {/* External Links (Alumni, Faculty, and Admin Only - Hidden for Students) */}
        {user.role !== 'STUDENT' && (
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
            <h4 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider">
              External Links
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1F242D] mb-1">Instagram URL</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#1F242D] mb-1">YouTube Channel URL</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@channel"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                />
              </div>
            </div>

            {/* Dynamic Custom Link / Personal Portfolio */}
            <div className="pt-3 border-t border-[#E6E1D7] space-y-2 text-xs">
              <span className="block font-semibold text-[#1F242D]">
                Personal Link / Portfolio
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#7E8696] mb-1">1) Link Title / Heading</label>
                  <input
                    type="text"
                    value={customLinkTitle}
                    onChange={(e) => setCustomLinkTitle(e.target.value)}
                    placeholder="e.g. Personal Website, Portfolio, Blog"
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#7E8696] mb-1">2) Target URL</label>
                  <input
                    type="url"
                    value={customLinkUrl}
                    onChange={(e) => setCustomLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F242D]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Course / Department Offerings Management (Admin Only) */}
        {(user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN') && (
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#5A7458]" />
                <span>College Offerings / Courses & Departments</span>
              </h4>
              <p className="text-xs text-[#565D6D] mt-0.5">
                Manage all registered degree streams and departmental courses for {user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'}.
              </p>
            </div>

            {/* Course tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {collegeCourses.length === 0 ? (
                <p className="text-xs text-[#7E8696] italic">No custom courses added yet.</p>
              ) : (
                collegeCourses.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DCD6C9] text-xs font-semibold text-[#1F242D]"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCourse(c)}
                      className="text-[#7E8696] hover:text-rose-600 transition-colors cursor-pointer"
                      title={`Remove ${c}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add course input */}
            <div className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                value={newCourseInput}
                onChange={(e) => setNewCourseInput(e.target.value)}
                placeholder="e.g. B.Com, BMS, BSc IT, BAF, BSc CS, M.Com"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCourse();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddCourse()}
                className="px-4 py-2 bg-[#1F242D] hover:bg-[#343A46] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Course / Department</span>
              </button>
            </div>
          </div>
        )}

        {/* Alumni Mentorship Availability (Alumni Only) */}
        {user.role === 'ALUMNI' && (
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#1F242D] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#8E82A8]" />
                <span>Mentorship Availability</span>
              </h4>
              <p className="text-xs text-[#565D6D] mt-0.5">
                When enabled, students from verified institutions can apply for 1:1 mentorship guidance.
              </p>
            </div>
            <input
              type="checkbox"
              checked={mentorshipAvailability}
              onChange={(e) => setMentorshipAvailability(e.target.checked)}
              className="w-5 h-5 accent-[#1F242D] cursor-pointer"
            />
          </div>
        )}

        {/* Privacy Settings */}
        <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs space-y-4 text-xs">
          <h4 className="text-sm font-bold text-[#1F242D] uppercase tracking-wider">
            Privacy & Permissions
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
              <div>
                <span className="font-semibold text-[#1F242D] block">Profile Visibility</span>
                <span className="text-[11px] text-[#7E8696]">Restrict profile view to members of your verified institution only</span>
              </div>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-[#FCFBF8] border border-[#E6E1D7] text-[#1F242D]"
              >
                <option value="PUBLIC">Public to All Verified Colleges</option>
                <option value="INSTITUTION_ONLY">My Institution Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
              <div>
                <span className="font-semibold text-[#1F242D] block">Allow Direct Messaging</span>
                <span className="text-[11px] text-[#7E8696]">Permit other verified students & alumni to initiate direct chats</span>
              </div>
              <input
                type="checkbox"
                checked={allowDMs}
                onChange={(e) => setAllowDMs(e.target.checked)}
                className="w-4 h-4 accent-[#1F242D] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
              <div>
                <span className="font-semibold text-[#1F242D] block">Show Email Publicly</span>
                <span className="text-[11px] text-[#7E8696]">Display your official collegiate email address on your directory profile</span>
              </div>
              <input
                type="checkbox"
                checked={showEmailPublicly}
                onChange={(e) => setShowEmailPublicly(e.target.checked)}
                className="w-4 h-4 accent-[#1F242D] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs font-semibold text-[#345932] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile settings saved successfully!</span>
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#1F242D] hover:bg-[#343A46] text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#A8B2C0]" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
