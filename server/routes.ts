import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, requireRole, hashPassword, comparePassword, generateToken } from "./auth";
import { registerSchema, loginSchema, insertJobRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        passwordHash,
        role: data.role,
      });

      if (data.role === "EMPLOYER") {
        const profile = await storage.createEmployerProfile({
          userId: user.id,
          companyName: data.companyName || "My Company",
        });
        await storage.createSubscription({ employerProfileId: profile.id });
        await storage.createCreditBalance({ employerProfileId: profile.id, balance: 3 });
      } else {
        await storage.createEmployeeProfile({
          userId: user.id,
          fullName: data.fullName || "Employee",
        });
      }

      const token = generateToken(user);
      return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
      return res.status(400).json({ message: err.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is disabled" });
      }
      const valid = await comparePassword(data.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = generateToken(user);
      return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
      return res.status(400).json({ message: err.message || "Login failed" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const user = await storage.getUser(req.user!.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile: any = null;
    if (user.role === "EMPLOYER") {
      profile = await storage.getEmployerProfileByUserId(user.id);
    } else if (user.role === "EMPLOYEE") {
      profile = await storage.getEmployeeProfileByUserId(user.id);
    }
    return res.json({ user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive }, profile });
  });

  app.get("/api/employer/profile", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    return res.json(profile);
  });

  app.put("/api/employer/profile", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const { companyName, description, location, phone } = req.body;
    const updated = await storage.updateEmployerProfile(profile.id, { companyName, description, location, phone });
    return res.json(updated);
  });

  app.get("/api/employee/profile", authMiddleware, requireRole("EMPLOYEE"), async (req, res) => {
    const profile = await storage.getEmployeeProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    return res.json(profile);
  });

  app.put("/api/employee/profile", authMiddleware, requireRole("EMPLOYEE"), async (req, res) => {
    const profile = await storage.getEmployeeProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const { fullName, skills, availability, location, phone } = req.body;
    const updated = await storage.updateEmployeeProfile(profile.id, { fullName, skills, availability, location, phone });
    return res.json(updated);
  });

  app.post("/api/jobs", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    try {
      const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      const sub = await storage.getSubscription(profile.id);
      const planConfig = await storage.getPlanConfig(sub?.plan || "FREE");
      const existingJobs = await storage.getJobsByEmployer(profile.id);
      const activeJobs = existingJobs.filter(j => j.status === "OPEN" || j.status === "FILLED");

      if (planConfig && activeJobs.length >= planConfig.maxActiveJobs) {
        return res.status(403).json({ message: `Your ${sub?.plan || "FREE"} plan allows a maximum of ${planConfig.maxActiveJobs} active jobs` });
      }

      const creditBal = await storage.getCreditBalance(profile.id);
      const costJobPost = planConfig?.creditCostJobPost || 5;
      if (!creditBal || creditBal.balance < costJobPost) {
        return res.status(403).json({ message: `Insufficient credits. Job posting costs ${costJobPost} credits` });
      }

      const createJobSchema = insertJobRequestSchema.extend({
        positionsQty: z.number().int().min(1).max(planConfig?.maxPositionsPerJob || 50).default(1),
        payRate: z.string().optional(),
        requiredSkills: z.array(z.string()).default([]),
      });
      const parsed = createJobSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      }
      const job = await storage.createJobRequest({
        ...parsed.data,
        employerProfileId: profile.id,
      });
      await storage.updateCreditBalance(profile.id, creditBal.balance - costJobPost);
      await storage.createCreditTransaction({
        employerProfileId: profile.id,
        amount: -costJobPost,
        type: "JOB_POST",
        referenceId: job.id,
      });

      return res.json(job);
    } catch (err: any) {
      return res.status(400).json({ message: err.message || "Failed to create job" });
    }
  });

  app.get("/api/jobs", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const jobs = await storage.getJobsByEmployer(profile.id);
    return res.json(jobs);
  });

  app.get("/api/jobs/feed", authMiddleware, async (req, res) => {
    const { location, page, limit } = req.query;
    const result = await storage.getJobFeed({
      location: location as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return res.json(result);
  });

  app.get("/api/jobs/:id", authMiddleware, async (req, res) => {
    const job = await storage.getJobRequest(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (req.user!.role === "EMPLOYER") {
      const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
      if (!profile || profile.id !== job.employerProfileId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    return res.json(job);
  });

  app.put("/api/jobs/:id", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const job = await storage.getJobRequest(req.params.id);
    if (!job || job.employerProfileId !== profile.id) {
      return res.status(404).json({ message: "Job not found" });
    }
    const sub = await storage.getSubscription(profile.id);
    const planConfig = await storage.getPlanConfig(sub?.plan || "FREE");
    const validStatuses = ["OPEN", "FILLED", "CANCELLED", "COMPLETED"] as const;
    const updateJobSchema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      location: z.string().min(1).optional(),
      shiftDate: z.string().min(1).optional(),
      startTime: z.string().min(1).optional(),
      endTime: z.string().min(1).optional(),
      positionsQty: z.number().int().min(1).max(planConfig?.maxPositionsPerJob || 50).optional(),
      requiredSkills: z.array(z.string()).optional(),
      payRate: z.string().optional(),
      status: z.enum(validStatuses).optional(),
    });
    const parsed = updateJobSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
    }
    const updates = Object.fromEntries(Object.entries(parsed.data).filter(([_, v]) => v !== undefined));
    const updated = await storage.updateJobRequest(req.params.id, updates);
    return res.json(updated);
  });

  app.delete("/api/jobs/:id", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const job = await storage.getJobRequest(req.params.id);
    if (!job || job.employerProfileId !== profile.id) {
      return res.status(404).json({ message: "Job not found" });
    }

    const updated = await storage.updateJobRequest(req.params.id, { status: "CANCELLED" });

    if (job.acceptedCount === 0) {
      const creditBal = await storage.getCreditBalance(profile.id);
      const planConfig = await storage.getPlanConfig("FREE");
      const refundAmount = planConfig?.creditCostJobPost || 5;
      if (creditBal) {
        await storage.updateCreditBalance(profile.id, creditBal.balance + refundAmount);
        await storage.createCreditTransaction({
          employerProfileId: profile.id,
          amount: refundAmount,
          type: "REFUND",
          referenceId: job.id,
        });
      }
    }

    return res.json(updated);
  });

  app.get("/api/search/employees", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const sub = await storage.getSubscription(profile.id);
    const planConfig = await storage.getPlanConfig(sub?.plan || "FREE");

    const { skills, location, page } = req.query;
    const result = await storage.searchEmployees({
      skills: skills ? (skills as string).split(",") : undefined,
      location: location as string,
      page: page ? Number(page) : 1,
      limit: planConfig?.maxSearchResults || 5,
    });

    return res.json(result);
  });

  app.post("/api/jobs/:id/apply", authMiddleware, requireRole("EMPLOYEE"), async (req, res) => {
    try {
      const profile = await storage.getEmployeeProfileByUserId(req.user!.userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      const job = await storage.getJobRequest(req.params.id);
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (job.status !== "OPEN") return res.status(400).json({ message: "Job is not open for applications" });

      const existingApps = await storage.getApplicationsByJob(job.id);
      const alreadyApplied = existingApps.find(a => a.employeeProfileId === profile.id);
      if (alreadyApplied) return res.status(400).json({ message: "Already applied to this job" });

      const application = await storage.createApplication({
        jobRequestId: job.id,
        employeeProfileId: profile.id,
      });

      return res.json(application);
    } catch (err: any) {
      return res.status(400).json({ message: err.message || "Failed to apply" });
    }
  });

  app.get("/api/jobs/:id/applications", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const job = await storage.getJobRequest(req.params.id);
    if (!job || job.employerProfileId !== profile.id) {
      return res.status(404).json({ message: "Job not found" });
    }

    const apps = await storage.getApplicationsByJob(req.params.id);
    return res.json(apps);
  });

  app.put("/api/applications/:id/accept", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    try {
      const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      const application = await storage.getApplication(req.params.id);
      if (!application) return res.status(404).json({ message: "Application not found" });

      const job = await storage.getJobRequest(application.jobRequestId);
      if (!job || job.employerProfileId !== profile.id) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (application.status !== "PENDING") {
        return res.status(400).json({ message: "Application is not pending" });
      }

      if (job.acceptedCount >= job.positionsQty) {
        return res.status(400).json({ message: "All positions are filled" });
      }

      const sub = await storage.getSubscription(profile.id);
      const planConfig = await storage.getPlanConfig(sub?.plan || "FREE");
      const costAccept = planConfig?.creditCostAccept || 1;

      const creditBal = await storage.getCreditBalance(profile.id);
      if (!creditBal || creditBal.balance < costAccept) {
        return res.status(403).json({ message: `Insufficient credits. Accepting costs ${costAccept} credit(s)` });
      }

      await storage.updateApplication(req.params.id, { status: "ACCEPTED" });
      await storage.updateJobRequest(job.id, { acceptedCount: job.acceptedCount + 1 });

      if (job.acceptedCount + 1 >= job.positionsQty) {
        await storage.updateJobRequest(job.id, { status: "FILLED" });
      }

      await storage.createShiftAssignment({
        jobRequestId: job.id,
        employeeProfileId: application.employeeProfileId,
        applicationId: application.id,
      });

      await storage.updateCreditBalance(profile.id, creditBal.balance - costAccept);
      await storage.createCreditTransaction({
        employerProfileId: profile.id,
        amount: -costAccept,
        type: "ACCEPT_APPLICATION",
        referenceId: application.id,
      });

      const employeeProfile = await storage.getEmployeeProfile(application.employeeProfileId);
      if (employeeProfile) {
        const empUser = await storage.getUser(employeeProfile.userId);
        if (empUser) {
          await storage.createNotification({
            userId: empUser.id,
            type: "APPLICATION_ACCEPTED",
            title: "Application Accepted",
            message: `Your application for "${job.title}" has been accepted!`,
          });
        }
      }

      return res.json({ message: "Application accepted" });
    } catch (err: any) {
      return res.status(400).json({ message: err.message || "Failed to accept" });
    }
  });

  app.put("/api/applications/:id/reject", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const application = await storage.getApplication(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });

    const job = await storage.getJobRequest(application.jobRequestId);
    if (!job || job.employerProfileId !== profile.id) {
      return res.status(404).json({ message: "Job not found" });
    }

    await storage.updateApplication(req.params.id, { status: "REJECTED" });

    const employeeProfile = await storage.getEmployeeProfile(application.employeeProfileId);
    if (employeeProfile) {
      const empUser = await storage.getUser(employeeProfile.userId);
      if (empUser) {
        await storage.createNotification({
          userId: empUser.id,
          type: "APPLICATION_REJECTED",
          title: "Application Rejected",
          message: `Your application for "${job.title}" was not accepted.`,
        });
      }
    }

    return res.json({ message: "Application rejected" });
  });

  app.get("/api/employee/applications", authMiddleware, requireRole("EMPLOYEE"), async (req, res) => {
    const profile = await storage.getEmployeeProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const apps = await storage.getApplicationsByEmployee(profile.id);
    return res.json(apps);
  });

  app.delete("/api/applications/:id", authMiddleware, requireRole("EMPLOYEE"), async (req, res) => {
    const profile = await storage.getEmployeeProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const application = await storage.getApplication(req.params.id);
    if (!application || application.employeeProfileId !== profile.id) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (application.status !== "PENDING") {
      return res.status(400).json({ message: "Can only withdraw pending applications" });
    }

    await storage.updateApplication(req.params.id, { status: "WITHDRAWN" });
    return res.json({ message: "Application withdrawn" });
  });

  app.get("/api/shifts", authMiddleware, requireRole("EMPLOYEE"), async (req, res) => {
    const profile = await storage.getEmployeeProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const shifts = await storage.getShiftsByEmployee(profile.id);
    return res.json(shifts);
  });

  app.post("/api/shifts/:id/checkin", authMiddleware, requireRole("EMPLOYEE"), async (req, res) => {
    const profile = await storage.getEmployeeProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const shift = await storage.getShiftAssignment(req.params.id);
    if (!shift || shift.employeeProfileId !== profile.id) {
      return res.status(404).json({ message: "Shift not found" });
    }
    if (shift.status !== "ASSIGNED") {
      return res.status(400).json({ message: "Cannot check in to this shift" });
    }

    const { lat, lng } = req.body;
    const updated = await storage.updateShiftAssignment(req.params.id, {
      checkInTime: new Date(),
      checkInLat: lat?.toString(),
      checkInLng: lng?.toString(),
      status: "CHECKED_IN",
    });

    return res.json(updated);
  });

  app.post("/api/shifts/:id/checkout", authMiddleware, requireRole("EMPLOYEE"), async (req, res) => {
    const profile = await storage.getEmployeeProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const shift = await storage.getShiftAssignment(req.params.id);
    if (!shift || shift.employeeProfileId !== profile.id) {
      return res.status(404).json({ message: "Shift not found" });
    }
    if (shift.status !== "CHECKED_IN") {
      return res.status(400).json({ message: "Must be checked in to check out" });
    }

    const { lat, lng } = req.body;
    const updated = await storage.updateShiftAssignment(req.params.id, {
      checkOutTime: new Date(),
      checkOutLat: lat?.toString(),
      checkOutLng: lng?.toString(),
      status: "COMPLETED",
    });

    return res.json(updated);
  });

  app.get("/api/employer/shifts", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const shifts = await storage.getShiftsByEmployer(profile.id);
    return res.json(shifts);
  });

  app.post("/api/shifts/:id/replace", authMiddleware, async (req, res) => {
    const shift = await storage.getShiftAssignment(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    if (req.user!.role === "EMPLOYEE") {
      const profile = await storage.getEmployeeProfileByUserId(req.user!.userId);
      if (!profile || profile.id !== shift.employeeProfileId) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (req.user!.role === "EMPLOYER") {
      const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
      if (!profile) return res.status(403).json({ message: "Access denied" });
      const job = await storage.getJobRequest(shift.jobRequestId);
      if (!job || job.employerProfileId !== profile.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const initiatedBy = req.user!.role === "EMPLOYER" ? "EMPLOYER" : "EMPLOYEE";

    const replacement = await storage.createReplacementRequest({
      shiftAssignmentId: shift.id,
      initiatedBy,
      reason: req.body.reason,
    });

    await storage.updateShiftAssignment(shift.id, { status: "REPLACED" });

    const job = await storage.getJobRequest(shift.jobRequestId);
    if (job) {
      await storage.updateJobRequest(job.id, {
        acceptedCount: Math.max(0, job.acceptedCount - 1),
        status: "OPEN",
      });
    }

    return res.json(replacement);
  });

  app.get("/api/replacements", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const replacements = await storage.getReplacementsByEmployer(profile.id);
    return res.json(replacements);
  });

  app.get("/api/subscription", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const sub = await storage.getSubscription(profile.id);
    return res.json(sub);
  });

  app.post("/api/subscription/upgrade", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const sub = await storage.getSubscription(profile.id);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    const { plan } = req.body;
    if (!["BASIC", "PRO"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const updated = await storage.updateSubscription(sub.id, {
      plan,
      startsAt: new Date(),
      expiresAt,
      isActive: true,
    });

    const planConfig = await storage.getPlanConfig(plan);
    if (planConfig) {
      const creditBal = await storage.getCreditBalance(profile.id);
      if (creditBal) {
        await storage.updateCreditBalance(profile.id, creditBal.balance + planConfig.monthlyCredits);
        await storage.createCreditTransaction({
          employerProfileId: profile.id,
          amount: planConfig.monthlyCredits,
          type: "MONTHLY_REFRESH",
        });
      }
    }

    return res.json(updated);
  });

  app.get("/api/credits", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const balance = await storage.getCreditBalance(profile.id);
    return res.json(balance);
  });

  app.post("/api/credits/topup", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const amount = Number(req.body.amount);
    if (!amount || !Number.isInteger(amount) || amount < 1 || amount > 1000) {
      return res.status(400).json({ message: "Amount must be an integer between 1 and 1000" });
    }

    const creditBal = await storage.getCreditBalance(profile.id);
    if (!creditBal) return res.status(404).json({ message: "Credit balance not found" });

    await storage.updateCreditBalance(profile.id, creditBal.balance + amount);
    await storage.createCreditTransaction({
      employerProfileId: profile.id,
      amount,
      type: "TOP_UP",
    });

    return res.json({ balance: creditBal.balance + amount });
  });

  app.get("/api/credits/transactions", authMiddleware, requireRole("EMPLOYER"), async (req, res) => {
    const profile = await storage.getEmployerProfileByUserId(req.user!.userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const transactions = await storage.getCreditTransactions(profile.id);
    return res.json(transactions);
  });

  app.get("/api/notifications", authMiddleware, async (req, res) => {
    const notifs = await storage.getNotifications(req.user!.userId);
    return res.json(notifs);
  });

  app.put("/api/notifications/:id/read", authMiddleware, async (req, res) => {
    const notifs = await storage.getNotifications(req.user!.userId);
    const owns = notifs.find(n => n.id === req.params.id);
    if (!owns) return res.status(404).json({ message: "Notification not found" });
    await storage.markNotificationRead(req.params.id);
    return res.json({ message: "Marked as read" });
  });

  app.put("/api/notifications/read-all", authMiddleware, async (req, res) => {
    await storage.markAllNotificationsRead(req.user!.userId);
    return res.json({ message: "All marked as read" });
  });

  app.get("/api/admin/users", authMiddleware, requireRole("ADMIN"), async (req, res) => {
    const allUsers = await storage.getAllUsers();
    return res.json(allUsers);
  });

  app.put("/api/admin/users/:id", authMiddleware, requireRole("ADMIN"), async (req, res) => {
    const { isActive } = req.body;
    const updated = await storage.updateUserStatus(req.params.id, isActive);
    return res.json(updated);
  });

  app.put("/api/admin/users/:id/role", authMiddleware, requireRole("ADMIN"), async (req, res) => {
    const { role } = req.body;
    const validRoles = ["ADMIN", "EMPLOYER", "EMPLOYEE"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Role must be ADMIN, EMPLOYER, or EMPLOYEE" });
    }
    const targetUser = await storage.getUser(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (targetUser.id === req.user!.userId) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }
    if (role === "EMPLOYER") {
      const existingProfile = await storage.getEmployerProfileByUserId(targetUser.id);
      if (!existingProfile) {
        const profile = await storage.createEmployerProfile({ userId: targetUser.id, companyName: targetUser.email.split("@")[0] });
        await storage.createSubscription({ employerProfileId: profile.id, plan: "FREE" });
        await storage.createCreditBalance({ employerProfileId: profile.id, balance: 3 });
      }
    } else if (role === "EMPLOYEE") {
      const existingProfile = await storage.getEmployeeProfileByUserId(targetUser.id);
      if (!existingProfile) {
        await storage.createEmployeeProfile({ userId: targetUser.id, fullName: targetUser.email.split("@")[0] });
      }
    }

    const updated = await storage.updateUserRole(req.params.id, role);
    return res.json(updated);
  });

  app.post("/api/admin/users", authMiddleware, requireRole("ADMIN"), async (req, res) => {
    try {
      const { email, password, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const validRoles = ["ADMIN", "EMPLOYER", "EMPLOYEE"];
      const userRole = validRoles.includes(role) ? role : "ADMIN";
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ message: "Email already registered" });

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ email, passwordHash, role: userRole });

      if (userRole === "EMPLOYER") {
        const profile = await storage.createEmployerProfile({ userId: user.id, companyName: email.split("@")[0] });
        await storage.createSubscription({ employerProfileId: profile.id, plan: "FREE" });
        await storage.createCreditBalance({ employerProfileId: profile.id, balance: 3 });
      } else if (userRole === "EMPLOYEE") {
        await storage.createEmployeeProfile({ userId: user.id, fullName: email.split("@")[0] });
      }

      return res.json(user);
    } catch (err: any) {
      return res.status(400).json({ message: err.message || "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id/plan", authMiddleware, requireRole("ADMIN"), async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user || user.role !== "EMPLOYER") {
      return res.status(404).json({ message: "Employer not found" });
    }
    const profile = await storage.getEmployerProfileByUserId(user.id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    const sub = await storage.getSubscription(profile.id);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    const { plan } = req.body;
    const updated = await storage.updateSubscription(sub.id, { plan });
    return res.json(updated);
  });

  app.get("/api/admin/stats", authMiddleware, requireRole("ADMIN"), async (req, res) => {
    const stats = await storage.getStats();
    return res.json(stats);
  });

  app.get("/api/admin/plan-config", authMiddleware, requireRole("ADMIN"), async (req, res) => {
    const configs = await storage.getAllPlanConfigs();
    return res.json(configs);
  });

  app.put("/api/admin/plan-config/:plan", authMiddleware, requireRole("ADMIN"), async (req, res) => {
    const updated = await storage.updatePlanConfig(req.params.plan, req.body);
    return res.json(updated);
  });

  return httpServer;
}
