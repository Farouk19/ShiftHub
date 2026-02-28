# ShiftHub - SaaS Shift-Based Jobs Marketplace

## Overview
ShiftHub connects Employers (web) with Employees (mobile) for on-demand shift work. Monetization via Free/Basic/Pro subscription plans + credit top-ups. Currently deployed: Employer Web Portal + Full REST API.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui + wouter (routing) + TanStack Query
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (Bearer tokens) with bcryptjs password hashing

## Database Tables
- `users` - Base auth entity (email, passwordHash, role: ADMIN/EMPLOYER/EMPLOYEE)
- `employer_profiles` - Company details (companyName, description, logoUrl, location, phone)
- `employee_profiles` - Worker details (fullName, skills[], availability, location, phone)
- `subscriptions` - Plan tier (FREE/BASIC/PRO) with start/expiry dates
- `credit_balances` - Current credit ledger per employer
- `credit_transactions` - Credit debit/credit log (MONTHLY_REFRESH, TOP_UP, JOB_POST, ACCEPT_APPLICATION, REFUND)
- `job_requests` - Shift postings (title, location, date, time, positions, skills, payRate, status)
- `applications` - Employee applications to jobs (PENDING/ACCEPTED/REJECTED/WITHDRAWN)
- `shift_assignments` - Accepted worker assignments with check-in/out GPS timestamps
- `replacement_requests` - Replacement workflow tracking
- `notifications` - In-app notifications
- `plan_configs` - Admin-configurable plan limits

## Key Files
- `shared/schema.ts` - Complete Drizzle schema + Zod validation schemas + TypeScript types
- `server/db.ts` - Database connection (pg Pool + Drizzle)
- `server/auth.ts` - JWT auth, password hashing, middleware (authMiddleware, requireRole)
- `server/storage.ts` - DatabaseStorage class with all CRUD operations
- `server/routes.ts` - All API endpoints (auth, profiles, jobs, applications, shifts, credits, admin)
- `client/src/lib/auth.tsx` - AuthProvider context + useAuth hook (JWT state management)
- `client/src/App.tsx` - Main app with routing (login/register/dashboard/jobs/etc.)
- `client/src/components/app-sidebar.tsx` - Sidebar navigation (employer vs admin views)
- `client/src/pages/dashboard.tsx` - Employer dashboard with stats
- `client/src/pages/jobs.tsx` - Job listing page
- `client/src/pages/job-form.tsx` - Create job form
- `client/src/pages/job-detail.tsx` - Job detail + application management
- `client/src/pages/employees.tsx` - Employee search
- `client/src/pages/credits.tsx` - Credits + subscription management
- `client/src/pages/notifications.tsx` - Notifications
- `client/src/pages/settings.tsx` - Profile settings
- `client/src/pages/admin/dashboard.tsx` - Admin stats
- `client/src/pages/admin/users.tsx` - User management

## Credit System
- Job Posting: 5 credits (refunded if cancelled before any accepts)
- Accept Application: 1 credit per accept
- Free plan: 3 credits/month, 1 active job, 3 positions/job
- Basic plan: 20 credits/month, 5 active jobs, 10 positions/job
- Pro plan: Unlimited credits, unlimited jobs, 50 positions/job

## Admin Features
- Admin can create new users (any role: ADMIN/EMPLOYER/EMPLOYEE) from admin panel
- Admin can change existing users' roles (with automatic profile/subscription provisioning)
- Admin can enable/disable users
- Admin cannot change their own role (safety guard)
- Role change to EMPLOYER auto-creates employer profile + FREE subscription + 3 credits
- Role change to EMPLOYEE auto-creates employee profile

## Test Accounts
- Employer: admin@shifthub.com / admin123
- Admin: superadmin@shifthub.com / admin123
- Employee: employee@test.com / admin123

## Design Tokens
- Font: Inter (sans), JetBrains Mono (mono)
- Theme: Blue primary (#3B82F6 range), class-based dark mode with localStorage
