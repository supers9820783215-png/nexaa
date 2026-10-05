import { Router } from 'express';
import { pg } from '../db.ts';
import { requireAuth, requireRole, optionalAuth, AuthRequest } from '../auth.ts';
import { createNotification } from '../notification.service.ts';

const router = Router();

// GET /api/opportunities - List and filter opportunities
router.get('/', optionalAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { type, search, page = '1', limit = '12' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (type && (type === 'JOB' || type === 'INTERNSHIP')) {
      conditions.push(`o.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      conditions.push(`(
        o.title ILIKE $${paramIndex} OR
        o.company ILIKE $${paramIndex} OR
        o.skills ILIKE $${paramIndex} OR
        o.location ILIKE $${paramIndex} OR
        o.description ILIKE $${paramIndex}
      )`);
      params.push(q);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pg.query<{ count: string }>(`
      SELECT COUNT(*) as count FROM opportunities o ${whereClause}
    `, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataQuery = `
      SELECT
        o.*,
        u.name as poster_name,
        u.email as poster_email,
        u.role as poster_role,
        u.profile_image as poster_avatar
      FROM opportunities o
      JOIN users u ON o.posted_by = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limitNum, offset);
    const result = await pg.query(dataQuery, params);

    return res.json({
      opportunities: result.rows,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error: any) {
    console.error('[Opportunities API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch opportunities.' });
  }
});

// POST /api/opportunities - Post new Job or Internship (Alumni or Admin only)
router.post('/', requireAuth, requireRole(['ALUMNI', 'ADMIN']), async (req: AuthRequest, res): Promise<any> => {
  try {
    const posterId = req.user!.id;
    const {
      type,
      title,
      company,
      description,
      location,
      employmentType,
      skills,
      experienceRequired,
      deadline,
      applicationLink
    } = req.body;

    // Validation
    if (!type || !title || !company || !description || !location || !employmentType || !deadline || !applicationLink) {
      return res.status(400).json({
        error: 'Type, title, company, description, location, employment type, deadline, and application link are required.'
      });
    }

    if (type !== 'JOB' && type !== 'INTERNSHIP') {
      return res.status(400).json({ error: "Type must be either 'JOB' or 'INTERNSHIP'." });
    }

    const newId = `opp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await pg.query(`
      INSERT INTO opportunities (
        id, posted_by, type, title, company, description, location,
        employment_type, skills, experience_required, deadline, application_link
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      newId,
      posterId,
      type,
      title.trim(),
      company.trim(),
      description.trim(),
      location.trim(),
      employmentType.trim(),
      skills ? skills.trim() : 'General Skills',
      experienceRequired ? experienceRequired.trim() : 'Not Specified',
      deadline.trim(),
      applicationLink.trim()
    ]);

    return res.status(201).json({
      message: `${type === 'JOB' ? 'Job' : 'Internship'} posted successfully!`,
      opportunityId: newId
    });
  } catch (error: any) {
    console.error('[Opportunities API] Create error:', error);
    return res.status(500).json({ error: 'Failed to create opportunity.' });
  }
});

// DELETE /api/opportunities/:id - Delete opportunity (Creator or Admin)
router.delete('/:id', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const oppRes = await pg.query<{ posted_by: string }>('SELECT posted_by FROM opportunities WHERE id = $1', [id]);
    if (oppRes.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    if (oppRes.rows[0].posted_by !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this opportunity.' });
    }

    await pg.query('DELETE FROM opportunities WHERE id = $1', [id]);

    return res.json({ message: 'Opportunity deleted successfully.' });
  } catch (error: any) {
    console.error('[Opportunities API] Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete opportunity.' });
  }
});

export default router;
