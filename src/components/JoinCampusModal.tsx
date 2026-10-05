
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
  BookOpen,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Search,
  Check,
  X
} from 'lucide-react';

interface JoinCampusModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const JoinCampusModal: React.FC<JoinCampusModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, joinCampus } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>(mockInstitutions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstId, setSelectedInstId] = useState('inst-dtss-01');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'ALUMNI' | 'FACULTY'>(() => {
    return (user?.role && ['STUDENT', 'ALUMNI', 'FACULTY'].includes(user.role) ? user.role : 'STUDENT') as 'STUDENT' | 'ALUMNI' | 'FACULTY';
  });
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
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
        // Exclude Birla Institute of Technology and Delhi University; keep DTSS and dynamic institutions
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
    if (selectedInstId) {
      institutionService.getCourses(selectedInstId).then(courses => {
        if (isMounted) {
          setAvailableCourses(courses || []);
        }
      });
    } else {
      setAvailableCourses([]);
    }
    return () => { isMounted = false; };
  }, [selectedInstId]);

  if (!isOpen) return null;

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inst.code && inst.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedInst = institutions.find(i => i.id === selectedInstId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!selectedInstId || !selectedInst) {
        throw new Error('Please select your College / Institution from the list.');
      }
      if (!department.trim()) {
        throw new Error('Please specify your academic department.');
      }
      if (!graduationYear.trim()) {
        throw new Error('Please specify your graduation year.');
      }

      // Update Firestore users/{currentUser.uid}
      if (user?.id) {
        try {
          const firestoreUpdates: Record<string, any> = {
            institutionId: selectedInst.id,
            institutionName: selectedInst.name,
            role: selectedRole,
            department: department.trim(),
            graduationYear: Number(graduationYear.trim()) || new Date().getFullYear(),
            isOnboardingComplete: true,
            verificationStatus: 'PENDING'
          };
          if (course.trim()) {
            firestoreUpdates.course = course.trim();
          }
          if (selectedRole === 'ALUMNI' && company.trim()) {
            firestoreUpdates.company = company.trim();
          }
          if (selectedRole === 'ALUMNI' && designation.trim()) {
            firestoreUpdates.designation = designation.trim();
          }

          await updateDoc(doc(db, 'users', user.id), firestoreUpdates);
        } catch (fErr) {
          console.warn('Error updating Firestore in JoinCampusModal:', fErr);
        }
      }

      await joinCampus({
        institutionId: selectedInst.id,
        institutionName: selectedInst.name,
        role: selectedRole,
        department: department.trim(),
        course: course.trim() || undefined,
        graduationYear: Number(graduationYear.trim()) || new Date().getFullYear(),
        company: selectedRole === 'ALUMNI' ? company.trim() : undefined,
        designation: selectedRole === 'ALUMNI' ? designation.trim() : undefined
      });

      setSuccess(`Welcome to the official ${selectedInst.name} network! Your profile has been connected.`);
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to join campus community.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F242D]/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E6E1D7] w-full max-w-xl overflow-hidden my-6 relative">
        
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-br from-[#FAF8F5] to-[#F2EFE8] border-b border-[#E6E1D7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1F242D] text-white flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-6 h-6 text-[#A0D2EB]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#1F242D] font-heading">
                  Join Your Campus Community
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD] uppercase">
                  Step 2 of 2
                </span>
              </div>
              <p className="text-xs text-[#565D6D] mt-0.5">
                Connect your account to your university or college to unlock mentorship, directories, and events.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#7E8696] hover:text-[#1F242D] hover:bg-black/5 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
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

          {/* Pre-configured Campus Display (Single-Institution Deployment) */}
          <div>
            <label className="block text-[11px] font-bold text-[#565D6D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#5A7458]" />
              <span>Campus Community</span>
            </label>
            <div className="p-3.5 rounded-xl bg-[#EBF2EA] border border-[#CFE2CD] flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#1F242D] block">
                  DTSS COLLEGE OF COMMERCE (AUTONOMOUS)
                </span>
                <p className="text-[10px] text-[#565D6D] mt-0.5">
                  Malad (West), Mumbai, Maharashtra · Official Institutional Portal
                </p>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#345932] text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-[11px] text-[#345932] font-semibold mt-1.5 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Pre-configured Institution: DTSS COLLEGE OF COMMERCE (AUTONOMOUS)</span>
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-[11px] font-bold text-[#565D6D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>I am joining as: <span className="text-[#991B1B]">*</span></span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['STUDENT', 'ALUMNI', 'FACULTY'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedRole === r
                      ? 'bg-[#1F242D] text-white border-[#1F242D] shadow-xs'
                      : 'bg-white text-[#565D6D] border-[#DCD6C9] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>{r}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Academic Details Section */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-3">
            <span className="text-[11px] font-bold text-[#565D6D] uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#8458B3]" />
              <span>Collegiate & Academic Details</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#565D6D] mb-1">
                  Department <span className="text-[#991B1B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Information Technology, Commerce"
                  className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs text-[#1F242D]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#565D6D] mb-1">
                  Graduation Year <span className="text-[#991B1B]">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={graduationYear}
                  onChange={e => setGraduationYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs text-[#1F242D]"
                />
              </div>
            </div>

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
                  placeholder="e.g. BSc IT, B.Com"
                  className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs text-[#1F242D]"
                />
              )}
            </div>

            {selectedRole === 'ALUMNI' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-[#565D6D] mb-1">
                    Current Company / Org
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Google / Microsoft"
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
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !selectedInstId}
              className="w-full py-3 px-4 rounded-xl bg-[#1F242D] hover:bg-[#343A46] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Join Campus Community & Access Dashboard</span>
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
