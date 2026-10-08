import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { db } from '../lib/firebase.ts';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { getAllUsers } from '../services/authService.ts';
import { institutionService } from '../services/institutionService.ts';
import { eventService } from '../services/eventService.ts';
import { EventItem } from '../types.ts';
import { UserAvatar } from '../components/common/UserAvatar.tsx';
import {
  ShieldAlert,
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  Calendar,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  BookOpen,
  Plus,
  X,
  MapPin,
  Building2,
  Video
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingAlumni, setPendingAlumni] = useState<any[]>([]);
  const [allUsersCache, setAllUsersCache] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'verifications' | 'users' | 'courses'>('verifications');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Dynamic courses management state
  const [coursesList, setCoursesList] = useState<string[]>([]);
  const [newCourseInput, setNewCourseInput] = useState('');

  // Campus events interactive state
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState<EventItem | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] = useState<'WORKSHOP' | 'MEETUP' | 'WEBINAR' | 'COLLEGE_EVENT'>('WORKSHOP');
  const [newEventIsOnline, setNewEventIsOnline] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      let users: any[] = [];
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        snapshot.forEach(docSnap => {
          users.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (err) {
        console.warn('Firestore fetch error, falling back to local users:', err);
      }

      if (users.length === 0) {
        users = getAllUsers();
      }

      setAllUsersCache(users);

      const pending = users.filter(u =>
        u.verificationStatus === 'PENDING' || (u.role === 'ALUMNI' && !u.isVerified)
      );
      setPendingAlumni(pending);

      // Fetch dynamic courses
      const loadedCourses = await institutionService.getCourses(user?.institutionId || 'inst-dtss-01');
      setCoursesList(loadedCourses);

      // Fetch events
      const loadedEvents = await eventService.getEvents();
      setEventsList(loadedEvents);

      setStats({
        totalUsers: users.length,
        students: users.filter(u => u.role === 'STUDENT').length,
        alumni: users.filter(u => u.role === 'ALUMNI').length,
        pendingAlumniVerification: pending.length,
        verifiedAlumni: users.filter(u => u.role === 'ALUMNI' && u.isVerified).length,
        mentors: users.filter(u => u.role === 'ALUMNI' && u.isVerified).length,
        activeConnections: 0,
        opportunities: 0,
        events: loadedEvents.length
      });
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  useEffect(() => {
    let filtered = [...allUsersCache];
    if (userRoleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === userRoleFilter);
    }
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      filtered = filtered.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.uid && u.uid.toLowerCase().includes(q))
      );
    }
    setUsersList(filtered);
  }, [allUsersCache, userRoleFilter, userSearch]);

  const handleVerifyAlumni = async (userId: string, status: 'VERIFIED' | 'REJECTED') => {
    setActionLoadingId(userId);
    try {
      try {
        await updateDoc(doc(db, 'users', userId), {
          isVerified: status === 'VERIFIED',
          verificationStatus: status
        });
      } catch (e) {
        console.warn('Could not update Firestore document:', e);
      }

      setPendingAlumni(prev => prev.filter(a => a.id !== userId));
      setAllUsersCache(prev =>
        prev.map(u => u.id === userId ? { ...u, isVerified: status === 'VERIFIED', verificationStatus: status } : u)
      );

      setStats((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          pendingAlumniVerification: Math.max(0, prev.pendingAlumniVerification - 1),
          verifiedAlumni: status === 'VERIFIED' ? prev.verifiedAlumni + 1 : prev.verifiedAlumni,
          mentors: status === 'VERIFIED' ? prev.mentors + 1 : prev.mentors
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update verification status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userName}" and all associated data?`)) {
      return;
    }
    try {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (e) {
        console.warn('Could not delete Firestore document:', e);
      }

      setAllUsersCache(prev => prev.filter(u => u.id !== userId));
      setPendingAlumni(prev => prev.filter(a => a.id !== userId));
      setStats((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalUsers: Math.max(0, prev.totalUsers - 1)
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  // Course management handlers
  const handleAddCourse = async () => {
    if (!newCourseInput.trim()) return;
    const updated = await institutionService.addCourse(user?.institutionId || 'inst-dtss-01', newCourseInput.trim());
    setCoursesList(updated);
    setNewCourseInput('');
  };

  const handleRemoveCourse = async (courseName: string) => {
    const updated = await institutionService.removeCourse(user?.institutionId || 'inst-dtss-01', courseName);
    setCoursesList(updated);
  };

  // Event handlers
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate.trim()) {
      alert('Please provide at least a title and date.');
      return;
    }

    const created = await eventService.createEvent({
      title: newEventTitle.trim(),
      eventType: newEventType,
      date: newEventDate.trim(),
      time: newEventTime.trim() || '11:00 AM - 1:00 PM IST',
      location: newEventLocation.trim() || 'Campus Auditorium',
      isOnline: newEventIsOnline,
      organizer: user?.name || 'DTSS College Admin',
      organizerRole: 'College Administration',
      institution: user?.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
      description: newEventDescription.trim() || 'Official campus schedule organized for students and alumni.',
      maxCapacity: 150,
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      registrationDeadline: newEventDate.trim()
    });

    setEventsList(prev => [created, ...prev]);
    setIsAddingEvent(false);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventLocation('');
    setNewEventDescription('');
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to remove this campus event schedule?')) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (e) {
      console.warn('Firestore delete event error:', e);
    }
    setEventsList(prev => prev.filter(e => e.id !== eventId));
    if (selectedEventDetail?.id === eventId) {
      setSelectedEventDetail(null);
    }
  };

  if (user?.role !== 'INSTITUTION_ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="w-12 h-12 bg-[#E5EAF5] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#8458B3]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-[#494D5F] font-heading">
          Administrator Privileges Required
        </h2>
        <p className="text-xs text-[#494D5F]/70 mt-1">
          This portal view is strictly restricted to designated college administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E5EAF5] text-[#8458B3] border border-[#D0BDF4]">
            Institutional Admin Portal
          </span>
          <span className="text-xs text-[#494D5F]/70 font-semibold">
            {user?.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'} • Alumni Cell
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#494D5F] font-heading">
          Welcome back, DTSS College Admin
        </h1>
        <p className="text-sm text-[#494D5F]/80 max-w-2xl mt-1">
          Manage system users, collegiate course offerings, campus events, and review incoming verification requests.
        </p>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-3xl border border-[#E5EAF5] shadow-xs">
            <span className="text-[11px] font-bold text-[#494D5F]/70 block">Total Registered</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-extrabold text-[#8458B3] font-heading">{stats.totalUsers}</span>
              <Users className="w-5 h-5 text-[#8458B3]" />
            </div>
            <span className="text-[10px] text-[#494D5F]/60 mt-1 block">
              {stats.students} Students • {stats.alumni} Alumni
            </span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-[#E5EAF5] shadow-xs">
            <span className="text-[11px] font-bold text-[#494D5F]/70 block">Pending Verifications</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-extrabold text-[#8458B3] font-heading">
                {stats.pendingAlumniVerification}
              </span>
              <Clock className="w-5 h-5 text-[#8458B3]" />
            </div>
            <span className="text-[10px] text-[#494D5F]/60 mt-1 block">
              {stats.verifiedAlumni} Verified Alumni Badges
            </span>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-[#E5EAF5] shadow-xs">
            <span className="text-[11px] font-bold text-[#494D5F]/70 block">Active Mentors</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-extrabold text-[#8458B3] font-heading">{stats.mentors}</span>
              <GraduationCap className="w-5 h-5 text-[#8458B3]" />
            </div>
            <span className="text-[10px] text-[#494D5F]/60 mt-1 block">
              {stats.activeConnections} Connections Established
            </span>
          </div>

          {/* Interactive Campus Events Card */}
          <div
            onClick={() => setIsEventsModalOpen(true)}
            className="bg-white p-4 rounded-3xl border border-[#E5EAF5] hover:border-[#8458B3] shadow-xs cursor-pointer transition-all hover:shadow-md group"
            title="Click to view and manage campus events"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#494D5F]/70 block">Campus Events</span>
              <span className="text-[10px] font-bold text-[#8458B3] group-hover:underline">Manage Schedules →</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-extrabold text-[#8458B3] font-heading">
                {eventsList.length}
              </span>
              <Calendar className="w-5 h-5 text-[#8458B3]" />
            </div>
            <span className="text-[10px] text-[#345932] font-semibold mt-1 block">
              {eventsList.length} Active Schedules (Click to Manage)
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#E5EAF5] mb-6 gap-6 flex-wrap">
        <button
          onClick={() => setActiveSubTab('verifications')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'verifications'
              ? 'border-[#8458B3] text-[#8458B3]'
              : 'border-transparent text-[#494D5F]/60 hover:text-[#494D5F]'
          }`}
        >
          <span>Alumni Verification Requests</span>
          {pendingAlumni.length > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#8458B3] text-white">
              {pendingAlumni.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'border-[#8458B3] text-[#8458B3]'
              : 'border-transparent text-[#494D5F]/60 hover:text-[#494D5F]'
          }`}
        >
          User Account Directory ({usersList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('courses')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'courses'
              ? 'border-[#8458B3] text-[#8458B3]'
              : 'border-transparent text-[#494D5F]/60 hover:text-[#494D5F]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Offerings / Courses & Departments</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#E5EAF5] text-[#8458B3] border border-[#D0BDF4]/40">
            {coursesList.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Verifications Queue */}
      {activeSubTab === 'verifications' && (
        loading ? (
          <div className="py-20 text-center text-sm text-[#494D5F]/60">Loading pending requests...</div>
        ) : pendingAlumni.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#E5EAF5]">
            <CheckCircle2 className="w-8 h-8 text-[#8458B3] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#494D5F]">No pending verification requests.</p>
            <p className="text-xs text-[#494D5F]/70 mt-1">
              All registered alumni profiles have been reviewed and certified.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAlumni.map((alum) => (
              <div
                key={alum.id}
                className="bg-white p-5 rounded-3xl border border-[#E5EAF5] hover:border-[#D0BDF4] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-4">
                  <UserAvatar
                    name={alum.name}
                    size="lg"
                    className="w-13 h-13 text-xl shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#494D5F] font-heading">{alum.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D0BDF4]/30 text-[#8458B3] border border-[#D0BDF4]">
                        Verification Pending
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#494D5F] mt-0.5">
                      {alum.currentRole || alum.designation || 'Alumni Member'} {alum.company ? `at ${alum.company}` : ''}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-[#494D5F]/70 mt-1.5 flex-wrap">
                      {alum.rollNumber && (
                        <span className="font-semibold text-[#8458B3] bg-[#E5EAF5] px-2 py-0.5 rounded-md text-[11px]">
                          Roll No: {alum.rollNumber}
                        </span>
                      )}
                      {alum.classYear && (
                        <span className="font-medium text-[#494D5F]">Class: {alum.classYear}</span>
                      )}
                      {alum.division && (
                        <span className="font-medium text-[#494D5F]">Div: {alum.division}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-[#8458B3]" />
                        Class of {alum.graduationYear || alum.graduation_year || 2026} ({alum.course || 'Degree'})
                      </span>
                      <span>•</span>
                      <span>Department: {alum.department || 'Commerce'}</span>
                      {alum.experience && (
                        <>
                          <span>•</span>
                          <span>Experience: {alum.experience} yrs</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approve / Reject Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleVerifyAlumni(alum.id, 'VERIFIED')}
                    disabled={actionLoadingId === alum.id}
                    className="px-4 py-2 bg-gradient-to-r from-[#8458B3] to-[#71489d] hover:from-[#71489d] hover:to-[#5d3b82] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#8458B3]/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Verify</span>
                  </button>

                  <button
                    onClick={() => handleVerifyAlumni(alum.id, 'REJECTED')}
                    disabled={actionLoadingId === alum.id}
                    className="px-3.5 py-2 bg-[#E5EAF5] hover:bg-rose-50 text-[#494D5F] hover:text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab 2: All Users Directory */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setUserRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userRoleFilter === 'ALL'
                    ? 'bg-[#8458B3] text-white'
                    : 'bg-white text-[#494D5F]/70 border border-[#E5EAF5]'
                }`}
              >
                All ({allUsersCache.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('STUDENT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userRoleFilter === 'STUDENT'
                    ? 'bg-[#8458B3] text-white'
                    : 'bg-white text-[#494D5F]/70 border border-[#E5EAF5]'
                }`}
              >
                Students ({allUsersCache.filter(u => u.role === 'STUDENT').length})
              </button>
              <button
                onClick={() => setUserRoleFilter('ALUMNI')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userRoleFilter === 'ALUMNI'
                    ? 'bg-[#8458B3] text-white'
                    : 'bg-white text-[#494D5F]/70 border border-[#E5EAF5]'
                }`}
              >
                Alumni ({allUsersCache.filter(u => u.role === 'ALUMNI').length})
              </button>
              <button
                onClick={() => setUserRoleFilter('INSTITUTION_ADMIN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userRoleFilter === 'INSTITUTION_ADMIN'
                    ? 'bg-[#8458B3] text-white'
                    : 'bg-white text-[#494D5F]/70 border border-[#E5EAF5]'
                }`}
              >
                Admins ({allUsersCache.filter(u => u.role === 'INSTITUTION_ADMIN').length})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#8458B3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D0BDF4]/60 text-[#494D5F] focus:border-[#8458B3] focus:outline-none bg-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5EAF5] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E5EAF5]/40 border-b border-[#E5EAF5] text-[#494D5F] font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Academic / Org Info</th>
                    <th className="py-3.5 px-4">Verification</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF5]/60">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#494D5F]/60">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((item) => (
                      <tr key={item.id} className="hover:bg-[#E5EAF5]/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={item.name}
                              size="sm"
                            />
                            <div>
                              <p className="font-bold text-[#494D5F]">{item.name}</p>
                              <p className="text-[11px] text-[#494D5F]/60">{item.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#E5EAF5] text-[#8458B3] border border-[#D0BDF4]/40">
                            {item.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#494D5F]/80">
                          {item.role === 'ALUMNI' ? (
                            <span>{item.currentRole || item.designation || 'Alumnus'} {item.company ? `at ${item.company}` : ''}</span>
                          ) : (
                            <span>{item.course || 'Degree'} ({item.department?.split('&')[0] || 'Department'})</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {item.role === 'ALUMNI' ? (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.isVerified || item.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#D0BDF4]/30 text-[#8458B3] border border-[#D0BDF4]'
                            }`}>
                              {item.isVerified || item.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                            </span>
                          ) : (
                            <span className="text-[#494D5F]/50 text-[10px]">Academic Enrolled</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {item.id !== user?.id && item.email !== 'admin@dtss.ac.in' ? (
                            <button
                              onClick={() => handleDeleteUser(item.id, item.name)}
                              className="p-1.5 text-[#494D5F]/40 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Permanently remove user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#494D5F]/50 italic">Protected</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Offerings / Courses & Departments */}
      {activeSubTab === 'courses' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5EAF5] shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-[#494D5F] font-heading flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#8458B3]" />
                <span>Collegiate Offerings & Department Management</span>
              </h3>
              <p className="text-xs text-[#494D5F]/70 mt-1 max-w-2xl leading-relaxed">
                Configure accredited streams, undergraduate programs, and postgraduate degree offerings for{' '}
                <strong>{user?.institutionName || 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)'}</strong>.
                Students and alumni onboarding to this campus will be able to select from these dynamically maintained options.
              </p>
            </div>

            {/* Courses list */}
            <div>
              <label className="block text-[11px] font-bold text-[#494D5F]/70 uppercase tracking-wider mb-2.5">
                Current Active Programs ({coursesList.length})
              </label>
              <div className="flex flex-wrap gap-2.5">
                {coursesList.map((courseItem) => (
                  <span
                    key={courseItem}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#E5EAF5]/70 border border-[#D0BDF4]/60 text-xs font-bold text-[#494D5F]"
                  >
                    <span>{courseItem}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCourse(courseItem)}
                      className="p-0.5 rounded-full hover:bg-rose-100 hover:text-rose-700 text-[#494D5F]/50 transition-colors cursor-pointer"
                      title={`Remove ${courseItem}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Add Course Input */}
            <div className="pt-4 border-t border-[#E5EAF5] max-w-xl">
              <label className="block text-xs font-bold text-[#494D5F] mb-1.5">
                Add New Offering / Course Program
              </label>
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={newCourseInput}
                  onChange={(e) => setNewCourseInput(e.target.value)}
                  placeholder="e.g. B.Com, BMS, BSc IT, BAF, BSc CS, M.Com"
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-[#D0BDF4]/60 bg-[#FAF8F5] text-[#1F242D] focus:outline-none focus:border-[#8458B3]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCourse();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCourse}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#8458B3] to-[#71489d] hover:from-[#71489d] hover:to-[#5d3b82] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#8458B3]/20 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Course / Department</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CAMPUS EVENTS INTERACTIVE MANAGEMENT MODAL
          ========================================================================= */}
      {isEventsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl p-6 sm:p-7 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6E1D7] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#8458B3]" />
                  <h3 className="font-bold text-lg text-[#1F242D] font-heading">
                    Campus Events & Masterclass Schedules
                  </h3>
                </div>
                <p className="text-xs text-[#7E8696] mt-0.5">
                  View event details, post new college masterclasses, and manage existing schedules.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEventsModalOpen(false);
                  setIsAddingEvent(false);
                  setSelectedEventDetail(null);
                }}
                className="p-1.5 rounded-xl hover:bg-[#EFEBE3] text-[#7E8696] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-[#1F242D]">
                Active Campus Events ({eventsList.length})
              </span>
              <button
                onClick={() => setIsAddingEvent(!isAddingEvent)}
                className="px-3.5 py-1.5 rounded-xl bg-[#8458B3] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#71489d] transition-colors cursor-pointer"
              >
                {isAddingEvent ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isAddingEvent ? 'Cancel' : '+ Add Campus Event'}</span>
              </button>
            </div>

            {/* Add Event Form (Collapsible) */}
            {isAddingEvent && (
              <form onSubmit={handleCreateEvent} className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] space-y-3.5 animate-in fade-in">
                <h4 className="text-xs font-bold text-[#1F242D] uppercase tracking-wider">
                  New Campus Schedule Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                      Event Title <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g. Alumni Guest Lecture on FinTech"
                      className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                      Event Type
                    </label>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                    >
                      <option value="WORKSHOP">Workshop</option>
                      <option value="MEETUP">Meetup</option>
                      <option value="WEBINAR">Webinar</option>
                      <option value="COLLEGE_EVENT">Campus Drive / Conclave</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                      Date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                      Time Slot
                    </label>
                    <input
                      type="text"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      placeholder="e.g. 10:30 AM - 1:00 PM IST"
                      className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                      Venue / Location
                    </label>
                    <input
                      type="text"
                      value={newEventLocation}
                      onChange={(e) => setNewEventLocation(e.target.value)}
                      placeholder="e.g. Main Auditorium, DTSS College Campus or Google Meet"
                      className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#565D6D] mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      placeholder="Outline topic takeaways, speaker backgrounds, and target audience..."
                      className="w-full px-3 py-2 rounded-xl border border-[#DCD6C9] bg-white text-[#1F242D]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1F242D] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEventIsOnline}
                      onChange={(e) => setNewEventIsOnline(e.target.checked)}
                      className="w-4 h-4 accent-[#8458B3]"
                    />
                    <span>Virtual / Online Event (Hybrid)</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1F242D] hover:bg-[#343A46] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Save & Publish Schedule
                  </button>
                </div>
              </form>
            )}

            {/* Events List */}
            {eventsList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#FAF8F5] border border-dashed border-[#DCD6C9] space-y-1">
                <Calendar className="w-8 h-8 text-[#7E8696] mx-auto opacity-70" />
                <p className="text-xs font-bold text-[#1F242D]">No upcoming campus events.</p>
                <p className="text-[11px] text-[#7E8696]">Click "+ Add Campus Event" above to create an event schedule.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventsList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl bg-white border border-[#E6E1D7] hover:border-[#D0BDF4] transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#1F242D]">{ev.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5EAF5] text-[#8458B3] border border-[#D0BDF4]/40">
                          {ev.eventType}
                        </span>
                        {ev.isOnline && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD] flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            <span>Online</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#565D6D] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#7E8696]" />
                          <span>{ev.date} · {ev.time}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#7E8696]" />
                          <span className="line-clamp-1">{ev.location}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-[#7E8696] line-clamp-1">
                        {ev.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => setSelectedEventDetail(ev)}
                        className="px-3 py-1.5 rounded-xl border border-[#DCD6C9] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1F242D] transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Event Detail Expansion View */}
            {selectedEventDetail && (
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#D0BDF4] space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F242D]">
                    {selectedEventDetail.title}
                  </h4>
                  <button
                    onClick={() => setSelectedEventDetail(null)}
                    className="text-xs text-[#7E8696] hover:underline"
                  >
                    Close Details
                  </button>
                </div>
                <p className="text-xs text-[#565D6D] leading-relaxed">
                  {selectedEventDetail.description}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-[#1F242D] pt-2 border-t border-[#E6E1D7]">
                  <div>
                    <span className="text-[10px] text-[#7E8696] block">Date & Time</span>
                    <span className="font-semibold">{selectedEventDetail.date} · {selectedEventDetail.time}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7E8696] block">Venue</span>
                    <span className="font-semibold">{selectedEventDetail.location}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7E8696] block">Organizer</span>
                    <span className="font-semibold">{selectedEventDetail.organizer}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
