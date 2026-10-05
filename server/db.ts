import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Ensure data directory exists for persistent local PostgreSQL storage
const dataDir = path.join(process.cwd(), 'data', 'pgdata');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const pg = new PGlite(dataDir);

export async function initDatabase() {
  console.log('[Database] Initializing PostgreSQL database via PGlite...');

  // Create Users table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      profile_image TEXT,
      institution_id TEXT,
      institution_name TEXT,
      is_verified BOOLEAN DEFAULT FALSE,
      verification_status TEXT DEFAULT 'NOT_VERIFIED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe non-destructive column migrations for institution-scoped verification
  await pg.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`);
  await pg.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('STUDENT', 'ALUMNI', 'FACULTY', 'INSTITUTION_ADMIN', 'ADMIN', 'SUPER_ADMIN'));`);
  await pg.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_id TEXT;`);
  await pg.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_name TEXT;`);
  await pg.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;`);
  await pg.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'NOT_VERIFIED';`);

  await pg.query(`
    UPDATE users
    SET institution_id = 'inst-dtss-01', institution_name = 'DTSS College of Commerce & Science'
    WHERE institution_id IS NULL;
  `);

  await pg.query(`
    UPDATE users
    SET is_verified = TRUE, verification_status = 'VERIFIED'
    WHERE role IN ('ADMIN', 'INSTITUTION_ADMIN', 'SUPER_ADMIN') AND (is_verified IS NULL OR is_verified = FALSE);
  `);

  await pg.query(`
    UPDATE users
    SET is_verified = FALSE, verification_status = 'PENDING'
    WHERE id IN ('alumni-11', 'alumni-12');
  `);

  // Create Institutions table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default accredited institutions if empty
  const instCountRes = await pg.query<{ count: string }>(`SELECT COUNT(*) as count FROM institutions`);
  if (parseInt(instCountRes.rows[0]?.count || '0', 10) === 0) {
    const defaultInstitutions = [
      ['inst-dtss-01', 'DTSS College of Commerce & Science', 'DTSS', 'Mumbai', 'Maharashtra'],
      ['inst-vjti-02', 'Veermata Jijabai Technological Institute (VJTI)', 'VJTI', 'Mumbai', 'Maharashtra'],
      ['inst-sxc-03', "St. Xavier's College", 'SXC', 'Mumbai', 'Maharashtra'],
      ['inst-bit-04', 'Birla Institute of Technology', 'BIT', 'Ranchi', 'Jharkhand'],
      ['inst-iist-05', 'Apex Institute of Science & Technology', 'AIST', 'Noida', 'Uttar Pradesh'],
      ['inst-mu-06', 'University of Mumbai', 'MU', 'Mumbai', 'Maharashtra'],
      ['inst-du-07', 'Delhi University', 'DU', 'New Delhi', 'Delhi']
    ];

    for (const [id, name, code, city, state] of defaultInstitutions) {
      await pg.query(`
        INSERT INTO institutions (id, name, code, city, state)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING;
      `, [id, name, code, city, state]);
    }
    console.log('[Database] Default accredited institutions seeded successfully.');
  }

  // Create Student Profiles table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course TEXT NOT NULL,
      department TEXT NOT NULL,
      current_year TEXT NOT NULL,
      graduation_year INT NOT NULL,
      skills TEXT,
      interests TEXT,
      career_goal TEXT,
      bio TEXT,
      linkedin TEXT,
      github TEXT,
      portfolio TEXT,
      resume TEXT
    );
  `);

  // Create Alumni Profiles table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS alumni_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      graduation_year INT NOT NULL,
      course TEXT NOT NULL,
      department TEXT NOT NULL,
      company TEXT NOT NULL,
      designation TEXT NOT NULL,
      industry TEXT NOT NULL,
      location TEXT NOT NULL,
      experience INT DEFAULT 0,
      skills TEXT,
      bio TEXT,
      linkedin TEXT,
      portfolio TEXT,
      mentoring_available BOOLEAN DEFAULT TRUE,
      verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'))
    );
  `);

  // Create Connections table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sender_id, receiver_id)
    );
  `);

  // Create Mentorship Requests table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS mentorship_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      alumni_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Opportunities table (Jobs & Internships)
  await pg.query(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      posted_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('JOB', 'INTERNSHIP')),
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      employment_type TEXT NOT NULL,
      skills TEXT NOT NULL,
      experience_required TEXT NOT NULL,
      deadline TEXT NOT NULL,
      application_link TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Events table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      event_type TEXT NOT NULL,
      organizer TEXT NOT NULL,
      capacity INT DEFAULT 100,
      registration_deadline TEXT NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Event Registrations table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attendance_status TEXT DEFAULT 'REGISTERED' CHECK (attendance_status IN ('REGISTERED', 'ATTENDED', 'CANCELLED')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );
  `);

  // Create Notifications table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Messages table for foundational future messaging
  await pg.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[Database] Schema created successfully.');

  // Ensure default institution admin account exists
  const adminRes = await pg.query<{ count: string }>(`SELECT COUNT(*) as count FROM users WHERE email = 'admin@college.edu'`);
  if (parseInt(adminRes.rows[0].count, 10) === 0) {
    const adminPass = await bcrypt.hash('Password123!', 10);
    await pg.query(`
      INSERT INTO users (id, name, email, password_hash, role, profile_image, institution_id, institution_name, is_verified, verification_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      'usr-admin-1',
      'DTSS Administration',
      'admin@college.edu',
      adminPass,
      'INSTITUTION_ADMIN',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      'inst-dtss-01',
      'DTSS College of Commerce & Science',
      true,
      'VERIFIED'
    ]);
    console.log('[Database] Default institution admin initialized (admin@college.edu)');
  }

  console.log('[Database] Ready for live operations.');
}
