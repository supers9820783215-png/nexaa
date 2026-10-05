import { User, StudentProfile, AlumniProfile, FacultyProfile, PlatformStats } from '../types.ts';
import { getAllUsers, saveAllUsers, getCurrentUser } from './authService.ts';
import { mockStudentProfiles, mockAlumniProfiles, mockFacultyProfiles } from '../data/users.ts';
import { usersApi, adminApi } from './api.ts';
import { db } from '../lib/firebase.ts';
import { collection, doc, getDocs, updateDoc, query, where } from 'firebase/firestore';

export interface AlumniFilterParams {
  search?: string;
  uid?: string;
  institution?: string;
  company?: string;
  industry?: string;
  graduationYear?: number | string;
  department?: string;
  location?: string;
  skills?: string;
  mentoringOnly?: boolean;
}

export const userService = {
  async getUser(idOrUid: string): Promise<User | null> {
    const users = getAllUsers();
    return users.find(u => u.id === idOrUid || u.uid.toLowerCase() === idOrUid.toLowerCase()) || null;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    const updated = { ...users[index], ...updates };
    users[index] = updated;
    saveAllUsers(users);
    return updated;
  },

  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    return this.updateUser(id, updates);
  },

  async getAlumni(params: AlumniFilterParams = {}): Promise<User[]> {
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
      console.warn('Firestore getAlumni error, using verified registered users:', e);
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

    if (params.search) {
      const q = params.search.toLowerCase();
      alumni = alumni.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.uid.toLowerCase().includes(q) ||
        (a.company && a.company.toLowerCase().includes(q)) ||
        (a.institutionName && a.institutionName.toLowerCase().includes(q)) ||
        (a.skills && a.skills.some(s => s.toLowerCase().includes(q)))
      );
    }

    if (params.uid) {
      alumni = alumni.filter(a => a.uid.toLowerCase().includes(params.uid!.toLowerCase()));
    }

    const currentUser = getCurrentUser();
    const instTarget = params.institution !== undefined
      ? params.institution
      : (currentUser?.institutionId || currentUser?.institutionName || 'ALL');

    if (instTarget && instTarget !== 'ALL') {
      alumni = alumni.filter(a => a.institutionName === instTarget || a.institutionId === instTarget);
    }

    if (params.company && params.company !== 'ALL') {
      alumni = alumni.filter(a => a.company?.toLowerCase() === params.company!.toLowerCase());
    }

    if (params.industry && params.industry !== 'ALL') {
      // Look up industry from profile or title
      alumni = alumni.filter(a => {
        const prof = mockAlumniProfiles[a.id];
        return prof ? prof.industry.toLowerCase().includes(params.industry!.toLowerCase()) : true;
      });
    }

    if (params.graduationYear && params.graduationYear !== 'ALL') {
      const year = Number(params.graduationYear);
      alumni = alumni.filter(a => a.graduationYear === year);
    }

    if (params.department && params.department !== 'ALL') {
      alumni = alumni.filter(a => a.department === params.department);
    }

    if (params.location && params.location !== 'ALL') {
      alumni = alumni.filter(a => a.location?.toLowerCase().includes(params.location!.toLowerCase()));
    }

    if (params.skills) {
      const skillLower = params.skills.toLowerCase();
      alumni = alumni.filter(a => a.skills?.some(s => s.toLowerCase().includes(skillLower)));
    }

    return alumni;
  },

  async getStudents(): Promise<User[]> {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'STUDENT')));
      const students: User[] = [];
      snap.forEach(d => students.push(d.data() as User));
      if (students.length > 0) return students;
    } catch (e) {
      console.warn('Firestore getStudents error:', e);
    }
    return getAllUsers().filter(u => u.role === 'STUDENT');
  },

  async getFaculty(): Promise<User[]> {
    return getAllUsers().filter(u => u.role === 'FACULTY');
  },

  async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    if (mockStudentProfiles[userId]) return mockStudentProfiles[userId];
    const user = await this.getUser(userId);
    if (!user) return null;
    return {
      id: `sp-${user.id}`,
      userId: user.id,
      uid: user.uid,
      institution: user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
      institutionId: user.institutionId || 'inst-dtss-01',
      course: user.course || 'BSc Information Technology',
      department: user.department || 'Information Technology',
      currentYear: '3rd Year',
      graduationYear: user.graduationYear || 2026,
      skills: user.skills || ['Web Development', 'Problem Solving', 'Data Structures'],
      bio: user.bio || 'Undergraduate scholar passionate about academic research and career opportunities.',
      careerInterests: ['Software Engineering', 'System Design'],
      location: user.location || 'Mumbai, India',
      mentorshipStatus: 'LOOKING_FOR_MENTOR',
      profileCompletion: 85
    };
  },

  async getAlumniProfile(userId: string): Promise<AlumniProfile | null> {
    if (mockAlumniProfiles[userId]) return mockAlumniProfiles[userId];
    const user = await this.getUser(userId);
    if (!user) return null;
    return {
      id: `ap-${user.id}`,
      userId: user.id,
      uid: user.uid,
      institution: user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
      institutionId: user.institutionId || 'inst-dtss-01',
      graduationYear: user.graduationYear || 2020,
      course: user.course || 'BSc IT',
      department: user.department || 'Information Technology',
      company: user.company || 'Tech Enterprise',
      jobTitle: user.currentRole || 'Software Professional',
      industry: 'Technology & Software',
      location: user.location || 'Mumbai, India',
      experienceYears: 4,
      skills: user.skills || ['JavaScript', 'System Architecture', 'Mentoring'],
      bio: user.bio || 'Alumnus giving back through mentoring, mock interviews, and career networking.',
      mentorshipAvailability: true,
      activeMentees: 4,
      verificationStatus: user.verificationStatus || 'VERIFIED',
      profileCompletion: 90
    };
  },

  async getFacultyProfile(userId: string): Promise<FacultyProfile | null> {
    if (mockFacultyProfiles[userId]) return mockFacultyProfiles[userId];
    const user = await this.getUser(userId);
    if (!user) return null;
    return {
      id: `fp-${user.id}`,
      userId: user.id,
      uid: user.uid,
      institution: user.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
      institutionId: user.institutionId || 'inst-dtss-01',
      department: user.department || 'Computer Science',
      designation: user.currentRole || 'Assistant Professor',
      subjects: ['Software Engineering', 'Data Mining', 'Computer Networks'],
      experienceYears: 12,
      academicInterests: ['Curriculum Engineering', 'Undergraduate Research'],
      bio: user.bio || 'Faculty mentor coordinating industry engagement and capstone project defenses.',
      professionalLinks: {},
      verificationStatus: user.verificationStatus || 'VERIFIED'
    };
  },

  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      let alumni = 0;
      let students = 0;
      let mentors = 0;
      snap.forEach(d => {
        const u = d.data() as User;
        if (u.role === 'ALUMNI') {
          alumni++;
          if (u.isVerified || u.verificationStatus === 'VERIFIED') mentors++;
        }
        if (u.role === 'STUDENT') students++;
      });
      return {
        alumni: alumni.toString(),
        students: students.toString(),
        mentors: mentors.toString(),
        opportunities: '0',
        events: '0',
        communities: '0',
        institutions: '1'
      };
    } catch {
      const localUsers = getAllUsers();
      const alumni = localUsers.filter(u => u.role === 'ALUMNI').length;
      const students = localUsers.filter(u => u.role === 'STUDENT').length;
      const mentors = localUsers.filter(u => u.role === 'ALUMNI' && (u.isVerified || u.verificationStatus === 'VERIFIED')).length;
      return {
        alumni: alumni.toString(),
        students: students.toString(),
        mentors: mentors.toString(),
        opportunities: '0',
        events: '0',
        communities: '0',
        institutions: '1'
      };
    }
  },

  async requestVerification(): Promise<{ verificationStatus: string; message: string }> {
    const currentUser = getCurrentUser();
    let msg = 'Verification request submitted to your institution admin.';
    try {
      const res = await usersApi.requestVerification();
      if (res?.message) msg = res.message;
    } catch (err) {
      console.warn('Backend requestVerification error, updating local state:', err);
    }

    if (currentUser) {
      currentUser.verificationStatus = 'PENDING';
      currentUser.isVerified = false;
      try {
        await updateDoc(doc(db, 'users', currentUser.id), {
          verificationStatus: 'PENDING',
          isVerified: false
        });
      } catch (e) {
        console.warn('Firestore updateDoc requestVerification error:', e);
      }
      const users = getAllUsers();
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        users[idx].verificationStatus = 'PENDING';
        users[idx].isVerified = false;
        saveAllUsers(users);
      }
      localStorage.setItem('alumni_connect_current_user', JSON.stringify(currentUser));
    }
    return { verificationStatus: 'PENDING', message: msg };
  },

  async getPendingVerifications(institutionId?: string): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: User[] = [];
      snap.forEach(d => {
        const u = d.data() as User;
        if (u.role === 'ALUMNI' && (!u.isVerified || u.verificationStatus === 'PENDING')) {
          if (!institutionId || institutionId === 'ALL' || u.institutionId === institutionId) {
            list.push(u);
          }
        }
      });
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Firestore getPendingVerifications error:', e);
    }
    const allUsers = getAllUsers();
    return allUsers.filter(u => {
      const isPending = !u.isVerified || u.verificationStatus === 'PENDING';
      if (!isPending) return false;
      if (institutionId && institutionId !== 'ALL') {
        return u.institutionId === institutionId || !u.institutionId;
      }
      return true;
    });
  },

  async verifyUser(userId: string, status: 'VERIFIED' | 'REJECTED'): Promise<User> {
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          isVerified: status === 'VERIFIED',
          verificationStatus: status
        });
      } catch (e) {
        console.warn('Firestore verifyUser error:', e);
      }
    }
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].isVerified = status === 'VERIFIED';
      users[idx].verificationStatus = status;
      saveAllUsers(users);

      // If verifying self
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        currentUser.isVerified = status === 'VERIFIED';
        currentUser.verificationStatus = status;
        localStorage.setItem('alumni_connect_current_user', JSON.stringify(currentUser));
      }

      return users[idx];
    }
    return { id: userId, isVerified: status === 'VERIFIED', verificationStatus: status } as any;
  }
};
