import { Router } from 'express';
import { pg } from '../db.ts';
import { requireAuth, requireRole, AuthRequest } from '../auth.ts';
import { createNotification } from '../notification.service.ts';

const router = Router();

// Protect ALL admin routes with requireAuth AND requireRole(['ADMIN', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'])
router.use(requireAuth, requireRole(['ADMIN', 'INSTITUTION_ADMIN', 'SUPER_ADMIN']));

// GET /api/admin/stats - Basic platform statistics
router.get('/stats', async (req: AuthRequest, res): Promise<any> => {
  try {
    const totalUsers = await pg.query<{ count: string }>('SELECT COUNT(*) as count FROM users');
    const students = await pg.query<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'");
    const alumni = await pg.query<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'ALUMNI'");
    const verifiedAlumni = await pg.query<{ count: string }>(`
      SELECT COUNT(*) as count FROM alumni_profiles WHERE verification_status = 'VERIFIED'
    `);
    const pendingVerifications = await pg.query<{ count: string }>(`
      SELECT COUNT(*) as count FROM alumni_profiles WHERE verification_status = 'PENDING'
    `);
    const mentors = await pg.query<{ count: string }>(`
      SELECT COUNT(*) as count FROM alumni_profiles WHERE mentoring_available = true
    `);
    const opportunities = await pg.query<{ count: string }>('SELECT COUNT(*) as count FROM opportunities');
    const events = await pg.query<{ count: string }>('SELECT COUNT(*) as count FROM events');
    const connections = await pg.query<{ count: string }>("SELECT COUNT(*) as count FROM connections WHERE status = 'ACCEPTED'");

    return res.json({
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count, 10),
        students: parseInt(students.rows[0].count, 10),
        alumni: parseInt(alumni.rows[0].count, 10),
        verifiedAlumni: parseInt(verifiedAlumni.rows[0].count, 10),
        pendingAlumniVerification: parseInt(pendingVerifications.rows[0].count, 10),
        mentors: parseInt(mentors.rows[0].count, 10),
        opportunities: parseInt(opportunities.rows[0].count, 10),
        events: parseInt(events.rows[0].count, 10),
        activeConnections: parseInt(connections.rows[0].count, 10)
      }
    });
  } catch (error: any) {
    console.error('[Admin API] Stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/users - List users with search and filter
router.get('/users', async (req: AuthRequest, res): Promise<any> => {
  try {
    const { role, search } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (role && (role === 'STUDENT' || role === 'ALUMNI' || role === 'ADMIN')) {
      conditions.push(`u.role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.profile_image,
        u.created_at,
        ap.verification_status,
        COALESCE(ap.company, '') as company,
        COALESCE(ap.designation, '') as designation,
        COALESCE(ap.course, sp.course, '') as course,
        COALESCE(ap.department, sp.department, '') as department
      FROM users u
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const result = await pg.query(query, params);
    return res.json({ users: result.rows });
  } catch (error: any) {
    console.error('[Admin API] Users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET /api/admin/verifications - Pending Alumni Verification Requests
// GET /api/admin/pending-verifications - Fetch pending users scoped to admin's institution
router.get('/pending-verifications', async (req: AuthRequest, res): Promise<any> => {
  try {
    const adminInstId = req.user?.institutionId;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.profile_image,
        u.institution_id,
        u.institution_name,
        u.is_verified,
        u.verification_status,
        u.created_at,
        COALESCE(ap.course, sp.course, '') as course,
        COALESCE(ap.department, sp.department, '') as department,
        COALESCE(ap.graduation_year, sp.graduation_year) as graduation_year,
        COALESCE(ap.company, '') as company,
        COALESCE(ap.designation, '') as designation,
        COALESCE(ap.industry, '') as industry
      FROM users u
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE (u.verification_status = 'PENDING' OR ap.verification_status = 'PENDING')
    `;

    const params: any[] = [];
    if (!isSuperAdmin && adminInstId) {
      query += ` AND (u.institution_id = $1 OR u.institution_id IS NULL)`;
      params.push(adminInstId);
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await pg.query(query, params);
    return res.json({ pendingUsers: result.rows, pendingAlumni: result.rows });
  } catch (error: any) {
    console.error('[Admin API] Pending verifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending verifications.' });
  }
});

// GET /api/admin/verifications - Alias for backward compatibility
router.get('/verifications', async (req: AuthRequest, res): Promise<any> => {
  try {
    const adminInstId = req.user?.institutionId;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.profile_image,
        u.institution_id,
        u.institution_name,
        u.is_verified,
        u.verification_status,
        u.created_at,
        COALESCE(ap.course, sp.course, '') as course,
        COALESCE(ap.department, sp.department, '') as department,
        COALESCE(ap.graduation_year, sp.graduation_year) as graduation_year,
        COALESCE(ap.company, '') as company,
        COALESCE(ap.designation, '') as designation,
        COALESCE(ap.industry, '') as industry,
        COALESCE(ap.experience, 0) as experience,
        COALESCE(ap.linkedin, '') as linkedin
      FROM users u
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE (u.verification_status = 'PENDING' OR ap.verification_status = 'PENDING')
    `;

    const params: any[] = [];
    if (!isSuperAdmin && adminInstId) {
      query += ` AND (u.institution_id = $1 OR u.institution_id IS NULL)`;
      params.push(adminInstId);
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await pg.query(query, params);
    return res.json({ pendingAlumni: result.rows, pendingUsers: result.rows });
  } catch (error: any) {
    console.error('[Admin API] Verifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending verifications.' });
  }
});

const handleVerifyUser = async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'VERIFIED' | 'REJECTED'

    if (status !== 'VERIFIED' && status !== 'REJECTED') {
      return res.status(400).json({ error: "Status must be either 'VERIFIED' or 'REJECTED'." });
    }

    const isVerified = status === 'VERIFIED';

    const userRes = await pg.query<any>(`
      UPDATE users
      SET is_verified = $1, verification_status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, email, role, institution_id, institution_name, is_verified, verification_status
    `, [isVerified, status, id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updatedUser = userRes.rows[0];

    // If ALUMNI, also update alumni_profiles
    if (updatedUser.role === 'ALUMNI') {
      await pg.query(`
        UPDATE alumni_profiles
        SET verification_status = $1
        WHERE user_id = $2
      `, [status, id]);
    }

    // Send notification to user
    const notifMsg = isVerified
      ? `Congratulations! Your credentials for ${updatedUser.institution_name || 'your institution'} have been approved by the administration. You now carry the verified collegiate badge.`
      : `Your verification request at ${updatedUser.institution_name || 'your institution'} was not approved. Please review your profile information or contact campus administration.`;

    await createNotification(
      id,
      `Verification ${isVerified ? 'Approved ✓' : 'Rejected'}`,
      notifMsg,
      'SYSTEM'
    );

    return res.json({
      message: `User verification status updated to ${status}.`,
      user: updatedUser,
      status
    });
  } catch (error: any) {
    console.error('[Admin API] Verify user error:', error);
    return res.status(500).json({ error: 'Failed to update user verification.' });
  }
};

router.post('/verify-user/:id', handleVerifyUser);
router.patch('/verify-user/:id', handleVerifyUser);

// PATCH /api/admin/verify-alumni/:id - Backward compatibility alias
router.patch('/verify-alumni/:id', async (req: AuthRequest, res): Promise<any> => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'VERIFIED' && status !== 'REJECTED') {
    return res.status(400).json({ error: "Status must be either 'VERIFIED' or 'REJECTED'." });
  }

  const isVerified = status === 'VERIFIED';
  await pg.query(`
    UPDATE users SET is_verified = $1, verification_status = $2 WHERE id = $3
  `, [isVerified, status, id]);

  await pg.query(`
    UPDATE alumni_profiles SET verification_status = $1 WHERE user_id = $2
  `, [status, id]);

  await createNotification(
    id,
    `Alumni Status: ${isVerified ? 'Verified ✓' : 'Rejected'}`,
    isVerified
      ? 'Congratulations! Your college alumni credentials have been verified by the administration.'
      : 'Your alumni verification request was reviewed and rejected.',
    'SYSTEM'
  );

  return res.json({ message: `Alumni verification status updated to ${status}.`, status });
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    const result = await pg.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ message: 'User deleted successfully.' });
  } catch (error: any) {
    console.error('[Admin API] Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

export default router;
