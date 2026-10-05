import { pg } from './db.ts';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string
) {
  try {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await pg.query(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read)
      VALUES ($1, $2, $3, $4, $5, false)
    `, [id, userId, title, message, type]);
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err);
  }
}
