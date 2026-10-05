import { Institution, InstitutionRequest, InstitutionMembership } from '../types.ts';
import { mockInstitutions, mockInstitutionRequests } from '../data/institutions.ts';
import { db } from '../lib/firebase.ts';
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const STORAGE_INSTITUTIONS_KEY = 'alumnexa_institutions_v3';
const STORAGE_INST_REQUESTS_KEY = 'alumnexa_inst_requests_v3';
const STORAGE_MEMBERSHIPS_KEY = 'alumnexa_memberships_v3';

function getStoredInstitutions(): Institution[] {
  try {
    const data = localStorage.getItem(STORAGE_INSTITUTIONS_KEY);
    if (data) {
      const parsed: Institution[] = JSON.parse(data);
      return parsed.filter(inst => {
        const name = (inst.name || '').toLowerCase();
        return !name.includes('birla institute') && !name.includes('delhi university');
      });
    }
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_INSTITUTIONS_KEY, JSON.stringify(mockInstitutions));
  return mockInstitutions;
}

function getStoredRequests(): InstitutionRequest[] {
  try {
    const data = localStorage.getItem(STORAGE_INST_REQUESTS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_INST_REQUESTS_KEY, JSON.stringify(mockInstitutionRequests));
  return mockInstitutionRequests;
}

export const institutionService = {
  /**
   * Fetch all registered institutions from Firestore `institutions` collection
   */
  async getInstitutions(): Promise<Institution[]> {
    try {
      const colRef = collection(db, 'institutions');
      const snap = await getDocs(colRef);

      // Dynamically query real verified members count per institution from Firestore users collection
      const verifiedCounts: Record<string, number> = {};
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(uDoc => {
          const u = uDoc.data();
          if (u.isVerified === true || u.verificationStatus === 'VERIFIED') {
            const instId = u.institutionId || (u.institutionName && u.institutionName.toLowerCase().includes('dtss') ? 'inst-dtss-01' : null);
            if (instId) {
              verifiedCounts[instId] = (verifiedCounts[instId] || 0) + 1;
            }
          }
        });
      } catch (err) {
        console.warn('Error reading verified user counts:', err);
      }

      if (!snap.empty) {
        const list: Institution[] = snap.docs.map(docSnap => {
          const d = docSnap.data();
          const mockMatch = mockInstitutions.find(
            m => m.id === docSnap.id || m.name.toLowerCase() === (d.name || '').toLowerCase()
          );
          const realVerifiedCount = verifiedCounts[docSnap.id] ?? (docSnap.id === 'inst-dtss-01' ? (verifiedCounts['inst-dtss-01'] || 0) : 0);

          return {
            id: docSnap.id,
            uid: d.uid || mockMatch?.uid || (d.code ? `AN-INS-${d.code}` : `AN-INS-${docSnap.id.substring(docSnap.id.length - 6).toUpperCase()}`),
            name: d.name || 'Collegiate Institution',
            code: d.code,
            logo: d.logo || mockMatch?.logo || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=240&q=80',
            bannerImage: d.bannerImage || mockMatch?.bannerImage || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
            officialWebsite: d.officialWebsite || mockMatch?.officialWebsite || '',
            officialEmailDomain: d.officialEmailDomain || mockMatch?.officialEmailDomain || '',
            address: d.address || mockMatch?.address || `${d.city || 'Mumbai'}, ${d.state || 'Maharashtra'}`,
            city: d.city || 'Mumbai',
            state: d.state || 'Maharashtra',
            country: d.country || 'India',
            institutionType: d.institutionType || mockMatch?.institutionType || 'Autonomous College',
            affiliation: d.affiliation || mockMatch?.affiliation || 'Affiliated Collegiate System',
            description: d.description || mockMatch?.description || `${d.name} is an active collegiate institution on AlumNexa.`,
            verificationStatus: 'VERIFIED',
            verifiedBadgeText: 'VERIFIED INSTITUTION',
            membersCount: realVerifiedCount,
            studentsCount: d.studentsCount || mockMatch?.studentsCount || 0,
            alumniCount: d.alumniCount || mockMatch?.alumniCount || 0,
            facultyCount: d.facultyCount || mockMatch?.facultyCount || 0,
            foundedYear: d.foundedYear || mockMatch?.foundedYear || 2026,
          };
        });

        // Filter out Birla Institute of Technology and Delhi University, plus any legacy non-DTSS mocks
        const filteredList = list.filter(inst => {
          const name = (inst.name || '').toLowerCase();
          if (name.includes('birla institute') || name.includes('delhi university')) {
            return false;
          }
          const isOtherLegacyMock = ['inst-vjti-02', 'inst-sxc-03', 'inst-bit-04', 'inst-iist-05', 'inst-mu-06', 'inst-du-07'].includes(inst.id);
          if (isOtherLegacyMock) {
            return false;
          }
          return true;
        });

        const dtssCount = verifiedCounts['inst-dtss-01'] || 0;
        const defaultDtss = { ...mockInstitutions[0], membersCount: dtssCount };
        const hasDtss = filteredList.some(i => i.id === 'inst-dtss-01' || (i.name || '').toLowerCase().includes('dtss'));
        const finalList = hasDtss ? filteredList : [defaultDtss, ...filteredList];

        localStorage.setItem(STORAGE_INSTITUTIONS_KEY, JSON.stringify(finalList));
        return finalList;
      } else {
        // Seed DTSS College as the default accredited institution into Firestore on initial setup
        console.log('[institutionService] Seeding DTSS College to Firestore...');
        const seeded: Institution[] = [];
        for (const inst of mockInstitutions) {
          const instDocData = {
            id: inst.id,
            uid: inst.uid,
            name: inst.name,
            code: 'DTSS',
            logo: inst.logo,
            bannerImage: inst.bannerImage,
            officialWebsite: inst.officialWebsite,
            officialEmailDomain: inst.officialEmailDomain,
            address: inst.address,
            city: inst.city,
            state: inst.state,
            country: inst.country,
            institutionType: inst.institutionType,
            affiliation: inst.affiliation,
            description: inst.description,
            verificationStatus: inst.verificationStatus,
            verifiedBadgeText: inst.verifiedBadgeText,
            membersCount: inst.membersCount,
            studentsCount: inst.studentsCount,
            alumniCount: inst.alumniCount,
            facultyCount: inst.facultyCount,
            foundedYear: inst.foundedYear,
            createdAt: serverTimestamp()
          };
          try {
            await setDoc(doc(db, 'institutions', inst.id), instDocData);
          } catch (err) {
            console.warn('[institutionService] Seed error for', inst.name, err);
          }
          seeded.push(inst);
        }
        localStorage.setItem(STORAGE_INSTITUTIONS_KEY, JSON.stringify(seeded));
        return seeded;
      }
    } catch (e) {
      console.warn('[institutionService] Failed to query Firestore institutions, falling back to cached:', e);
    }
    return getStoredInstitutions();
  },

  /**
   * Self-register a new institution directly in Firestore
   */
  async registerInstitution(payload: {
    institutionName: string;
    institutionCode?: string;
    city: string;
    state: string;
    adminName: string;
    adminEmail: string;
    password: string;
  }) {
    const cleanInstName = payload.institutionName.trim();
    const cleanInstCode = (payload.institutionCode || '').trim().toUpperCase();
    const instId = `inst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const instDocData = {
      id: instId,
      uid: cleanInstCode ? `AN-INS-${cleanInstCode}` : `AN-INS-${instId.substring(instId.length - 6).toUpperCase()}`,
      name: cleanInstName,
      code: cleanInstCode,
      city: payload.city.trim(),
      state: payload.state.trim(),
      country: 'India',
      institutionType: 'Autonomous College',
      affiliation: 'Affiliated Higher Education System',
      description: `${cleanInstName} is an active collegiate institution on AlumNexa.`,
      verificationStatus: 'VERIFIED',
      verifiedBadgeText: 'VERIFIED INSTITUTION',
      membersCount: 1,
      studentsCount: 0,
      alumniCount: 0,
      facultyCount: 0,
      foundedYear: 2026,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'institutions', instId), instDocData);
    } catch (e) {
      console.error('[institutionService] Firestore institution registration error:', e);
    }

    await this.getInstitutions();

    return {
      id: instId,
      name: cleanInstName,
      code: cleanInstCode,
      city: payload.city.trim(),
      state: payload.state.trim()
    };
  },

  async getInstitutionById(idOrUid: string): Promise<Institution | null> {
    const list = await this.getInstitutions();
    return list.find(inst => inst.id === idOrUid || inst.uid.toLowerCase() === idOrUid.toLowerCase()) || null;
  },

  async searchInstitutions(query: string): Promise<Institution[]> {
    const list = await this.getInstitutions();
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(inst =>
      inst.name.toLowerCase().includes(q) ||
      inst.uid.toLowerCase().includes(q) ||
      inst.city.toLowerCase().includes(q) ||
      inst.officialEmailDomain.toLowerCase().includes(q)
    );
  },

  async requestInstitution(payload: {
    institutionName: string;
    officialWebsite: string;
    officialEmailDomain: string;
    address: string;
    city: string;
    state: string;
    country: string;
    institutionType: string;
    affiliation: string;
    description: string;
    supportingInfo: string;
    contactPersonName: string;
    contactPersonEmail: string;
    contactPersonDesignation: string;
  }): Promise<InstitutionRequest> {
    await new Promise(r => setTimeout(r, 200));
    const requests = getStoredRequests();
    const newRequest: InstitutionRequest = {
      id: `req-${Date.now()}`,
      ...payload,
      status: 'REQUESTED',
      submittedAt: new Date().toISOString()
    };
    requests.unshift(newRequest);
    localStorage.setItem(STORAGE_INST_REQUESTS_KEY, JSON.stringify(requests));
    return newRequest;
  },

  async getInstitutionRequests(): Promise<InstitutionRequest[]> {
    return getStoredRequests();
  },

  async updateInstitutionRequestStatus(id: string, status: 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'APPROVED'): Promise<void> {
    const requests = getStoredRequests();
    const idx = requests.findIndex(r => r.id === id);
    if (idx !== -1) {
      requests[idx].status = status === 'APPROVED' ? 'VERIFIED' : status;
      localStorage.setItem(STORAGE_INST_REQUESTS_KEY, JSON.stringify(requests));
    }
  },

  async updateRequestStatus(id: string, status: 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'APPROVED'): Promise<void> {
    return this.updateInstitutionRequestStatus(id, status);
  },

  async joinInstitution(payload: {
    institutionId: string;
    institutionName: string;
    userId: string;
    userName: string;
    userUid: string;
    userEmail: string;
    role: 'STUDENT' | 'ALUMNI' | 'FACULTY';
    department: string;
    course?: string;
    graduationYear?: number;
    idProofDocName?: string;
  }): Promise<InstitutionMembership> {
    await new Promise(r => setTimeout(r, 150));
    const stored = localStorage.getItem(STORAGE_MEMBERSHIPS_KEY);
    const memberships: InstitutionMembership[] = stored ? JSON.parse(stored) : [];

    const newMembership: InstitutionMembership = {
      id: `mem-${Date.now()}`,
      ...payload,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    memberships.unshift(newMembership);
    localStorage.setItem(STORAGE_MEMBERSHIPS_KEY, JSON.stringify(memberships));
    return newMembership;
  },

  async getPendingMemberships(institutionId?: string): Promise<InstitutionMembership[]> {
    const stored = localStorage.getItem(STORAGE_MEMBERSHIPS_KEY);
    let list: InstitutionMembership[] = stored ? JSON.parse(stored) : [
      {
        id: 'mem-seed-1',
        institutionId: 'inst-dtss-01',
        institutionName: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
        userId: 'user-stu-09',
        userName: 'Kunal Varma',
        userUid: 'AN-STU-1T5N38',
        userEmail: 'kunal.varma@dtsscollege.edu.in',
        role: 'STUDENT',
        department: 'Commerce',
        course: 'B.Com',
        graduationYear: 2026,
        idProofDocName: 'Student_ID_Card_2025.pdf',
        status: 'PENDING',
        requestedAt: '2026-03-16T10:00:00Z'
      }
    ];
    if (institutionId) {
      list = list.filter(m => m.institutionId === institutionId);
    }
    return list;
  },

  async verifyMembership(membershipId: string, status: 'VERIFIED' | 'REJECTED'): Promise<void> {
    const list = await this.getPendingMemberships();
    const idx = list.findIndex(m => m.id === membershipId);
    if (idx !== -1) {
      list[idx].status = status;
      list[idx].verifiedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_MEMBERSHIPS_KEY, JSON.stringify(list));
    }
  },

  async getCourses(institutionId: string = 'inst-dtss-01'): Promise<string[]> {
    try {
      const snap = await getDoc(doc(db, 'institutions', institutionId));
      if (snap.exists() && snap.data()?.courses && snap.data().courses.length > 0) {
        return snap.data().courses;
      }
    } catch (e) {
      console.warn('Firestore getCourses error:', e);
    }
    const stored = localStorage.getItem(`alumnexa_courses_${institutionId}`);
    if (stored) return JSON.parse(stored);
    return ['B.Com', 'BMS', 'BSc IT', 'BAF', 'BSc CS', 'BFM', 'BBI', 'BAMMC', 'M.Com', 'MSc IT'];
  },

  async addCourse(institutionId: string = 'inst-dtss-01', courseName: string): Promise<string[]> {
    const trimmed = courseName.trim();
    if (!trimmed) return this.getCourses(institutionId);
    const current = await this.getCourses(institutionId);
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      try {
        await updateDoc(doc(db, 'institutions', institutionId), { courses: updated });
      } catch (e) {
        console.warn('Firestore addCourse error:', e);
      }
      localStorage.setItem(`alumnexa_courses_${institutionId}`, JSON.stringify(updated));
      return updated;
    }
    return current;
  },

  async removeCourse(institutionId: string = 'inst-dtss-01', courseName: string): Promise<string[]> {
    const current = await this.getCourses(institutionId);
    const updated = current.filter(c => c.toLowerCase() !== courseName.toLowerCase());
    try {
      await updateDoc(doc(db, 'institutions', institutionId), { courses: updated });
    } catch (e) {
      console.warn('Firestore removeCourse error:', e);
    }
    localStorage.setItem(`alumnexa_courses_${institutionId}`, JSON.stringify(updated));
    return updated;
  }
};
