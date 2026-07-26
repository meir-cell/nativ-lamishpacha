import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getDb } from "../db";
import { publicProcedure, ownerProcedure, router } from "../_core/trpc";
import { registrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "nlp-course-secret";

function signToken(payload: { id: number; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "90d" });
}

export const registrationRouter = router({
  /** Register a new student */
  register: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2, "שם מלא חייב להכיל לפחות 2 תווים"),
        email: z.string().email("כתובת מייל לא תקינה"),
        phone: z.string().min(9, "מספר טלפון לא תקין"),
        password: z.string().min(6, "סיסמא חייבת להכיל לפחות 6 תווים"),
        emailOptIn: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if email already exists
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(eq(registrations.email, input.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "כתובת המייל כבר רשומה. נסה להתחבר.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      // Generate unsubscribe token
      const crypto = await import("crypto");
      const unsubscribeToken = crypto.randomBytes(32).toString("hex");

      const [result] = await db.insert(registrations).values({
        fullName: input.fullName.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone.trim(),
        passwordHash,
        token: "", // will update below
        emailOptIn: input.emailOptIn,
        unsubscribeToken,
        ipAddress: ctx.req.ip || ctx.req.socket?.remoteAddress || null,
      });

      const insertId = (result as any).insertId as number;
      const token = signToken({ id: insertId, email: input.email.toLowerCase() });

      await db
        .update(registrations)
        .set({ token })
        .where(eq(registrations.id, insertId));

      return { token, fullName: input.fullName.trim() };
    }),

  /** Login with email + password */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("כתובת מייל לא תקינה"),
        password: z.string().min(1, "נא להזין סיסמה"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select()
        .from(registrations)
        .where(eq(registrations.email, input.email.toLowerCase()))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "כתובת המייל אינה רשומה. נא להירשם תחילה.",
        });
      }

      const reg = rows[0];
      const valid = await bcrypt.compare(input.password, reg.passwordHash);

      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "סיסמה שגויה.",
        });
      }

      // Refresh token on each login
      const token = signToken({ id: reg.id, email: reg.email });
      await db
        .update(registrations)
        .set({ token })
        .where(eq(registrations.id, reg.id));

      return { token, fullName: reg.fullName };
    }),

  /** Verify a token from localStorage */
  verify: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const payload = jwt.verify(input.token, JWT_SECRET) as { id: number; email: string };
        const db = await getDb();
        if (!db) return { valid: false, fullName: null };
        const rows = await db
          .select({ id: registrations.id, fullName: registrations.fullName, email: registrations.email })
          .from(registrations)
          .where(eq(registrations.id, payload.id))
          .limit(1);

        if (rows.length === 0) return { valid: false, fullName: null, isOwner: false };
        const ownerEmail = process.env.OWNER_EMAIL || "";
        const isOwner = ownerEmail
          ? rows[0].email.toLowerCase() === ownerEmail.toLowerCase()
          : false;
        return { valid: true, fullName: rows[0].fullName, isOwner };
      } catch {
        return { valid: false, fullName: null };
      }
    }),

  /** Request a password reset — sends an email with a reset link */
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email(), origin: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select({ id: registrations.id, fullName: registrations.fullName, email: registrations.email })
        .from(registrations)
        .where(eq(registrations.email, input.email.toLowerCase()))
        .limit(1);

      // Always return success to avoid email enumeration
      if (rows.length === 0) return { sent: true };

      const crypto = await import("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(registrations)
        .set({ passwordResetToken: resetToken, passwordResetExpiry: expiry })
        .where(eq(registrations.id, rows[0].id));

      const resetUrl = `${input.origin}/reset-password?token=${resetToken}`;
      const firstName = rows[0].fullName.split(" ")[0];

      const { sendEmail } = await import("../_core/email");
      await sendEmail({
        to: rows[0].email,
        subject: `איפוס סיסמה — קורס NLP Practitioner`,
        html: `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:40px 20px;background:#0a0a12;font-family:Arial,sans-serif;direction:rtl;">
  <div style="max-width:520px;margin:0 auto;background:#0f0f1a;border-radius:16px;overflow:hidden;border:1px solid #1e1e35;">
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 40px;text-align:center;border-bottom:2px solid #c9a84c;">
      <div style="font-size:36px;margin-bottom:10px;">🔑</div>
      <h1 style="margin:0;color:#F0C040;font-size:22px;">איפוס סיסמה</h1>
      <p style="margin:8px 0 0;color:#8888aa;font-size:13px;">קורס NLP Practitioner</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#c8c8e0;font-size:16px;line-height:1.7;">שלום ${firstName},</p>
      <p style="color:#c8c8e0;font-size:15px;line-height:1.7;">קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה:</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#F0C040);color:#0a0a12;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">אפס סיסמה ←</a>
      </div>
      <p style="color:#8888aa;font-size:13px;line-height:1.6;">הקישור תקף לשעה אחת בלבד. אם לא ביקשת איפוס סיסמה, ניתן להתעלם ממייל זה.</p>
    </div>
    <div style="background:#080810;padding:16px 40px;border-top:1px solid #1e1e35;text-align:center;">
      <p style="margin:0;color:#444466;font-size:12px;">© 2026 קורס NLP Practitioner | מאיר שמעון עשור</p>
    </div>
  </div>
</body></html>`,
        text: `שלום ${firstName},\n\nלאיפוס הסיסמה שלך לחץ על הקישור:\n${resetUrl}\n\nהקישור תקף לשעה אחת בלבד.\n\nקורס NLP Practitioner`,
      });

      return { sent: true };
    }),

  /** Reset password using the token from the email */
  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), newPassword: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים") }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select()
        .from(registrations)
        .where(eq(registrations.passwordResetToken, input.token))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "קישור האיפוס אינו תקין." });
      }

      const reg = rows[0];
      if (!reg.passwordResetExpiry || reg.passwordResetExpiry < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "קישור האיפוס פג תוקף. נא לבקש קישור חדש." });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      const newToken = signToken({ id: reg.id, email: reg.email });

      await db
        .update(registrations)
        .set({ passwordHash, token: newToken, passwordResetToken: null, passwordResetExpiry: null })
        .where(eq(registrations.id, reg.id));

      return { token: newToken, fullName: reg.fullName };
    }),

  /** Admin: list all registrations */
  list: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: registrations.id,
        fullName: registrations.fullName,
        email: registrations.email,
        phone: registrations.phone,
        createdAt: registrations.createdAt,
      })
      .from(registrations)
      .orderBy(registrations.createdAt);
  }),
});
