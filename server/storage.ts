import { eq, and, desc, sql, ilike, or, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  employerProfiles,
  employeeProfiles,
  subscriptions,
  creditBalances,
  creditTransactions,
  jobRequests,
  applications,
  shiftAssignments,
  replacementRequests,
  notifications,
  planConfigs,
  type User,
  type InsertUser,
  type EmployerProfile,
  type EmployeeProfile,
  type Subscription,
  type CreditBalance,
  type CreditTransaction,
  type JobRequest,
  type Application,
  type ShiftAssignment,
  type ReplacementRequest,
  type Notification,
  type PlanConfig,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, isActive: boolean): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;

  getEmployerProfileByUserId(userId: string): Promise<EmployerProfile | undefined>;
  createEmployerProfile(data: Partial<EmployerProfile> & { userId: string; companyName: string }): Promise<EmployerProfile>;
  updateEmployerProfile(id: string, data: Partial<EmployerProfile>): Promise<EmployerProfile | undefined>;

  getEmployeeProfileByUserId(userId: string): Promise<EmployeeProfile | undefined>;
  getEmployeeProfile(id: string): Promise<EmployeeProfile | undefined>;
  createEmployeeProfile(data: Partial<EmployeeProfile> & { userId: string; fullName: string }): Promise<EmployeeProfile>;
  updateEmployeeProfile(id: string, data: Partial<EmployeeProfile>): Promise<EmployeeProfile | undefined>;
  searchEmployees(filters: { skills?: string[]; location?: string; page?: number; limit?: number }): Promise<{ employees: EmployeeProfile[]; total: number }>;

  getSubscription(employerProfileId: string): Promise<Subscription | undefined>;
  createSubscription(data: Partial<Subscription> & { employerProfileId: string }): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined>;

  getCreditBalance(employerProfileId: string): Promise<CreditBalance | undefined>;
  createCreditBalance(data: Partial<CreditBalance> & { employerProfileId: string }): Promise<CreditBalance>;
  updateCreditBalance(employerProfileId: string, balance: number): Promise<CreditBalance | undefined>;

  getCreditTransactions(employerProfileId: string): Promise<CreditTransaction[]>;
  createCreditTransaction(data: { employerProfileId: string; amount: number; type: string; referenceId?: string }): Promise<CreditTransaction>;

  getJobRequest(id: string): Promise<JobRequest | undefined>;
  getJobsByEmployer(employerProfileId: string): Promise<JobRequest[]>;
  getJobFeed(filters?: { location?: string; skills?: string[]; page?: number; limit?: number }): Promise<{ jobs: JobRequest[]; total: number }>;
  createJobRequest(data: Partial<JobRequest> & { employerProfileId: string; title: string; location: string; shiftDate: string; startTime: string; endTime: string }): Promise<JobRequest>;
  updateJobRequest(id: string, data: Partial<JobRequest>): Promise<JobRequest | undefined>;

  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsByJob(jobRequestId: string): Promise<(Application & { employee?: EmployeeProfile })[]>;
  getApplicationsByEmployee(employeeProfileId: string): Promise<(Application & { job?: JobRequest })[]>;
  createApplication(data: { jobRequestId: string; employeeProfileId: string }): Promise<Application>;
  updateApplication(id: string, data: Partial<Application>): Promise<Application | undefined>;

  getShiftAssignment(id: string): Promise<ShiftAssignment | undefined>;
  getShiftsByEmployee(employeeProfileId: string): Promise<(ShiftAssignment & { job?: JobRequest })[]>;
  getShiftsByEmployer(employerProfileId: string): Promise<(ShiftAssignment & { job?: JobRequest; employee?: EmployeeProfile })[]>;
  createShiftAssignment(data: { jobRequestId: string; employeeProfileId: string; applicationId: string }): Promise<ShiftAssignment>;
  updateShiftAssignment(id: string, data: Partial<ShiftAssignment>): Promise<ShiftAssignment | undefined>;

  getReplacementsByEmployer(employerProfileId: string): Promise<ReplacementRequest[]>;
  createReplacementRequest(data: { shiftAssignmentId: string; initiatedBy: string; reason?: string }): Promise<ReplacementRequest>;
  updateReplacementRequest(id: string, data: Partial<ReplacementRequest>): Promise<ReplacementRequest | undefined>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: { userId: string; type: string; title: string; message: string }): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  getPlanConfig(plan: string): Promise<PlanConfig | undefined>;
  getAllPlanConfigs(): Promise<PlanConfig[]>;
  updatePlanConfig(plan: string, data: Partial<PlanConfig>): Promise<PlanConfig | undefined>;

  getStats(): Promise<{ totalUsers: number; totalEmployers: number; totalEmployees: number; totalJobs: number; activeJobs: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ isActive }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async getEmployerProfileByUserId(userId: string): Promise<EmployerProfile | undefined> {
    const [profile] = await db.select().from(employerProfiles).where(eq(employerProfiles.userId, userId));
    return profile;
  }

  async createEmployerProfile(data: Partial<EmployerProfile> & { userId: string; companyName: string }): Promise<EmployerProfile> {
    const [profile] = await db.insert(employerProfiles).values(data).returning();
    return profile;
  }

  async updateEmployerProfile(id: string, data: Partial<EmployerProfile>): Promise<EmployerProfile | undefined> {
    const [profile] = await db.update(employerProfiles).set(data).where(eq(employerProfiles.id, id)).returning();
    return profile;
  }

  async getEmployeeProfileByUserId(userId: string): Promise<EmployeeProfile | undefined> {
    const [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, userId));
    return profile;
  }

  async getEmployeeProfile(id: string): Promise<EmployeeProfile | undefined> {
    const [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.id, id));
    return profile;
  }

  async createEmployeeProfile(data: Partial<EmployeeProfile> & { userId: string; fullName: string }): Promise<EmployeeProfile> {
    const [profile] = await db.insert(employeeProfiles).values(data).returning();
    return profile;
  }

  async updateEmployeeProfile(id: string, data: Partial<EmployeeProfile>): Promise<EmployeeProfile | undefined> {
    const [profile] = await db.update(employeeProfiles).set(data).where(eq(employeeProfiles.id, id)).returning();
    return profile;
  }

  async searchEmployees(filters: { skills?: string[]; location?: string; page?: number; limit?: number }): Promise<{ employees: EmployeeProfile[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters.location) {
      conditions.push(ilike(employeeProfiles.location, `%${filters.location}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(employeeProfiles).where(whereClause);
    const employees = await db.select().from(employeeProfiles).where(whereClause).limit(limit).offset(offset);

    return { employees, total: Number(countResult.count) };
  }

  async getSubscription(employerProfileId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.employerProfileId, employerProfileId));
    return sub;
  }

  async createSubscription(data: Partial<Subscription> & { employerProfileId: string }): Promise<Subscription> {
    const [sub] = await db.insert(subscriptions).values(data).returning();
    return sub;
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [sub] = await db.update(subscriptions).set(data).where(eq(subscriptions.id, id)).returning();
    return sub;
  }

  async getCreditBalance(employerProfileId: string): Promise<CreditBalance | undefined> {
    const [bal] = await db.select().from(creditBalances).where(eq(creditBalances.employerProfileId, employerProfileId));
    return bal;
  }

  async createCreditBalance(data: Partial<CreditBalance> & { employerProfileId: string }): Promise<CreditBalance> {
    const [bal] = await db.insert(creditBalances).values(data).returning();
    return bal;
  }

  async updateCreditBalance(employerProfileId: string, balance: number): Promise<CreditBalance | undefined> {
    const [bal] = await db.update(creditBalances).set({ balance }).where(eq(creditBalances.employerProfileId, employerProfileId)).returning();
    return bal;
  }

  async getCreditTransactions(employerProfileId: string): Promise<CreditTransaction[]> {
    return db.select().from(creditTransactions).where(eq(creditTransactions.employerProfileId, employerProfileId)).orderBy(desc(creditTransactions.createdAt));
  }

  async createCreditTransaction(data: { employerProfileId: string; amount: number; type: string; referenceId?: string }): Promise<CreditTransaction> {
    const [txn] = await db.insert(creditTransactions).values(data as any).returning();
    return txn;
  }

  async getJobRequest(id: string): Promise<JobRequest | undefined> {
    const [job] = await db.select().from(jobRequests).where(eq(jobRequests.id, id));
    return job;
  }

  async getJobsByEmployer(employerProfileId: string): Promise<JobRequest[]> {
    return db.select().from(jobRequests).where(eq(jobRequests.employerProfileId, employerProfileId)).orderBy(desc(jobRequests.createdAt));
  }

  async getJobFeed(filters?: { location?: string; skills?: string[]; page?: number; limit?: number }): Promise<{ jobs: JobRequest[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(jobRequests.status, "OPEN")];
    if (filters?.location) {
      conditions.push(ilike(jobRequests.location, `%${filters.location}%`));
    }

    const whereClause = and(...conditions);
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(jobRequests).where(whereClause);
    const jobs = await db.select().from(jobRequests).where(whereClause).orderBy(desc(jobRequests.createdAt)).limit(limit).offset(offset);

    return { jobs, total: Number(countResult.count) };
  }

  async createJobRequest(data: any): Promise<JobRequest> {
    const [job] = await db.insert(jobRequests).values(data).returning();
    return job;
  }

  async updateJobRequest(id: string, data: Partial<JobRequest>): Promise<JobRequest | undefined> {
    const [job] = await db.update(jobRequests).set(data).where(eq(jobRequests.id, id)).returning();
    return job;
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app;
  }

  async getApplicationsByJob(jobRequestId: string): Promise<(Application & { employee?: EmployeeProfile })[]> {
    const apps = await db.select().from(applications).where(eq(applications.jobRequestId, jobRequestId)).orderBy(desc(applications.appliedAt));
    const result = [];
    for (const app of apps) {
      const [employee] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.id, app.employeeProfileId));
      result.push({ ...app, employee });
    }
    return result;
  }

  async getApplicationsByEmployee(employeeProfileId: string): Promise<(Application & { job?: JobRequest })[]> {
    const apps = await db.select().from(applications).where(eq(applications.employeeProfileId, employeeProfileId)).orderBy(desc(applications.appliedAt));
    const result = [];
    for (const app of apps) {
      const [job] = await db.select().from(jobRequests).where(eq(jobRequests.id, app.jobRequestId));
      result.push({ ...app, job });
    }
    return result;
  }

  async createApplication(data: { jobRequestId: string; employeeProfileId: string }): Promise<Application> {
    const [app] = await db.insert(applications).values(data).returning();
    return app;
  }

  async updateApplication(id: string, data: Partial<Application>): Promise<Application | undefined> {
    const [app] = await db.update(applications).set(data).where(eq(applications.id, id)).returning();
    return app;
  }

  async getShiftAssignment(id: string): Promise<ShiftAssignment | undefined> {
    const [shift] = await db.select().from(shiftAssignments).where(eq(shiftAssignments.id, id));
    return shift;
  }

  async getShiftsByEmployee(employeeProfileId: string): Promise<(ShiftAssignment & { job?: JobRequest })[]> {
    const shifts = await db.select().from(shiftAssignments).where(eq(shiftAssignments.employeeProfileId, employeeProfileId));
    const result = [];
    for (const shift of shifts) {
      const [job] = await db.select().from(jobRequests).where(eq(jobRequests.id, shift.jobRequestId));
      result.push({ ...shift, job });
    }
    return result;
  }

  async getShiftsByEmployer(employerProfileId: string): Promise<(ShiftAssignment & { job?: JobRequest; employee?: EmployeeProfile })[]> {
    const jobs = await db.select().from(jobRequests).where(eq(jobRequests.employerProfileId, employerProfileId));
    const jobIds = jobs.map(j => j.id);
    if (jobIds.length === 0) return [];

    const shifts = await db.select().from(shiftAssignments).where(inArray(shiftAssignments.jobRequestId, jobIds));
    const result = [];
    for (const shift of shifts) {
      const job = jobs.find(j => j.id === shift.jobRequestId);
      const [employee] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.id, shift.employeeProfileId));
      result.push({ ...shift, job, employee });
    }
    return result;
  }

  async createShiftAssignment(data: { jobRequestId: string; employeeProfileId: string; applicationId: string }): Promise<ShiftAssignment> {
    const [shift] = await db.insert(shiftAssignments).values(data).returning();
    return shift;
  }

  async updateShiftAssignment(id: string, data: Partial<ShiftAssignment>): Promise<ShiftAssignment | undefined> {
    const [shift] = await db.update(shiftAssignments).set(data).where(eq(shiftAssignments.id, id)).returning();
    return shift;
  }

  async getReplacementsByEmployer(employerProfileId: string): Promise<ReplacementRequest[]> {
    const jobs = await db.select().from(jobRequests).where(eq(jobRequests.employerProfileId, employerProfileId));
    const jobIds = jobs.map(j => j.id);
    if (jobIds.length === 0) return [];

    const shifts = await db.select().from(shiftAssignments).where(inArray(shiftAssignments.jobRequestId, jobIds));
    const shiftIds = shifts.map(s => s.id);
    if (shiftIds.length === 0) return [];

    return db.select().from(replacementRequests).where(inArray(replacementRequests.shiftAssignmentId, shiftIds)).orderBy(desc(replacementRequests.createdAt));
  }

  async createReplacementRequest(data: { shiftAssignmentId: string; initiatedBy: string; reason?: string }): Promise<ReplacementRequest> {
    const [req] = await db.insert(replacementRequests).values(data as any).returning();
    return req;
  }

  async updateReplacementRequest(id: string, data: Partial<ReplacementRequest>): Promise<ReplacementRequest | undefined> {
    const [req] = await db.update(replacementRequests).set(data).where(eq(replacementRequests.id, id)).returning();
    return req;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  }

  async createNotification(data: { userId: string; type: string; title: string; message: string }): Promise<Notification> {
    const [notif] = await db.insert(notifications).values(data as any).returning();
    return notif;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getPlanConfig(plan: string): Promise<PlanConfig | undefined> {
    const [config] = await db.select().from(planConfigs).where(eq(planConfigs.plan, plan as any));
    return config;
  }

  async getAllPlanConfigs(): Promise<PlanConfig[]> {
    return db.select().from(planConfigs);
  }

  async updatePlanConfig(plan: string, data: Partial<PlanConfig>): Promise<PlanConfig | undefined> {
    const [config] = await db.update(planConfigs).set(data).where(eq(planConfigs.plan, plan as any)).returning();
    return config;
  }

  async getStats(): Promise<{ totalUsers: number; totalEmployers: number; totalEmployees: number; totalJobs: number; activeJobs: number }> {
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalEmployers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "EMPLOYER"));
    const [totalEmployees] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "EMPLOYEE"));
    const [totalJobs] = await db.select({ count: sql<number>`count(*)` }).from(jobRequests);
    const [activeJobs] = await db.select({ count: sql<number>`count(*)` }).from(jobRequests).where(eq(jobRequests.status, "OPEN"));

    return {
      totalUsers: Number(totalUsers.count),
      totalEmployers: Number(totalEmployers.count),
      totalEmployees: Number(totalEmployees.count),
      totalJobs: Number(totalJobs.count),
      activeJobs: Number(activeJobs.count),
    };
  }
}

export const storage = new DatabaseStorage();
