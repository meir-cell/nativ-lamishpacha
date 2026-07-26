/**
 * Lesson progress router
 * - completeLesson: marks a lesson as done, sends first-lesson thank-you email
 * - getProgress: returns completed lesson IDs for the current student
 * - unsubscribeAndDelete: deletes the student account via unsubscribe token
 */
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { registrations, lessonProgress } from "../../drizzle/schema";
import { sendEmail, buildFirstLessonEmail } from "../_core/email";

export const lessonProgressRouter = router({
  /**
   * Mark a lesson as completed for the current student (identified by JWT token).
   * On the very first completion, sends a thank-you email if the student opted in.
   */
  completeLesson: publicProcedure
    .input(
      z.object({
        token: z.string(),
        lessonId: z.number().int().min(1),
        lessonTitle: z.string(),
        siteUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Look up the registration by token
      const rows = await db
        .select()
        .from(registrations)
        .where(eq(registrations.token, input.token))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Token לא תקין" });
      }

      const reg = rows[0];

      // Check if this lesson was already recorded
      const existing = await db
        .select({ id: lessonProgress.id })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.registrationId, reg.id),
            eq(lessonProgress.lessonId, input.lessonId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(lessonProgress).values({
          registrationId: reg.id,
          lessonId: input.lessonId,
        });
      }

      // Always update lastActivityAt on lesson access
      await db
        .update(registrations)
        .set({ lastActivityAt: new Date() })
        .where(eq(registrations.id, reg.id));

      // Count total completed lessons (after this insert)
      const allCompleted = await db
        .select({ id: lessonProgress.id })
        .from(lessonProgress)
        .where(eq(lessonProgress.registrationId, reg.id));

      const isFirstLesson = allCompleted.length === 1;

      // Send first-lesson email if: opted in, first lesson, not yet sent
      if (isFirstLesson && reg.emailOptIn && !reg.firstLessonEmailSent) {
        // Ensure unsubscribe token exists
        let unsubToken = reg.unsubscribeToken;
        if (!unsubToken) {
          unsubToken = randomBytes(32).toString("hex");
          await db
            .update(registrations)
            .set({ unsubscribeToken: unsubToken })
            .where(eq(registrations.id, reg.id));
        }

        const { subject, html, text } = buildFirstLessonEmail({
          fullName: reg.fullName,
          lessonTitle: input.lessonTitle,
          siteUrl: input.siteUrl,
          unsubscribeToken: unsubToken,
        });

        const sent = await sendEmail({ to: reg.email, subject, html, text });

        if (sent) {
          await db
            .update(registrations)
            .set({ firstLessonEmailSent: true })
            .where(eq(registrations.id, reg.id));
        }
      }

      return { success: true, completedCount: allCompleted.length };
    }),

  /**
   * Return the list of completed lesson IDs for the current student.
   */
  getProgress: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { completedLessonIds: [] };

      const rows = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(eq(registrations.token, input.token))
        .limit(1);

      if (rows.length === 0) return { completedLessonIds: [] };

      const progress = await db
        .select({ lessonId: lessonProgress.lessonId })
        .from(lessonProgress)
        .where(eq(lessonProgress.registrationId, rows[0].id));

      return { completedLessonIds: progress.map((p) => p.lessonId) };
    }),

  /**
   * Unsubscribe and delete the student account using the unsubscribe token from the email.
   */
  unsubscribeAndDelete: publicProcedure
    .input(z.object({ unsubscribeToken: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select({ id: registrations.id, fullName: registrations.fullName })
        .from(registrations)
        .where(eq(registrations.unsubscribeToken, input.unsubscribeToken))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "קישור לא תקין או כבר שומש" });
      }

      const regId = rows[0].id;

      // Delete progress records first (FK safety)
      await db.delete(lessonProgress).where(eq(lessonProgress.registrationId, regId));
      // Delete the registration
      await db.delete(registrations).where(eq(registrations.id, regId));

      return { success: true, fullName: rows[0].fullName };
    }),

  /**
   * Validate an unsubscribe token (used by the confirmation page to show the name).
   */
  validateUnsubscribeToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, fullName: null };

      const rows = await db
        .select({ id: registrations.id, fullName: registrations.fullName })
        .from(registrations)
        .where(eq(registrations.unsubscribeToken, input.token))
        .limit(1);

      if (rows.length === 0) return { valid: false, fullName: null };
      return { valid: true, fullName: rows[0].fullName };
    }),
});
