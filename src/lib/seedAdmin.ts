import { db } from './firebase.ts';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const DEFAULT_DTSS_COURSES = [
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
];

export async function ensureAdminAndDTSSSeeded(): Promise<void> {
  try {
    // 1. Ensure DTSS College exists in `institutions` collection
    const instDocRef = doc(db, 'institutions', 'inst-dtss-01');
    const instSnap = await getDoc(instDocRef);
    if (!instSnap.exists()) {
      await setDoc(instDocRef, {
        id: 'inst-dtss-01',
        uid: 'AN-INS-8F42KD',
        name: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
        code: 'DTSS',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        institutionType: 'Autonomous College',
        affiliation: 'University of Mumbai',
        description: 'Premier higher educational institution empowering undergraduate and postgraduate scholars across Commerce, Management, and Computing disciplines.',
        verificationStatus: 'VERIFIED',
        verifiedBadgeText: 'VERIFIED INSTITUTION',
        courses: DEFAULT_DTSS_COURSES,
        membersCount: 1,
        studentsCount: 0,
        alumniCount: 0,
        facultyCount: 1,
        foundedYear: 1984,
        createdAt: serverTimestamp()
      });
      console.log('[Seed] DTSS COLLEGE OF COMMERCE (AUTONOMOUS) seeded to Firestore.');
    } else {
      const existingData = instSnap.data();
      await setDoc(instDocRef, {
        name: 'DTSS COLLEGE OF COMMERCE (AUTONOMOUS)',
        courses: existingData?.courses && existingData.courses.length > 0 ? existingData.courses : DEFAULT_DTSS_COURSES
      }, { merge: true });
    }
  } catch (err) {
    console.warn('[Seed] Firestore institution seeding warning:', err);
  }
}
