import { Router } from 'express';
import { pg } from '../db.ts';
import { requireAuth, AuthRequest } from '../auth.ts';
import { createNotification } from '../notification.service.ts';

const router = Router();

// GET /api/mentorship/mentors - List mentors available for mentorship
router.get('/mentors', async (req, res): Promise<any> => {
  try {
    const { search } = req.query;
    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.profile_image,
        ap.company,
        ap.designation,
        ap.industry,
        ap.location,
        ap.experience,
        ap.skills,
        ap.bio,
        ap.graduation_year,
        ap.course,
        ap.department,
        ap.mentoring_available,
        ap.verification_status
      FROM users u
      JOIN alumni_profiles ap ON u.id = ap.user_id
      WHERE ap.mentoring_available = true
    `;
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (
        u.name ILIKE $1 OR
        ap.company ILIKE $1 OR
        ap.designation ILIKE $1 OR
        ap.skills ILIKE $1 OR
        ap.industry ILIKE $1
      )`;
      params.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY ap.verification_status = 'VERIFIED' DESC, ap.experience DESC`;

    const result = await pg.query(query, params);
    return res.json({ mentors: result.rows });
  } catch (error: any) {
    console.error('[Mentorship API] Fetch mentors error:', error);
    return res.status(500).json({ error: 'Failed to fetch mentors.' });
  }
});

// POST /api/mentorship/request - Student sends mentorship request
router.post('/request', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const studentId = req.user!.id;
    const { alumniId, topic, message } = req.body;

    if (!alumniId || !topic || !message) {
      return res.status(400).json({ error: 'Alumni ID, topic, and message are required.' });
    }

    if (studentId === alumniId) {
      return res.status(400).json({ error: 'You cannot request mentorship from yourself.' });
    }

    // Verify alumni exists and is accepting mentorship
    const alumniRes = await pg.query<{ mentoring_available: boolean; name: string }>(`
      SELECT ap.mentoring_available, u.name
      FROM users u
      JOIN alumni_profiles ap ON u.id = ap.user_id
      WHERE u.id = $1
    `, [alumniId]);

    if (alumniRes.rows.length === 0) {
      return res.status(404).json({ error: 'Mentor not found.' });
    }

    if (!alumniRes.rows[0].mentoring_available) {
      return res.status(400).json({ error: 'This alumni is not currently accepting new mentorship requests.' });
    }

    // Check for existing pending request
    const existing = await pg.query(`
      SELECT id, status FROM mentorship_requests
      WHERE student_id = $1 AND alumni_id = $2 AND status = 'PENDING'
    `, [studentId, alumniId]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a pending mentorship request with this mentor.' });
    }

    const requestId = `mnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await pg.query(`
      INSERT INTO mentorship_requests (id, student_id, alumni_id, topic, message, status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING')
    `, [requestId, studentId, alumniId, topic.trim(), message.trim()]);

    // Send notification to the alumni
    await createNotification(
      alumniId,
      'New Mentorship Request',
      `${req.user!.name} requested mentorship on topic: "${topic.trim()}".`,
      'MENTORSHIP_REQUEST'
    );

    return res.status(201).json({
      message: 'Mentorship request submitted successfully!',
      requestId,
      status: 'PENDING'
    });
  } catch (error: any) {
    console.error('[Mentorship API] Send request error:', error);
    return res.status(500).json({ error: 'Failed to submit mentorship request.' });
  }
});

// GET /api/mentorship/requests - Get incoming & outgoing mentorship requests
router.get('/requests', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Incoming requests (if alumni)
    const incomingQuery = `
      SELECT
        mr.id,
        mr.topic,
        mr.message,
        mr.status,
        mr.created_at,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.profile_image as student_avatar,
        sp.course,
        sp.department,
        sp.current_year,
        sp.career_goal
      FROM mentorship_requests mr
      JOIN users u ON mr.student_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE mr.alumni_id = $1
      ORDER BY mr.created_at DESC
    `;
    const incomingRes = await pg.query(incomingQuery, [userId]);

    // Outgoing requests (if student)
    const outgoingQuery = `
      SELECT
        mr.id,
        mr.topic,
        mr.message,
        mr.status,
        mr.created_at,
        u.id as alumni_id,
        u.name as alumni_name,
        u.email as alumni_email,
        u.profile_image as alumni_avatar,
        ap.company,
        ap.designation,
        ap.industry,
        ap.skills
      FROM mentorship_requests mr
      JOIN users u ON mr.alumni_id = u.id
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
      WHERE mr.student_id = $1
      ORDER BY mr.created_at DESC
    `;
    const outgoingRes = await pg.query(outgoingQuery, [userId]);

    return res.json({
      incoming: incomingRes.rows,
      outgoing: outgoingRes.rows
    });
  } catch (error: any) {
    console.error('[Mentorship API] Get requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch mentorship requests.' });
  }
});

// PATCH /api/mentorship/:id - Accept, Reject or Complete Request
router.patch('/:id', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
    const userId = req.user!.id;

    if (!['ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Allowed: 'ACCEPTED', 'REJECTED', 'COMPLETED'." });
    }

    const reqRes = await pg.query<{
      id: string;
      student_id: string;
      alumni_id: string;
      topic: string;
      status: string;
    }>('SELECT * FROM mentorship_requests WHERE id = $1', [id]);

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Mentorship request not found.' });
    }

    const mReq = reqRes.rows[0];

    // Must be the mentor to accept or reject
    if (mReq.alumni_id !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only the targeted mentor can update this request.' });
    }

    await pg.query(`
      UPDATE mentorship_requests
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [status, id]);

    // Send notification to the student
    const notifType = status === 'ACCEPTED' ? 'MENTORSHIP_ACCEPTED' : 'MENTORSHIP_REJECTED';
    const notifTitle = `Mentorship Request ${status === 'ACCEPTED' ? 'Accepted' : 'Updated'}`;
    const notifMsg = status === 'ACCEPTED'
      ? `${req.user!.name} accepted your mentorship request for "${mReq.topic}". Check your mentorship dashboard to connect.`
      : `${req.user!.name} marked your mentorship request for "${mReq.topic}" as ${status.toLowerCase()}.`;

    await createNotification(mReq.student_id, notifTitle, notifMsg, notifType);

    return res.json({
      message: `Mentorship request marked as ${status}.`,
      status
    });
  } catch (error: any) {
    console.error('[Mentorship API] Update request error:', error);
    return res.status(500).json({ error: 'Failed to update mentorship request.' });
  }
});

export default router;
