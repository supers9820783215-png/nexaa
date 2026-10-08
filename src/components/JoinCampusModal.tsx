import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { institutionService } from '../services/institutionService.ts';
import { Institution } from '../types.ts';
import { mockInstitutions } from '../data/institutions.ts';
import { db } from '../lib/firebase.ts';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Building2,
  GraduationCap,
  Briefcase,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  Sparkles,
  School
} from 'lucide-react';

interface JoinCampusModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onNavigate?: (tab: string) => void;
}

export const JoinCampusModal: React.FC<JoinCampusModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { user, joinCampus } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>(mockInstitutions);
  
  // Campus selection: Primary (DTSS) vs Other College
  const [campusType, setCampusType] = useState<'PRIMARY' | 'OTHER'>('PRIMARY');
  const [customCollegeName, setCustomCollegeName] = useState('');

  // Role selection
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'ALUMNI' | 'FACULTY'>(() => {
    if (user?.role === 'FACULTY') return 'FACULTY';
    if (user?.role === 'ALUMNI') return 'ALUMNI';
    return 'STUDENT';
  });

  // Faculty Department options (Requirement 4)
  const [facultyDept, setFacultyDept] = useState<'Information Technology Department' | 'Self Finance Department' | 'Commerce Department'>('Information Technology Department');

  // Student Year selection (Requirement 3: FY, SY, TY)
  const [studentYear, setStudentYear] = useState<'FY' | 'SY' | 'TY'>('FY');

  // Shared academic fields
  const [course, setCourse] = useState('');
  const [graduationYear, setGraduationYear] = useState(String(new Date().getFullYear()));
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');

  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [isCustomCourse, setIsCustomCourse] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    institutionService.getInstitutions().then(list => {
      if (isMounted && list && list.length > 0) {
        const filtered = list.filter(inst => {
          const name = (inst.name || '').toLowerCase();
          return !name.includes('birla institute') && !name.includes('delhi university');
        });
        setInstitutions(filtered);
      }
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (campusType === 'PRIMARY') {
      institutionService.getCourses('inst-dtss-01').then(courses => {
        if (isMounted) {
          setAvailableCourses(courses || []);
        }
      });
    } else {
      setAvailableCourses([]);
    }
    return () => { isMounted = false; };
  }, [campusType]);

  // When switching to Other College, lock out FACULTY role
  useEffect(() => {
    if (campusType === 'OTHER' && selectedRole === 'FACULTY') {
      setSelectedRole('STUDENT');
    }
  }, [campusType, selectedRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const isOtherCollege = campusType === 'OTHER';
      const instId = isOtherCollege ? 'other-college' : 'inst-dtss-01';
      const instName = isOtherCollege
        ? (customCollegeName.trim() || 'Other College')
        : 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)';

      // Verification handling: Other College = Free User (Verified immediately, bypasses queue)
      const isVerified = isOtherCollege;
      const verificationStatus = isOtherCollege ? ('VERIFIED' as const) : ('PENDING' as const);

      // Validate inputs based on role
      let finalDepartment: string | undefined = undefined;
      let finalGradYear: number | undefined;

      if (selectedRole === 'FACULTY') {
        if (isOtherCollege) {
          throw new Error('Faculty registration is only available for DTSS College of Commerce.');
        }
        finalDepartment = facultyDept;
        finalGradYear = undefined;
      } else if (selectedRole === 'STUDENT') {
        const currentYear = new Date().getFullYear();
        finalGradYear = studentYear === 'TY' ? currentYear : studentYear === 'SY' ? currentYear + 1 : currentYear + 2;
      } else if (selectedRole === 'ALUMNI') {
        if (!graduationYear.trim()) {
          throw new Error('Please enter your passing / graduation year.');
        }
        finalGradYear = Number(graduationYear.trim()) || 2024;
      }

      // Update Firestore users/{currentUser.uid}
      if (user?.id) {
        try {
          const firestoreUpdates: Record<string, any> = {
            institutionId: instId,
            institutionName: instName,
            role: selectedRole,
            isOnboardingComplete: true,
            isVerified,
            verificationStatus,
            isFreeUser: isOtherCollege,
            campusType
          };

          if (finalDepartment) {
            firestoreUpdates.department = finalDepartment;
          }

          if (selectedRole === 'STUDENT') {
            firestoreUpdates.classYear = studentYear;
            firestoreUpdates.graduationYear = finalGradYear;
            if (course.trim()) firestoreUpdates.course = course.trim();
          } else if (selectedRole === 'ALUMNI') {
            firestoreUpdates.graduationYear = finalGradYear;
            if (course.trim()) firestoreUpdates.course = course.trim();
            if (company.trim()) firestoreUpdates.company = company.trim();
            if (designation.trim()) firestoreUpdates.designation = designation.trim();
          } else if (selectedRole === 'FACULTY') {
            firestoreUpdates.course = 'Faculty Member';
          }

          await updateDoc(doc(db, 'users', user.id), firestoreUpdates);
        } catch (fErr) {
          console.warn('Error updating Firestore in JoinCampusModal:', fErr);
        }
      }

      // Update AuthContext and Local Session
      await joinCampus({
        institutionId: instId,
        institutionName: instName,
        role: selectedRole,
        department: finalDepartment,
        course: selectedRole === 'FACULTY' ? 'Faculty Member' : (course.trim() || undefined),
        classYear: selectedRole === 'STUDENT' ? studentYear : undefined,
        graduationYear: finalGradYear,
        company: selectedRole === 'ALUMNI' ? company.trim() : undefined,
        designation: selectedRole === 'ALUMNI' ? designation.trim() : undefined,
        isFreeUser: isOtherCollege,
        campusType
      });

      const successMsg = isOtherCollege
        ? `Free access granted! Welcome to AlumNexa Open Network.`
        : `Welcome to the official ${instName} portal! Your profile has been connected.`;

      setSuccess(successMsg);
      setTimeout(() => {
        if (onClose) onClose();
        if (onNavigate) onNavigate('dashboard');
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete campus onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F242D]/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E6E1D7] w-full max-w-lg max-h-[90vh] flex flex-col relative overflow-hidden my-auto animate-in zoom-in-95">
        
        {/* Banner Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-[#FAF8F5] to-[#F2EFE8] border-b border-[#E6E1D7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1F242D] text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-5 h-5 text-[#A0D2EB]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[#1F242D] font-heading">
                  Collegiate Onboarding
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD] uppercase">
                  Profile Setup
                </span>
              </div>
              <p className="text-[11px] text-[#565D6D] mt-0.5">
                Select your campus and academic credentials to access your dashboard.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#7E8696] hover:text-[#1F242D] hover:bg-black/5 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-xs text-[#166534] flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* 1. CAMPUS COMMUNITY SELECTION (Requirement 2) */}
          <div>
            <label className="block text-[11px] font-bold text-[#565D6D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#5A7458]" />
              <span>Select Campus Community <span className="text-[#991B1B]">*</span></span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Primary Option: DTSS */}
              <button
                type="button"
                onClick={() => setCampusType('PRIMARY')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  campusType === 'PRIMARY'
                    ? 'bg-[#EBF2EA] border-[#345932] shadow-xs ring-1 ring-[#345932]'
                    : 'bg-white border-[#E6E1D7] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-[#1F242D]">
                    DTSS College of Commerce
                  </span>
                  {campusType === 'PRIMARY' && (
                    <div className="w-4 h-4 rounded-full bg-[#345932] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#565D6D]">
                  Autonomous · Malad (W), Mumbai
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold text-[#345932] bg-white px-2 py-0.5 rounded-full border border-[#CFE2CD]">
                  Primary Institution
                </span>
              </button>

              {/* Secondary Option: Other College */}
              <button
                type="button"
                onClick={() => setCampusType('OTHER')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  campusType === 'OTHER'
                    ? 'bg-[#F3E8FF] border-[#8458B3] shadow-xs ring-1 ring-[#8458B3]'
                    : 'bg-white border-[#E6E1D7] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-[#1F242D]">
                    Other College / Institute
                  </span>
                  {campusType === 'OTHER' && (
                    <div className="w-4 h-4 rounded-full bg-[#8458B3] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#565D6D]">
                  External Campus · Open Network
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold text-[#8458B3] bg-white px-2 py-0.5 rounded-full border border-[#E9D5FF]">
                  Free User · Instant Access
                </span>
              </button>
            </div>

            {/* Other College Details Input */}
            {campusType === 'OTHER' && (
              <div className="mt-2.5 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8458B3]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Free User: No administrative verification required. Access is instant!</span>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#565D6D] mb-1">
                    College / University Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customCollegeName}
                    onChange={e => setCustomCollegeName(e.target.value)}
                    placeholder="e.g. Wilson College, Mithibai College, etc."
                    className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs text-[#1F242D] focus:outline-none focus:border-[#8458B3]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. ROLE SELECTION (Requirement 2: Faculty disabled/locked out for Other College) */}
          <div>
            <label className="block text-[11px] font-bold text-[#565D6D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>I am joining as: <span className="text-[#991B1B]">*</span></span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'STUDENT', label: 'Student', icon: GraduationCap },
                { id: 'ALUMNI', label: 'Alumni', icon: Briefcase },
                { id: 'FACULTY', label: 'Faculty', icon: Shield }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.id;
                const isFacultyLocked = campusType === 'OTHER' && item.id === 'FACULTY';

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isFacultyLocked}
                    onClick={() => {
                      if (!isFacultyLocked) {
                        setSelectedRole(item.id as any);
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 relative ${
                      isFacultyLocked
                        ? 'opacity-40 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#1F242D] text-white border-[#1F242D] shadow-xs'
                        : 'bg-white text-[#565D6D] border-[#DCD6C9] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {isFacultyLocked && (
                      <span className="text-[8px] font-normal text-gray-500 mt-0.5">
                        (DTSS Only)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {campusType === 'OTHER' && (
              <p className="text-[10px] text-[#7E8696] mt-1.5 italic">
                * Faculty role is exclusively available for primary institutional members (DTSS College of Commerce).
              </p>
            )}
          </div>

          {/* 3. CONDITIONAL ONBOARDING FORM SECTIONS */}

          {/* === A. FACULTY FORM SIMPLIFICATION (Requirement 4) === */}
          {selectedRole === 'FACULTY' && campusType === 'PRIMARY' && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-3 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-bold text-[#1F242D] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#5A7458]" />
                  <span>Select Your Department <span className="text-[#991B1B]">*</span></span>
                </label>
                <p className="text-[11px] text-[#565D6D] mb-3">
                  Please choose your official academic department at DTSS College of Commerce:
                </p>
                <div className="space-y-2">
                  {[
                    'Information Technology Department',
                    'Self Finance Department',
                    'Commerce Department'
                  ].map(dept => {
                    const isSelected = facultyDept === dept;
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setFacultyDept(dept as any)}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#1F242D] text-white border-[#1F242D] shadow-xs'
                            : 'bg-white text-[#1F242D] border-[#DCD6C9] hover:bg-[#F4F1EA]'
                        }`}
                      >
                        <span className="font-bold text-xs">{dept}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-white text-[#1F242D] flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* === B. STUDENT FORM (Requirement 3: FY, SY, TY Year Selection) === */}
          {selectedRole === 'STUDENT' && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-3 animate-in fade-in">
              <span className="text-[11px] font-bold text-[#565D6D] uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#8458B3]" />
                <span>Collegiate & Academic Details</span>
              </span>

              {/* Student Year Selection: FY, SY, TY */}
              <div>
                <label className="block text-[10px] font-bold text-[#565D6D] uppercase tracking-wider mb-1">
                  Collegiate Year <span className="text-[#991B1B]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'FY', label: 'FY', full: 'First Year' },
                    { id: 'SY', label: 'SY', full: 'Second Year' },
                    { id: 'TY', label: 'TY', full: 'Third Year' }
                  ].map(y => {
                    const isSelected = studentYear === y.id;
                    return (
                      <button
                        key={y.id}
                        type="button"
                        onClick={() => setStudentYear(y.id as any)}
                        className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#8458B3] text-white border-[#8458B3] shadow-xs'
                            : 'bg-white text-[#565D6D] border-[#DCD6C9] hover:bg-[#F2EFE8]'
                        }`}
                      >
                        <span className="block text-sm">{y.label}</span>
                        <span className="block text-[9px] font-normal opacity-90">{y.full}</span>
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* Degree / Course Program */}
              <div>
                <label className="block text-[10px] font-semibold text-[#565D6D] mb-1">
                  Degree / Course Program
                </label>
                {availableCourses.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={isCustomCourse ? '__custom__' : course}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCourse(true);
                          setCourse('');
                        } else {
                          setIsCustomCourse(false);
                          setCourse(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs text-[#1F242D] focus:outline-none focus:border-[#1F242D]"
                    >
                      <option value="">Select Degree / Course Program...</option>
                      {availableCourses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__custom__">+ Other / Not Listed (Type Manually)</option>
                    </select>
                    {isCustomCourse && (
                      <input
                        type="text"
                        value={course}
                        onChange={e => setCourse(e.target.value)}
                        placeholder="e.g. BSc IT, B.Com, etc."
                        className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs text-[#1F242D] animate-in fade-in"
                        autoFocus
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                    placeholder="e.g. BSc IT, B.Com, BMS, BA"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs text-[#1F242D] focus:outline-none focus:border-[#1F242D]"
                  />
                )}
              </div>
            </div>
          )}

          {/* === C. ALUMNI FORM === */}
          {selectedRole === 'ALUMNI' && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-3 animate-in fade-in">
              <span className="text-[11px] font-bold text-[#565D6D] uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#5A7458]" />
                <span>Alumni Academic & Professional Details</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#565D6D] mb-1">
                    Passing / Graduation Year <span className="text-[#991B1B]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={graduationYear}
                    onChange={e => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2024"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs text-[#1F242D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#565D6D] mb-1">
                    Degree / Course Program
                  </label>
                  <input
                    type="text"
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                    placeholder="e.g. BSc IT, B.Com"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs text-[#1F242D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-[#565D6D] mb-1">
                    Current Company / Org
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Google / TCS"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#565D6D] mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#1F242D] hover:bg-[#343A46] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Complete Onboarding & Access Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
