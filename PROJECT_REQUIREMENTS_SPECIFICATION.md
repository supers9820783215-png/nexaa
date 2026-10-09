# AlumNexa — Project Requirements & System Specification

**Institution:** DTSS College of Commerce (Autonomous)  
**Project Title:** AlumNexa — Collegiate Alumni Networking, Mentorship & Career Ecosystem  

---

## 3.1 Problem Definition

In traditional higher education institutions, connecting students with alumni and faculty is decentralized, fragmented, and difficult to manage. After graduation, colleges lose systematic contact with their alumni, while current students struggle to obtain verified career guidance, mentorship, and professional opportunities.

The traditional process relies on unorganized social networks, manual spreadsheets, and informal communication channels. This creates several problems:

* **Fragmented Communication:** Communication between students, alumni, and faculty is scattered across multiple unverified third-party platforms, leading to missed opportunities.
* **Lack of Institutional Verification:** Open social platforms cannot guarantee genuine collegiate affiliation, resulting in impersonation, fake profiles, and unvetted referrals.
* **Difficult Mentorship Coordination:** Students find it challenging to identify relevant alumni mentors, and alumni have no structured mechanism to review, accept, or manage mentorship requests.
* **Inefficient Career & Opportunity Distribution:** Placement cells and alumni struggle to broadcast verified internships, jobs, and referral openings directly to eligible student cohorts without administrative delays.
* **Manual Record Keeping:** College administrators must manually track alumni directories, event participation, and career outcomes with considerable effort.

To overcome these problems, **AlumNexa** provides a unified collegiate networking, mentorship, and career ecosystem. The platform issues tamper-proof Academic UIDs, allows verified alumni and faculty to mentor students, hosts an institutional job and opportunity board, facilitates campus event management, and provides secure direct messaging.

The system reduces administrative overhead, ensures institutional authenticity, and bridges the gap between academic education and lifelong career advancement.

---

## 3.2 Requirements Specification

The system requirements are divided into functional requirements and non-functional requirements.

### 3.2.1 Functional Requirements

The system shall:

1. **Authentication & RBAC:** Allow students, alumni, faculty, and administrators to register and log in securely with role-based access control (`STUDENT`, `ALUMNI`, `FACULTY`, `INSTITUTION_ADMIN`, `SUPER_ADMIN`).
   * *Code Implementation:* `src/context/AuthContext.tsx`, `src/services/authService.ts`

2. **Tamper-Proof Academic UID:** Issue a unique Academic UID (e.g., `AN-STU-...`, `AN-ALU-...`, `AN-FAC-...`) to every verified collegiate member.
   * *Code Implementation:* `src/components/common/UserUIDBadge.tsx`, `src/services/authService.ts`

3. **Institutional Verification Pipeline:** Provide campus onboarding and identity verification workflows reviewed by institutional administrators.
   * *Code Implementation:* `src/components/JoinCampusModal.tsx`, `src/views/AdminDashboardView.tsx`

4. **1:1 Mentorship Platform:** Allow alumni and faculty to offer 1:1 mentorship and manage their availability, bio, and expertise areas.
   * *Code Implementation:* `src/views/MentorshipView.tsx`, `src/services/mentorshipService.ts`

5. **Mentorship Applications & Portfolio Links:** Allow students to search for verified mentors, send personalized mentorship requests, and attach portfolio/resume links (LinkedIn, GitHub, Drive).
   * *Code Implementation:* `src/views/MentorshipView.tsx`

6. **Mentorship Review & Status Tracking:** Enable mentors to review incoming mentorship applications and accept or decline requests with custom scheduling notes.
   * *Code Implementation:* `src/views/MentorshipView.tsx`, `src/services/mentorshipService.ts`

7. **Direct Messaging & Active Chat Initialization:** Automatically initialize direct conversation threads in Firestore upon mentorship acceptance and allow real-time direct messaging between verified members.
   * *Code Implementation:* `src/views/MessagesView.tsx`, `src/services/messageService.ts`

8. **Career Opportunities & Job Board:** Allow alumni, faculty, and administrators to publish verified career openings, internships, and referral opportunities to a single live cloud database.
   * *Code Implementation:* `src/views/OpportunitiesView.tsx`, `src/services/opportunityService.ts`

9. **Live Feed & Real-Time Sync:** Allow students to browse opportunities in real time, filter by type, mode, and department, and apply directly.
   * *Code Implementation:* `src/views/OpportunitiesView.tsx`, `src/services/opportunityService.ts`

10. **Applicant Tracking for Job Posters:** Provide alumni posters with an applicant tracking portal displaying student applications, resumes, and notes in real time.
    * *Code Implementation:* `src/views/OpportunitiesView.tsx`, `src/services/opportunityService.ts`

11. **Campus & Alumni Events:** Allow organizers to create, manage, and publish campus webinars, workshops, and alumni reunions with RSVP attendee limits.
    * *Code Implementation:* `src/views/EventsView.tsx`, `src/services/eventService.ts`

12. **Event RSVPs & Calendar Integration:** Allow participants to reserve spots for events and export event schedules directly to Google Calendar.
    * *Code Implementation:* `src/views/EventsView.tsx`, `src/services/eventService.ts`

13. **Searchable Member Directory:** Provide a searchable Alumni & Student Directory filtered by department, graduation batch, current company, and skills.
    * *Code Implementation:* `src/views/DirectoryView.tsx`

14. **Gated Access for Verified Profiles:** Restrict sensitive platform features (such as direct messaging and job posting) to verified collegiate profiles.
    * *Code Implementation:* `src/views/MessagesView.tsx`, `src/App.tsx`

---

### 3.2.2 Non-Functional Requirements

1. **Security:** Protect user credentials, academic profiles, and private messages through authentication, session management, Firestore security rules, and role-based permissions.
2. **Authenticity & Data Integrity:** Academic UID generation and institutional verification framework ensure only genuine collegiate members claim institutional affiliation.
3. **Performance & Real-Time Responsiveness:** Sub-second retrieval of opportunities, events, and directory records; real-time cloud snapshot listeners for messages and job postings.
4. **Usability:** Compact, responsive layout tailored for standard 100% desktop screens as well as mobile devices.
5. **Privacy & Trust:** Direct communication channels and student contact details are strictly restricted to verified institutional members and approved mentorship connections.
6. **Scalability:** Shared cloud database architecture supporting growing numbers of students, alumni cohorts, job postings, and high-frequency messaging traffic.
7. **Reliability:** Operates consistently during onboarding, mentorship requests, real-time chats, and concurrent event registrations without data corruption or loss.
