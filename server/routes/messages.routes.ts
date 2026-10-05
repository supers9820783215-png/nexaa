import { Router } from 'express';
import { pg } from '../db.ts';
import { requireAuth, AuthRequest } from '../auth.ts';

const router = Router();

// GET /api/messages/:otherUserId - Get message history
router.get('/:otherUserId', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const currentUserId = req.user!.id;
    const { otherUserId } = req.params;

    const result = await pg.query(`
      SELECT m.*,
             u_send.name as sender_name,
             u_send.profile_image as sender_avatar
      FROM messages m
      JOIN users u_send ON m.sender_id = u_send.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `, [currentUserId, otherUserId]);

    return res.json({ messages: result.rows });
  } catch (error: any) {
    console.error('[Messages API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST /api/messages - Send message
router.post('/', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const senderId = req.user!.id;
    const { receiverId, message } = req.body;

    if (!receiverId || !message || !message.trim()) {
      return res.status(400).json({ error: 'receiverId and message are required.' });
    }

    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await pg.query(`
      INSERT INTO messages (id, sender_id, receiver_id, message)
      VALUES ($1, $2, $3, $4)
    `, [msgId, senderId, receiverId, message.trim()]);

    return res.status(201).json({
      message: 'Message sent successfully!',
      messageId: msgId
    });
  } catch (error: any) {
    console.error('[Messages API] Send error:', error);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;
