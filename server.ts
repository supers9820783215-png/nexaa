import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.ts';

// Route imports
import authRoutes from './server/routes/auth.routes.ts';
import usersRoutes from './server/routes/users.routes.ts';
import alumniRoutes from './server/routes/alumni.routes.ts';
import connectionsRoutes from './server/routes/connections.routes.ts';
import mentorshipRoutes from './server/routes/mentorship.routes.ts';
import opportunitiesRoutes from './server/routes/opportunities.routes.ts';
import eventsRoutes from './server/routes/events.routes.ts';
import notificationsRoutes from './server/routes/notifications.routes.ts';
import messagesRoutes from './server/routes/messages.routes.ts';
import adminRoutes from './server/routes/admin.routes.ts';
import institutionsRoutes from './server/routes/institutions.routes.ts';

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser
  app.use(express.json());

  // Initialize PostgreSQL schema (automatic demo seeding disabled)
  await initDatabase();

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Alumni Connect Portal API', time: new Date().toISOString() });
  });

  // Mount API routers
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/alumni', alumniRoutes);
  app.use('/api/connections', connectionsRoutes);
  app.use('/api/mentorship', mentorshipRoutes);
  app.use('/api/opportunities', opportunitiesRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/institutions', institutionsRoutes);

  // Serve static files from public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Alumni Connect Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('[Server] Server error:', err);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
