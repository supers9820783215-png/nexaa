import { Router } from 'express';
import { pg } from '../db.ts';
import { requireAuth, optionalAuth, requireRole, AuthRequest } from '../auth.ts';

const router = Router();

// GET /api/alumni - List, search & filter alumni
router.get('/', optionalAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const {
      search,
      department,
      graduationYear,
      industry,
      mentoringAvailable,
      page = '1',
      limit = '12'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = ["u.role = 'ALUMNI'"];
    const params: any[] = [];
    let paramIndex = 1;

    // Institution network isolation
    const targetInstitution = req.user?.institutionId || (req.query.institution && req.query.institution !== 'ALL' ? (req.query.institution as string) : null);
    if (targetInstitution) {
      conditions.push(`(u.institution_id = $${paramIndex} OR u.institution_id IS NULL)`);
      params.push(targetInstitution);
      paramIndex++;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      conditions.push(`(
        u.name ILIKE $${paramIndex} OR
        ap.company ILIKE $${paramIndex} OR
        ap.designation ILIKE $${paramIndex} OR
        ap.skills ILIKE $${paramIndex} OR
        ap.course ILIKE $${paramIndex}
      )`);
      params.push(q);
      paramIndex++;
    }

    if (department && typeof department === 'string' && department !== 'ALL') {
      conditions.push(`ap.department = $${paramIndex}`);
      params.push(department);
      paramIndex++;
    }

    if (graduationYear && typeof graduationYear === 'string' && graduationYear !== 'ALL') {
      conditions.push(`ap.graduation_year = $${paramIndex}`);
      params.push(parseInt(graduationYear, 10));
      paramIndex++;
    }

    if (industry && typeof industry === 'string' && industry !== 'ALL') {
      conditions.push(`ap.industry = $${paramIndex}`);
      params.push(industry);
      paramIndex++;
    }

    if (mentoringAvailable === 'true') {
      conditions.push(`ap.mentoring_available = true`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching
    const countQuery = `
      SELECT COUNT(*) as count
      FROM users u
      JOIN alumni_profiles ap ON u.id = ap.user_id
      ${whereClause}
    `;
    const countResult = await pg.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Fetch paginated results
    const dataQuery = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.profile_image,
        u.institution_id,
        u.institution_name,
        u.is_verified,
        COALESCE(u.verification_status, ap.verification_status, 'NOT_VERIFIED') as verification_status,
        ap.graduation_year,
        ap.course,
        ap.department,
        ap.company,
        ap.designation,
        ap.industry,
        ap.location,
        ap.experience,
        ap.skills,
        ap.bio,
        ap.linkedin,
        ap.portfolio,
        ap.mentoring_available
      FROM users u
      JOIN alumni_profiles ap ON u.id = ap.user_id
      ${whereClause}
      ORDER BY ap.verification_status = 'VERIFIED' DESC, ap.graduation_year DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limitNum, offset);
    const result = await pg.query<any>(dataQuery, params);

    // If a user is logged in, attach their connection status to each alumni
    let alumniWithConnection: any[] = result.rows;
    if (req.user) {
      const currentUserId = req.user.id;
      const connectionsRes = await pg.query<any>(`
        SELECT sender_id, receiver_id, status
        FROM connections
        WHERE sender_id = $1 OR receiver_id = $1
      `, [currentUserId]);

      const connectionMap = new Map<string, { status: string; isSender: boolean }>();
      connectionsRes.rows.forEach((c: any) => {
        const otherId = c.sender_id === currentUserId ? c.receiver_id : c.sender_id;
        connectionMap.set(otherId, {
          status: c.status,
          isSender: c.sender_id === currentUserId
        });
      });

      alumniWithConnection = result.rows.map((a: any) => ({
        ...a,
        connection: connectionMap.get(a.id) || null
      }));
    }

    return res.json({
      alumni: alumniWithConnection,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error: any) {
    console.error('[Alumni API] Fetch alumni error:', error);
    return res.status(500).json({ error: 'Failed to fetch alumni directory.' });
  }
});

// GET /api/alumni/:id - Detailed Alumni Profile
router.get('/:id', optionalAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;

    const result = await pg.query<any>(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.profile_image,
        u.created_at,
        ap.graduation_year,
        ap.course,
        ap.department,
        ap.company,
        ap.designation,
        ap.industry,
        ap.location,
        ap.experience,
        ap.skills,
        ap.bio,
        ap.linkedin,
        ap.portfolio,
        ap.mentoring_available,
        ap.verification_status
      FROM users u
      JOIN alumni_profiles ap ON u.id = ap.user_id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alumni profile not found.' });
    }

    const alumni = result.rows[0];
    let connection = null;

    if (req.user) {
      const currentUserId = req.user.id;
      const connRes = await pg.query<any>(`
        SELECT id, sender_id, receiver_id, status
        FROM connections
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
      `, [currentUserId, id]);

      if (connRes.rows.length > 0) {
        connection = {
          ...connRes.rows[0],
          isSender: connRes.rows[0].sender_id === currentUserId
        };
      }
    }

    // Check posted opportunities by this alumni
    const oppRes = await pg.query<any>(`
      SELECT id, title, type, company, location, employment_type, deadline
      FROM opportunities
      WHERE posted_by = $1
      ORDER BY created_at DESC
    `, [id]);

    return res.json({
      ...alumni,
      connection,
      postedOpportunities: oppRes.rows
    });
  } catch (error: any) {
    console.error('[Alumni API] Fetch single alumni error:', error);
    return res.status(500).json({ error: 'Failed to fetch alumni profile.' });
  }
});

// PATCH /api/alumni/mentoring-toggle - Toggle Mentorship Availability
router.patch('/mentoring-toggle', requireAuth, requireRole(['ALUMNI']), async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { available } = req.body;

    const result = await pg.query<any>(`
      UPDATE alumni_profiles
      SET mentoring_available = $1
      WHERE user_id = $2
      RETURNING mentoring_available
    `, [available, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alumni profile not found.' });
    }

    return res.json({
      message: 'Mentorship availability updated!',
      mentoringAvailable: result.rows[0].mentoring_available
    });
  } catch (error: any) {
    console.error('[Alumni API] Mentoring toggle error:', error);
    return res.status(500).json({ error: 'Failed to update mentorship availability.' });
  }
});

export default router;
