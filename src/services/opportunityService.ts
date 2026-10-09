import { Opportunity, OpportunityType } from '../types.ts';
import { db } from '../lib/firebase.ts';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const STORAGE_OPPS_KEY = 'alumnexa_opportunities_v2';

const defaultSeedOpportunities: Opportunity[] = [
  {
    id: 'opp-seed-01',
    title: 'Associate Cloud Solutions Engineer',
    company: 'Microsoft Azure',
    type: 'FULL_TIME',
    workplaceType: 'HYBRID',
    workplace: 'HYBRID',
    employmentType: 'Full-time',
    location: 'Mumbai / Bengaluru',
    stipendSalary: '₹12 - 16 LPA',
    salaryRange: '₹12 - 16 LPA',
    stipend: '₹12 - 16 LPA',
    departmentPreference: 'Information Technology, Computer Science',
    targetBatches: ['2025', '2026'],
    requiredSkills: ['Azure', 'React', 'TypeScript', 'Node.js'],
    skills: ['Azure', 'React', 'TypeScript', 'Node.js'],
    requirements: ['Solid understanding of cloud architecture and modern web apps'],
    deadline: '2026-08-30',
    description: 'Design and deploy scalable enterprise cloud applications, collaborate with cross-functional engineering teams, and deliver robust microservices.',
    applicationLink: 'https://careers.microsoft.com',
    isExclusive: false,
    postedBy: 'user-alumni-01',
    postedById: 'user-alumni-01',
    posterName: 'Aarav Mehta',
    posterUid: 'AN-ALU-9X2M41',
    posterRole: 'ALUMNI',
    posterAvatar: '',
    authorUid: 'AN-ALU-9X2M41',
    authorName: 'Aarav Mehta',
    authorRole: 'ALUMNI',
    institutionId: 'inst-dtss-01',
    institution: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
    experienceRequired: '0 - 2 Years',
    applicantsCount: 14,
    hasApplied: false,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'opp-seed-02',
    title: 'Full Stack Engineering Intern',
    company: 'Razorpay',
    type: 'INTERNSHIP',
    workplaceType: 'HYBRID',
    workplace: 'HYBRID',
    employmentType: 'Internship',
    location: 'Mumbai / Remote',
    stipendSalary: '₹45,000 / month',
    salaryRange: '₹45,000 / month',
    stipend: '₹45,000 / month',
    departmentPreference: 'Information Technology, Computer Science',
    targetBatches: ['2025', '2026'],
    requiredSkills: ['React', 'Node.js', 'PostgreSQL', 'REST APIs'],
    skills: ['React', 'Node.js', 'PostgreSQL', 'REST APIs'],
    requirements: ['Hands-on project experience with modern TypeScript and responsive UI'],
    deadline: '2026-07-15',
    description: 'Work directly on high-volume collegiate payment flows, checkout APIs, and financial dashboard features alongside principal staff engineers.',
    applicationLink: 'https://razorpay.com/jobs',
    isExclusive: false,
    postedBy: 'user-alumni-02',
    postedById: 'user-alumni-02',
    posterName: 'Priya Sharma',
    posterUid: 'AN-ALU-3B8K72',
    posterRole: 'ALUMNI',
    posterAvatar: '',
    authorUid: 'AN-ALU-3B8K72',
    authorName: 'Priya Sharma',
    authorRole: 'ALUMNI',
    institutionId: 'inst-dtss-01',
    institution: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
    experienceRequired: '0 - 1 Years',
    applicantsCount: 22,
    hasApplied: false,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'opp-seed-03',
    title: 'Technical Product Management Associate',
    company: 'Tata Consultancy Services',
    type: 'FULL_TIME',
    workplaceType: 'ON_SITE',
    workplace: 'ON_SITE',
    employmentType: 'Full-time',
    location: 'Mumbai',
    stipendSalary: '₹8.5 - 11 LPA',
    salaryRange: '₹8.5 - 11 LPA',
    stipend: '₹8.5 - 11 LPA',
    departmentPreference: 'Commerce, Management Studies, IT',
    targetBatches: ['2024', '2025', '2026'],
    requiredSkills: ['Product Strategy', 'SQL', 'Agile/Scrum', 'Analytics'],
    skills: ['Product Strategy', 'SQL', 'Agile/Scrum', 'Analytics'],
    requirements: ['Strong analytical thinking and stakeholder management abilities'],
    deadline: '2026-09-01',
    description: 'Lead feature lifecycles, translate user requirements into technical specifications, and interface between collegiate clients and development teams.',
    applicationLink: 'https://tcs.com/careers',
    isExclusive: false,
    postedBy: 'user-faculty-01',
    postedById: 'user-faculty-01',
    posterName: 'Dr. Suresh Joshi',
    posterUid: 'AN-FAC-1L4P90',
    posterRole: 'FACULTY',
    posterAvatar: '',
    authorUid: 'AN-FAC-1L4P90',
    authorName: 'Dr. Suresh Joshi',
    authorRole: 'FACULTY',
    institutionId: 'inst-dtss-01',
    institution: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
    experienceRequired: '0 - 2 Years',
    applicantsCount: 9,
    hasApplied: false,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

function getStoredOpportunities(): Opportunity[] {
  try {
    const data = localStorage.getItem(STORAGE_OPPS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return defaultSeedOpportunities;
}

export interface OpportunityFilterParams {
  search?: string;
  type?: OpportunityType | 'ALL';
  location?: string;
  workplaceType?: string;
  skills?: string;
  department?: string;
  exclusiveOnly?: boolean;
  postedBy?: string;
  status?: string;
}

export const opportunityService = {
  /**
   * Fetches opportunities with unrestricted visibility for all authenticated roles.
   * All active postings appear without requiring admin pre-approval.
   */
  async getOpportunities(filters: OpportunityFilterParams = {}): Promise<Opportunity[]> {
    const oppsMap = new Map<string, Opportunity>();

    // 1. Query Firestore 'opportunities' collection ordered by createdAt desc
    try {
      const snapOpp = await getDocs(collection(db, 'opportunities'));
      snapOpp.forEach(d => {
        const raw = d.data();
        let createdAtStr = new Date().toISOString();
        if (raw.createdAt) {
          if (typeof raw.createdAt.toDate === 'function') {
            createdAtStr = raw.createdAt.toDate().toISOString();
          } else if (typeof raw.createdAt === 'string') {
            createdAtStr = raw.createdAt;
          } else if (raw.createdAt.seconds) {
            createdAtStr = new Date(raw.createdAt.seconds * 1000).toISOString();
          }
        }
        oppsMap.set(d.id, {
          id: d.id,
          ...raw,
          createdAt: createdAtStr,
          status: raw.status || 'active',
          postedBy: raw.postedBy || raw.posterUid || raw.postedById || raw.authorUid || '',
          postedByName: raw.postedByName || raw.posterName || raw.authorName || 'Alumni Member',
          posterName: raw.posterName || raw.postedByName || raw.authorName || 'Alumni Member',
          posterRole: raw.posterRole || raw.authorRole || 'ALUMNI',
          workplaceType: raw.workplaceType || raw.workplace || 'HYBRID',
          workplace: raw.workplace || raw.workplaceType || 'HYBRID',
        } as Opportunity);
      });
    } catch (e) {
      console.warn('Firestore getDocs opportunities error:', e);
    }

    // 2. Query Firestore 'jobs' collection for backward compatibility
    try {
      const snapJobs = await getDocs(collection(db, 'jobs'));
      snapJobs.forEach(d => {
        if (!oppsMap.has(d.id)) {
          const raw = d.data();
          let createdAtStr = new Date().toISOString();
          if (raw.createdAt) {
            if (typeof raw.createdAt.toDate === 'function') {
              createdAtStr = raw.createdAt.toDate().toISOString();
            } else if (typeof raw.createdAt === 'string') {
              createdAtStr = raw.createdAt;
            } else if (raw.createdAt.seconds) {
              createdAtStr = new Date(raw.createdAt.seconds * 1000).toISOString();
            }
          }
          oppsMap.set(d.id, {
            id: d.id,
            ...raw,
            createdAt: createdAtStr,
            status: raw.status || 'active',
            postedBy: raw.postedBy || raw.posterUid || raw.postedById || raw.authorUid || '',
            postedByName: raw.postedByName || raw.posterName || raw.authorName || 'Alumni Member',
            posterName: raw.posterName || raw.postedByName || raw.authorName || 'Alumni Member',
            posterRole: raw.posterRole || raw.authorRole || 'ALUMNI',
            workplaceType: raw.workplaceType || raw.workplace || 'HYBRID',
            workplace: raw.workplace || raw.workplaceType || 'HYBRID',
          } as Opportunity);
        }
      });
    } catch (e) {
      console.warn('Firestore getDocs jobs error:', e);
    }

    // 3. Fallback to verified local cache or default opportunities if DB empty
    const local = getStoredOpportunities();
    local.forEach(item => {
      if (!oppsMap.has(item.id)) {
        oppsMap.set(item.id, item);
      }
    });

    let list = Array.from(oppsMap.values());

    // Filter out ONLY explicitly deleted or archived listings
    list = list.filter(o => o.status !== 'deleted' && o.status !== 'archived');

    // Sort by createdAt descending
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    // 4. Safe, unrestricted filter evaluations:
    // If a filter is undefined, null, empty, or 'ALL', evaluate to true without dropping posts
    if (filters.postedBy) {
      const pUid = filters.postedBy.toLowerCase().trim();
      list = list.filter(o =>
        (o.postedBy && o.postedBy.toLowerCase().trim() === pUid) ||
        (o.posterUid && o.posterUid.toLowerCase().trim() === pUid) ||
        (o.postedById && o.postedById.toLowerCase().trim() === pUid) ||
        (o.authorUid && o.authorUid.toLowerCase().trim() === pUid)
      );
    }

    if (filters.type && filters.type !== 'ALL' && (filters.type as any) !== 'All Types') {
      const fType = filters.type.toUpperCase().replace(/\s+/g, '_');
      list = list.filter(o => {
        if (!o.type) return true;
        const oType = o.type.toUpperCase().replace(/\s+/g, '_');
        if (fType === 'JOB' || fType === 'FULL_TIME') {
          return oType === 'JOB' || oType === 'FULL_TIME';
        }
        return oType.includes(fType) || fType.includes(oType);
      });
    }

    if (filters.exclusiveOnly !== undefined) {
      if (filters.exclusiveOnly) {
        list = list.filter(o => o.isExclusive);
      } else {
        list = list.filter(o => !o.isExclusive);
      }
    }

    if (filters.department && filters.department !== 'ALL' && filters.department !== 'All Disciplines') {
      const dLower = filters.department.toLowerCase().trim();
      list = list.filter(o => {
        if (!o.departmentPreference) return true;
        const dPref = o.departmentPreference.toLowerCase();
        return dPref.includes(dLower) || dPref.includes('all');
      });
    }

    if (filters.workplaceType && filters.workplaceType !== 'ALL' && (filters.workplaceType as any) !== 'All Modes') {
      const wTarget = filters.workplaceType.toUpperCase().replace(/\s+/g, '_');
      list = list.filter(o => {
        const mode = (o.workplaceType || o.workplace || '').toUpperCase().replace(/\s+/g, '_');
        if (!mode) return true;
        return mode.includes(wTarget) || wTarget.includes(mode);
      });
    }

    if (filters.location && filters.location !== 'ALL' && filters.location.trim()) {
      const lLower = filters.location.toLowerCase().trim();
      list = list.filter(o => !o.location || o.location.toLowerCase().includes(lLower));
    }

    if (filters.skills && filters.skills.trim()) {
      const sLower = filters.skills.toLowerCase().trim();
      list = list.filter(o =>
        (o.skills && o.skills.some(s => s.toLowerCase().includes(sLower))) ||
        (o.requiredSkills && o.requiredSkills.some(s => s.toLowerCase().includes(sLower)))
      );
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(o =>
        (o.title && o.title.toLowerCase().includes(q)) ||
        (o.company && o.company.toLowerCase().includes(q)) ||
        (o.description && o.description.toLowerCase().includes(q)) ||
        (o.skills && o.skills.some(s => s.toLowerCase().includes(q))) ||
        (o.requiredSkills && o.requiredSkills.some(s => s.toLowerCase().includes(q)))
      );
    }

    return list;
  },

  subscribeOpportunities(callback: (opps: Opportunity[]) => void, filters: OpportunityFilterParams = {}): () => void {
    // Initial fetch
    this.getOpportunities(filters).then(callback).catch(console.error);

    let unsubFirestore: (() => void) | null = null;
    try {
      const oppsRef = collection(db, 'opportunities');
      unsubFirestore = onSnapshot(oppsRef, () => {
        this.getOpportunities(filters).then(callback).catch(console.error);
      }, (err) => {
        console.warn('Real-time opportunities subscription warning:', err);
      });
    } catch (err) {
      console.warn('Could not establish onSnapshot for opportunities:', err);
    }

    const handleCustomEvent = () => {
      this.getOpportunities(filters).then(callback).catch(console.error);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('alumnexa_opportunity_created', handleCustomEvent);
      window.addEventListener('alumnexa_opportunity_deleted', handleCustomEvent);
    }

    return () => {
      if (unsubFirestore) unsubFirestore();
      if (typeof window !== 'undefined') {
        window.removeEventListener('alumnexa_opportunity_created', handleCustomEvent);
        window.removeEventListener('alumnexa_opportunity_deleted', handleCustomEvent);
      }
    };
  },

  async getOpportunityById(id: string): Promise<Opportunity | null> {
    const list = await this.getOpportunities();
    return list.find(o => o.id === id) || null;
  },

  async applyToOpportunity(id: string, _details?: any): Promise<Opportunity> {
    const list = getStoredOpportunities();
    const idx = list.findIndex(o => o.id === id);
    if (idx !== -1) {
      list[idx].hasApplied = true;
      list[idx].applicantsCount = (list[idx].applicantsCount || 0) + 1;
      localStorage.setItem(STORAGE_OPPS_KEY, JSON.stringify(list));
    }
    try {
      await setDoc(doc(db, 'opportunities', id), { hasApplied: true }, { merge: true });
    } catch (e) {
      console.warn('applyToOpportunity firestore update error:', e);
    }
    return list[idx] || { id, title: '', company: '' } as Opportunity;
  },

  async createOpportunity(payload: Partial<Opportunity> & { title: string; company: string }): Promise<Opportunity> {
    const nowIso = new Date().toISOString();
    const id = payload.id || `opp-${Date.now()}`;

    const posterUid = payload.postedBy || payload.posterUid || payload.postedById || payload.authorUid || 'AN-ALU-000000';
    const posterName = payload.posterName || payload.authorName || 'Alumni Member';
    const posterRole = payload.posterRole || payload.authorRole || 'ALUMNI';
    const workplace = payload.workplace || payload.workplaceType || 'HYBRID';

    const newOpp: Opportunity = {
      id,
      title: payload.title,
      company: payload.company,
      type: (payload.type as OpportunityType) || 'INTERNSHIP',
      workplace: workplace,
      workplaceType: workplace as any,
      employmentType: payload.employmentType || (payload.type === 'INTERNSHIP' ? 'Internship' : 'Full-time'),
      location: payload.location || 'Mumbai / Remote',
      stipendSalary: payload.stipendSalary || payload.salaryRange || 'Competitive',
      salaryRange: payload.salaryRange || payload.stipendSalary || 'Competitive',
      stipend: payload.stipend || payload.stipendSalary || 'Competitive',
      departmentPreference: payload.departmentPreference || 'All Disciplines',
      targetBatches: payload.targetBatches || ['2025', '2026'],
      requiredSkills: payload.requiredSkills || payload.skills || ['General'],
      skills: payload.skills || payload.requiredSkills || ['General'],
      requirements: payload.requirements || ['Enthusiasm to build and learn'],
      deadline: payload.deadline || '2026-12-31',
      description: payload.description || '',
      applicationLink: payload.applicationLink || '',
      isExclusive: Boolean(payload.isExclusive),
      exclusiveInstitutionName: payload.exclusiveInstitutionName || payload.institution || 'Collegiate Network',
      exclusiveInstitutionId: payload.exclusiveInstitutionId || payload.institutionId || 'GLOBAL',
      postedBy: posterUid,
      postedById: payload.postedById || posterUid,
      posterUid: posterUid,
      posterName: posterName,
      posterRole: posterRole,
      posterAvatar: payload.posterAvatar || '',
      authorUid: posterUid,
      authorName: posterName,
      authorRole: posterRole,
      institutionId: payload.institutionId || 'GLOBAL',
      institution: payload.institution || 'Collegiate Network',
      experienceRequired: payload.experienceRequired || '0 - 2 Years',
      applicantsCount: 0,
      hasApplied: false,
      status: 'active',
      createdAt: nowIso
    };

    try {
      await setDoc(doc(db, 'opportunities', newOpp.id), {
        ...newOpp,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'jobs', newOpp.id), {
        ...newOpp,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore setDoc opportunities error, falling back to local cache:', e);
    }

    const list = getStoredOpportunities();
    const updatedList = [newOpp, ...list.filter(o => o.id !== newOpp.id)];
    localStorage.setItem(STORAGE_OPPS_KEY, JSON.stringify(updatedList));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alumnexa_opportunity_created', { detail: newOpp }));
    }

    return newOpp;
  },

  async deleteOpportunity(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'opportunities', id));
    } catch (e) {
      console.warn('Firestore deleteDoc opportunities error:', e);
    }
    try {
      await deleteDoc(doc(db, 'jobs', id));
    } catch (e) {
      console.warn('Firestore deleteDoc jobs error:', e);
    }

    const list = getStoredOpportunities().filter(o => o.id !== id);
    localStorage.setItem(STORAGE_OPPS_KEY, JSON.stringify(list));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alumnexa_opportunity_deleted', { detail: { id } }));
    }
    return true;
  }
};
