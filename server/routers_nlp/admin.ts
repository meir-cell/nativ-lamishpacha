/**
 * Admin router — procedures available only to the site owner/admin.
 * Access is granted if:
 * 1. The request includes a valid ADMIN_SECRET, OR
 * 2. The request includes a valid registration token belonging to the owner (OWNER_EMAIL), OR
 * 3. The user is authenticated via OAuth and has role "admin"
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { registrations, certificates, moduleExamResults, lessonProgress } from "../../drizzle/schema";
import { eq, count } from "drizzle-orm";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import type { User } from "../../drizzle/schema";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

/** Shared input schema — accepts either adminSecret or ownerToken */
const adminInput = z.object({
  adminSecret: z.string().optional(),
  ownerToken: z.string().optional(),
});

/** Verify admin access — by secret, owner token, OAuth admin user, or admin_session cookie */
async function checkAdmin(input: { adminSecret?: string; ownerToken?: string }, user?: User | null, ctx?: any) {
  // Method 1: OAuth admin user
  if (user && user.role === "admin") {
    return; // Access granted — OAuth admin
  }

  // Method 2: ADMIN_SECRET
  const secret = process.env.ADMIN_SECRET;
  if (secret && input.adminSecret && input.adminSecret === secret) {
    return; // Access granted
  }

  // Method 3: Owner token (registration JWT with owner email)
  if (input.ownerToken) {
    try {
      const payload = jwt.verify(input.ownerToken, JWT_SECRET) as { id: number; email: string };
      const ownerEmail = process.env.OWNER_EMAIL || "";
      if (ownerEmail && payload.email && payload.email.toLowerCase() === ownerEmail.toLowerCase()) {
        return; // Access granted — owner
      }
    } catch {
      // Token invalid, fall through
    }
  }

  // Method 4: admin_session cookie (set by /admin login on Railway)
  if (ctx?.req) {
    try {
      const parsed = ctx.req?.cookies?.admin_session;
      const cookieHeader = ctx.req?.headers?.cookie || "";
      const match = cookieHeader.match(/admin_session=([^;]+)/);
      const token = parsed || (match ? match[1] : null);
      if (token) {
        const { jwtVerify } = await import("jose");
        const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || "admin-secret");
        await jwtVerify(token, jwtSecret);
        return; // Access granted — admin_session cookie
      }
    } catch {
      // Cookie invalid, fall through
    }
  }

  throw new TRPCError({ code: "UNAUTHORIZED", message: "גישה אסורה" });
}

export const adminRouter = router({
  /**
   * Test SMTP connection — verifies the configured credentials work.
   * Returns { ok, message } — never throws so the UI can show the result.
   */
  testSmtp: publicProcedure
    .input(adminInput)
    .mutation(async ({ input, ctx }) => {
      await checkAdmin(input, ctx.user, ctx);

      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const user = process.env.SMTP_USER || "meir@ynrcollege.org";
      const pass = process.env.SMTP_PASS || "rkzryywi ybsjumvf";

      if (!host || !user || !pass) {
        return {
          ok: false,
          message: "פרטי SMTP חסרים — הגדר SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS",
        };
      }

      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
        });

        await transporter.verify();
        return {
          ok: true,
          message: `חיבור SMTP תקין ✓ (${host}:${port})`,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          ok: false,
          message: `חיבור SMTP נכשל: ${msg}`,
        };
      }
    }),

  /**
   * Get system stats for the admin dashboard.
   */
  getStats: publicProcedure
    .input(adminInput)
    .query(async ({ input, ctx }) => {
      await checkAdmin(input, ctx.user, ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const smtpConfigured = !!(true ||
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      );

      // Query each table separately with error handling — tables may not exist yet on fresh deployments
      let totalRegistrations = 0;
      let totalCertificates = 0;
      let totalExamResults = 0;
      let totalLessonCompletions = 0;
      let emailOptInCount = 0;

      try {
        const [totalRegs] = await db.select({ count: count() }).from(registrations);
        totalRegistrations = Number(totalRegs.count) || 0;
        const [optedIn] = await db
          .select({ count: count() })
          .from(registrations)
          .where(eq(registrations.emailOptIn, true));
        emailOptInCount = Number(optedIn.count) || 0;
      } catch { /* table may not exist yet */ }

      try {
        const [totalCerts] = await db.select({ count: count() }).from(certificates);
        totalCertificates = Number(totalCerts.count) || 0;
      } catch { /* table may not exist yet */ }

      try {
        const [totalExams] = await db.select({ count: count() }).from(moduleExamResults);
        totalExamResults = Number(totalExams.count) || 0;
      } catch { /* table may not exist yet */ }

      try {
        const [totalLessons] = await db.select({ count: count() }).from(lessonProgress);
        totalLessonCompletions = Number(totalLessons.count) || 0;
      } catch { /* table may not exist yet */ }

      return {
        totalRegistrations,
        totalCertificates,
        totalExamResults,
        totalLessonCompletions,
        emailOptInCount,
        smtpConfigured,
        smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
      };
    }),
});
