import { Opportunity, OpportunityType } from '../types.ts';
import { db } from '../lib/firebase.ts';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

const STORAGE_OPPS_KEY = 'alumnexa_opportunities_v2';

function getStoredOpportunities(): Opportunity[] {
  try {
    const data = localStorage.getItem(STORAGE_OPPS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((o: any) =>
          o &&
          !o.title?.includes('Associate Cloud Software Engineer') &&
          !o.title?.includes('Frontend Engineering Intern') &&
          !o.title?.includes('Product Management Associate')
        );
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
}

export const opportunityService = {
  async getOpportunities(filters: OpportunityFilterParams = {}): Promise<Opportunity[]> {
    let list: Opportunity[] = [];
    try {
      const snap = await getDocs(collection(db, 'jobs'));
      snap.forEach(d => {
        const item = { id: d.id, ...d.data() } as Opportunity;
        // Exclude mock jobs if lingering in firestore
        if (
          !item.title?.includes('Associate Cloud Software Engineer') &&
          !item.title?.includes('Frontend Engineering Intern') &&
          !item.title?.includes('Product Management Associate')
        ) {
          list.push(item);
        }
      });
      // Also check 'opportunities' collection if jobs was empty
      if (list.length === 0) {
        const snapOpp = await getDocs(collection(db, 'opportunities'));
        snapOpp.forEach(d => {
          const item = { id: d.id, ...d.data() } as Opportunity;
          if (
            !item.title?.includes('Associate Cloud Software Engineer') &&
            !item.title?.includes('Frontend Engineering Intern') &&
            !item.title?.includes('Product Management Associate')
          ) {
            list.push(item);
          }
        });
      }
    } catch (e) {
      console.warn('Firestore getOpportunities error, using verified local opportunities:', e);
      list = getStoredOpportunities();
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

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.company.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        (o.skills && o.skills.some(s => s.toLowerCase().includes(q))) ||
        (o.requiredSkills && o.requiredSkills.some(s => s.toLowerCase().includes(q)))
      );
    }

    if (filters.location && filters.location !== 'ALL') {
      list = list.filter(o => o.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }

    if (filters.workplaceType && filters.workplaceType !== 'ALL') {
      list = list.filter(o => o.workplaceType === filters.workplaceType);
    }

    if (filters.skills) {
      const sLower = filters.skills.toLowerCase();
      list = list.filter(o =>
        (o.skills && o.skills.some(s => s.toLowerCase().includes(sLower))) ||
        (o.requiredSkills && o.requiredSkills.some(s => s.toLowerCase().includes(sLower)))
      );
    }

    return list;
  },

  async getOpportunityById(id: string): Promise<Opportunity | null> {
    const list = await this.getOpportunities();
    return list.find(o => o.id === id) || null;
  },

  async applyToOpportunity(id: string, _details?: any): Promise<Opportunity> {
    const list = getStoredOpportunities();
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Opportunity not found');
    list[idx].hasApplied = true;
    list[idx].applicantsCount += 1;
    localStorage.setItem(STORAGE_OPPS_KEY, JSON.stringify(list));
    return list[idx];
  },

  async createOpportunity(payload: Omit<Opportunity, 'id' | 'applicantsCount' | 'hasApplied'> & { createdAt?: string }): Promise<Opportunity> {
    const newOpp: Opportunity = {
      ...payload,
      id: `opp-${Date.now()}`,
      applicantsCount: 0,
      createdAt: payload.createdAt || new Date().toISOString(),
      hasApplied: false,
      posterName: payload.posterName || payload.authorName || 'Alumni Member',
      posterRole: payload.posterRole || payload.authorRole || 'ALUMNI',
      posterUid: payload.posterUid || payload.authorUid || 'AN-ALU-000000',
      postedById: payload.postedById || 'user-0',
      authorUid: payload.authorUid || payload.posterUid,
      authorName: payload.authorName || payload.posterName,
      authorRole: payload.authorRole || payload.posterRole,
      institutionId: payload.institutionId || payload.exclusiveInstitutionId,
      posterAvatar: payload.posterAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
      institution: payload.institution || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
      skills: payload.skills || payload.requiredSkills || ['General'],
      requirements: payload.requirements || ['Degree in relevant field']
    };
    try {
      await setDoc(doc(db, 'jobs', newOpp.id), newOpp);
      await setDoc(doc(db, 'opportunities', newOpp.id), newOpp);
    } catch (e) {
      console.warn('Firestore setDoc jobs error:', e);
    }
    const list = getStoredOpportunities();
    list.unshift(newOpp);
    localStorage.setItem(STORAGE_OPPS_KEY, JSON.stringify(list));
    return newOpp;
  }
};
