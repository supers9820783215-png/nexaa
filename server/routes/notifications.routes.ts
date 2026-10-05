import { Router } from 'express';
import { pg } from '../db.ts';
import { requireAuth, AuthRequest } from '../auth.ts';

const router = Router();

// GET /api/notifications - List user's notifications
router.get('/', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user!.id;
    const result = await pg.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    const unreadCountRes = await pg.query<{ count: string }>(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    return res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadCountRes.rows[0].count, 10)
    });
  } catch (error: any) {
    console.error('[Notifications API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// PATCH /api/notifications/:id/read - Mark one as read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await pg.query(`
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    return res.json({ message: 'Notification marked as read.' });
  } catch (error: any) {
    console.error('[Notifications API] Read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user!.id;

    await pg.query(`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1
    `, [userId]);

    return res.json({ message: 'All notifications marked as read.' });
  } catch (error: any) {
    console.error('[Notifications API] Read all error:', error);
    return res.status(500).json({ error: 'Failed to mark all as read.' });
  }
});

export default router;
