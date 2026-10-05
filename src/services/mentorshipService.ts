import { MentorshipRequest, MentorshipStatus, User } from '../types.ts';
import { mockMentorshipRequests } from '../data/mentorships.ts';
import { getAllUsers } from './authService.ts';
import { mockAlumniProfiles } from '../data/users.ts';
import { db } from '../lib/firebase.ts';
import { collection, getDocs, query, where } from 'firebase/firestore';

const STORAGE_MENTORSHIP_KEY = 'alumnexa_mentorship_requests_v2';

function getStoredRequests(): MentorshipRequest[] {
  try {
    const data = localStorage.getItem(STORAGE_MENTORSHIP_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return [...mockMentorshipRequests];
}

export interface MentorFilterParams {
  search?: string;
  industry?: string;
  skills?: string;
  company?: string;
  experience?: string | number;
  institution?: string;
  location?: string;
}

export const mentorshipService = {
  async getMentors(filters: MentorFilterParams = {}): Promise<Array<User & { activeMentees: number; mentorshipAvailability: boolean; experienceYears: number; industry: string }>> {
    let alumni: User[] = [];
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['ALUMNI', 'FACULTY'])));
      snap.forEach(d => {
        const u = d.data() as User;
        if (
          (u.isVerified || u.verificationStatus === 'VERIFIED') &&
          !u.name?.includes('Nikhil Kulkarni') &&
          !u.name?.includes('Divya Rao') &&
          !u.name?.includes('Aditya Singhania') &&
          !u.name?.includes('Meera Nair') &&
          !u.name?.includes('Karthik Subramanian')
        ) {
          alumni.push(u);
        }
      });
    } catch (e) {
      console.warn('Firestore getMentors error, using verified registered users:', e);
      alumni = getAllUsers().filter(u =>
        (u.role === 'ALUMNI' || u.role === 'FACULTY') &&
        (u.isVerified || u.verificationStatus === 'VERIFIED') &&
        !u.name?.includes('Nikhil Kulkarni') &&
        !u.name?.includes('Divya Rao') &&
        !u.name?.includes('Aditya Singhania') &&
        !u.name?.includes('Meera Nair') &&
        !u.name?.includes('Karthik Subramanian')
      );
    }

    const mapped = alumni.map(a => {
      const prof = mockAlumniProfiles[a.id];
      return {
        ...a,
        activeMentees: prof ? prof.activeMentees : 0,
        mentorshipAvailability: prof ? prof.mentorshipAvailability : true,
        experienceYears: prof ? prof.experienceYears : 2,
        industry: prof ? prof.industry : 'Technology'
      };
    });

    return mapped.filter(m => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches = m.name.toLowerCase().includes(q) ||
          m.company?.toLowerCase().includes(q) ||
          m.skills?.some(s => s.toLowerCase().includes(q)) ||
          m.institutionName?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filters.industry && filters.industry !== 'ALL') {
        if (!m.industry.toLowerCase().includes(filters.industry.toLowerCase())) return false;
      }
      if (filters.company && filters.company !== 'ALL') {
        if (m.company?.toLowerCase() !== filters.company.toLowerCase()) return false;
      }
      if (filters.institution && filters.institution !== 'ALL') {
        if (m.institutionName !== filters.institution && m.institutionId !== filters.institution) return false;
      }
      if (filters.skills) {
        if (!m.skills?.some(s => s.toLowerCase().includes(filters.skills!.toLowerCase()))) return false;
      }
      if (filters.location && filters.location !== 'ALL') {
        if (!m.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
      }
      return true;
    });
  },

  async getRequestsForUser(userId: string, role?: string): Promise<MentorshipRequest[]> {
    const list = getStoredRequests();
    if (!userId) return [];
    if (role === 'ALUMNI') {
      return list.filter(r => r.mentorId === userId);
    }
    return list.filter(r => r.menteeId === userId);
  },

  async requestMentorship(payload: {
    mentorId: string;
    mentorName: string;
    mentorUid: string;
    mentorAvatar: string;
    mentorCompany: string;
    mentorRole: string;
    menteeId: string;
    menteeName: string;
    menteeUid: string;
    menteeAvatar: string;
    menteeCourse: string;
    menteeYear: string;
    topic: string;
    message: string;
  }): Promise<MentorshipRequest> {
    await new Promise(r => setTimeout(r, 150));
    const list = getStoredRequests();
    const newReq: MentorshipRequest = {
      id: `ment-${Date.now()}`,
      ...payload,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };
    list.unshift(newReq);
    localStorage.setItem(STORAGE_MENTORSHIP_KEY, JSON.stringify(list));
    return newReq;
  },

  async updateStatus(requestId: string, status: MentorshipStatus, notes?: string): Promise<MentorshipRequest> {
    const list = getStoredRequests();
    const idx = list.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error('Mentorship request not found');
    list[idx].status = status;
    list[idx].updatedAt = new Date().toISOString();
    if (notes) list[idx].notes = notes;
    localStorage.setItem(STORAGE_MENTORSHIP_KEY, JSON.stringify(list));
    return list[idx];
  }
};
