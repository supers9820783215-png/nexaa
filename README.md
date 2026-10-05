# AlumNexa Enterprise — Unified Campus & Alumni Ecosystem

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)

AlumNexa is an enterprise-grade, multi-tenant digital ecosystem engineered to connect students, verified alumni, academic faculty, and institution administrators. It bridges university academia with real-world careers, mentorships, campus communities, and accredited institutional governance.

---

## 🏛️ System Architecture

AlumNexa is built with an **Enterprise Full-Stack Architecture**:

```
                       ┌──────────────────────────────────────────────┐
                       │           React 19 + TypeScript              │
                       │           TailwindCSS v4 + Vite              │
                       │     (Client Dashboard & Campus Portal)       │
                       └──────────────────────┬───────────────────────┘
                                              │ REST / JSON (JWT Auth)
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │          Enterprise Gateway Layer            │
                       │        Spring Security / Express Proxy       │
                       └──────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
     ┌─────────────────────────────────┐             ┌────────────────────────────────┐
     │   Enterprise Spring Boot 3.3    │             │      Node / Express Engine     │
     │   Java 17 / Jakarta EE / JPA    │             │       Live Dev & PGlite        │
     │   (Production Backend)          │             │       (Instant Dev Server)     │
     └────────────────┬────────────────┘             └───────────────┬────────────────┘
                      │                                              │
                      └───────────────────────┬──────────────────────┘
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │        Enterprise PostgreSQL Database        │
                       │      Multi-Tenant Institutional Schema       │
                       └──────────────────────────────────────────────┘
```

---

## 📂 Project Organization

```
AlumNexa/
├── backend-java/                    # Enterprise Spring Boot 3 Java Application
│   ├── pom.xml                      # Maven Build & Dependencies (Spring Web, JPA, Security, JJWT)
│   └── src/
│       └── main/
│           ├── java/com/alumnexa/
│           │   ├── AlumNexaApplication.java  # Spring Boot Application Entrypoint
│           │   ├── config/          # Spring Security 6, JWT Filter, CORS
│           │   ├── controller/      # REST Controllers (Auth, Events, Jobs, Mentorship, Admin)
│           │   ├── dto/             # Request & Response Data Transfer Objects
│           │   ├── entity/          # JPA Domain Entities (Users, Events, Profiles, Communities)
│           │   ├── repository/      # Spring Data JPA Repositories
│           │   └── service/         # Business Logic Services
│           └── resources/
│               ├── application.yml  # Database & JWT Configuration
│               └── schema.sql       # PostgreSQL DDL Schema
│
├── src/                             # Enterprise React 19 Frontend
│   ├── App.tsx                      # Root Application & State Controller
│   ├── types.ts                     # Strict TypeScript Domain Definitions
│   ├── components/                  # Reusable UI & Modal Components
│   │   ├── AlumniDetailModal.tsx    # Mentor & Alumni Profile Inspector
│   │   ├── AuthModal.tsx            # Multi-Method Authentication Portal
│   │   ├── GlobalSearchModal.tsx    # Universal Instant Campus Search
│   │   ├── JoinCampusModal.tsx      # Onboarding & Institutional Verification
│   │   ├── Navbar.tsx               # Responsive Header & Role Navigation
│   │   └── NotificationDropdown.tsx # Real-Time Notification Bell & Badges
│   ├── views/                       # 14 Role-Based Application Views
│   │   ├── AdminDashboardView.tsx   # Institutional Governance & Verifications
│   │   ├── CommunitiesView.tsx      # Academic & Career Discussion Guilds
│   │   ├── DirectoryView.tsx        # Searchable Alumni & Student Directory
│   │   ├── EventsView.tsx           # Campus Summits, Masterclasses, Hackathons
│   │   ├── HomeView.tsx             # Interactive Landing & Mission Showcase
│   │   ├── InstitutionsView.tsx     # Accredited Universities Network
│   │   ├── MentorshipView.tsx       # 1-on-1 Mentorship Request & Booking Portal
│   │   ├── MessagesView.tsx         # Direct Real-Time Campus Messaging
│   │   ├── OpportunitiesView.tsx    # Role-Based Job & Internship Board
│   │   ├── ProfileView.tsx          # Dynamic Profile & Identity Settings
│   │   └── RoleDashboardView.tsx    # Custom Dashboards (Student / Alumni / Faculty)
│   └── services/                    # API Clients & Real-Time Sync Engines
│
├── server/                          # Local Full-Stack Node / Express Development Server
│   ├── db.ts                        # Persistent PostgreSQL (PGlite) Integration
│   └── routes/                      # Fast Development API Endpoints
├── package.json                     # Frontend & Dev Tooling Dependencies
└── vite.config.ts                   # Vite Build & Hot-Module Replacement
```

---

## 🚀 Running the Project

### Option A: Instant Development Server (Node / Vite / PGlite)
Run the application instantly without installing external database servers:
```bash
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### Option B: Enterprise Java (Spring Boot) Backend
Run the production Java Spring Boot service:
```bash
cd backend-java
mvn clean spring-boot:run
```
The Spring Boot REST API starts on port **8080** with Swagger / REST endpoints available at `http://localhost:8080/api`.

---

## 🔐 Credentials & Default Demo Accounts

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Institution Admin** | `admin@dtss.ac.in` | `Admin@DTSS2026` | Full DTSS College Governance, Verifications, Campus Analytics |
| **Student** | `student@college.edu` | `Password123!` | Mentorship requests, Event RSVPs, Job applications, Student forums |
| **Alumni / Mentor** | `alumni@college.edu` | `Password123!` | Mentorship requests management, Post job opportunities, Lead workshops |

---

## 🛡️ Key Features & Modules

1. **Role-Based Access Control (RBAC)**: Distinct permissions and views for `STUDENT`, `ALUMNI`, `FACULTY`, and `INSTITUTION_ADMIN`.
2. **Accredited Campus Onboarding**: Single-time verification flow linking users to their university (e.g. *DTSS COLLEGE OF COMMERCE (AUTONOMOUS)*).
3. **Dynamic Opportunities Board**: Live CRUD for career postings with role-scoped posting rights (Alumni, Faculty, Admin).
4. **Mentorship Booking Engine**: Direct student-to-alumni connection with automated status tracking (`PENDING`, `ACCEPTED`, `REJECTED`).
5. **Universal Campus Search**: Keyboard-navigable (`Ctrl+K` / `⌘K`) real-time search across alumni, events, jobs, and communities.
6. **Enterprise Security**: Industry-standard BCrypt password hashing, JWT stateless bearer authentication, and input sanitization.