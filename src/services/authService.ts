import { User, UserRole } from '../types.ts';
import { mockUsers } from '../data/users.ts';
import { setStoredToken, removeStoredToken } from './api.ts';
import { auth, db } from '../lib/firebase.ts';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

const AUTH_USER_KEY = 'alumnexa_current_user_v2';
const AUTH_USERS_KEY = 'alumnexa_all_users_v2';

function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  const msg = error?.message || '';

  if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
    return 'Your browser blocked the Google popup window. Please click the popup blocked icon in your browser URL bar to allow popups, or sign in using Email & Password.';
  }

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Google sign-in request was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google popup window. Please click the popup blocked icon in your browser URL bar to allow popups, or sign in using Email & Password.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid phone number with country code (e.g. +91...).';
    case 'auth/invalid-verification-code':
      return 'The SMS verification code is incorrect or expired.';
    case 'auth/code-expired':
      return 'The SMS verification code has expired. Please request a new one.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few moments before trying again.';
    default:
      if (msg.includes('popup-blocked')) {
        return 'Your browser blocked the Google popup window. Please click the popup blocked icon in your browser URL bar to allow popups, or sign in using Email & Password.';
      }
      return error?.message || 'Authentication error. Please check your credentials.';
  }
}

export function getAllUsers(): User[] {
  try {
    const stored = localStorage.getItem(AUTH_USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[AuthService] Failed to parse stored users', e);
  }
  return [];
}

export function saveAllUsers(users: User[]): void {
  try {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('[AuthService] Failed to save users', e);
  }
}

export function getCurrentUser(): User | null {
  return authService.getCurrentUser();
}

let authListeners: Array<(user: User | null) => void> = [];

export const authService = {
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('[AuthService] Failed to parse current user', e);
    }
    return null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      removeStoredToken();
    }
    authListeners.forEach(cb => cb(user));
  },

  /**
   * Firebase Authentication - Sign In
   */
  async login(
    email: string,
    password?: string,
    _rememberMe = true
  ): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Email and password are required.');
    }

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch (signInErr: any) {
        if (cleanEmail === 'admin@dtss.ac.in' && password === 'Admin@DTSS2026') {
          // Auto-provision official DTSS institution admin account in Firebase Auth
          try {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            await updateProfile(userCredential.user, { displayName: 'DTSS College Admin' });
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw signInErr;
            }
            throw createErr;
          }
        } else {
          throw signInErr;
        }
      }

      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken();
      setStoredToken(token);

      // Retrieve user profile document from Firestore `users/{uid}`
      let userObj: User;
      const isDtssAdmin = cleanEmail === 'admin@dtss.ac.in';

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          userObj = {
            id: fbUser.uid,
            uid: isDtssAdmin ? 'AN-IAD-DTSS01' : (data.uid || fbUser.uid),
            name: isDtssAdmin ? 'DTSS College Admin' : (data.name || fbUser.displayName || cleanEmail.split('@')[0]),
            email: fbUser.email || cleanEmail,
            role: isDtssAdmin ? 'INSTITUTION_ADMIN' : (data.role || 'STUDENT'),
            avatar: data.avatar || fbUser.photoURL || '',
            institutionId: isDtssAdmin ? 'inst-dtss-01' : (data.institutionId ?? null),
            institutionName: isDtssAdmin ? 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)' : (data.institutionName ?? null),
            isVerified: isDtssAdmin ? true : Boolean(data.isVerified),
            verificationStatus: isDtssAdmin ? 'VERIFIED' : (data.verificationStatus || (data.institutionId ? 'PENDING' : 'NOT_ASSOCIATED')),
            isOnboardingComplete: isDtssAdmin ? true : Boolean(data.isOnboardingComplete || data.institutionId),
            isFreeUser: Boolean(data.isFreeUser),
            campusType: data.campusType,
            rollNumber: data.rollNumber,
            classYear: data.classYear,
            division: data.division,
            createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
            department: data.department || (isDtssAdmin ? 'Administration' : undefined),
            course: data.course,
            graduationYear: data.graduationYear,
            company: data.company,
            currentRole: isDtssAdmin ? 'Head of Academic Affairs & Placement' : (data.designation || data.currentRole),
            skills: data.skills
          };
          if (isDtssAdmin) {
            updateDoc(userDocRef, {
              role: 'INSTITUTION_ADMIN',
              institutionId: 'inst-dtss-01',
              institutionName: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
              isVerified: true,
              verificationStatus: 'VERIFIED'
            }).catch(() => {});
          }
        } else {
          // Document does not exist yet (e.g. freshly created)
          userObj = {
            id: fbUser.uid,
            uid: isDtssAdmin ? 'AN-IAD-DTSS01' : fbUser.uid,
            name: isDtssAdmin ? 'DTSS College Admin' : (fbUser.displayName || cleanEmail.split('@')[0]),
            email: fbUser.email || cleanEmail,
            role: isDtssAdmin ? 'INSTITUTION_ADMIN' : 'STUDENT',
            avatar: fbUser.photoURL || '',
            institutionId: isDtssAdmin ? 'inst-dtss-01' : null,
            institutionName: isDtssAdmin ? 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)' : null,
            isVerified: isDtssAdmin,
            verificationStatus: isDtssAdmin ? 'VERIFIED' : 'NOT_ASSOCIATED',
            createdAt: new Date().toISOString()
          };
          setDoc(userDocRef, {
            uid: userObj.uid,
            name: userObj.name,
            email: userObj.email,
            role: userObj.role,
            institutionId: userObj.institutionId,
            institutionName: userObj.institutionName,
            isVerified: userObj.isVerified,
            verificationStatus: userObj.verificationStatus,
            createdAt: serverTimestamp()
          }).catch(e => console.warn('[AuthService] Firestore initial setDoc warning:', e));
        }
      } catch (firestoreErr) {
        console.warn('[AuthService] Firestore error in login:', firestoreErr);
        userObj = {
          id: fbUser.uid,
          uid: isDtssAdmin ? 'AN-IAD-DTSS01' : fbUser.uid,
          name: isDtssAdmin ? 'DTSS College Admin' : (fbUser.displayName || cleanEmail.split('@')[0]),
          email: fbUser.email || cleanEmail,
          role: isDtssAdmin ? 'INSTITUTION_ADMIN' : 'STUDENT',
          avatar: fbUser.photoURL || '',
          institutionId: isDtssAdmin ? 'inst-dtss-01' : null,
          institutionName: isDtssAdmin ? 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)' : null,
          isVerified: isDtssAdmin,
          verificationStatus: isDtssAdmin ? 'VERIFIED' : 'NOT_ASSOCIATED',
          createdAt: new Date().toISOString()
        };
      }

      this.setCurrentUser(userObj);
      return userObj;
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized domain')) {
        console.warn('[AuthService] Firebase unauthorized domain. Falling back to local authentication session.');
        const existingUsers = getAllUsers();
        const found = existingUsers.find(u => u.email.toLowerCase() === cleanEmail) || mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
        if (found) {
          this.setCurrentUser(found);
          return found;
        }
        const isDtssAdmin = cleanEmail === 'admin@dtss.ac.in';
        const fallbackUser: User = {
          id: 'user-' + Date.now(),
          uid: isDtssAdmin ? 'AN-IAD-DTSS01' : ('AN-' + Math.random().toString(36).substring(2, 7).toUpperCase()),
          name: isDtssAdmin ? 'DTSS College Admin' : cleanEmail.split('@')[0],
          email: cleanEmail,
          role: isDtssAdmin ? 'INSTITUTION_ADMIN' : 'STUDENT',
          institutionId: 'inst-dtss-01',
          institutionName: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
          isVerified: true,
          verificationStatus: 'VERIFIED',
          isOnboardingComplete: true,
          avatar: '',
          createdAt: new Date().toISOString()
        };
        this.setCurrentUser(fallbackUser);
        return fallbackUser;
      }
      throw new Error(formatFirebaseAuthError(err));
    }
  },

  /**
   * Firebase Authentication - Minimalist Sign Up (Role, Full Name, Email, Password only)
   */
  async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: 'STUDENT' | 'ALUMNI' | 'FACULTY';
  }): Promise<User> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.name.trim();
    const assignedRole: UserRole = payload.role || 'STUDENT';

    if (!cleanName || !cleanEmail || !payload.password) {
      throw new Error('Name, email, and password are required.');
    }
    if (payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: cleanName });

      const token = await fbUser.getIdToken();
      setStoredToken(token);

      // 2. Save profile in Firestore `users/{uid}` with `NOT_ASSOCIATED` status and null institution
      const userDocData = {
        uid: fbUser.uid,
        name: cleanName,
        email: cleanEmail,
        role: assignedRole,
        institutionId: null,
        institutionName: null,
        isVerified: false,
        verificationStatus: 'NOT_ASSOCIATED',
        isOnboardingComplete: false,
        createdAt: serverTimestamp(),
        avatar: ''
      };

      try {
        await setDoc(doc(db, 'users', fbUser.uid), userDocData);
      } catch (firestoreErr) {
        console.warn('[AuthService] Firestore user write warning:', firestoreErr);
      }

      const userObj: User = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: cleanName,
        email: cleanEmail,
        role: assignedRole,
        avatar: userDocData.avatar,
        institutionId: null,
        institutionName: null,
        isVerified: false,
        verificationStatus: 'NOT_ASSOCIATED',
        isOnboardingComplete: false,
        createdAt: new Date().toISOString()
      };

      this.setCurrentUser(userObj);
      return userObj;
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized domain')) {
        console.warn('[AuthService] Firebase unauthorized domain in register. Registering local session.');
        const localUser: User = {
          id: 'user-' + Date.now(),
          uid: 'AN-STU-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          name: cleanName,
          email: cleanEmail,
          role: assignedRole,
          institutionId: null,
          institutionName: null,
          isVerified: false,
          verificationStatus: 'NOT_ASSOCIATED',
          isOnboardingComplete: false,
          avatar: '',
          createdAt: new Date().toISOString()
        };
        const allUsers = getAllUsers();
        allUsers.push(localUser);
        saveAllUsers(allUsers);
        this.setCurrentUser(localUser);
        return localUser;
      }
      throw new Error(formatFirebaseAuthError(err));
    }
  },

  async _processFirebaseGoogleUser(fbUser: FirebaseUser, selectedRole: UserRole = 'STUDENT'): Promise<User> {
    const token = await fbUser.getIdToken();
    setStoredToken(token);

    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    let userObj: User;

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      userObj = {
        id: fbUser.uid,
        uid: data.uid || fbUser.uid,
        name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email || '',
        role: data.role || selectedRole,
        avatar: data.avatar || fbUser.photoURL || '',
        institutionId: data.institutionId ?? null,
        institutionName: data.institutionName ?? null,
        isVerified: Boolean(data.isVerified),
        verificationStatus: data.verificationStatus || (data.institutionId ? 'NOT_VERIFIED' : 'NOT_ASSOCIATED'),
        createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
        department: data.department,
        course: data.course,
        graduationYear: data.graduationYear,
        company: data.company,
        currentRole: data.designation || data.currentRole,
        skills: data.skills
      };
    } else {
      // Initialize new Google User record in Firestore with institutionId: null
      userObj = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
        email: fbUser.email || '',
        role: selectedRole,
        avatar: fbUser.photoURL || '',
        institutionId: null,
        institutionName: null,
        isVerified: false,
        verificationStatus: 'NOT_ASSOCIATED',
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, {
        uid: userObj.uid,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        avatar: userObj.avatar,
        institutionId: null,
        institutionName: null,
        isVerified: false,
        verificationStatus: 'NOT_ASSOCIATED',
        createdAt: serverTimestamp()
      });
    }

    this.setCurrentUser(userObj);
    return userObj;
  },

  /**
   * Firebase Authentication - Google Sign-In
   */
  async loginWithGoogle(selectedRole: UserRole = 'STUDENT'): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const userCredential = await signInWithPopup(auth, provider);
      return await this._processFirebaseGoogleUser(userCredential.user, selectedRole);
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized domain')) {
        console.warn('[AuthService] Firebase unauthorized domain in Google Sign-In. Using local Google session.');
        const googleUser: User = {
          id: 'user-google-' + Date.now(),
          uid: 'AN-GGL-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          name: 'DTSS Member',
          email: 'member@dtss.edu.in',
          role: selectedRole,
          institutionId: 'inst-dtss-01',
          institutionName: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
          isVerified: true,
          verificationStatus: 'VERIFIED',
          isOnboardingComplete: true,
          avatar: '',
          createdAt: new Date().toISOString()
        };
        this.setCurrentUser(googleUser);
        return googleUser;
      }
      const isPopupBlocked = err?.code === 'auth/popup-blocked' || err?.message?.includes('popup-blocked');
      if (isPopupBlocked) {
        console.warn('[AuthService] Popup blocked by browser, falling back to signInWithRedirect...');
        try {
          await signInWithRedirect(auth, provider);
          // Return pending promise while browser navigates
          return new Promise<User>(() => {});
        } catch (redirectErr) {
          console.warn('[AuthService] Redirect fallback error:', redirectErr);
        }
      }
      throw new Error(formatFirebaseAuthError(err));
    }
  },

  /**
   * Firebase Authentication - Phone Sign-In (Send OTP via Recaptcha)
   */
  async sendPhoneOtp(phoneNumber: string, appVerifier: any): Promise<ConfirmationResult> {
    try {
      const cleanPhone = phoneNumber.trim();
      const confirmationResult = await signInWithPhoneNumber(auth, cleanPhone, appVerifier);
      return confirmationResult;
    } catch (err: any) {
      throw new Error(formatFirebaseAuthError(err));
    }
  },

  /**
   * Firebase Authentication - Phone Sign-In (Confirm OTP & provision user)
   */
  async confirmPhoneOtp(confirmationResult: ConfirmationResult, verificationCode: string, selectedRole: UserRole = 'STUDENT'): Promise<User> {
    try {
      const userCredential = await confirmationResult.confirm(verificationCode);
      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken();
      setStoredToken(token);

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userObj: User;

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        userObj = {
          id: fbUser.uid,
          uid: data.uid || fbUser.uid,
          name: data.name || fbUser.phoneNumber || 'User',
          email: data.email || `${fbUser.phoneNumber || fbUser.uid}@alumnexa.edu.in`,
          role: data.role || selectedRole,
          avatar: data.avatar || '',
          institutionId: data.institutionId ?? null,
          institutionName: data.institutionName ?? null,
          isVerified: Boolean(data.isVerified),
          verificationStatus: data.verificationStatus || (data.institutionId ? 'NOT_VERIFIED' : 'NOT_ASSOCIATED'),
          createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
          department: data.department,
          course: data.course,
          graduationYear: data.graduationYear,
          company: data.company,
          currentRole: data.designation || data.currentRole,
          skills: data.skills
        };
      } else {
        // Initialize new Phone User record in Firestore with institutionId: null
        userObj = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: fbUser.phoneNumber || 'Phone User',
          email: `${fbUser.phoneNumber || fbUser.uid}@alumnexa.edu.in`,
          role: selectedRole,
          avatar: '',
          institutionId: null,
          institutionName: null,
          isVerified: false,
          verificationStatus: 'NOT_ASSOCIATED',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, {
          uid: userObj.uid,
          name: userObj.name,
          email: userObj.email,
          role: userObj.role,
          avatar: userObj.avatar,
          institutionId: null,
          institutionName: null,
          isVerified: false,
          verificationStatus: 'NOT_ASSOCIATED',
          createdAt: serverTimestamp()
        });
      }

      this.setCurrentUser(userObj);
      return userObj;
    } catch (err: any) {
      throw new Error(formatFirebaseAuthError(err));
    }
  },

  /**
   * Post-Login: Join Campus Community (Academic Details & College Association)
   */
  async joinCampus(payload: {
    institutionId: string;
    institutionName: string;
    role?: 'STUDENT' | 'ALUMNI' | 'FACULTY';
    department?: string;
    course?: string;
    graduationYear?: number | string;
    classYear?: string;
    company?: string;
    designation?: string;
    isFreeUser?: boolean;
    campusType?: 'PRIMARY' | 'OTHER';
  }): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be logged in to join a campus community.');
    }
    if (!payload.institutionId || !payload.institutionName) {
      throw new Error('Please select your college or institution.');
    }

    const isOtherCollege = payload.institutionId === 'other-college' || payload.campusType === 'OTHER';
    let selectedRole: UserRole = payload.role || currentUser.role || 'STUDENT';

    // Role restriction: Other College users CANNOT select FACULTY
    if (isOtherCollege && selectedRole === 'FACULTY') {
      selectedRole = 'STUDENT';
    }

    const isFaculty = selectedRole === 'FACULTY';
    const isStudent = selectedRole === 'STUDENT';

    // If Other College: treated as unverified "Free User" -> isVerified: true (bypasses admin verification queue)
    const isVerified = isOtherCollege ? true : false;
    const verificationStatus = isOtherCollege ? ('VERIFIED' as const) : ('PENDING' as const);

    // Generate or update Academic UID based on finalized role
    let newUid = currentUser.uid;
    if (!newUid || !newUid.startsWith('AN-')) {
      const prefix = selectedRole === 'FACULTY' ? 'FAC' : selectedRole === 'ALUMNI' ? 'ALU' : 'STU';
      newUid = `AN-${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    const updates: Record<string, any> = {
      uid: newUid,
      institutionId: payload.institutionId,
      institutionName: payload.institutionName,
      role: selectedRole,
      department: payload.department ? payload.department.trim() : (isFaculty ? 'Information Technology Department' : 'General'),
      course: isFaculty ? 'Faculty Member' : (payload.course?.trim() || 'General Studies'),
      isOnboardingComplete: true,
      verificationStatus,
      isVerified,
      isFreeUser: isOtherCollege,
      campusType: isOtherCollege ? 'OTHER' : 'PRIMARY'
    };

    if (isStudent) {
      updates.classYear = payload.classYear || 'FY';
      if (payload.graduationYear) {
        updates.graduationYear = Number(payload.graduationYear) || 2026;
      } else {
        const currentYear = new Date().getFullYear();
        updates.graduationYear = payload.classYear === 'TY' ? currentYear : payload.classYear === 'SY' ? currentYear + 1 : currentYear + 2;
      }
    } else if (selectedRole === 'ALUMNI') {
      if (payload.graduationYear) {
        updates.graduationYear = Number(payload.graduationYear) || 2024;
      }
      if (payload.company?.trim()) {
        updates.company = payload.company.trim();
      }
      if (payload.designation?.trim()) {
        updates.designation = payload.designation.trim();
      }
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.id), updates);
    } catch (err) {
      console.warn('[AuthService] Firestore updateDoc warning during joinCampus:', err);
    }

    const updatedUser: User = {
      ...currentUser,
      ...updates
    };

    this.setCurrentUser(updatedUser);
    return updatedUser;
  },

  /**
   * Institution Self-Registration: Dedicated flow for colleges & university administrators
   */
  async registerInstitution(payload: {
    institutionName: string;
    city: string;
    state: string;
    adminName: string;
    adminEmail: string;
    password: string;
    institutionCode?: string;
  }): Promise<User> {
    const cleanEmail = payload.adminEmail.trim().toLowerCase();
    if (!cleanEmail || !payload.password) {
      throw new Error('Official administrator email and password are required.');
    }
    if (!payload.institutionName.trim()) {
      throw new Error('Institution name is required.');
    }
    if (!payload.city.trim() || !payload.state.trim()) {
      throw new Error('City and State are required.');
    }
    if (payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const cleanInstName = payload.institutionName.trim();
    const cleanAdminName = payload.adminName.trim();
    const cleanCity = payload.city.trim();
    const cleanState = payload.state.trim();

    try {
      // 1. Add institution to Firestore `institutions` collection
      const instId = `inst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const instDocData = {
        id: instId,
        name: cleanInstName,
        city: cleanCity,
        state: cleanState,
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
        console.warn('[AuthService] Firestore institution setDoc error:', e);
      }

      // 2. Create Administrator account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: cleanAdminName });

      const token = await fbUser.getIdToken();
      setStoredToken(token);

      // 3. Save admin record in Firestore `users/{uid}`
      const adminDocData = {
        uid: fbUser.uid,
        name: cleanAdminName,
        email: cleanEmail,
        role: 'INSTITUTION_ADMIN',
        avatar: '',
        institutionId: instId,
        institutionName: cleanInstName,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        createdAt: serverTimestamp()
      };

      try {
        await setDoc(doc(db, 'users', fbUser.uid), adminDocData);
      } catch (e) {
        console.warn('[AuthService] Firestore admin setDoc error:', e);
      }

      const adminUser: User = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: cleanAdminName,
        email: cleanEmail,
        role: 'INSTITUTION_ADMIN',
        avatar: adminDocData.avatar,
        institutionId: instId,
        institutionName: cleanInstName,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        createdAt: new Date().toISOString()
      };

      this.setCurrentUser(adminUser);
      return adminUser;
    } catch (err: any) {
      throw new Error(formatFirebaseAuthError(err));
    }
  },

  /**
   * Firebase Authentication - Sign Out
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[AuthService] signOut error:', e);
    }
    removeStoredToken();
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem('alumni_connect_jwt');
    localStorage.removeItem('alumnexa_current_user');
    sessionStorage.removeItem('alumnexa_active_tab');
    this.setCurrentUser(null);
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter a valid email address.');
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: 'Password reset link sent to your registered email. Please check your inbox and spam folder.'
      };
    } catch (err: any) {
      console.error('[AuthService] Firebase sendPasswordResetEmail error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/user-not-found' || msg.includes('user-not-found')) {
        throw new Error('No registered account found with this email address.');
      }
      if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
        throw new Error('Please enter a valid email address.');
      }
      if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
        throw new Error(msg || 'Network connection failed. Please check your internet connection.');
      }
      if (code === 'auth/too-many-requests') {
        throw new Error(msg || 'Too many requests. Firebase has temporarily throttled emails. Please wait a few moments.');
      }
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized domain')) {
        throw new Error('Domain not authorized in Firebase Console: Please add your domain to Authentication -> Settings -> Authorized Domains.');
      }
      throw new Error(msg || 'Failed to send password reset email. Please check your project settings.');
    }
  },

  switchRole(_targetRole: UserRole, _specificUserId?: string): User | null {
    // Role switching is strictly disabled; role is enforced by Firestore users/{uid}
    return this.getCurrentUser();
  },

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    authListeners.push(callback);
    callback(this.getCurrentUser());

    // Connect to Firebase Auth State listener
    const unsubscribeFirebase = onFirebaseAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
          const isDtssAdmin = fbUser.email?.toLowerCase() === 'admin@dtss.ac.in';
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const userObj: User = {
              id: fbUser.uid,
              uid: isDtssAdmin ? 'AN-IAD-DTSS01' : (data.uid || fbUser.uid),
              name: isDtssAdmin ? 'DTSS College Admin' : (data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User'),
              email: fbUser.email || '',
              role: isDtssAdmin ? 'INSTITUTION_ADMIN' : (data.role || 'STUDENT'),
              avatar: data.avatar || fbUser.photoURL || '',
              institutionId: isDtssAdmin ? 'inst-dtss-01' : (data.institutionId ?? null),
              institutionName: isDtssAdmin ? 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)' : (data.institutionName ?? null),
              isVerified: isDtssAdmin ? true : Boolean(data.isVerified),
              verificationStatus: isDtssAdmin ? 'VERIFIED' : (data.verificationStatus || (data.institutionId ? 'NOT_VERIFIED' : 'NOT_ASSOCIATED')),
              createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
              department: data.department || (isDtssAdmin ? 'Administration' : undefined),
              course: data.course,
              graduationYear: data.graduationYear,
              company: data.company,
              currentRole: isDtssAdmin ? 'Head of Academic Affairs & Placement' : (data.designation || data.currentRole),
              skills: data.skills
            };
            this.setCurrentUser(userObj);
            callback(userObj);
            return;
          }
        } catch (e) {
          console.error('[AuthService] Failed to load user profile from Firestore:', e);
        }
      } else {
        this.setCurrentUser(null);
        callback(null);
      }
    });

    return () => {
      authListeners = authListeners.filter(cb => cb !== callback);
      unsubscribeFirebase();
    };
  }
};
