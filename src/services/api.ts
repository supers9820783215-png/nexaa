import {
  AlumniDirectoryItem,
  EventItem,
  MentorshipRequestItem,
  NotificationItem,
  Opportunity,
  User,
  ConnectionUser
} from '../types.ts';

const TOKEN_KEY = 'alumni_connect_jwt';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

// 1. Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: any) =>
    request<{ token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  quickLogin: (demoType: 'student' | 'alumni' | 'admin') =>
    request<{ token: string; user: User; message: string }>('/api/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ demoType }),
    }),

  getMe: () =>
    request<{ user: User; profile: any }>('/api/auth/me'),
};

// 2. Alumni API
export const alumniApi = {
  list: (params: {
    search?: string;
    department?: string;
    graduationYear?: string;
    industry?: string;
    mentoringAvailable?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.department && params.department !== 'ALL') query.append('department', params.department);
    if (params.graduationYear && params.graduationYear !== 'ALL') query.append('graduationYear', params.graduationYear);
    if (params.industry && params.industry !== 'ALL') query.append('industry', params.industry);
    if (params.mentoringAvailable) query.append('mentoringAvailable', 'true');
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return request<{ alumni: AlumniDirectoryItem[]; total: number; page: number; totalPages: number }>(
      `/api/alumni?${query.toString()}`
    );
  },

  getById: (id: string) =>
    request<AlumniDirectoryItem & { postedOpportunities?: Opportunity[] }>(`/api/alumni/${id}`),

  toggleMentoring: (available: boolean) =>
    request<{ message: string; mentoringAvailable: boolean }>('/api/alumni/mentoring-toggle', {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    }),
};

// 3. Connections API
export const connectionsApi = {
  request: (receiverId: string) =>
    request<{ message: string; status: string; id?: string }>('/api/connections/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    }),

  list: () =>
    request<{
      connected: ConnectionUser[];
      incoming: ConnectionUser[];
      outgoing: ConnectionUser[];
    }>('/api/connections'),

  respond: (id: string, action: 'ACCEPT' | 'REJECT') =>
    request<{ message: string; status: string }>(`/api/connections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),
};

// 4. Mentorship API
export const mentorshipApi = {
  getMentors: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ mentors: AlumniDirectoryItem[] }>(`/api/mentorship/mentors${query}`);
  },

  sendRequest: (alumniId: string, topic: string, message: string) =>
    request<{ message: string; requestId: string; status: string }>('/api/mentorship/request', {
      method: 'POST',
      body: JSON.stringify({ alumniId, topic, message }),
    }),

  getRequests: () =>
    request<{
      incoming: MentorshipRequestItem[];
      outgoing: MentorshipRequestItem[];
    }>('/api/mentorship/requests'),

  respond: (id: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') =>
    request<{ message: string; status: string }>(`/api/mentorship/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// 5. Opportunities API
export const opportunitiesApi = {
  list: (params: { type?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'ALL') query.append('type', params.type);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return request<{ opportunities: Opportunity[]; total: number; page: number; totalPages: number }>(
      `/api/opportunities?${query.toString()}`
    );
  },

  create: (payload: {
    type: 'JOB' | 'INTERNSHIP';
    title: string;
    company: string;
    description: string;
    location: string;
    employmentType: string;
    skills: string;
    experienceRequired: string;
    deadline: string;
    applicationLink: string;
  }) =>
    request<{ message: string; opportunityId: string }>('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/opportunities/${id}`, {
      method: 'DELETE',
    }),
};

// 6. Events API
export const eventsApi = {
  list: (params?: { search?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.type && params?.type !== 'ALL') query.append('type', params.type);
    return request<{ events: EventItem[] }>(`/api/events?${query.toString()}`);
  },

  getMyEvents: () =>
    request<{ registeredEvents: (EventItem & { registered_at: string; attendance_status: string })[] }>(
      '/api/events/my-events'
    ),

  register: (id: string) =>
    request<{ message: string; registrationId: string }>(`/api/events/${id}/register`, {
      method: 'POST',
    }),

  cancelRegistration: (id: string) =>
    request<{ message: string }>(`/api/events/${id}/register`, {
      method: 'DELETE',
    }),

  create: (payload: any) =>
    request<{ message: string; eventId: string }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: any) =>
    request<{ message: string; event: EventItem }>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/events/${id}`, {
      method: 'DELETE',
    }),

  getAttendees: (id: string) =>
    request<{ attendees: any[] }>(`/api/events/${id}/registrations`),
};

// 7. Notifications API
export const notificationsApi = {
  list: () =>
    request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications'),

  markRead: (id: string) =>
    request<{ message: string }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllRead: () =>
    request<{ message: string }>('/api/notifications/read-all', {
      method: 'PATCH',
    }),
};

// 8. Admin API
export const adminApi = {
  getStats: () =>
    request<{
      stats: {
        totalUsers: number;
        students: number;
        alumni: number;
        verifiedAlumni: number;
        pendingAlumniVerification: number;
        mentors: number;
        opportunities: number;
        events: number;
        activeConnections: number;
      };
    }>('/api/admin/stats'),

  getUsers: (role?: string, search?: string) => {
    const query = new URLSearchParams();
    if (role && role !== 'ALL') query.append('role', role);
    if (search) query.append('search', search);
    return request<{ users: any[] }>(`/api/admin/users?${query.toString()}`);
  },

  getVerifications: () =>
    request<{ pendingAlumni: any[] }>('/api/admin/verifications'),

  getPendingVerifications: () =>
    request<{ pendingUsers: any[]; pendingAlumni: any[] }>('/api/admin/pending-verifications'),

  verifyUser: (id: string, status: 'VERIFIED' | 'REJECTED') =>
    request<{ message: string; user?: any; status: string }>(`/api/admin/verify-user/${id}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  verifyAlumni: (id: string, status: 'VERIFIED' | 'REJECTED') =>
    request<{ message: string; status: string }>(`/api/admin/verify-alumni/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),
};

// 9. Users Profile API
export const usersApi = {
  getProfile: (id: string) =>
    request<{ user: User; profile: any }>(`/api/users/profile/${id}`),

  updateProfile: (data: any) =>
    request<{ message: string }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  requestVerification: () =>
    request<{ message: string; user?: any; verificationStatus: string }>('/api/users/request-verification', {
      method: 'POST',
    }),
};

// 10. Direct Messages API
export const messagesApi = {
  getConversations: () =>
    request<{ conversations: any[] }>('/api/messages/conversations'),

  getHistory: (partnerId: string) =>
    request<{ messages: any[]; partner: any }>(`/api/messages/${partnerId}`),

  send: (receiverId: string, content: string) =>
    request<{ message: any }>('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    }),
};

// 11. Institutions API
export const institutionsApi = {
  list: () =>
    request<{
      institutions: Array<{
        id: string;
        name: string;
        code?: string;
        city: string;
        state: string;
        created_at?: string;
      }>;
    }>('/api/institutions'),

  register: (payload: {
    institutionName: string;
    institutionCode?: string;
    city: string;
    state: string;
    adminName: string;
    adminEmail: string;
    password: string;
  }) =>
    request<{
      message: string;
      token: string;
      user: User;
      institution: {
        id: string;
        name: string;
        code?: string;
        city: string;
        state: string;
      };
    }>('/api/institutions/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

