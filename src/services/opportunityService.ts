import { Opportunity, OpportunityType } from '../types.ts';
import { db } from '../lib/firebase.ts';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// Purge any legacy mock storage on initialization
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('alumnexa_opportunities_v2');
    localStorage.removeItem('alumnexa_opportunities');
  } catch (e) {
    // Ignore storage errors
  }
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

export interface OpportunityApplication {
  id: string;
  jobId: string;
  applicantId: string;
  applicantUid: string;
  applicantName: string;
  applicantEmail: string;
  applicantRole: string;
  applicantAvatar?: string;
  applicantCourse?: string;
  note: string;
  resumeLink?: string;
  createdAt: any;
}

export const opportunityService = {
  /**
   * Fetches live opportunities directly from shared Firestore collection 'opportunities'.
   * Contains ZERO hardcoded fake mock data.
   */
  async getOpportunities(filters: OpportunityFilterParams = {}): Promise<Opportunity[]> {
    const oppsMap = new Map<string, Opportunity>();

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
          applicantsCount: typeof raw.applicantsCount === 'number' ? raw.applicantsCount : 0
        } as Opportunity);
      });
    } catch (e) {
      console.error('Firestore getDocs opportunities error:', e);
    }

    let list = Array.from(oppsMap.values());

    // Filter out only explicitly deleted/archived listings
    list = list.filter(o => o.status !== 'deleted' && o.status !== 'archived');

    // Sort by createdAt descending
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    // Filtering
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

  /**
   * Real-time subscription to shared Firestore 'opportunities' collection for all roles.
   */
  subscribeOpportunities(callback: (opps: Opportunity[]) => void): () => void {
    const oppsRef = collection(db, 'opportunities');
    const unsubscribe = onSnapshot(oppsRef, (snapshot) => {
      const liveJobs = snapshot.docs.map(d => {
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
        return {
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
          applicantsCount: typeof raw.applicantsCount === 'number' ? raw.applicantsCount : 0
        } as Opportunity;
      })
      .filter(job => job.status !== 'deleted' && job.status !== 'archived')
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      callback(liveJobs);
    }, (error) => {
      console.error('Firestore opportunities subscription error:', error);
    });

    return () => unsubscribe();
  },

  async getOpportunityById(id: string): Promise<Opportunity | null> {
    const list = await this.getOpportunities();
    return list.find(o => o.id === id) || null;
  },

  /**
   * Creates an opportunity directly in the shared Firestore cloud database.
   */
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

    // Save directly to shared Firestore collection 'opportunities'
    try {
      await setDoc(doc(db, 'opportunities', newOpp.id), {
        ...newOpp,
        createdAt: serverTimestamp()
      });
      console.log('Successfully wrote opportunity to Firestore collection opportunities:', newOpp.id);
    } catch (e) {
      console.error('Firestore setDoc opportunities error:', e);
      throw e;
    }

    return newOpp;
  },

  /**
   * Submits a student's application to Firestore under opportunities/{jobId}/applications
   * and increments the applicants count on the opportunity document.
   */
  async submitApplication(jobId: string, applicant: {
    applicantId: string;
    applicantUid: string;
    applicantName: string;
    applicantEmail: string;
    applicantRole: string;
    applicantAvatar?: string;
    applicantCourse?: string;
    note: string;
    resumeLink?: string;
  }): Promise<void> {
    const appId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      id: appId,
      jobId,
      ...applicant,
      createdAt: serverTimestamp()
    };

    // 1. Write to subcollection opportunities/{jobId}/applications
    try {
      await setDoc(doc(db, 'opportunities', jobId, 'applications', appId), payload);
    } catch (e) {
      console.warn('Subcollection application write warning:', e);
    }

    // 2. Also write to shared applications collection
    try {
      await setDoc(doc(db, 'applications', appId), payload);
    } catch (e) {
      console.warn('Applications collection write warning:', e);
    }

    // 3. Increment applicantsCount on the opportunity document
    try {
      await updateDoc(doc(db, 'opportunities', jobId), {
        applicantsCount: increment(1)
      });
    } catch (e) {
      console.warn('Failed to increment applicantsCount:', e);
    }
  },

  /**
   * Retrieves all applicants for a given opportunity.
   */
  async getOpportunityApplicants(jobId: string): Promise<OpportunityApplication[]> {
    const results: OpportunityApplication[] = [];

    // Check subcollection first
    try {
      const snap = await getDocs(collection(db, 'opportunities', jobId, 'applications'));
      snap.forEach(d => {
        results.push({ id: d.id, ...d.data() } as OpportunityApplication);
      });
    } catch (e) {
      console.warn('Error fetching from subcollection applications:', e);
    }

    // Fallback to shared collection if needed
    if (results.length === 0) {
      try {
        const snap = await getDocs(query(collection(db, 'applications'), where('jobId', '==', jobId)));
        snap.forEach(d => {
          results.push({ id: d.id, ...d.data() } as OpportunityApplication);
        });
      } catch (e) {
        console.warn('Error fetching from shared applications collection:', e);
      }
    }

    return results;
  },

  async deleteOpportunity(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'opportunities', id));
      console.log('Successfully deleted opportunity from Firestore:', id);
    } catch (e) {
      console.error('Firestore deleteDoc opportunities error:', e);
    }
    return true;
  }
};
