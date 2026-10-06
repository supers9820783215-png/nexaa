import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Opportunity, EventItem, PlatformStats, User } from '../types.ts';
import { userService } from '../services/userService.ts';
import { opportunityService } from '../services/opportunityService.ts';
import { mentorshipService } from '../services/mentorshipService.ts';
import { eventService } from '../services/eventService.ts';
import { UserUIDBadge } from '../components/common/UserUIDBadge.tsx';
import {
  Users,
  HeartHandshake,
  Briefcase,
  Calendar,
  Building2,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Lock,
  FileCheck2,
  Clock,
  Compass,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: string, extraData?: any) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [featuredOpportunities, setFeaturedOpportunities] = useState<Opportunity[]>([]);
  const [featuredMentors, setFeaturedMentors] = useState<User[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, opps, mentors, events] = await Promise.all([
          userService.getPlatformStats(),
          opportunityService.getOpportunities(),
          mentorshipService.getMentors(),
          eventService.getEvents()
        ]);

        if (isMounted) {
          setStats(statsData);
          setFeaturedOpportunities(opps.slice(0, 3));
          setFeaturedMentors(mentors.slice(0, 3));
          setFeaturedEvents(events.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative z-10 space-y-20 sm:space-y-28 pb-20">
      {/* =========================================================================
          SECTION 1: HERO SECTION
          ========================================================================= */}
      <section className="pt-6 sm:pt-10 pb-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Elevated Institutional Hero Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#E6E1D7] shadow-sm p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          {/* Institutional Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF8F5] text-[#1F242D] border border-[#E6E1D7] text-xs font-semibold mb-4 tracking-wide shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5A7458]" />
            <span>DTSS COLLEGE OF COMMERCE (AUTONOMOUS)</span>
          </div>

          {/* Signature Collegiate Logo Badge */}
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-[#5A7458] text-white flex items-center justify-center shadow-md border border-[#4A6048] transition-transform hover:scale-105">
              <GraduationCap className="w-8 h-8" />
            </div>
          </div>

          {/* Product Identity & Exact Requested Titles */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1F242D] tracking-tight font-heading leading-tight">
            AlumNexa
          </h1>
          <p className="text-base sm:text-xl font-bold text-[#5A7458] mt-1.5 tracking-tight">
            AlumNexa Academic Network & Campus Network
          </p>
          <p className="text-xs sm:text-sm font-medium text-[#7E8696] mt-0.5 tracking-tight">
            Connect. Learn. Grow.
          </p>

          {/* Value Proposition */}
          <p className="mt-4 text-xs sm:text-sm text-[#565D6D] max-w-2xl mx-auto font-normal leading-relaxed">
            Connecting DTSS College of Commerce students, alumni, and faculty into one unified academic, mentorship & career advancement network.
          </p>

          {/* Primary Call-to-Action Grid - Perfectly Aligned 4 Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <button
              onClick={() => onNavigate('directory')}
              className="w-full py-3 px-4 rounded-xl bg-[#1F242D] text-white font-semibold text-xs sm:text-sm hover:bg-[#343A46] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#C5CED9] shrink-0" />
              <span>Explore Alumni Directory</span>
            </button>

            <button
              onClick={() => onNavigate('mentorship')}
              className="w-full py-3 px-4 rounded-xl bg-[#FAF8F5] text-[#1F242D] border border-[#DCD6C9] font-semibold text-xs sm:text-sm hover:bg-[#F2EFE8] transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-[#8E82A8] shrink-0" />
              <span>Find a Mentor</span>
            </button>

            <button
              onClick={() => onNavigate('opportunities')}
              className="w-full py-3 px-4 rounded-xl bg-[#FAF8F5] text-[#1F242D] border border-[#DCD6C9] font-semibold text-xs sm:text-sm hover:bg-[#F2EFE8] transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-[#784433] shrink-0" />
              <span>Campus Opportunities</span>
            </button>

            <button
              onClick={() => onNavigate('events')}
              className="w-full py-3 px-4 rounded-xl bg-[#FAF8F5] text-[#1F242D] border border-[#DCD6C9] font-semibold text-xs sm:text-sm hover:bg-[#F2EFE8] transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#D88A58] shrink-0" />
              <span>Campus Events</span>
            </button>
          </div>
        </div>

        {/* Key Platform Statistics Counter */}
        <div className="mt-14 pt-10 border-t border-[#E6E1D7]/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 text-center">
          {[
            { label: 'Alumni', count: stats?.alumni || '0', color: 'text-[#345932]', bg: 'bg-[#EBF2EA]' },
            { label: 'Students', count: stats?.students || '0', color: 'text-[#2A537A]', bg: 'bg-[#E9F1F8]' },
            { label: 'Mentors', count: stats?.mentors || '0', color: 'text-[#553E7A]', bg: 'bg-[#F1EDF7]' },
            { label: 'Opportunities', count: stats?.opportunities || '0', color: 'text-[#784433]', bg: 'bg-[#F8EFEA]' },
            { label: 'Events', count: stats?.events || '0', color: 'text-[#8C6212]', bg: 'bg-[#FFF6E5]' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#FAF8F5]/90 border border-[#E6E1D7] shadow-2xs transition-transform hover:-translate-y-0.5"
            >
              <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-heading ${item.color}`}>
                {item.count}
              </p>
              <p className="text-xs font-semibold text-[#565D6D] uppercase tracking-wider mt-1">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: EVERYTHING YOU NEED TO GROW
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#5A7458] uppercase tracking-wider">
            Platform Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1F242D] mt-1 font-heading tracking-tight">
            Everything You Need to Grow
          </h2>
          <p className="text-sm text-[#565D6D] mt-2">
            A cohesive environment connecting undergraduate ambition with seasoned industry guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Verified Academic Identities',
              description: 'Cryptographically consistent UIDs for Students, Alumni, and Faculty ensure every conversation starts on verified institutional trust.',
              icon: ShieldCheck,
              accent: 'bg-[#EBF2EA] text-[#345932] border-[#CFE2CD]'
            },
            {
              title: 'Mentor Connect',
              description: 'Structured 1:1 mentorship requests with milestones, meeting agendas, and guidance roadmaps tailored to your career aspirations.',
              icon: HeartHandshake,
              accent: 'bg-[#F1EDF7] text-[#553E7A] border-[#DDD5EB]'
            },
            {
              title: 'Exclusive Opportunities',
              description: 'Campus-gated internships, full-time engineering roles, research fellowships, and hackathons posted directly by working alumni.',
              icon: Briefcase,
              accent: 'bg-[#F8EFEA] text-[#784433] border-[#EDD5CC]'
            },
            {
              title: 'Direct Campus Messaging',
              description: 'Direct messaging and networking channels connecting students with alumni mentors and career guides.',
              icon: MessageSquare,
              accent: 'bg-[#E9F1F8] text-[#2A537A] border-[#D2E2F0]'
            },
            {
              title: 'Collaborative Learning',
              description: 'Interactive masterclasses, live design simulations, resume teardowns, and tech workshops run by senior engineers and product leaders.',
              icon: GraduationCap,
              accent: 'bg-[#FFF6E5] text-[#8C6212] border-[#FFE6B3]'
            },
            {
              title: 'DTSS Institutional Pride',
              description: 'Showcasing distinguished alumni successes, campus milestones, and enduring multi-generational collegiate affinity.',
              icon: Building2,
              accent: 'bg-[#EBF2EA] text-[#345932] border-[#CFE2CD]'
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#DCD6C9] transition-all"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 ${card.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#1F242D]">{card.title}</h3>
                  <p className="text-xs text-[#565D6D] mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: VALUE BY AUDIENCE / ROLES
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#8E82A8] uppercase tracking-wider">
            Tailored Experiences
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1F242D] mt-1 font-heading tracking-tight">
            Built for Every Member of DTSS College
          </h2>
          <p className="text-sm text-[#565D6D] mt-2">
            Targeted features empowering each stakeholder within the collegiate community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Students */}
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] flex flex-col justify-between hover:border-[#2A537A]/60 transition-all">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E9F1F8] text-[#2A537A] border border-[#D2E2F0]">
                FOR STUDENTS
              </span>
              <h3 className="text-lg font-bold text-[#1F242D] mt-3">Launch Your Career</h3>
              <ul className="mt-3 space-y-2 text-xs text-[#565D6D]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2A537A] shrink-0 mt-0.5" />
                  <span>Request 1:1 guidance from verified alumni in your target industry</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2A537A] shrink-0 mt-0.5" />
                  <span>Discover internships & entry-level jobs with internal campus referrals</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2A537A] shrink-0 mt-0.5" />
                  <span>Attend technical masterclasses and resume breakdown clinics</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('directory')}
              className="mt-6 text-xs font-semibold text-[#2A537A] flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span>Explore alumni directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alumni */}
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] flex flex-col justify-between hover:border-[#345932]/60 transition-all">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBF2EA] text-[#345932] border border-[#CFE2CD]">
                FOR ALUMNI
              </span>
              <h3 className="text-lg font-bold text-[#1F242D] mt-3">Give Back & Lead</h3>
              <ul className="mt-3 space-y-2 text-xs text-[#565D6D]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#345932] shrink-0 mt-0.5" />
                  <span>Set mentoring availability and guide ambitious juniors</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#345932] shrink-0 mt-0.5" />
                  <span>Post career openings and hire top talent from DTSS</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#345932] shrink-0 mt-0.5" />
                  <span>Host masterclasses and share industry wisdom</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('mentorship')}
              className="mt-6 text-xs font-semibold text-[#345932] flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span>Mentorship opportunities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Faculty */}
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] flex flex-col justify-between hover:border-[#553E7A]/60 transition-all">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1EDF7] text-[#553E7A] border border-[#DDD5EB]">
                FOR FACULTY
              </span>
              <h3 className="text-lg font-bold text-[#1F242D] mt-3">Academic Alignment</h3>
              <ul className="mt-3 space-y-2 text-xs text-[#565D6D]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#553E7A] shrink-0 mt-0.5" />
                  <span>Connect academic syllabi with modern industry trends</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#553E7A] shrink-0 mt-0.5" />
                  <span>Invite alumni guest lecturers for capstone panels</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#553E7A] shrink-0 mt-0.5" />
                  <span>Track departmental outcomes and placement records</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('directory')}
              className="mt-6 text-xs font-semibold text-[#553E7A] flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span>Explore faculty tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Campus Administration */}
          <div className="p-6 rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] flex flex-col justify-between hover:border-[#9E6852]/60 transition-all">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F8EFEA] text-[#784433] border border-[#EDD5CC]">
                CAMPUS ADMINISTRATION
              </span>
              <h3 className="text-lg font-bold text-[#1F242D] mt-3">Governance & Insights</h3>
              <ul className="mt-3 space-y-2 text-xs text-[#565D6D]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#784433] shrink-0 mt-0.5" />
                  <span>Centralized verified alumni & student registry</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#784433] shrink-0 mt-0.5" />
                  <span>Institutional verification queue & approval controls</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#784433] shrink-0 mt-0.5" />
                  <span>Reunion, masterclass, and campus analytics</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('admin')}
              className="mt-6 text-xs font-semibold text-[#784433] flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span>Enter admin portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: VERIFIED NETWORK ARCHITECTURE (TRUST MODEL)
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#FAF8F5] border border-[#E6E1D7] shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#5A7458] uppercase tracking-wider">
              Verification Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F242D] mt-1 font-heading tracking-tight">
              Tamper-Proof Academic UIDs
            </h2>
            <p className="text-sm text-[#565D6D] mt-2">
              Every profile is backed by institutional credentials to guarantee zero fake recruiters, bots, or unverified claims.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-[#E6E1D7] shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-[#EBF2EA] text-[#345932] flex items-center justify-center font-bold text-xs mb-3">
                01
              </div>
              <h4 className="text-sm font-bold text-[#1F242D]">Single-Campus Verification</h4>
              <p className="text-xs text-[#565D6D] mt-1.5 leading-relaxed">
                Affiliation with DTSS College of Commerce is verified by department, graduation batch, and institutional admin approval.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E1D7] shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-[#F1EDF7] text-[#553E7A] flex items-center justify-center font-bold text-xs mb-3">
                02
              </div>
              <h4 className="text-sm font-bold text-[#1F242D]">Role-Based Access Gates</h4>
              <p className="text-xs text-[#565D6D] mt-1.5 leading-relaxed">
                Only verified alumni and faculty can post job opportunities or lead accredited workshops for undergraduates.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E6E1D7] shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-[#F8EFEA] text-[#784433] flex items-center justify-center font-bold text-xs mb-3">
                03
              </div>
              <h4 className="text-sm font-bold text-[#1F242D]">Public UID Badges</h4>
              <p className="text-xs text-[#565D6D] mt-1.5 leading-relaxed">
                Distinctive badges identify official credentials across directories, cards, messages, and RSVPs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: UPCOMING EVENTS & WORKSHOPS
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-[#8E82A8] uppercase tracking-wider">
              Live Academic Engagements
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F242D] mt-1 font-heading tracking-tight">
              Upcoming Events & Workshops
            </h2>
            <p className="text-sm text-[#565D6D] mt-1">
              Curated masterclasses, tech sessions, and alumni meetups.
            </p>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-semibold text-[#1F242D] hover:text-[#5A7458] flex items-center gap-1.5 cursor-pointer"
          >
            <span>Explore All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEvents.map((evt) => (
            <div
              key={evt.id}
              className="rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="h-36 relative overflow-hidden bg-[#EAE6DE]">
                <img
                  src={evt.imageUrl}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF8F5]/90 text-[#1F242D] backdrop-blur-xs border border-[#E6E1D7]">
                    {evt.eventType}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#5A7458] font-semibold mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{evt.date} · {evt.time.split('-')[0]}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1F242D] line-clamp-2 leading-snug">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-[#565D6D] mt-1.5 line-clamp-2">
                    {evt.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E6E1D7] flex items-center justify-between">
                  <div className="text-[11px] text-[#7E8696]">
                    <span>{evt.attendeesCount} attendees</span>
                  </div>
                  <button
                    onClick={() => onNavigate('events')}
                    className="px-3 py-1.5 rounded-lg bg-[#1F242D] text-white text-xs font-semibold hover:bg-[#343A46] transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: CALL TO ACTION (BOTTOM)
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-14 rounded-3xl bg-[#1F242D] text-white shadow-xl text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#5A7458] uppercase tracking-wider bg-[#5A7458]/20 px-3 py-1 rounded-full border border-[#5A7458]/30">
              DTSS Campus Community
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading mt-4 text-[#FAF8F5]">
              Ready to Accelerate Your Career Journey?
            </h2>
            <p className="text-sm sm:text-base text-[#DCD6C9] mt-3 leading-relaxed">
              Whether you are an undergraduate seeking guidance, an alumnus looking to mentor, or a faculty member fostering campus connections — AlumNexa brings DTSS together.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3 rounded-xl bg-[#5A7458] hover:bg-[#4D654B] text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
              >
                Create Verified Account
              </button>
              <button
                onClick={() => onNavigate('directory')}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#FAF8F5] border border-white/20 font-semibold text-sm transition-all cursor-pointer"
              >
                Explore Alumni Directory
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
