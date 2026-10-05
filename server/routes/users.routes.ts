import { Router } from 'express';
import { pg } from '../db.ts';
import { requireAuth, AuthRequest } from '../auth.ts';
import { createNotification } from '../notification.service.ts';

const router = Router();

// GET /api/users/profile/:id - View profile
router.get('/profile/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const userRes = await pg.query<any>(`
      SELECT id, name, email, role, profile_image, created_at
      FROM users WHERE id = $1
    `, [id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    let profile = null;

    if (user.role === 'STUDENT') {
      const pRes = await pg.query<any>('SELECT * FROM student_profiles WHERE user_id = $1', [id]);
      profile = pRes.rows[0] || null;
    } else if (user.role === 'ALUMNI') {
      const pRes = await pg.query<any>('SELECT * FROM alumni_profiles WHERE user_id = $1', [id]);
      profile = pRes.rows[0] || null;
    }

    return res.json({ user, profile });
  } catch (error: any) {
    console.error('[Users API] Profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// PUT /api/users/profile - Update current user profile
router.put('/profile', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const {
      name,
      profileImage,
      bio,
      skills,
      linkedin,
      portfolio,
      github,
      careerGoal,
      interests,
      company,
      designation,
      industry,
      location,
      experience
    } = req.body;

    if (name) {
      await pg.query(`
        UPDATE users
        SET name = $1, profile_image = COALESCE($2, profile_image), updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [name.trim(), profileImage, userId]);
    }

    if (role === 'STUDENT') {
      await pg.query(`
        UPDATE student_profiles
        SET bio = $1, skills = $2, linkedin = $3, portfolio = $4, github = $5,
            career_goal = $6, interests = $7
        WHERE user_id = $8
      `, [
        bio || '',
        skills || '',
        linkedin || '',
        portfolio || '',
        github || '',
        careerGoal || '',
        interests || '',
        userId
      ]);
    } else if (role === 'ALUMNI') {
      await pg.query(`
        UPDATE alumni_profiles
        SET bio = $1, skills = $2, linkedin = $3, portfolio = $4,
            company = COALESCE($5, company), designation = COALESCE($6, designation),
            industry = COALESCE($7, industry), location = COALESCE($8, location),
            experience = COALESCE($9, experience)
        WHERE user_id = $10
      `, [
        bio || '',
        skills || '',
        linkedin || '',
        portfolio || '',
        company,
        designation,
        industry,
        location,
        experience ? parseInt(experience, 10) : undefined,
        userId
      ]);
    }

    return res.json({ message: 'Profile updated successfully!' });
  } catch (error: any) {
    console.error('[Users API] Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// GET /api/users/public-stats - Public statistics for homepage
router.get('/public-stats', async (_req, res): Promise<any> => {
  try {
    const alumniCount = await pg.query<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'ALUMNI'");
    const studentCount = await pg.query<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'");
    const mentorCount = await pg.query<{ count: string }>("SELECT COUNT(*) as count FROM alumni_profiles WHERE mentoring_available = true");
    const oppsCount = await pg.query<{ count: string }>("SELECT COUNT(*) as count FROM opportunities");
    const eventsCount = await pg.query<{ count: string }>("SELECT COUNT(*) as count FROM events");
    const connectionsCount = await pg.query<{ count: string }>("SELECT COUNT(*) as count FROM connections WHERE status = 'ACCEPTED'");

    return res.json({
      stats: {
        alumni: parseInt(alumniCount.rows[0]?.count || '0', 10),
        students: parseInt(studentCount.rows[0]?.count || '0', 10),
        mentors: parseInt(mentorCount.rows[0]?.count || '0', 10),
        opportunities: parseInt(oppsCount.rows[0]?.count || '0', 10),
        events: parseInt(eventsCount.rows[0]?.count || '0', 10),
        connections: parseInt(connectionsCount.rows[0]?.count || '0', 10)
      }
    });
  } catch (error: any) {
    console.error('[Users API] Stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch platform statistics.' });
  }
});

// POST /api/users/request-verification - Request institutional verification
router.post('/request-verification', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Update user's verification_status to 'PENDING'
    const result = await pg.query<any>(`
      UPDATE users
      SET verification_status = 'PENDING', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, email, role, institution_id, institution_name, is_verified, verification_status
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updatedUser = result.rows[0];

    // If ALUMNI, also update alumni_profiles
    if (userRole === 'ALUMNI') {
      await pg.query(`
        UPDATE alumni_profiles
        SET verification_status = 'PENDING'
        WHERE user_id = $1
      `, [userId]);
    }

    // Send confirmation notification to user
    await createNotification(
      userId,
      'Verification Request Submitted',
      `Your verification request for ${updatedUser.institution_name || 'your institution'} has been submitted to your campus administration for review.`,
      'SYSTEM'
    );

    // Notify institution admin(s)
    const instId = updatedUser.institution_id;
    const adminRes = await pg.query<{ id: string }>(`
      SELECT id FROM users
      WHERE (role = 'ADMIN' OR role = 'INSTITUTION_ADMIN' OR role = 'SUPER_ADMIN')
        AND ($1::TEXT IS NULL OR institution_id = $1 OR institution_id IS NULL)
    `, [instId || null]);

    for (const admin of adminRes.rows) {
      await createNotification(
        admin.id,
        'Pending Verification Request',
        `${updatedUser.name} (${updatedUser.role}) requested collegiate verification for ${updatedUser.institution_name || 'institution'}.`,
        'SYSTEM'
      );
    }

    return res.json({
      message: 'Verification request submitted to your institution admin.',
      user: updatedUser,
      verificationStatus: 'PENDING'
    });
  } catch (error: any) {
    console.error('[Users API] Request verification error:', error);
    return res.status(500).json({ error: 'Failed to submit verification request.' });
  }
});

export default router;
