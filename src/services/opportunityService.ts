import { Opportunity, OpportunityType } from '../types.ts';
import { db } from '../lib/firebase.ts';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const STORAGE_OPPS_KEY = 'alumnexa_opportunities_v2';

function getStoredOpportunities(): Opportunity[] {
  try {
    const data = localStorage.getItem(STORAGE_OPPS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
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
  async getOpportunities(filters: OpportunityFilterParams = {}): Promise<Opportunity[]> {
    const oppsMap = new Map<string, Opportunity>();

    // 1. Query Firestore 'opportunities' collection
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
          } as Opportunity);
        }
      });
    } catch (e) {
      console.warn('Firestore getDocs jobs error:', e);
    }

    // 3. Merge verified local cache
    const local = getStoredOpportunities();
    local.forEach(item => {
      if (!oppsMap.has(item.id)) {
        oppsMap.set(item.id, item);
      }
    });

    let list = Array.from(oppsMap.values());

    // Only active listings
    list = list.filter(o => o.status !== 'deleted' && o.status !== 'inactive');

    // Sort createdAt descending
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    // Filtering
    if (filters.postedBy) {
      const pUid = filters.postedBy;
      list = list.filter(o =>
        o.postedBy === pUid ||
        o.posterUid === pUid ||
        o.postedById === pUid ||
        o.authorUid === pUid
      );
    }

    if (filters.type && filters.type !== 'ALL') {
      list = list.filter(o => o.type === filters.type);
    }

    if (filters.exclusiveOnly !== undefined) {
      if (filters.exclusiveOnly) {
        list = list.filter(o => o.isExclusive);
      } else {
        list = list.filter(o => !o.isExclusive);
      }
    }

    if (filters.department && filters.department !== 'ALL') {
      const dLower = filters.department.toLowerCase();
      list = list.filter(o => o.departmentPreference?.toLowerCase().includes(dLower));
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

    if (filters.location && filters.location !== 'ALL') {
      list = list.filter(o => o.location && o.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }

    if (filters.workplaceType && filters.workplaceType !== 'ALL') {
      list = list.filter(o => (o.workplaceType === filters.workplaceType) || (o.workplace === filters.workplaceType));
    }

    if (filters.skills && filters.skills.trim()) {
      const sLower = filters.skills.toLowerCase().trim();
      list = list.filter(o =>
        (o.skills && o.skills.some(s => s.toLowerCase().includes(sLower))) ||
        (o.requiredSkills && o.requiredSkills.some(s => s.toLowerCase().includes(sLower)))
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
