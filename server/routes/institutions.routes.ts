import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pg } from '../db.ts';
import { signToken } from '../auth.ts';

const router = Router();

// Public: GET /api/institutions
// Retrieve list of all accredited & registered institutions
router.get('/', async (_req, res): Promise<any> => {
  try {
    const result = await pg.query(`
      SELECT id, name, code, city, state, created_at
      FROM institutions
      ORDER BY name ASC
    `);

    return res.json({ institutions: result.rows });
  } catch (err: any) {
    console.error('[Institutions API] Failed to fetch institutions:', err);
    return res.status(500).json({ error: 'Failed to fetch registered institutions.' });
  }
});

// Public: POST /api/institutions/register
// Autonomous onboarding of a college/institution and its collegiate administrator
router.post('/register', async (req, res): Promise<any> => {
  try {
    const {
      institutionName,
      institutionCode,
      city,
      state,
      adminName,
      adminEmail,
      password
    } = req.body;

    // Field validations
    if (!institutionName || !institutionName.trim()) {
      return res.status(400).json({ error: 'Institution name is required.' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'City is required.' });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ error: 'State is required.' });
    }
    if (!adminName || !adminName.trim()) {
      return res.status(400).json({ error: 'Official administrator name is required.' });
    }
    if (!adminEmail || !adminEmail.trim()) {
      return res.status(400).json({ error: 'Official administrator email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanAdminEmail = adminEmail.toLowerCase().trim();
    if (!emailRegex.test(cleanAdminEmail)) {
      return res.status(400).json({ error: 'Please enter a valid official administrator email address.' });
    }

    const cleanInstName = institutionName.trim();
    const cleanInstCode = (institutionCode || '').trim().toUpperCase();
    const cleanCity = city.trim();
    const cleanState = state.trim();
    const cleanAdminName = adminName.trim();

    // Check if administrator email is already registered
    const existingUser = await pg.query('SELECT id FROM users WHERE email = $1', [cleanAdminEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this administrator email address already exists.' });
    }

    // Check if institution already exists by name
    const existingInst = await pg.query(
      'SELECT id FROM institutions WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))',
      [cleanInstName]
    );
    if (existingInst.rows.length > 0) {
      return res.status(400).json({ error: 'An institution with this name has already been registered.' });
    }

    // 1. Create Institution record
    const instId = `inst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    await pg.query(`
      INSERT INTO institutions (id, name, code, city, state)
      VALUES ($1, $2, $3, $4, $5)
    `, [instId, cleanInstName, cleanInstCode, cleanCity, cleanState]);

    // 2. Hash Password & Create Institution Admin User
    const passwordHash = await bcrypt.hash(password, 10);
    const adminId = `usr-adm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const avatarUrl = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80`;

    await pg.query(`
      INSERT INTO users (
        id, name, email, password_hash, role, profile_image,
        institution_id, institution_name, is_verified, verification_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      adminId,
      cleanAdminName,
      cleanAdminEmail,
      passwordHash,
      'INSTITUTION_ADMIN',
      avatarUrl,
      instId,
      cleanInstName,
      true,
      'VERIFIED'
    ]);

    // 3. Issue Token
    const token = signToken({
      id: adminId,
      email: cleanAdminEmail,
      role: 'INSTITUTION_ADMIN',
      name: cleanAdminName,
      institutionId: instId,
      institutionName: cleanInstName
    });

    return res.status(201).json({
      message: 'College institution and administrative portal account registered successfully.',
      token,
      user: {
        id: adminId,
        uid: `AN-IAD-${adminId.substring(adminId.length - 6).toUpperCase()}`,
        name: cleanAdminName,
        email: cleanAdminEmail,
        role: 'INSTITUTION_ADMIN',
        avatar: avatarUrl,
        institutionId: instId,
        institutionName: cleanInstName,
        isVerified: true,
        verificationStatus: 'VERIFIED'
      },
      institution: {
        id: instId,
        name: cleanInstName,
        code: cleanInstCode,
        city: cleanCity,
        state: cleanState
      }
    });
  } catch (err: any) {
    console.error('[Institutions API] Registration error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred while registering the institution.' });
  }
});

export default router;
