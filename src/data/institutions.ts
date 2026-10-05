import { Institution, InstitutionRequest } from '../types.ts';

export const mockInstitutions: Institution[] = [
  {
    id: 'inst-dtss-01',
    uid: 'AN-INS-8F42KD',
    name: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
    logo: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    officialWebsite: 'https://www.dtsscollege.edu.in',
    officialEmailDomain: 'dtsscollege.edu.in',
    address: 'Malad East, Kurar Village',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    institutionType: 'Autonomous College',
    affiliation: 'University of Mumbai',
    description: 'Premier higher educational institution empowering undergraduate and postgraduate scholars across Commerce, Management, and Computing disciplines.',
    verificationStatus: 'VERIFIED',
    verifiedBadgeText: 'VERIFIED INSTITUTION',
    courses: [
      'B.Com',
      'BMS',
      'BSc IT',
      'BAF',
      'BSc CS',
      'BFM',
      'BBI',
      'BAMMC',
      'M.Com',
      'MSc IT'
    ],
    membersCount: 0,
    studentsCount: 0,
    alumniCount: 0,
    facultyCount: 0,
    foundedYear: 1984
  }
];

export const mockInstitutionRequests: InstitutionRequest[] = [];
