import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { authService } from './services/authService.ts';
import { Navbar } from './components/Navbar.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AlumniLogo } from './components/AlumniLogo.tsx';
import { GlobalSearchModal } from './components/GlobalSearchModal.tsx';
import { HomeView } from './views/HomeView.tsx';
import { DirectoryView } from './views/DirectoryView.tsx';
import { MentorshipView } from './views/MentorshipView.tsx';
import { OpportunitiesView } from './views/OpportunitiesView.tsx';
import { EventsView } from './views/EventsView.tsx';
import { MyNetworkView } from './views/MyNetworkView.tsx';
import { MessagesView } from './views/MessagesView.tsx';
import { RoleDashboardView } from './views/RoleDashboardView.tsx';
import { AdminDashboardView } from './views/AdminDashboardView.tsx';
import { NotificationsView } from './views/NotificationsView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { AuthGatewayView } from './views/AuthGatewayView.tsx';
import {
  Shield,
  X,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ExternalLink,
  Building2,
  ShieldAlert
} from 'lucide-react';

function MainLayout() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (search.includes('register-institution') || hash.includes('register-institution')) {
        return 'gateway';
      }
    }
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return 'gateway';
    const saved = sessionStorage.getItem('alumnexa_active_tab');
    return saved && saved !== 'gateway' ? saved : 'dashboard';
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'STUDENT' | 'ALUMNI'>('STUDENT');
  const [accessDeniedToast, setAccessDeniedToast] = useState<string | null>(null);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem('alumnexa_active_chat_partner') : null;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; body: React.ReactNode } | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login', role: 'STUDENT' | 'ALUMNI' = 'STUDENT') => {
    setAuthMode(mode);
    setAuthRole(role);
    setActiveTab('gateway');
    sessionStorage.setItem('alumnexa_active_tab', 'gateway');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const checkDirectUrl = () => {
      if (typeof window !== 'undefined') {
        const search = window.location.search.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        if (search.includes('register-institution') || hash.includes('register-institution')) {
          setActiveTab('gateway');
        }
      }
    };
    checkDirectUrl();
    window.addEventListener('popstate', checkDirectUrl);
    window.addEventListener('hashchange', checkDirectUrl);
    return () => {
      window.removeEventListener('popstate', checkDirectUrl);
      window.removeEventListener('hashchange', checkDirectUrl);
    };
  }, []);

  React.useEffect(() => {
    if (!user) {
      if (activeTab !== 'directory' && activeTab !== 'events' && activeTab !== 'home') {
        setActiveTab('gateway');
        sessionStorage.setItem('alumnexa_active_tab', 'gateway');
      }
    } else {
      if (activeTab === 'gateway') {
        setActiveTab('dashboard');
        sessionStorage.setItem('alumnexa_active_tab', 'dashboard');
      }
    }
  }, [user]);

  const handleOpenInfo = (type: 'about' | 'contact' | 'privacy' | 'terms') => {
    if (type === 'about') {
      setInfoModalContent({
        title: 'About AlumNexa',
        body: (
          <div className="space-y-3 text-xs text-[#565D6D] leading-relaxed">
            <p>
              <strong>AlumNexa</strong> is the modern collegiate alumni networking and mentorship ecosystem designed to bridge higher education and lifelong career advancement.
            </p>
            <p>
              Every student, alumnus, faculty member, and institution is issued a tamper-proof Academic UID (e.g., <code>AN-ALU-9X2M41</code>), guaranteeing institutional authenticity and eliminating unverified profiles.
            </p>
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] mt-2">
              <p className="font-semibold text-[#5A7458]">Institutional Verification Framework</p>
              <p className="text-[11px] text-[#7E8696]">Multi-Campus Federation & Accredited Placement Cell Integration</p>
            </div>
          </div>
        )
      });
    } else if (type === 'contact') {
      setInfoModalContent({
        title: 'Contact AlumNexa Support',
        body: (
          <div className="space-y-3 text-xs text-[#565D6D]">
            <p className="leading-relaxed">
              Have questions regarding collegiate onboarding, alumni UID verification, or placement cell partnerships?
            </p>
            <div className="space-y-2 mt-3 text-xs">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                <Mail className="w-4 h-4 text-[#5A7458]" />
                <span>support@alumnexa.edu.in</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7]">
                <Building2 className="w-4 h-4 text-[#5A7458]" />
                <span>Central Collegiate Secretariat, Mumbai Campus Cluster</span>
              </div>
            </div>
          </div>
        )
      });
    } else if (type === 'privacy') {
      setInfoModalContent({
        title: 'Privacy & Data Protection',
        body: (
          <div className="space-y-3 text-xs text-[#565D6D] leading-relaxed">
            <p>
              AlumNexa strictly guards student academic data. Direct messaging and personal contact details are gated by institutional membership and mutual connection approval.
            </p>
            <p>
              Profiles can be set to institution-exclusive visibility at any time in Profile Settings.
            </p>
          </div>
        )
      });
    } else if (type === 'terms') {
      setInfoModalContent({
        title: 'Terms of Academic Service',
        body: (
          <div className="space-y-3 text-xs text-[#565D6D] leading-relaxed">
            <p>
              By accessing AlumNexa, members agree to maintain professional collegiate conduct. All job and internship postings are vetted for authenticity.
            </p>
          </div>
        )
      });
    }
  };

  const navigateTo = (tab: string, extraData?: any) => {
    if (tab === 'institutions' || tab === 'communities') {
      tab = 'directory';
    }
    if (tab === 'messages') {
      const partnerId = extraData?.partnerId || extraData?.recipientId;
      if (partnerId) {
        setActiveChatPartnerId(partnerId);
        sessionStorage.setItem('alumnexa_active_chat_partner', partnerId);
      }
    }
    if (tab === 'admin') {
      if (!user || (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN')) {
        setAccessDeniedToast("Access Denied: You do not have administrator permissions to view this section.");
        setActiveTab('dashboard');
        sessionStorage.setItem('alumnexa_active_tab', 'dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setAccessDeniedToast(null), 4000);
        return;
      }
    }
    setActiveTab(tab);
    sessionStorage.setItem('alumnexa_active_tab', tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#494D5F] flex flex-col font-sans selection:bg-[#8458B3] selection:text-white">
      {/* Access Denied Toast Notification */}
      {accessDeniedToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-xl shadow-lg animate-in fade-in text-xs font-semibold">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          <span>{accessDeniedToast}</span>
          <button
            onClick={() => setAccessDeniedToast(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Responsive Header - Hidden on the starting login/signup page */}
      {activeTab !== 'gateway' && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => navigateTo(tab)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={(mode) => handleOpenAuth(mode || 'login')}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 w-full relative z-10">
        {activeTab === 'gateway' && (
          <AuthGatewayView
            onEnterApp={() => navigateTo('dashboard')}
            onExploreAsGuest={() => navigateTo('home')}
            initialMode={authMode}
          />
        )}
        {activeTab === 'home' && (
          <HomeView
            onNavigate={navigateTo}
            onOpenAuth={(mode) => handleOpenAuth(mode || 'register')}
          />
        )}
        {activeTab === 'directory' && <DirectoryView onOpenAuth={() => handleOpenAuth('login')} onNavigate={navigateTo} />}
        {activeTab === 'mentorship' && <MentorshipView onOpenAuth={() => handleOpenAuth('login')} onNavigate={navigateTo} />}
        {activeTab === 'opportunities' && <OpportunitiesView onOpenAuth={() => handleOpenAuth('login')} />}
        {activeTab === 'events' && <EventsView onOpenAuth={() => handleOpenAuth('login')} />}
        {activeTab === 'network' && <MyNetworkView onOpenAuth={() => handleOpenAuth('login')} />}
        {activeTab === 'messages' && (
          <MessagesView
            onOpenAuth={() => handleOpenAuth('login')}
            initialPartnerId={activeChatPartnerId}
            onClearInitialPartner={() => setActiveChatPartnerId(null)}
          />
        )}
        {activeTab === 'dashboard' && <RoleDashboardView onNavigate={navigateTo} onOpenAuth={() => handleOpenAuth('login')} />}
        {activeTab === 'admin' && ((user?.role === 'INSTITUTION_ADMIN' || user?.role === 'SUPER_ADMIN') ? <AdminDashboardView /> : <RoleDashboardView onNavigate={navigateTo} onOpenAuth={() => handleOpenAuth('login')} />)}
        {activeTab === 'notifications' && <NotificationsView onNavigate={navigateTo} onOpenAuth={() => handleOpenAuth('login')} />}
        {activeTab === 'profile' && <ProfileView onOpenAuth={() => handleOpenAuth('login')} />}
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigateTo}
      />

      {/* Clean Professional Footer - only rendered when exploring or authenticated */}
      {activeTab !== 'gateway' && (
        <footer className="bg-white border-t border-[#E5EAF5] mt-16 pt-12 pb-10 px-4 sm:px-6 lg:px-8 text-xs text-[#494D5F]/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Brand Column */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E5EAF5] border border-[#D0BDF4]/50 flex items-center justify-center p-0.5 shadow-2xs overflow-hidden">
                <AlumniLogo className="w-full h-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-[#494D5F] font-heading tracking-tight leading-tight">
                  ALUMNEXA
                </span>
                <span className="text-[11px] text-[#8458B3] font-medium tracking-tight">
                  DTSS COLLEGE OF COMMERCE
                </span>
              </div>
            </div>
            <p className="text-[#494D5F]/80 leading-relaxed text-xs">
              DTSS COLLEGE OF COMMERCE (AUTONOMOUS) — Unified alumni networking, 1:1 verified mentorship, and corporate placement bridge.
            </p>
          </div>

          {/* Navigation & Informational Links */}
          <div className="flex gap-8 w-full md:w-auto">
            <div>
              <p className="font-bold text-[#1F242D] mb-3 text-xs uppercase tracking-wider">
                Explore Network
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => navigateTo('directory')} className="hover:text-[#1F242D] transition-colors cursor-pointer">
                    Alumni Directory
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('mentorship')} className="hover:text-[#1F242D] transition-colors cursor-pointer">
                    1:1 Mentorship
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('opportunities')} className="hover:text-[#1F242D] transition-colors cursor-pointer">
                    Opportunities & Jobs
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('events')} className="hover:text-[#1F242D] transition-colors cursor-pointer">
                    Campus Events
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#E6E1D7] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#7E8696] text-[11px]">
          <p>© {new Date().getFullYear()} DTSS College of Commerce. All rights reserved.</p>
        </div>
      </footer>
      )}

      {/* Info Dialog Modal */}
      {infoModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-[#E6E1D7] pb-3 mb-4">
              <h3 className="font-bold text-base text-[#1F242D] font-heading">{infoModalContent.title}</h3>
              <button
                onClick={() => setInfoModalContent(null)}
                className="p-1 rounded-lg hover:bg-[#EFEBE3] text-[#7E8696]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {infoModalContent.body}
            <div className="mt-5 pt-3 border-t border-[#E6E1D7] flex justify-end">
              <button
                onClick={() => setInfoModalContent(null)}
                className="px-4 py-1.5 rounded-xl bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        initialRole={authRole}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
