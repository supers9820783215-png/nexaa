import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Users,
  HeartHandshake,
  Briefcase,
  Calendar,
  Search,
  Bell,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  SlidersHorizontal,
  PlusCircle,
  MessageSquare
} from 'lucide-react';
import { UserRole } from '../types.ts';
import { UserUIDBadge } from './common/UserUIDBadge.tsx';
import { UserAvatar } from './common/UserAvatar.tsx';
import { AlumniLogo } from './AlumniLogo.tsx';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAuth,
}) => {
  const { user, logout, unreadCount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'directory', label: 'Alumni Directory', icon: Users },
    { id: 'mentorship', label: 'Mentorship', icon: HeartHandshake },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E6E1D7] transition-all">
      {/* Top micro-bar: Session & System Indicator */}
      <div className="bg-[#F4F1EA] border-b border-[#E6E1D7] px-4 sm:px-6 py-1 text-[11px] text-[#565D6D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#5A7458] animate-pulse" />
          <span className="font-medium text-[#1F242D]">AlumNexa Academic Network</span>
          <span className="hidden md:inline text-[#7E8696]">· Academic & Campus Network</span>
        </div>

        {/* Active Session / Role Indicator */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7E8696] hidden sm:inline">
                Role:
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#DCD6C9] font-mono font-medium text-[11px] text-[#1F242D]">
                <span className="font-bold text-[#5A7458]">{user.role}</span>
                <span className="hidden lg:inline text-[#7E8696] font-normal">({user.name.split(' ')[0]})</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7E8696] hidden sm:inline">
                Session:
              </span>
              <button
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#DCD6C9] font-medium text-[11px] text-[#565D6D] hover:bg-[#EFEBE3] transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[#7E8696]">GUEST</span>
                <span className="text-[10px] text-[#5A7458] font-bold">· Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick(user ? 'dashboard' : 'gateway')}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#5A7458] text-white flex items-center justify-center shadow-xs group-hover:bg-[#4A6048] transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#1F242D] tracking-tight text-base sm:text-lg font-heading">
                    AlumNexa
                  </span>
                </div>
                <span className="text-[10px] text-[#7E8696] font-medium tracking-tight -mt-0.5">
                  Connect. Learn. Grow.
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1F242D] text-white shadow-xs'
                      : 'text-[#565D6D] hover:text-[#1F242D] hover:bg-[#EFEBE3]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Search, Notifications, Profile / Login */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global UID & Directory Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#F4F1EA] hover:bg-[#EFEBE3] border border-[#E6E1D7] text-xs text-[#565D6D] hover:text-[#1F242D] transition-colors cursor-pointer"
              title="Global Search & UID Verification (AN-ALU-..., AN-STU-...)"
            >
              <Search className="w-3.5 h-3.5 text-[#7E8696]" />
              <span className="hidden sm:inline font-medium">Search UID / People</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-[#EAE6DE] rounded border border-[#DCD6C9] text-[#7E8696]">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => handleNavClick('notifications')}
              className="relative p-2 rounded-xl bg-[#F4F1EA] hover:bg-[#EFEBE3] border border-[#E6E1D7] text-[#565D6D] hover:text-[#1F242D] transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#9E4D3E] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D7] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
                >
                  <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#1F242D] leading-tight line-clamp-1">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-[#5A7458] font-mono font-medium">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7E8696]" />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-xl py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-2.5 border-b border-[#E6E1D7] flex items-center gap-3">
                      <UserAvatar name={user.name} avatar={user.avatar} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#1F242D] truncate">{user.name}</p>
                        <p className="text-[11px] text-[#7E8696] font-mono truncate">{user.email}</p>
                        <div className="mt-1">
                          <UserUIDBadge uid={user.uid} role={user.role} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => handleNavClick('dashboard')}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-[#1F242D] hover:bg-[#F7F5F0] flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#5A7458]" />
                        <span>Role Dashboard ({user.role})</span>
                      </button>
                      {(user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN') && (
                        <button
                          onClick={() => handleNavClick('admin')}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-[#8458B3] hover:bg-[#F7F5F0] flex items-center gap-2 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-[#8458B3]" />
                          <span>Admin Console (Approvals)</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleNavClick('messages')}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-[#1F242D] hover:bg-[#F7F5F0] flex items-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-[#5A7458]" />
                        <span>Messages</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('profile')}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-[#1F242D] hover:bg-[#F7F5F0] flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-[#565D6D]" />
                        <span>My Public Profile</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('notifications')}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-[#1F242D] hover:bg-[#F7F5F0] flex items-center gap-2 cursor-pointer"
                      >
                        <Bell className="w-4 h-4 text-[#565D6D]" />
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#9E4D3E] text-white">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="border-t border-[#E6E1D7] pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          setActiveTab('gateway');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-[#932F2F] hover:bg-[#FDF3F3] flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-[#1F242D] hover:bg-[#EFEBE3] rounded-xl transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1F242D] hover:bg-[#343A46] rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Join AlumNexa
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#F4F1EA] text-[#1F242D] hover:bg-[#EFEBE3] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E6E1D7] bg-[#FCFBF8] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1F242D] text-white'
                    : 'text-[#565D6D] hover:bg-[#F7F5F0]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="border-t border-[#E6E1D7] pt-3 mt-3">
            {user ? (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1F242D] hover:bg-[#F7F5F0]"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#5A7458]" />
                  <span>Role Dashboard ({user.role})</span>
                </button>
                {(user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#8458B3] hover:bg-[#F7F5F0]"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#8458B3]" />
                    <span>Admin Console (Approvals)</span>
                  </button>
                )}
                <button
                  onClick={() => handleNavClick('profile')}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#1F242D] hover:bg-[#F7F5F0]"
                >
                  <UserIcon className="w-4 h-4 text-[#565D6D]" />
                  <span>My Public Profile</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    setActiveTab('gateway');
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#932F2F] hover:bg-[#FDF3F3]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-[#1F242D] bg-[#FAF8F5] border border-[#E6E1D7] rounded-xl"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-white bg-[#1F242D] rounded-xl"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
