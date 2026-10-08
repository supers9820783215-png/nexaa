import { MentorshipRequest, MentorshipStatus, User } from '../types.ts';
import { mockMentorshipRequests } from '../data/mentorships.ts';
import { getAllUsers } from './authService.ts';
import { mockAlumniProfiles } from '../data/users.ts';
import { db } from '../lib/firebase.ts';
import { collection, getDocs, doc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { notificationService } from './notificationService.ts';

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
          alumni.push({ ...u, id: u.id || d.id });
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

    let mapped = alumni.map(a => {
      const prof = mockAlumniProfiles[a.id];
      return {
        ...a,
        activeMentees: prof ? prof.activeMentees : 0,
        mentorshipAvailability: prof ? prof.mentorshipAvailability : true,
        experienceYears: prof ? prof.experienceYears : 2,
        industry: prof ? prof.industry : 'Technology'
      };
    });

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      mapped = mapped.filter(m =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.uid && m.uid.toLowerCase().includes(q)) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.currentRole && m.currentRole.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.industry && m.industry.toLowerCase().includes(q)) ||
        (m.location && m.location.toLowerCase().includes(q)) ||
        (m.institutionName && m.institutionName.toLowerCase().includes(q)) ||
        (m.skills && m.skills.some(s => s.toLowerCase().includes(q)))
      );
    }

    if (filters.industry && filters.industry !== 'ALL') {
      mapped = mapped.filter(m => m.industry.toLowerCase().includes(filters.industry!.toLowerCase()));
    }
    if (filters.company && filters.company !== 'ALL') {
      mapped = mapped.filter(m => m.company?.toLowerCase() === filters.company!.toLowerCase());
    }
    if (filters.institution && filters.institution !== 'ALL') {
      mapped = mapped.filter(m => m.institutionName === filters.institution || m.institutionId === filters.institution);
    }
    if (filters.skills) {
      mapped = mapped.filter(m => m.skills?.some(s => s.toLowerCase().includes(filters.skills!.toLowerCase())));
    }
    if (filters.location && filters.location !== 'ALL') {
      mapped = mapped.filter(m => m.location?.toLowerCase().includes(filters.location!.toLowerCase()));
    }

    return mapped;
  },

  async getRequestsForUser(userIdOrUid: string, role?: string): Promise<MentorshipRequest[]> {
    if (!userIdOrUid) return [];
    const target = userIdOrUid.trim().toLowerCase();
    const stored = getStoredRequests();
    const firestoreReqs: MentorshipRequest[] = [];

    try {
      const snap = await getDocs(collection(db, 'mentorship_requests'));
      snap.forEach(d => {
        const item = d.data() as MentorshipRequest;
        firestoreReqs.push({ ...item, id: item.id || d.id });
      });
    } catch (e) {
      console.warn('[MentorshipService] Firestore getDocs failed, fallback to local:', e);
    }

    // Merge Firestore + local storage (Firestore taking precedence by ID)
    const combinedMap = new Map<string, MentorshipRequest>();
    stored.forEach(r => combinedMap.set(r.id, r));
    firestoreReqs.forEach(r => combinedMap.set(r.id, r));
    const all = Array.from(combinedMap.values());

    const isMentor = role === 'ALUMNI' || role === 'FACULTY';
    return all.filter(r => {
      const mId = (r.mentorId || '').trim().toLowerCase();
      const mUid = (r.mentorUid || '').trim().toLowerCase();
      const sId = (r.menteeId || '').trim().toLowerCase();
      const sUid = (r.menteeUid || '').trim().toLowerCase();

      if (isMentor) {
        return mId === target || mUid === target;
      } else if (role === 'STUDENT') {
        return sId === target || sUid === target;
      }
      return mId === target || mUid === target || sId === target || sUid === target;
    });
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
    menteeLinkedin?: string;
    menteeResume?: string;
  }): Promise<MentorshipRequest> {
    const newReq: MentorshipRequest = {
      id: `ment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...payload,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    // Save to Firestore for cross-session and cross-device delivery
    try {
      await setDoc(doc(db, 'mentorship_requests', newReq.id), newReq);
      console.log('[MentorshipService] Request stored in Firestore collection mentorship_requests:', newReq.id);
    } catch (err) {
      console.error('[MentorshipService] Firestore setDoc error (relying on localStorage):', err);
    }

    // Also persist to localStorage for instant local reactivity
    const list = getStoredRequests();
    list.unshift(newReq);
    localStorage.setItem(STORAGE_MENTORSHIP_KEY, JSON.stringify(list));

    // Trigger in-app notification for the mentor
    try {
      await notificationService.createNotification({
        userId: payload.mentorId,
        title: 'New Mentorship Request',
        message: `${payload.menteeName} sent you a new 1:1 mentorship request for ${payload.topic}`,
        type: 'MENTORSHIP',
        linkUrl: 'mentorship',
        actionLabel: 'Review Request'
      });
    } catch (notifErr) {
      console.warn('[MentorshipService] Notification dispatch error:', notifErr);
    }

    return newReq;
  },

  async updateStatus(requestId: string, status: MentorshipStatus, notes?: string): Promise<MentorshipRequest> {
    const list = getStoredRequests();
    const idx = list.findIndex(r => r.id === requestId);
    const existingReq = idx !== -1 ? list[idx] : null;

    const updatedFields: any = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (notes) updatedFields.notes = notes;

    try {
      await updateDoc(doc(db, 'mentorship_requests', requestId), updatedFields);
    } catch (err) {
      console.warn('[MentorshipService] Firestore updateDoc failed, updated locally:', err);
    }

    let resultReq: MentorshipRequest;
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      localStorage.setItem(STORAGE_MENTORSHIP_KEY, JSON.stringify(list));
      resultReq = list[idx];
    } else {
      resultReq = { id: requestId, ...updatedFields } as MentorshipRequest;
    }

    // Trigger in-app notification for the student/mentee
    const menteeId = resultReq.menteeId || existingReq?.menteeId;
    const mentorName = resultReq.mentorName || existingReq?.mentorName || 'Your mentor';
    if (menteeId) {
      try {
        if (status === 'ACCEPTED') {
          await notificationService.createNotification({
            userId: menteeId,
            title: 'Mentorship Request Accepted!',
            message: `Your mentorship request with ${mentorName} has been accepted!`,
            type: 'MENTORSHIP',
            linkUrl: 'mentorship',
            actionLabel: 'View Mentorship'
          });
        } else if (status === 'REJECTED') {
          await notificationService.createNotification({
            userId: menteeId,
            title: 'Mentorship Request Update',
            message: `Your mentorship request with ${mentorName} was not accepted at this time.`,
            type: 'MENTORSHIP',
            linkUrl: 'mentorship',
            actionLabel: 'Browse Mentors'
          });
        }
      } catch (notifErr) {
        console.warn('[MentorshipService] Status notification dispatch error:', notifErr);
      }
    }

    return resultReq;
  }
};
