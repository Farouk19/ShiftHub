export const BLUEPRINT_TITLE = "ShiftHub — MVP Blueprint";
export const BLUEPRINT_SUBTITLE = "SaaS Shift-Based Jobs Platform";

export interface Section {
  id: string;
  title: string;
  icon: string;
  content: string;
}

export const sections: Section[] = [
  {
    id: "overview",
    title: "Overview & Assumptions",
    icon: "info",
    content: `## Overview & Assumptions

### Platform Summary

**ShiftHub** is a SaaS shift-based jobs marketplace that connects **Employers** (web) with **Employees** (mobile) for on-demand shift work. The platform monetizes through tiered subscription plans (Free / Basic / Pro) supplemented by a credit top-up system.

---

### Key Assumptions

| # | Assumption | Rationale |
|---|-----------|-----------|
| 1 | Credits are consumed on **job posting** (5 cr) and **accepting an application** (1 cr/accept) | Aligns cost with employer value moments |
| 2 | Free = 3 cr/month, Basic = 20 cr/month, Pro = unlimited | Gradual upgrade incentive |
| 3 | Employer **manually accepts** each applicant (up to position qty) | Keeps MVP simple; auto-match is P1 |
| 4 | Check-in/out is **timestamp + GPS** (employee initiates) | Low friction; GPS for audit trail |
| 5 | Either party can request replacement; original employee status \u2192 "replaced" | No penalty logic in MVP |
| 6 | Scheduled tasks: **subscription expiry** (daily) + **absence detection** (15 min after shift start) | Critical for SaaS billing and reliability |
| 7 | No salary/payment processing in-app | Out of scope per requirements |
| 8 | Credit amounts are configurable and may change | Business flexibility |

---

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Employer Web | React + TypeScript + RTK + RTK Query + Ant Design |
| Employee Mobile | React Native |
| Backend API | Node.js (TypeScript) + Express |
| Database | PostgreSQL (Prisma ORM) |
| Scheduled Tasks | Google Cloud Scheduler + Cloud Functions |
| Auth | JWT (access + refresh tokens) |
| File Storage | Google Cloud Storage (profile photos, documents) |
`,
  },
  {
    id: "scope",
    title: "MVP Scope",
    icon: "target",
    content: `## MVP Scope

### P0 — Must-Have (MVP)

| # | Feature | Owner |
|---|---------|-------|
| 1 | **Auth & Registration** — Email/password sign-up, login, JWT tokens, role selection | All |
| 2 | **Employer Profile** — Company info, logo upload, plan indicator | Employer |
| 3 | **Employee Profile** — Personal info, skills, availability, profile photo | Employee |
| 4 | **Job Request CRUD** — Create/edit/cancel job posts with title, description, location, date/time, positions qty, required skills | Employer |
| 5 | **Employee Search** — Employer searches employees by skills, availability, location | Employer |
| 6 | **Job Feed & Apply** — Employee browses available jobs, filters, applies | Employee |
| 7 | **Application Management** — Employer views applicants, accepts/rejects (up to position qty) | Employer |
| 8 | **Check-in / Check-out** — Employee timestamps + GPS capture at shift start/end | Employee |
| 9 | **Replacement Request** — Either party initiates; employer re-opens slot | Both |
| 10 | **Subscription Plans** — Free/Basic/Pro with feature & credit gating | All |
| 11 | **Credit System** — Monthly allocation + top-up purchase, balance tracking | Employer |
| 12 | **Admin Dashboard** — User management, plan overrides, platform stats | Admin |
| 13 | **Notifications** — In-app + push (mobile) for key events | All |
| 14 | **Absence Detection** — Auto-flag no-show 15 min after shift start | System |
| 15 | **Subscription Expiry** — Daily check, downgrade expired plans | System |

---

### P1 — Nice-to-Have

| # | Feature | Notes |
|---|---------|-------|
| 1 | Auto-matching algorithm | Match employees to jobs by score |
| 2 | Employer ratings & reviews | Post-shift feedback |
| 3 | Employee ratings & reviews | Employer rates employee |
| 4 | Shift calendar view | Visual schedule management |
| 5 | Chat / messaging | In-app employer-employee messaging |
| 6 | Advanced analytics | Employer hiring trends, costs |
| 7 | Bulk job posting | CSV import for multiple jobs |
| 8 | Geofence check-in | Verify employee is at correct location |
| 9 | Invoice generation | Auto-generate shift invoices |
| 10 | Multi-language support | i18n framework |

---

### Out of Scope

| Feature | Reason |
|---------|--------|
| Salary / payment processing | Explicitly excluded |
| Video interviews | Over-engineering for MVP |
| Background checks integration | Third-party dependency |
| Complex scheduling / recurring shifts | P1+ feature |
| Mobile web (responsive employer) | Employer = desktop web only |
| White-labeling | Enterprise feature |
| SSO / SAML | Enterprise feature |
`,
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    icon: "shield",
    content: `## Roles & Permissions Matrix

### Role-Based Access Control

| Action | Admin | Employer | Employee |
|--------|:-----:|:--------:|:--------:|
| Manage all users | Yes | - | - |
| Override subscription plans | Yes | - | - |
| View platform analytics | Yes | - | - |
| Create / edit company profile | - | Yes | - |
| Create job requests | - | Yes | - |
| Search employees | - | Yes | - |
| View & manage applications | - | Yes | - |
| Accept / reject applicants | - | Yes | - |
| Initiate replacement (as employer) | - | Yes | - |
| Top-up credits | - | Yes | - |
| Create / edit employee profile | - | - | Yes |
| Browse & apply to jobs | - | - | Yes |
| Check-in / check-out | - | - | Yes |
| Initiate replacement (as employee) | - | - | Yes |
| View own shift history | - | - | Yes |

---

### Plan-Based Gating

| Capability | Free | Basic | Pro |
|-----------|:----:|:-----:|:---:|
| Active job posts (concurrent) | 1 | 5 | Unlimited |
| Monthly credits | 3 | 20 | Unlimited |
| Employee search results per query | 5 | 20 | Unlimited |
| Application accepts per month | 3 | 20 | Unlimited |
| Job request positions (max qty) | 3 | 10 | 50 |
| Priority listing in search | - | - | Yes |
| Company logo on job posts | - | Yes | Yes |
| Export reports | - | - | Yes |

---

### Credit Consumption Rules

| Action | Credits Consumed | Notes |
|--------|:---------------:|-------|
| Create a job request | **5** | Charged at creation, refunded if cancelled before any accepts |
| Accept an application | **1** | Per individual accept |
| Search employees (per query) | **0** | Free action, results limited by plan |
| Top-up purchase | **+N** | Employer buys additional credits at any time |
| Monthly plan refresh | **+N** | Credits reset/add on billing cycle date |

> **Note:** Credit amounts shown above are defaults and can be adjusted via admin configuration.
`,
  },
  {
    id: "workflows",
    title: "Main Workflows",
    icon: "workflow",
    content: `## Main Workflows

### 1. Employer Creates a Job Request

\`\`\`
Step 1  Employer logs in (Web)
Step 2  Navigates to "Post a Job"
Step 3  Fills form: title, description, location, date/time, positions qty, required skills, pay rate
Step 4  System checks:
          a) Active job post count < plan limit?
          b) Credit balance >= 5 (job posting cost)?
Step 5  If checks pass → Job created (status: OPEN), 5 credits deducted
Step 6  Job appears in Employee feed (mobile)
Step 7  Employer receives confirmation notification
\`\`\`

---

### 2. Employee Applies to a Job

\`\`\`
Step 1  Employee opens mobile app
Step 2  Browses job feed (filtered by location, skills, date)
Step 3  Taps on a job → views full details
Step 4  Taps "Apply"
Step 5  System checks:
          a) Employee has not already applied
          b) Job is still OPEN (positions remaining)
Step 6  Application created (status: PENDING)
Step 7  Employer receives notification of new applicant
\`\`\`

---

### 3. Employer Accepts an Application

\`\`\`
Step 1  Employer views applicant list for a job
Step 2  Reviews employee profile (skills, rating, history)
Step 3  Taps "Accept"
Step 4  System checks:
          a) Accepted count < positions qty
          b) Credit balance >= 1
Step 5  Application status → ACCEPTED, 1 credit deducted
Step 6  If accepted count == positions qty → Job status → FILLED
Step 7  Employee receives "You're accepted!" notification
Step 8  Remaining PENDING applications may stay open or auto-reject (FILLED)
\`\`\`

---

### 4. Employee Check-in / Check-out

\`\`\`
Step 1  Employee arrives at job location
Step 2  Opens app → navigates to "My Shifts" → taps "Check In"
Step 3  System captures: timestamp + GPS coordinates
Step 4  Shift record updated: checkInTime, checkInLat, checkInLng
Step 5  Employer can see check-in status in real-time
Step 6  At shift end → Employee taps "Check Out"
Step 7  System captures: timestamp + GPS coordinates
Step 8  Shift record updated: checkOutTime, checkOutLat, checkOutLng
Step 9  Shift status → COMPLETED
\`\`\`

---

### 5. Replacement Request

\`\`\`
Step 1  Either party initiates replacement:
          a) Employee: "I can't make it" → taps "Request Replacement"
          b) Employer: Employee no-show → taps "Replace Employee"
Step 2  System creates ReplacementRequest (reason, initiatedBy)
Step 3  Original shift assignment status → REPLACED
Step 4  Job position slot re-opens (accepted count decremented)
Step 5  Job status reverts to OPEN (if was FILLED)
Step 6  Both parties receive notification
Step 7  New applicants can fill the reopened slot
\`\`\`

---

### 6. Absence Detection (Automated)

\`\`\`
Step 1  Cloud Scheduler triggers function at T+15 min after each shift start
Step 2  Function queries all shifts starting at time T where:
          a) Status = ACCEPTED
          b) checkInTime IS NULL
Step 3  For each match:
          a) Shift status → ABSENT
          b) Notification sent to employer
          c) Notification sent to employee
Step 4  Employer can then initiate replacement if needed
\`\`\`

---

### 7. Subscription Expiry (Automated)

\`\`\`
Step 1  Cloud Scheduler triggers daily at 00:00 UTC
Step 2  Function queries subscriptions where expiresAt < NOW
Step 3  For each expired subscription:
          a) Plan downgraded to FREE
          b) Credits reset to Free tier allocation (3)
          c) Active job posts beyond Free limit → PAUSED
          d) Notification sent to employer
Step 4  Log expiry event for admin visibility
\`\`\`
`,
  },
  {
    id: "data-model",
    title: "Data Model",
    icon: "database",
    content: `## Data Model

### Entity Overview

| Entity | Description |
|--------|------------|
| **User** | Base auth entity (id, email, passwordHash, role, createdAt) |
| **EmployerProfile** | Company details linked to User |
| **EmployeeProfile** | Worker details linked to User |
| **Subscription** | Employer's current plan + billing dates |
| **CreditBalance** | Employer's credit ledger |
| **CreditTransaction** | Individual credit debit/credit log |
| **JobRequest** | Shift posting by employer |
| **Application** | Employee's application to a job |
| **ShiftAssignment** | Accepted employee's shift record (check-in/out) |
| **ReplacementRequest** | Request to replace an employee on a shift |
| **Notification** | In-app notifications for all roles |
| **PlanConfig** | Admin-configurable plan limits and credit costs |

---

### Entity-Relationship Diagram

\`\`\`mermaid
erDiagram
    User ||--o| EmployerProfile : "has (if employer)"
    User ||--o| EmployeeProfile : "has (if employee)"
    User ||--o{ Notification : "receives"

    EmployerProfile ||--|| Subscription : "has"
    EmployerProfile ||--|| CreditBalance : "has"
    EmployerProfile ||--o{ CreditTransaction : "logs"
    EmployerProfile ||--o{ JobRequest : "creates"

    EmployeeProfile ||--o{ Application : "submits"
    EmployeeProfile ||--o{ ShiftAssignment : "works"

    JobRequest ||--o{ Application : "receives"
    JobRequest ||--o{ ShiftAssignment : "has"

    ShiftAssignment ||--o| ReplacementRequest : "may have"

    Application }o--|| JobRequest : "for"
    Application }o--|| EmployeeProfile : "by"

    ShiftAssignment }o--|| JobRequest : "for"
    ShiftAssignment }o--|| EmployeeProfile : "assigned to"

    ReplacementRequest }o--|| ShiftAssignment : "replaces"
\`\`\`

---

### Key Fields by Entity

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| email | string | unique |
| passwordHash | string | bcrypt |
| role | enum | ADMIN, EMPLOYER, EMPLOYEE |
| isActive | boolean | soft-disable |
| createdAt | timestamp | |

#### EmployerProfile
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User |
| companyName | string | |
| description | text | |
| logoUrl | string | nullable |
| location | string | city/region |
| phone | string | |

#### EmployeeProfile
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User |
| fullName | string | |
| skills | text[] | array of skill tags |
| availability | jsonb | weekly schedule object |
| location | string | city/region |
| photoUrl | string | nullable |
| phone | string | |

#### Subscription
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| employerProfileId | UUID | FK |
| plan | enum | FREE, BASIC, PRO |
| startsAt | timestamp | |
| expiresAt | timestamp | nullable for FREE |
| isActive | boolean | |

#### CreditBalance
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| employerProfileId | UUID | FK, unique |
| balance | integer | current credits |
| lastRefreshedAt | timestamp | monthly reset tracker |

#### CreditTransaction
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| employerProfileId | UUID | FK |
| amount | integer | positive = credit, negative = debit |
| type | enum | MONTHLY_REFRESH, TOP_UP, JOB_POST, ACCEPT_APPLICATION, REFUND |
| referenceId | UUID | nullable, links to job/application |
| createdAt | timestamp | |

#### JobRequest
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| employerProfileId | UUID | FK |
| title | string | |
| description | text | |
| location | string | |
| shiftDate | date | |
| startTime | time | |
| endTime | time | |
| positionsQty | integer | total slots |
| acceptedCount | integer | current filled count |
| requiredSkills | text[] | |
| payRate | decimal | hourly/shift rate (info only) |
| status | enum | OPEN, FILLED, CANCELLED, PAUSED, COMPLETED |
| createdAt | timestamp | |

#### Application
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| jobRequestId | UUID | FK |
| employeeProfileId | UUID | FK |
| status | enum | PENDING, ACCEPTED, REJECTED, WITHDRAWN |
| appliedAt | timestamp | |

#### ShiftAssignment
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| jobRequestId | UUID | FK |
| employeeProfileId | UUID | FK |
| applicationId | UUID | FK |
| checkInTime | timestamp | nullable |
| checkInLat | decimal | nullable |
| checkInLng | decimal | nullable |
| checkOutTime | timestamp | nullable |
| checkOutLat | decimal | nullable |
| checkOutLng | decimal | nullable |
| status | enum | ASSIGNED, CHECKED_IN, COMPLETED, ABSENT, REPLACED |

#### ReplacementRequest
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| shiftAssignmentId | UUID | FK |
| initiatedBy | enum | EMPLOYER, EMPLOYEE |
| reason | text | |
| status | enum | PENDING, APPROVED, RESOLVED |
| createdAt | timestamp | |

#### Notification
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| userId | UUID | FK |
| type | enum | APPLICATION_RECEIVED, APPLICATION_ACCEPTED, SHIFT_REMINDER, ABSENCE_ALERT, REPLACEMENT, PLAN_EXPIRED, CREDIT_LOW |
| title | string | |
| message | text | |
| isRead | boolean | default false |
| createdAt | timestamp | |

#### PlanConfig
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| plan | enum | FREE, BASIC, PRO |
| maxActiveJobs | integer | |
| monthlyCredits | integer | |
| maxSearchResults | integer | |
| maxPositionsPerJob | integer | |
| creditCostJobPost | integer | default 5 |
| creditCostAccept | integer | default 1 |
`,
  },
  {
    id: "api",
    title: "API Contract",
    icon: "code",
    content: `## API Contract Outline

### Base URL
\`\`\`
https://api.shifthub.com/v1
\`\`\`

### Authentication
All endpoints (except auth) require \`Authorization: Bearer <JWT>\` header.

---

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| POST | \`/auth/register\` | Register new user | Public |
| POST | \`/auth/login\` | Login, returns JWT pair | Public |
| POST | \`/auth/refresh\` | Refresh access token | Refresh token |
| POST | \`/auth/logout\` | Invalidate refresh token | Bearer |
| GET | \`/auth/me\` | Get current user profile | Bearer |

---

### Employer Endpoints

| Method | Endpoint | Description | Auth | Credits |
|--------|---------|-------------|------|---------|
| GET | \`/employer/profile\` | Get own employer profile | Employer | - |
| PUT | \`/employer/profile\` | Update employer profile | Employer | - |
| POST | \`/employer/profile/logo\` | Upload company logo | Employer | - |

---

### Employee Endpoints

| Method | Endpoint | Description | Auth | Credits |
|--------|---------|-------------|------|---------|
| GET | \`/employee/profile\` | Get own employee profile | Employee | - |
| PUT | \`/employee/profile\` | Update employee profile | Employee | - |
| POST | \`/employee/profile/photo\` | Upload profile photo | Employee | - |

---

### Job Request Endpoints

| Method | Endpoint | Description | Auth | Credits |
|--------|---------|-------------|------|---------|
| POST | \`/jobs\` | Create job request | Employer | -5 |
| GET | \`/jobs\` | List employer's jobs | Employer | - |
| GET | \`/jobs/:id\` | Get job details | Any | - |
| PUT | \`/jobs/:id\` | Update job request | Employer (owner) | - |
| DELETE | \`/jobs/:id\` | Cancel job request | Employer (owner) | +5 refund* |
| GET | \`/jobs/feed\` | Browse available jobs (employee) | Employee | - |

> *Refund only if no applications have been accepted

---

### Search Endpoints

| Method | Endpoint | Description | Auth | Credits |
|--------|---------|-------------|------|---------|
| GET | \`/search/employees\` | Search employees by filters | Employer | 0 (plan-limited) |

**Query params:** \`skills\`, \`location\`, \`available_date\`, \`page\`, \`limit\`

---

### Application Endpoints

| Method | Endpoint | Description | Auth | Credits |
|--------|---------|-------------|------|---------|
| POST | \`/jobs/:id/apply\` | Apply to a job | Employee | - |
| GET | \`/jobs/:id/applications\` | List applications for a job | Employer (owner) | - |
| PUT | \`/applications/:id/accept\` | Accept application | Employer | -1 |
| PUT | \`/applications/:id/reject\` | Reject application | Employer | - |
| DELETE | \`/applications/:id\` | Withdraw application | Employee (owner) | - |
| GET | \`/employee/applications\` | List my applications | Employee | - |

---

### Shift & Check-in Endpoints

| Method | Endpoint | Description | Auth | Credits |
|--------|---------|-------------|------|---------|
| GET | \`/shifts\` | List my shifts | Employee | - |
| POST | \`/shifts/:id/checkin\` | Check in with GPS | Employee | - |
| POST | \`/shifts/:id/checkout\` | Check out with GPS | Employee | - |
| GET | \`/employer/shifts\` | List shifts for employer's jobs | Employer | - |

**Check-in/out body:** \`{ lat: number, lng: number }\`

---

### Replacement Endpoints

| Method | Endpoint | Description | Auth | Credits |
|--------|---------|-------------|------|---------|
| POST | \`/shifts/:id/replace\` | Request replacement | Employer or Employee | - |
| GET | \`/replacements\` | List replacement requests | Employer | - |

---

### Subscription & Credits Endpoints

| Method | Endpoint | Description | Auth | Credits |
|--------|---------|-------------|------|---------|
| GET | \`/subscription\` | Get current subscription | Employer | - |
| POST | \`/subscription/upgrade\` | Upgrade plan | Employer | - |
| GET | \`/credits\` | Get credit balance | Employer | - |
| POST | \`/credits/topup\` | Purchase additional credits | Employer | +N |
| GET | \`/credits/transactions\` | Credit transaction history | Employer | - |

---

### Notification Endpoints

| Method | Endpoint | Description | Auth | Credits |
|--------|---------|-------------|------|---------|
| GET | \`/notifications\` | List notifications (paginated) | Any | - |
| PUT | \`/notifications/:id/read\` | Mark as read | Any | - |
| PUT | \`/notifications/read-all\` | Mark all as read | Any | - |

---

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | \`/admin/users\` | List all users (paginated) | Admin |
| PUT | \`/admin/users/:id\` | Update user (activate/deactivate) | Admin |
| PUT | \`/admin/users/:id/plan\` | Override user plan | Admin |
| GET | \`/admin/stats\` | Platform statistics | Admin |
| GET | \`/admin/plan-config\` | Get plan configurations | Admin |
| PUT | \`/admin/plan-config/:plan\` | Update plan configuration | Admin |

---

### Authorization Rules Summary

\`\`\`
Middleware Chain:
  1. authMiddleware      → Verify JWT, attach user to req
  2. roleMiddleware(role) → Check user.role matches required role
  3. planMiddleware       → Check employer plan limits (for gated actions)
  4. creditMiddleware(cost) → Check & deduct credits (for credit-consuming actions)
\`\`\`

| Rule | Implementation |
|------|---------------|
| JWT expired | 401 + client uses refresh token |
| Wrong role | 403 Forbidden |
| Plan limit exceeded | 402 + \`{ error: "plan_limit", upgrade: true }\` |
| Insufficient credits | 402 + \`{ error: "insufficient_credits", balance: N, required: M }\` |
| Resource ownership | Check \`resource.employerProfileId === req.user.profileId\` |
`,
  },
  {
    id: "cloud-tasks",
    title: "Cloud Tasks Design",
    icon: "cloud",
    content: `## Time-Based Tasks — Google Cloud

### Architecture Overview

\`\`\`
+-------------------+     +-----------------------+     +------------------+
| Cloud Scheduler   |---->| Cloud Functions (v2)  |---->| PostgreSQL (DB)  |
| (cron triggers)   |     | (Node.js / TypeScript)|     | (via Prisma)     |
+-------------------+     +-----------------------+     +------------------+
                                    |
                                    v
                          +-------------------+
                          | Push Notifications|
                          | (FCM / In-App)    |
                          +-------------------+
\`\`\`

---

### Task 1: Subscription Expiry Check

| Property | Value |
|----------|-------|
| **Trigger** | Cloud Scheduler |
| **Schedule** | \`0 0 * * *\` (daily at midnight UTC) |
| **Function** | \`checkExpiredSubscriptions\` |
| **Runtime** | Node.js 20 (TypeScript) |
| **Timeout** | 120s |
| **Memory** | 256 MB |

**Logic:**

\`\`\`typescript
async function checkExpiredSubscriptions() {
  // 1. Query expired subscriptions
  const expired = await prisma.subscription.findMany({
    where: {
      expiresAt: { lt: new Date() },
      isActive: true,
      plan: { not: 'FREE' }
    },
    include: { employerProfile: true }
  });

  for (const sub of expired) {
    await prisma.$transaction([
      // 2. Downgrade to FREE
      prisma.subscription.update({
        where: { id: sub.id },
        data: { plan: 'FREE', isActive: true }
      }),
      // 3. Reset credits to Free allocation
      prisma.creditBalance.update({
        where: { employerProfileId: sub.employerProfileId },
        data: { balance: 3, lastRefreshedAt: new Date() }
      }),
      // 4. Pause excess active jobs
      prisma.jobRequest.updateMany({
        where: {
          employerProfileId: sub.employerProfileId,
          status: 'OPEN',
          // Keep only the first 1 (Free limit)
        },
        data: { status: 'PAUSED' }
      }),
      // 5. Create notification
      prisma.notification.create({
        data: {
          userId: sub.employerProfile.userId,
          type: 'PLAN_EXPIRED',
          title: 'Subscription Expired',
          message: 'Your plan has been downgraded to Free.'
        }
      })
    ]);
  }
}
\`\`\`

---

### Task 2: Absence Detection

| Property | Value |
|----------|-------|
| **Trigger** | Cloud Scheduler |
| **Schedule** | \`*/5 * * * *\` (every 5 minutes) |
| **Function** | \`detectAbsences\` |
| **Runtime** | Node.js 20 (TypeScript) |
| **Timeout** | 60s |
| **Memory** | 256 MB |

**Logic:**

\`\`\`typescript
async function detectAbsences() {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  // Find shifts that started > 15 min ago with no check-in
  const absentShifts = await prisma.shiftAssignment.findMany({
    where: {
      status: 'ASSIGNED',
      checkInTime: null,
      jobRequest: {
        shiftDate: { equals: today() },
        startTime: { lte: fifteenMinAgo }
      }
    },
    include: {
      jobRequest: { include: { employerProfile: true } },
      employeeProfile: { include: { user: true } }
    }
  });

  for (const shift of absentShifts) {
    await prisma.$transaction([
      // 1. Mark as ABSENT
      prisma.shiftAssignment.update({
        where: { id: shift.id },
        data: { status: 'ABSENT' }
      }),
      // 2. Notify employer
      prisma.notification.create({
        data: {
          userId: shift.jobRequest.employerProfile.userId,
          type: 'ABSENCE_ALERT',
          title: 'Employee No-Show',
          message: \`\${shift.employeeProfile.fullName} did not check in.\`
        }
      }),
      // 3. Notify employee
      prisma.notification.create({
        data: {
          userId: shift.employeeProfile.user.id,
          type: 'ABSENCE_ALERT',
          title: 'Missed Check-in',
          message: 'You were marked absent for your shift.'
        }
      })
    ]);
  }
}
\`\`\`

---

### Infrastructure Setup (Terraform / gcloud)

\`\`\`bash
# Deploy Cloud Functions
gcloud functions deploy checkExpiredSubscriptions \\
  --gen2 \\
  --runtime=nodejs20 \\
  --trigger-http \\
  --region=us-central1 \\
  --memory=256MB \\
  --timeout=120s

gcloud functions deploy detectAbsences \\
  --gen2 \\
  --runtime=nodejs20 \\
  --trigger-http \\
  --region=us-central1 \\
  --memory=256MB \\
  --timeout=60s

# Create Cloud Scheduler Jobs
gcloud scheduler jobs create http check-subscriptions \\
  --schedule="0 0 * * *" \\
  --uri="https://REGION-PROJECT.cloudfunctions.net/checkExpiredSubscriptions" \\
  --http-method=POST \\
  --oidc-service-account-email=scheduler@PROJECT.iam.gserviceaccount.com

gcloud scheduler jobs create http detect-absences \\
  --schedule="*/5 * * * *" \\
  --uri="https://REGION-PROJECT.cloudfunctions.net/detectAbsences" \\
  --http-method=POST \\
  --oidc-service-account-email=scheduler@PROJECT.iam.gserviceaccount.com
\`\`\`

---

### Security Considerations

| Concern | Solution |
|---------|---------|
| Unauthorized trigger | OIDC authentication on Cloud Functions |
| DB connection pooling | Use Prisma connection pooling or PgBouncer |
| Idempotency | Check current status before updating (avoid re-processing) |
| Monitoring | Cloud Logging + alerting on function errors |
| Retry policy | Cloud Scheduler retry config (max 3 attempts, exponential backoff) |
`,
  },
  {
    id: "delivery",
    title: "Delivery Plan",
    icon: "calendar",
    content: `## Delivery Plan

### Strategy: WEB + API First, then MOBILE

The delivery strategy prioritizes building the backend API and employer web app first, since:
- API is the shared foundation for both web and mobile
- Employer web app can be tested independently
- Employee mobile can consume stable APIs

---

### Phase 1: Foundation (Weeks 1–2)

| Sprint | Deliverables | Team |
|--------|-------------|------|
| 1.1 | Project setup: monorepo, CI/CD, DB schema, Prisma models | Backend |
| 1.1 | Auth system: register, login, JWT, refresh, middleware chain | Backend |
| 1.1 | Design system setup: Ant Design theme, shared components | Frontend Web |
| 1.2 | User management API (CRUD, roles) | Backend |
| 1.2 | Employer & Employee profile APIs | Backend |
| 1.2 | Auth pages (login, register, role selection) | Frontend Web |
| 1.2 | Employer profile page | Frontend Web |

**Milestone:** Users can register, login, manage profiles.

---

### Phase 2: Core Job Flow (Weeks 3–4)

| Sprint | Deliverables | Team |
|--------|-------------|------|
| 2.1 | Job Request CRUD API | Backend |
| 2.1 | Application API (apply, accept, reject) | Backend |
| 2.1 | Plan & credit system (middleware + APIs) | Backend |
| 2.1 | Job posting form + list (web) | Frontend Web |
| 2.2 | Employee search API | Backend |
| 2.2 | Application management UI (web) | Frontend Web |
| 2.2 | Employee search page (web) | Frontend Web |
| 2.2 | Credit balance & top-up UI | Frontend Web |

**Milestone:** Employers can post jobs, search employees, manage applications, use credits.

---

### Phase 3: Shift Operations (Weeks 5–6)

| Sprint | Deliverables | Team |
|--------|-------------|------|
| 3.1 | Shift assignment API | Backend |
| 3.1 | Check-in/out API (GPS capture) | Backend |
| 3.1 | Replacement request API | Backend |
| 3.1 | Shift management view (web, employer side) | Frontend Web |
| 3.2 | Notification system (in-app API) | Backend |
| 3.2 | Cloud Functions: absence detection, subscription expiry | Backend |
| 3.2 | Admin dashboard (user management, stats, plan config) | Frontend Web |
| 3.2 | Notification center UI (web) | Frontend Web |

**Milestone:** Full employer web experience complete. Backend API stable.

---

### Phase 4: Mobile App (Weeks 7–9)

| Sprint | Deliverables | Team |
|--------|-------------|------|
| 4.1 | React Native project setup + navigation | Mobile |
| 4.1 | Auth screens (login, register) | Mobile |
| 4.1 | Employee profile screen | Mobile |
| 4.2 | Job feed + search + apply flow | Mobile |
| 4.2 | My applications list | Mobile |
| 4.3 | My shifts + check-in/out (GPS) | Mobile |
| 4.3 | Replacement request screen | Mobile |
| 4.3 | Push notifications (FCM) | Mobile + Backend |

**Milestone:** Full employee mobile experience complete.

---

### Phase 5: QA & Launch (Weeks 10–11)

| Sprint | Deliverables | Team |
|--------|-------------|------|
| 5.1 | Integration testing (web + API) | QA |
| 5.1 | Mobile testing (real devices) | QA |
| 5.1 | Performance testing & optimization | Backend |
| 5.2 | Bug fixes & polish | All |
| 5.2 | Staging deployment + UAT | All |
| 5.2 | Production deployment | DevOps |

**Milestone:** MVP launch-ready.

---

### Timeline Summary

\`\`\`
Week:  1    2    3    4    5    6    7    8    9    10   11
       |----Foundation----|----Core Jobs----|---Shifts---|
       |                                    |---Mobile---------|
       |                                                 |--QA--|
\`\`\`

---

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| API scope creep | Strict P0 scope, all P1 deferred |
| Mobile delays | API-first ensures mobile has stable endpoints |
| Credit system bugs | Transactional operations, comprehensive tests |
| Cloud task failures | Idempotent functions, retry policies, monitoring |
| Plan upgrade complexity | Start with manual plan changes; integrate payment gateway in P1 |

---

### Team Composition (Recommended)

| Role | Count | Focus |
|------|-------|-------|
| Backend Engineer | 2 | API, DB, business logic, cloud tasks |
| Frontend Engineer (Web) | 1–2 | Employer web app (React + Ant Design) |
| Mobile Engineer | 1–2 | Employee app (React Native) |
| QA Engineer | 1 | Cross-platform testing |
| Product / PM | 1 | Scope, priorities, stakeholder comms |
| Designer | 1 (shared) | UI/UX for web + mobile |
`,
  },
];

export const fullMarkdown = `# ${BLUEPRINT_TITLE}
**${BLUEPRINT_SUBTITLE}**

*Document Version: 1.0 | Date: February 2026*

---

${sections.map((s) => s.content).join("\n---\n\n")}

---

*End of MVP Blueprint*
`;
