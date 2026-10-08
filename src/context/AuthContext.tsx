import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types.ts';
import { authService } from '../services/authService.ts';
import { notificationService } from '../services/notificationService.ts';
import { setStoredToken } from '../services/api.ts';
import { auth, db } from '../lib/firebase.ts';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  unreadCount: number;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; role?: 'STUDENT' | 'ALUMNI' | 'FACULTY' }) => Promise<User>;
  joinCampus: (payload: {
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
    linkedin?: string;
    resumeUrl?: string;
    portfolio?: string;
  }) => Promise<User>;
  registerInstitution: (payload: {
    institutionName: string;
    city: string;
    state: string;
    adminName: string;
    adminEmail: string;
    password: string;
    institutionCode?: string;
  }) => Promise<User>;
  loginWithGoogle: (role?: UserRole) => Promise<User>;
  sendPhoneOtp: (phoneNumber: string, appVerifier: any) => Promise<any>;
  confirmPhoneOtp: (confirmationResult: any, code: string, role?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole, specificUserId?: string) => User | null;
  refreshNotifications: () => Promise<void>;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount(user?.id);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshNotifications();
    const handleNotifAdded = () => {
      refreshNotifications();
    };
    window.addEventListener('alumnexa_notification_added', handleNotifAdded);
    window.addEventListener('storage', handleNotifAdded);
    return () => {
      window.removeEventListener('alumnexa_notification_added', handleNotifAdded);
      window.removeEventListener('storage', handleNotifAdded);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const token = await fbUser.getIdToken();
            setStoredToken(token);

            const userObj: User = {
              id: fbUser.uid,
              uid: data.uid || fbUser.uid,
              name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              email: fbUser.email || '',
              role: data.role || 'STUDENT',
              avatar: data.avatar || fbUser.photoURL || '',
              institutionId: data.institutionId ?? null,
              institutionName: data.institutionName ?? null,
              isVerified: Boolean(data.isVerified),
              verificationStatus: data.verificationStatus || (data.institutionId ? 'PENDING' : 'NOT_ASSOCIATED'),
              isOnboardingComplete: Boolean(data.isOnboardingComplete || data.institutionId),
              isFreeUser: Boolean(data.isFreeUser),
              campusType: data.campusType,
              rollNumber: data.rollNumber,
              classYear: data.classYear,
              division: data.division,
              createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
              department: data.department,
              course: data.course,
              graduationYear: data.graduationYear,
              company: data.company,
              currentRole: data.designation || data.currentRole,
              skills: data.skills
            };

            authService.setCurrentUser(userObj);
            setUser(userObj);
            setLoading(false);
            refreshNotifications();
            return;
          }
        } catch (e) {
          console.error('[AuthContext] Failed to load user profile from Firestore:', e);
        }
      }

      // No active Firebase user or logged out
      setUser(null);
      authService.setCurrentUser(null);
      setLoading(false);
      refreshNotifications();
    });

    return () => unsubscribe();
  }, [refreshNotifications]);

  const login = async (
    email: string,
    password = '',
    rememberMe = true
  ): Promise<User> => {
    setLoading(true);
    try {
      const loggedIn = await authService.login(email, password, rememberMe);
      setUser(loggedIn);
      await refreshNotifications();
      return loggedIn;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: { name: string; email: string; password: string; role?: 'STUDENT' | 'ALUMNI' | 'FACULTY' }): Promise<User> => {
    setLoading(true);
    try {
      const newUser = await authService.register(payload);
      setUser(newUser);
      await refreshNotifications();
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const joinCampus = async (payload: {
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
    linkedin?: string;
    resumeUrl?: string;
    portfolio?: string;
  }): Promise<User> => {
    setLoading(true);
    try {
      const updated = await authService.joinCampus(payload);
      setUser(updated);
      await refreshNotifications();
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const registerInstitution = async (payload: {
    institutionName: string;
    city: string;
    state: string;
    adminName: string;
    adminEmail: string;
    password: string;
    institutionCode?: string;
  }): Promise<User> => {
    setLoading(true);
    try {
      const adminUser = await authService.registerInstitution(payload);
      setUser(adminUser);
      await refreshNotifications();
      return adminUser;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (role?: UserRole): Promise<User> => {
    setLoading(true);
    try {
      const loggedIn = await authService.loginWithGoogle(role);
      setUser(loggedIn);
      await refreshNotifications();
      return loggedIn;
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOtp = async (phoneNumber: string, appVerifier: any): Promise<any> => {
    return authService.sendPhoneOtp(phoneNumber, appVerifier);
  };

  const confirmPhoneOtp = async (confirmationResult: any, code: string, role?: UserRole): Promise<User> => {
    setLoading(true);
    try {
      const loggedIn = await authService.confirmPhoneOtp(confirmationResult, code, role);
      setUser(loggedIn);
      await refreshNotifications();
      return loggedIn;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[AuthContext] signOut error:', e);
    }
    await authService.logout();
    setUser(null);
    setUnreadCount(0);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  const switchRole = (_role: UserRole, _specificUserId?: string): User | null => {
    // Role switching is strictly disabled; role is enforced by Firestore users/{uid}
    return user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        unreadCount,
        login,
        register,
        joinCampus,
        registerInstitution,
        loginWithGoogle,
        sendPhoneOtp,
        confirmPhoneOtp,
        logout,
        switchRole,
        refreshNotifications,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
