import { Router } from 'express';
import { pg } from '../db.ts';
import { requireAuth, requireRole, optionalAuth, AuthRequest } from '../auth.ts';
import { createNotification } from '../notification.service.ts';

const router = Router();

// GET /api/events - List all events
router.get('/', optionalAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { search, type } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search && typeof search === 'string' && search.trim() !== '') {
      conditions.push(`(title ILIKE $${paramIndex} OR location ILIKE $${paramIndex} OR organizer ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (type && typeof type === 'string' && type !== 'ALL') {
      conditions.push(`event_type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const eventsQuery = `
      SELECT
        e.*,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as attendee_count
      FROM events e
      ${whereClause}
      ORDER BY e.date ASC
    `;

    const result = await pg.query<any>(eventsQuery, params);

    // If logged in, check which events the user has registered for
    let userRegisteredEventIds = new Set<string>();
    if (req.user) {
      const regRes = await pg.query<{ event_id: string }>(`
        SELECT event_id FROM event_registrations WHERE user_id = $1
      `, [req.user.id]);
      userRegisteredEventIds = new Set(regRes.rows.map(r => r.event_id));
    }

    const eventsWithStatus = result.rows.map((e: any) => ({
      ...e,
      isRegistered: userRegisteredEventIds.has(e.id)
    }));

    return res.json({ events: eventsWithStatus });
  } catch (error: any) {
    console.error('[Events API] Fetch events error:', error);
    return res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

// GET /api/events/my-events - Get events current user registered for
router.get('/my-events', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user!.id;
    const result = await pg.query(`
      SELECT
        e.*,
        er.created_at as registered_at,
        er.attendance_status
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.user_id = $1
      ORDER BY e.date ASC
    `, [userId]);

    return res.json({ registeredEvents: result.rows });
  } catch (error: any) {
    console.error('[Events API] My events error:', error);
    return res.status(500).json({ error: 'Failed to fetch registered events.' });
  }
});

// POST /api/events/:id/register - Register for an event
router.post('/:id/register', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if event exists
    const eventRes = await pg.query<{ id: string; title: string; capacity: number }>(`
      SELECT id, title, capacity FROM events WHERE id = $1
    `, [id]);

    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventRes.rows[0];

    // Check capacity
    const countRes = await pg.query<{ count: string }>(`
      SELECT COUNT(*) as count FROM event_registrations WHERE event_id = $1
    `, [id]);
    const currentAttendees = parseInt(countRes.rows[0].count, 10);

    if (currentAttendees >= event.capacity) {
      return res.status(400).json({ error: 'This event has reached full capacity.' });
    }

    // Check duplicate
    const existing = await pg.query(`
      SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2
    `, [id, userId]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You are already registered for this event.' });
    }

    const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await pg.query(`
      INSERT INTO event_registrations (id, event_id, user_id, attendance_status)
      VALUES ($1, $2, $3, 'REGISTERED')
    `, [regId, id, userId]);

    // Send confirmation notification
    await createNotification(
      userId,
      'Event Registration Confirmed',
      `You are registered for "${event.title}". See details in My Events.`,
      'EVENT_REGISTRATION'
    );

    return res.status(201).json({
      message: 'Registration successful! See you there.',
      registrationId: regId
    });
  } catch (error: any) {
    console.error('[Events API] Register error:', error);
    return res.status(500).json({ error: 'Failed to register for event.' });
  }
});

// DELETE /api/events/:id/register - Cancel registration
router.delete('/:id/register', requireAuth, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await pg.query(`
      DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2 RETURNING id
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    return res.json({ message: 'Event registration cancelled.' });
  } catch (error: any) {
    console.error('[Events API] Cancel error:', error);
    return res.status(500).json({ error: 'Failed to cancel registration.' });
  }
});

// ADMIN: POST /api/events - Create new event
router.post('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res): Promise<any> => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      eventType,
      organizer,
      capacity,
      registrationDeadline,
      imageUrl
    } = req.body;

    if (!title || !description || !date || !time || !location || !eventType || !organizer) {
      return res.status(400).json({ error: 'All primary event fields are required.' });
    }

    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await pg.query(`
      INSERT INTO events (
        id, title, description, date, time, location, event_type,
        organizer, capacity, registration_deadline, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      eventId,
      title.trim(),
      description.trim(),
      date.trim(),
      time.trim(),
      location.trim(),
      eventType.trim(),
      organizer.trim(),
      capacity ? parseInt(capacity, 10) : 100,
      registrationDeadline ? registrationDeadline.trim() : date.trim(),
      imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80'
    ]);

    return res.status(201).json({
      message: 'Event created successfully!',
      eventId
    });
  } catch (error: any) {
    console.error('[Events API] Admin create event error:', error);
    return res.status(500).json({ error: 'Failed to create event.' });
  }
});

// ADMIN: PUT /api/events/:id - Edit event
router.put('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      date,
      time,
      location,
      eventType,
      organizer,
      capacity,
      registrationDeadline
    } = req.body;

    const result = await pg.query(`
      UPDATE events
      SET title = $1, description = $2, date = $3, time = $4, location = $5,
          event_type = $6, organizer = $7, capacity = $8, registration_deadline = $9
      WHERE id = $10
      RETURNING *
    `, [
      title.trim(),
      description.trim(),
      date.trim(),
      time.trim(),
      location.trim(),
      eventType.trim(),
      organizer.trim(),
      capacity ? parseInt(capacity, 10) : 100,
      registrationDeadline ? registrationDeadline.trim() : date.trim(),
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.json({ message: 'Event updated successfully!', event: result.rows[0] });
  } catch (error: any) {
    console.error('[Events API] Admin edit event error:', error);
    return res.status(500).json({ error: 'Failed to update event.' });
  }
});

// ADMIN: DELETE /api/events/:id - Delete event
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const result = await pg.query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.json({ message: 'Event deleted successfully.' });
  } catch (error: any) {
    console.error('[Events API] Admin delete event error:', error);
    return res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// ADMIN: GET /api/events/:id/registrations - View attendees
router.get('/:id/registrations', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res): Promise<any> => {
  try {
    const { id } = req.params;
    const result = await pg.query(`
      SELECT
        er.id as registration_id,
        er.attendance_status,
        er.created_at as registered_at,
        u.id as user_id,
        u.name,
        u.email,
        u.role,
        u.profile_image
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = $1
      ORDER BY er.created_at DESC
    `, [id]);

    return res.json({ attendees: result.rows });
  } catch (error: any) {
    console.error('[Events API] Admin get attendees error:', error);
    return res.status(500).json({ error: 'Failed to fetch attendees.' });
  }
});

export default router;
