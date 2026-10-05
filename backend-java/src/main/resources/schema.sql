-- ==============================================================================
-- AlumNexa Enterprise PostgreSQL Schema
-- Unified Campus & Alumni Ecosystem
-- ==============================================================================

CREATE TABLE IF NOT EXISTS institutions (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('STUDENT', 'ALUMNI', 'FACULTY', 'INSTITUTION_ADMIN', 'ADMIN', 'SUPER_ADMIN')),
  profile_image TEXT,
  institution_id VARCHAR(64) REFERENCES institutions(id) ON DELETE SET NULL,
  institution_name VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50) DEFAULT 'NOT_VERIFIED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  current_year VARCHAR(50) NOT NULL,
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

CREATE TABLE IF NOT EXISTS alumni_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  graduation_year INT NOT NULL,
  course VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  industry VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  experience INT DEFAULT 0,
  skills TEXT,
  bio TEXT,
  linkedin TEXT,
  portfolio TEXT,
  mentoring_available BOOLEAN DEFAULT TRUE,
  verification_status VARCHAR(50) DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date VARCHAR(100) NOT NULL,
  time VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  organizer VARCHAR(255) NOT NULL,
  capacity INT DEFAULT 100,
  registration_deadline VARCHAR(100) NOT NULL,
  image_url TEXT,
  institution_id VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id VARCHAR(64) PRIMARY KEY,
  posted_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('JOB', 'INTERNSHIP')),
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  employment_type VARCHAR(100) NOT NULL,
  skills TEXT NOT NULL,
  experience_required VARCHAR(100) NOT NULL,
  deadline VARCHAR(100) NOT NULL,
  application_link TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentorship_requests (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alumni_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communities (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  creator_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_count INT DEFAULT 1,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_posts (
  id VARCHAR(64) PRIMARY KEY,
  community_id VARCHAR(64) NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(100) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
