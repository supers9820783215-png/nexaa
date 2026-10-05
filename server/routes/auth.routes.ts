import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pg } from '../db.ts';
import { signToken, requireAuth, AuthRequest } from '../auth.ts';

const router = Router();

// Register new Student, Alumni, or Faculty
router.post('/register', async (req, res): Promise<any> => {
  try {
    const {
      name,
      email,
      password,
      role,
      institutionId,
      institutionName,
      course,
      department,
      graduationYear,
      // Student specific
      currentYear,
      skills,
      interests,
      careerGoal,
      // Alumni specific
      company,
      designation,
      industry,
      location,
      experience
    } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required fields.' });
    }

    if (!institutionId || !institutionName) {
      return res.status(400).json({ error: 'Please select your College / Institution.' });
    }

    if (role !== 'STUDENT' && role !== 'ALUMNI' && role !== 'FACULTY') {
      return res.status(400).json({ error: 'Invalid role. Must be STUDENT, ALUMNI, or FACULTY.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!course || !department || !graduationYear) {
      return res.status(400).json({ error: 'Course, Department, and Graduation Year are required.' });
    }

    if (role === 'STUDENT' && !currentYear) {
      return res.status(400).json({ error: 'Current year of study is required for student registration.' });
    }

    if (role === 'ALUMNI' && (!company || !designation)) {
      return res.status(400).json({ error: 'Company and Designation are required for alumni registration.' });
    }

    // Check if user already exists
    const existing = await pg.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const avatarUrl = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80`;

    // Create User in database with default unverified status and selected institution
    await pg.query(`
      INSERT INTO users (id, name, email, password_hash, role, profile_image, institution_id, institution_name, is_verified, verification_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [userId, name.trim(), email.toLowerCase().trim(), passwordHash, role, avatarUrl, institutionId, institutionName, false, 'NOT_VERIFIED']);

    // Create specific Profile
    if (role === 'STUDENT') {
      await pg.query(`
        INSERT INTO student_profiles (
          id, user_id, course, department, current_year, graduation_year,
          skills, interests, career_goal, bio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        `prof-${userId}`,
        userId,
        course.trim(),
        department.trim(),
        currentYear.trim(),
        parseInt(graduationYear, 10),
        skills || '',
        interests || '',
        careerGoal || '',
        `Student at ${department}, graduating in ${graduationYear}.`
      ]);
    } else if (role === 'ALUMNI') {
      // Alumni profile
      await pg.query(`
        INSERT INTO alumni_profiles (
          id, user_id, graduation_year, course, department, company, designation,
          industry, location, experience, skills, bio, mentoring_available, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        `prof-${userId}`,
        userId,
        parseInt(graduationYear, 10),
        course.trim(),
        department.trim(),
        company.trim(),
        designation.trim(),
        industry || 'Technology',
        location || 'Remote',
        experience ? parseInt(experience, 10) : 1,
        skills || '',
        `Alumnus class of ${graduationYear}, currently working as ${designation} at ${company}.`,
        true,
        'NOT_VERIFIED'
      ]);
    }

    const authUser = {
      id: userId,
      email: email.toLowerCase().trim(),
      role,
      name: name.trim(),
      institutionId,
      institutionName,
      isVerified: false,
      verificationStatus: 'NOT_VERIFIED' as const
    };

    const token = signToken(authUser);

    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        institutionId,
        institutionName,
        isVerified: false,
        verificationStatus: 'NOT_VERIFIED',
        profileImage: avatarUrl
      }
    });
  } catch (error: any) {
    console.error('[Auth API] Register error:', error);
    return res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { email, password, institutionId, institutionName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pg.query<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      role: any;
      profile_image: string;
      institution_id: string;
      institution_name: string;
      is_verified: boolean;
      verification_status: string;
    }>('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify institution if provided
    if (institutionId && user.institution_id && user.institution_id !== institutionId) {
      return res.status(401).json({
        error: `This account is registered under ${user.institution_name || 'another institution'}. Please select your registered institution to log in.`
      });
    }

    const assignedInstId = user.institution_id || institutionId || 'inst-dtss-01';
    const assignedInstName = user.institution_name || institutionName || 'DTSS College of Commerce & Science';

    // If user previously had no institution, update them
    if (!user.institution_id && institutionId) {
      await pg.query('UPDATE users SET institution_id = $1, institution_name = $2 WHERE id = $3', [
        assignedInstId,
        assignedInstName,
        user.id
      ]);
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      institutionId: assignedInstId,
      institutionName: assignedInstName
    };

    const token = signToken(authUser);

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profile_image,
        institutionId: assignedInstId,
        institutionName: assignedInstName,
        isVerified: Boolean(user.is_verified),
        verificationStatus: user.verification_status || 'NOT_VERIFIED'
      }
    });
  } catch (error: any) {
    console.error('[Auth API] Login error:', error);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

// Quick Demo Login Disabled (Enforce strict password & credential verification)
router.post('/quick-login', (_req, res) => {
  return res.status(403).json({ error: 'Quick login bypass is disabled. Please sign in with your verified email and password.' });
});

// Get Current User Profile
router.get('/me', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user!.id;
    const userRes = await pg.query<any>(`
      SELECT id, name, email, role, profile_image, institution_id, institution_name, is_verified, verification_status, created_at
      FROM users WHERE id = $1
    `, [userId]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    let profileData: any = null;

    if (user.role === 'STUDENT') {
      const pRes = await pg.query<any>(`SELECT * FROM student_profiles WHERE user_id = $1`, [userId]);
      profileData = pRes.rows[0] || null;
    } else if (user.role === 'ALUMNI') {
      const pRes = await pg.query<any>(`SELECT * FROM alumni_profiles WHERE user_id = $1`, [userId]);
      profileData = pRes.rows[0] || null;
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profile_image,
        institutionId: user.institution_id || req.user!.institutionId,
        institutionName: user.institution_name || req.user!.institutionName,
        isVerified: Boolean(user.is_verified),
        verificationStatus: user.verification_status || 'NOT_VERIFIED',
        createdAt: user.created_at
      },
      profile: profileData
    });
  } catch (error: any) {
    console.error('[Auth API] Me error:', error);
    return res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

export default router;
