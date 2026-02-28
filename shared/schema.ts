import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  decimal,
  timestamp,
  date,
  time,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "EMPLOYER", "EMPLOYEE"]);
export const planTierEnum = pgEnum("plan_tier", ["FREE", "BASIC", "PRO"]);
export const jobStatusEnum = pgEnum("job_status", ["OPEN", "FILLED", "CANCELLED", "PAUSED", "COMPLETED"]);
export const applicationStatusEnum = pgEnum("application_status", ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"]);
export const shiftStatusEnum = pgEnum("shift_status", ["ASSIGNED", "CHECKED_IN", "COMPLETED", "ABSENT", "REPLACED"]);
export const replacementStatusEnum = pgEnum("replacement_status", ["PENDING", "APPROVED", "RESOLVED"]);
export const replacementInitiatorEnum = pgEnum("replacement_initiator", ["EMPLOYER", "EMPLOYEE"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "APPLICATION_RECEIVED",
  "APPLICATION_ACCEPTED",
  "APPLICATION_REJECTED",
  "SHIFT_REMINDER",
  "ABSENCE_ALERT",
  "REPLACEMENT",
  "PLAN_EXPIRED",
  "CREDIT_LOW",
]);
export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "MONTHLY_REFRESH",
  "TOP_UP",
  "JOB_POST",
  "ACCEPT_APPLICATION",
  "REFUND",
]);

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const employerProfiles = pgTable("employer_profiles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  location: text("location"),
  phone: text("phone"),
});

export const employeeProfiles = pgTable("employee_profiles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  skills: text("skills").array(),
  availability: jsonb("availability"),
  location: text("location"),
  photoUrl: text("photo_url"),
  phone: text("phone"),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employerProfileId: varchar("employer_profile_id", { length: 36 }).notNull().references(() => employerProfiles.id),
  plan: planTierEnum("plan").notNull().default("FREE"),
  startsAt: timestamp("starts_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
});

export const creditBalances = pgTable("credit_balances", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employerProfileId: varchar("employer_profile_id", { length: 36 }).notNull().unique().references(() => employerProfiles.id),
  balance: integer("balance").notNull().default(3),
  lastRefreshedAt: timestamp("last_refreshed_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employerProfileId: varchar("employer_profile_id", { length: 36 }).notNull().references(() => employerProfiles.id),
  amount: integer("amount").notNull(),
  type: creditTransactionTypeEnum("type").notNull(),
  referenceId: varchar("reference_id", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jobRequests = pgTable("job_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employerProfileId: varchar("employer_profile_id", { length: 36 }).notNull().references(() => employerProfiles.id),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  shiftDate: date("shift_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  positionsQty: integer("positions_qty").notNull().default(1),
  acceptedCount: integer("accepted_count").notNull().default(0),
  requiredSkills: text("required_skills").array(),
  payRate: decimal("pay_rate", { precision: 10, scale: 2 }),
  status: jobStatusEnum("status").notNull().default("OPEN"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  jobRequestId: varchar("job_request_id", { length: 36 }).notNull().references(() => jobRequests.id),
  employeeProfileId: varchar("employee_profile_id", { length: 36 }).notNull().references(() => employeeProfiles.id),
  status: applicationStatusEnum("status").notNull().default("PENDING"),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
});

export const shiftAssignments = pgTable("shift_assignments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  jobRequestId: varchar("job_request_id", { length: 36 }).notNull().references(() => jobRequests.id),
  employeeProfileId: varchar("employee_profile_id", { length: 36 }).notNull().references(() => employeeProfiles.id),
  applicationId: varchar("application_id", { length: 36 }).notNull().references(() => applications.id),
  checkInTime: timestamp("check_in_time"),
  checkInLat: decimal("check_in_lat", { precision: 10, scale: 7 }),
  checkInLng: decimal("check_in_lng", { precision: 10, scale: 7 }),
  checkOutTime: timestamp("check_out_time"),
  checkOutLat: decimal("check_out_lat", { precision: 10, scale: 7 }),
  checkOutLng: decimal("check_out_lng", { precision: 10, scale: 7 }),
  status: shiftStatusEnum("status").notNull().default("ASSIGNED"),
});

export const replacementRequests = pgTable("replacement_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  shiftAssignmentId: varchar("shift_assignment_id", { length: 36 }).notNull().references(() => shiftAssignments.id),
  initiatedBy: replacementInitiatorEnum("initiated_by").notNull(),
  reason: text("reason"),
  status: replacementStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const planConfigs = pgTable("plan_configs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  plan: planTierEnum("plan").notNull().unique(),
  maxActiveJobs: integer("max_active_jobs").notNull(),
  monthlyCredits: integer("monthly_credits").notNull(),
  maxSearchResults: integer("max_search_results").notNull(),
  maxPositionsPerJob: integer("max_positions_per_job").notNull(),
  maxAcceptsPerMonth: integer("max_accepts_per_month").notNull(),
  creditCostJobPost: integer("credit_cost_job_post").notNull().default(5),
  creditCostAccept: integer("credit_cost_accept").notNull().default(1),
  allowLogo: boolean("allow_logo").notNull().default(false),
  priorityListing: boolean("priority_listing").notNull().default(false),
  exportReports: boolean("export_reports").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
  role: true,
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["EMPLOYER", "EMPLOYEE"]),
  companyName: z.string().optional(),
  fullName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const insertEmployerProfileSchema = createInsertSchema(employerProfiles).omit({ id: true });
export const insertEmployeeProfileSchema = createInsertSchema(employeeProfiles).omit({ id: true });
export const insertJobRequestSchema = createInsertSchema(jobRequests).omit({ id: true, employerProfileId: true, acceptedCount: true, status: true, createdAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, status: true, appliedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, isRead: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type EmployerProfile = typeof employerProfiles.$inferSelect;
export type EmployeeProfile = typeof employeeProfiles.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type CreditBalance = typeof creditBalances.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type JobRequest = typeof jobRequests.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type ReplacementRequest = typeof replacementRequests.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PlanConfig = typeof planConfigs.$inferSelect;
