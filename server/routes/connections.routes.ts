import { Router } from 'express';
import { pg } from '../db.ts';
import { requireAuth, AuthRequest } from '../auth.ts';
import { createNotification } from '../notification.service.ts';

const router = Router();

// POST /api/connections/request - Send connection request
router.post('/request', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const senderId = req.user!.id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId is required.' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'You cannot connect with yourself.' });
    }

    // Check if receiver exists
    const receiverRes = await pg.query('SELECT id, name FROM users WHERE id = $1', [receiverId]);
    if (receiverRes.rows.length === 0) {
      return res.status(404).json({ error: 'Target user does not exist.' });
    }

    // Check existing connection
    const existing = await pg.query<any>(`
      SELECT id, status, sender_id, receiver_id
      FROM connections
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
    `, [senderId, receiverId]);

    if (existing.rows.length > 0) {
      const conn = existing.rows[0];
      if (conn.status === 'ACCEPTED') {
        return res.status(400).json({ error: 'You are already connected with this user.' });
      } else if (conn.status === 'PENDING') {
        return res.status(400).json({ error: 'A connection request is already pending.' });
      } else {
        // If previously REJECTED, allow re-requesting
        await pg.query(`
          UPDATE connections
          SET sender_id = $1, receiver_id = $2, status = 'PENDING', updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [senderId, receiverId, conn.id]);

        await createNotification(
          receiverId,
          'New Connection Request',
          `${req.user!.name} sent you a connection request.`,
          'CONNECTION_REQUEST'
        );

        return res.json({ message: 'Connection request sent successfully!', status: 'PENDING' });
      }
    }

    const newId = `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await pg.query(`
      INSERT INTO connections (id, sender_id, receiver_id, status)
      VALUES ($1, $2, $3, 'PENDING')
    `, [newId, senderId, receiverId]);

    // Send notification
    await createNotification(
      receiverId,
      'New Connection Request',
      `${req.user!.name} sent you a connection request.`,
      'CONNECTION_REQUEST'
    );

    return res.status(201).json({
      message: 'Connection request sent successfully!',
      status: 'PENDING',
      id: newId
    });
  } catch (error: any) {
    console.error('[Connections API] Request error:', error);
    return res.status(500).json({ error: 'Failed to send connection request.' });
  }
});

// GET /api/connections - Get my connections & pending requests
router.get('/', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user!.id;

    // 1. Accepted Connections
    const acceptedQuery = `
      SELECT
        c.id as connection_id,
        c.created_at as connected_since,
        u.id as user_id,
        u.name,
        u.email,
        u.role,
        u.profile_image,
        COALESCE(ap.company, '') as company,
        COALESCE(ap.designation, '') as designation,
        COALESCE(sp.course, ap.course, '') as course,
        COALESCE(sp.department, ap.department, '') as department
      FROM connections c
      JOIN users u ON (u.id = CASE WHEN c.sender_id = $1 THEN c.receiver_id ELSE c.sender_id END)
      LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE (c.sender_id = $1 OR c.receiver_id = $1)
        AND c.status = 'ACCEPTED'
      ORDER BY c.updated_at DESC
    `;
    const acceptedRes = await pg.query(acceptedQuery, [userId]);

    // 2. Incoming Pending Requests
    const incomingQuery = `
      SELECT
        c.id as connection_id,
        c.created_at,
        u.id as user_id,
        u.name,
        u.email,
        u.role,
        u.profile_image,
        COALESCE(ap.company, '') as company,
        COALESCE(ap.designation, '') as designation,
        COALESCE(sp.course, ap.course, '') as course,
        COALESCE(sp.department, ap.department, '') as department
      FROM connections c
      JOIN users u ON u.id = c.sender_id
      LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE c.receiver_id = $1 AND c.status = 'PENDING'
      ORDER BY c.created_at DESC
    `;
    const incomingRes = await pg.query(incomingQuery, [userId]);

    // 3. Outgoing Pending Requests
    const outgoingQuery = `
      SELECT
        c.id as connection_id,
        c.created_at,
        u.id as user_id,
        u.name,
        u.email,
        u.role,
        u.profile_image,
        COALESCE(ap.company, '') as company,
        COALESCE(ap.designation, '') as designation,
        COALESCE(sp.course, ap.course, '') as course,
        COALESCE(sp.department, ap.department, '') as department
      FROM connections c
      JOIN users u ON u.id = c.receiver_id
      LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE c.sender_id = $1 AND c.status = 'PENDING'
      ORDER BY c.created_at DESC
    `;
    const outgoingRes = await pg.query(outgoingQuery, [userId]);

    return res.json({
      connected: acceptedRes.rows,
      incoming: incomingRes.rows,
      outgoing: outgoingRes.rows
    });
  } catch (error: any) {
    console.error('[Connections API] Get connections error:', error);
    return res.status(500).json({ error: 'Failed to fetch connections.' });
  }
});

// PATCH /api/connections/:id - Accept or Reject Request
router.patch('/:id', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'ACCEPT' | 'REJECT'
    const userId = req.user!.id;

    if (action !== 'ACCEPT' && action !== 'REJECT') {
      return res.status(400).json({ error: "Action must be 'ACCEPT' or 'REJECT'." });
    }

    const connRes = await pg.query<{
      id: string;
      sender_id: string;
      receiver_id: string;
      status: string;
    }>('SELECT * FROM connections WHERE id = $1', [id]);

    if (connRes.rows.length === 0) {
      return res.status(404).json({ error: 'Connection request not found.' });
    }

    const conn = connRes.rows[0];

    // Must be the receiver to accept or reject
    if (conn.receiver_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Only the recipient can respond to this connection request.' });
    }

    const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';

    await pg.query(`
      UPDATE connections
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newStatus, id]);

    if (newStatus === 'ACCEPTED') {
      await createNotification(
        conn.sender_id,
        'Connection Request Accepted',
        `${req.user!.name} accepted your connection request. You are now connected!`,
        'CONNECTION_ACCEPTED'
      );
    }

    return res.json({
      message: `Connection request ${action.toLowerCase()}ed successfully.`,
      status: newStatus
    });
  } catch (error: any) {
    console.error('[Connections API] Update connection error:', error);
    return res.status(500).json({ error: 'Failed to update connection request.' });
  }
});

export default router;
