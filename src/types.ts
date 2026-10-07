export type UserRole = 'STUDENT' | 'ALUMNI' | 'FACULTY' | 'INSTITUTION_ADMIN' | 'SUPER_ADMIN';

export type VerificationStatus = 'NOT_ASSOCIATED' | 'NOT_VERIFIED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  uid: string; // e.g., AN-STU-7K4P92, AN-ALU-4M8Q21, AN-FAC-9R2T51, AN-IAD-5K8P31, AN-ADM-2P7X41
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  institutionId?: string | null;
  institutionName?: string | null;
  department?: string;
  course?: string;
  graduationYear?: number | string;
  currentRole?: string;
  company?: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  isOnboardingComplete?: boolean;
  isFreeUser?: boolean;
  campusType?: 'PRIMARY' | 'OTHER';
  rollNumber?: string;
  classYear?: string;
  division?: string;
  createdAt: string;
  bio?: string;
  skills?: string[];
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  instagram?: string;
  youtube?: string;
  customLinkTitle?: string;
  customLinkUrl?: string;
  experienceYears?: number;
  experience?: string | number;
  isAvailableForMentoring?: boolean;
  industry?: string;
  designation?: string;
  profile_image?: string;
  verification_status?: string;
  graduation_year?: number;
  mentoring_available?: boolean;
  connection?: any;
}

export interface StudentProfile {
  id: string;
  userId: string;
  uid: string;
  institution: string;
  institutionId: string;
  course: string;
  department: string;
  currentYear: string;
  graduationYear: number;
  skills: string[];
  bio: string;
  careerInterests: string[];
  location: string;
  linkedin?: string;
  portfolio?: string;
  github?: string;
  mentorshipStatus: 'LOOKING_FOR_MENTOR' | 'CONNECTED' | 'INACTIVE';
  profileCompletion: number;
}

export interface AlumniProfile {
  id: string;
  userId: string;
  uid: string;
  institution: string;
  institutionId: string;
  graduationYear: number;
  course: string;
  department: string;
  company: string;
  jobTitle: string;
  industry: string;
  location: string;
  experienceYears: number;
  skills: string[];
  bio: string;
  linkedin?: string;
  portfolio?: string;
  mentorshipAvailability: boolean;
  activeMentees: number; // Important: > 10 unlocks official Mentor Community creation
  verificationStatus: VerificationStatus;
  profileCompletion: number;
}

export interface FacultyProfile {
  id: string;
  userId: string;
  uid: string;
  institution: string;
  institutionId: string;
  department: string;
  designation: string;
  subjects: string[];
  experienceYears: number;
  academicInterests: string[];
  bio: string;
  professionalLinks: {
    googleScholar?: string;
    linkedin?: string;
    website?: string;
  };
  verificationStatus: VerificationStatus;
}

export interface Institution {
  id: string;
  uid: string; // e.g. AN-INS-8F42KD
  name: string;
  code?: string;
  logo: string;
  officialWebsite: string;
  officialEmailDomain: string; // e.g. dtss.edu.in
  address: string;
  city: string;
  state: string;
  country: string;
  institutionType: 'University' | 'Autonomous College' | 'Engineering Institute' | 'Management College' | 'Affiliated College';
  affiliation: string; // e.g. University of Mumbai
  description: string;
  verificationStatus: VerificationStatus;
  verifiedBadgeText?: string;
  membersCount: number;
  studentsCount: number;
  alumniCount: number;
  facultyCount: number;
  foundedYear: number;
  bannerImage?: string;
  courses?: string[];
  departments?: string[];
}

export interface InstitutionMembership {
  id: string;
  institutionId: string;
  institutionName: string;
  userId: string;
  userName: string;
  userUid: string;
  userEmail: string;
  role: 'STUDENT' | 'ALUMNI' | 'FACULTY';
  department: string;
  course?: string;
  graduationYear?: number;
  idProofDocName?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  requestedAt: string;
  verifiedAt?: string;
}

export interface InstitutionRequest {
  id: string;
  institutionName: string;
  officialWebsite: string;
  officialEmailDomain: string;
  address: string;
  city: string;
  state: string;
  country: string;
  institutionType: string;
  affiliation: string;
  description: string;
  supportingInfo: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonDesignation: string;
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  submittedAt: string;
}

export type MentorshipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export interface MentorshipRequest {
  id: string;
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
  status: MentorshipStatus;
  requestedAt: string;
  updatedAt?: string;
  notes?: string;
}

export type CommunityType = 'INSTITUTION' | 'ACADEMIC' | 'YEAR_BATCH' | 'MENTORSHIP' | 'GENERAL' | 'DEPARTMENT' | 'INDUSTRY';
export type CommunityPrivacy = 'PUBLIC' | 'PRIVATE' | 'INSTITUTION_ONLY';

export interface Community {
  id: string;
  name: string;
  type: CommunityType;
  institutionId?: string;
  institutionName?: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorUid: string;
  creatorRole: UserRole;
  memberCount: number;
  isVerified: boolean;
  isOfficial: boolean; // e.g. ✓ OFFICIAL COMMUNITY
  privacy: CommunityPrivacy;
  category: string;
  avatar: string;
  coverImage?: string;
  tags: string[];
  createdAt: string;
  isMember?: boolean;
  mentorEligibilityMeta?: {
    mentorActiveMentees: number;
    isEligibleOfficialMentorCommunity: boolean;
  };
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorUid: string;
  authorRole: UserRole;
  authorAvatar: string;
  title?: string;
  content: string;
  likes: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
}

export type OpportunityType = 'JOB' | 'INTERNSHIP' | 'REFERRAL';
export type WorkplaceType = 'REMOTE' | 'HYBRID' | 'ON_SITE';

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: OpportunityType;
  workplaceType: WorkplaceType;
  employmentType: string; // Full-time, Part-time, 6 Months, etc.
  postedById: string;
  posterName: string;
  posterRole: string;
  posterUid: string;
  posterAvatar: string;
  institution: string;
  skills: string[];
  experienceRequired: string;
  salaryRange?: string;
  stipend?: string;
  stipendSalary?: string;
  deadline: string;
  description: string;
  requirements: string[];
  applicationLink?: string;
  applicantsCount: number;
  createdAt: string;
  hasApplied?: boolean;
  isExclusive?: boolean;
  exclusiveInstitutionName?: string;
  exclusiveInstitutionId?: string;
  postedByName?: string;
  postedByUid?: string;
  postedByRole?: string;
  requiredSkills?: string[];
  targetBatches?: string[];
  departmentPreference?: string;
  authorUid?: string;
  authorName?: string;
  authorRole?: string;
  institutionId?: string;
}

export type EventType = 'MEETUP' | 'WORKSHOP' | 'WEBINAR' | 'COLLEGE_EVENT' | 'CAREER_EVENT' | 'MENTORSHIP_SESSION';

export interface EventItem {
  id: string;
  title: string;
  eventType: EventType;
  date: string;
  time: string;
  location: string;
  isOnline: boolean;
  meetingLink?: string;
  organizer: string;
  organizerRole?: string;
  institution: string;
  description: string;
  agenda?: string[];
  speakers?: Array<{
    name: string;
    role: string;
    company: string;
    avatar: string;
  }>;
  attendeesCount: number;
  maxCapacity: number;
  imageUrl: string;
  registrationDeadline: string;
  isRegistered?: boolean;
  authorUid?: string;
  authorName?: string;
  authorRole?: string;
  institutionId?: string;
  createdAt?: string;
}

export interface Connection {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterUid: string;
  requesterRole: UserRole;
  requesterAvatar: string;
  requesterCompany?: string;
  requesterRoleTitle?: string;
  requesterDept?: string;
  requesterInstitution: string;
  recipientId: string;
  recipientName: string;
  recipientUid: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export type NotificationCategory = 'MENTORSHIP' | 'MEMBERSHIP' | 'CONNECTION' | 'OPPORTUNITY' | 'EVENT' | 'SYSTEM';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationCategory;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  linkUrl?: string;
  timestamp?: string;
  actionLabel?: string;
  is_read?: boolean;
  created_at?: string;
}

export type AlumniDirectoryItem = User;
export type MentorshipRequestItem = MentorshipRequest;
export type ConnectionUser = Connection;

export interface PlatformStats {
  alumni: string;
  students: string;
  mentors: string;
  opportunities: string;
  events: string;
  communities: string;
  institutions: string;
}
