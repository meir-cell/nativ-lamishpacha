import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { moduleExamResults, registrations } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/** Helper: look up a registration by token, throw if not found */
async function getRegByToken(token: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const rows = await db.select().from(registrations).where(eq(registrations.token, token)).limit(1);
  if (rows.length === 0) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token לא תקין" });
  return { db, reg: rows[0] };
}

/**
 * Exam eligibility logic:
 * - Attempt 1: always available (version A)
 * - Attempt 2: available 1 hour after attempt 1 failure (version B)
 * - Attempt 3: available 24 hours after attempt 2 failure (version C)
 * - After 3 failures: must re-study module (no more attempts until admin reset or module re-studied)
 */
export const examVersionsRouter = router({
  /**
   * Check exam eligibility for a specific module.
   * Returns: which attempt is next, which version to use, cooldown remaining (ms), and previous results.
   */
  getExamEligibility: publicProcedure
    .input(z.object({
      token: z.string(),
      moduleId: z.number().int().min(1).max(5),
    }))
    .query(async ({ input }) => {
      const { db, reg } = await getRegByToken(input.token);

      // Get all attempts for this module, ordered by completedAt desc
      const attempts = await db
        .select()
        .from(moduleExamResults)
        .where(
          and(
            eq(moduleExamResults.registrationId, reg.id),
            eq(moduleExamResults.moduleId, input.moduleId)
          )
        )
        .orderBy(desc(moduleExamResults.completedAt));

      // If any attempt passed, the module is complete
      const passedAttempt = attempts.find(a => a.passed);
      if (passedAttempt) {
        return {
          status: "passed" as const,
          score: passedAttempt.score,
          attempt: passedAttempt.attempt,
          version: passedAttempt.examVersion,
          cooldownMs: 0,
          cooldownUntil: null,
          previousAttempts: attempts.map(a => ({
            attempt: a.attempt,
            score: a.score,
            passed: a.passed,
            version: a.examVersion,
            completedAt: a.completedAt,
          })),
        };
      }

      const attemptCount = attempts.length;
      const now = Date.now();

      if (attemptCount === 0) {
        // First attempt — always available
        return {
          status: "eligible" as const,
          nextAttempt: 1,
          nextVersion: "A" as const,
          cooldownMs: 0,
          cooldownUntil: null,
          previousAttempts: [],
        };
      }

      if (attemptCount === 1) {
        // After first failure — 1 hour cooldown
        const lastAttemptTime = new Date(attempts[0].completedAt).getTime();
        const cooldownEnd = lastAttemptTime + 60 * 60 * 1000; // 1 hour
        const remaining = cooldownEnd - now;

        if (remaining > 0) {
          return {
            status: "cooldown" as const,
            nextAttempt: 2,
            nextVersion: "B" as const,
            cooldownMs: remaining,
            cooldownUntil: new Date(cooldownEnd),
            previousAttempts: attempts.map(a => ({
              attempt: a.attempt,
              score: a.score,
              passed: a.passed,
              version: a.examVersion,
              completedAt: a.completedAt,
            })),
          };
        }

        return {
          status: "eligible" as const,
          nextAttempt: 2,
          nextVersion: "B" as const,
          cooldownMs: 0,
          cooldownUntil: null,
          previousAttempts: attempts.map(a => ({
            attempt: a.attempt,
            score: a.score,
            passed: a.passed,
            version: a.examVersion,
            completedAt: a.completedAt,
          })),
        };
      }

      if (attemptCount === 2) {
        // After second failure — 24 hour cooldown
        const lastAttemptTime = new Date(attempts[0].completedAt).getTime();
        const cooldownEnd = lastAttemptTime + 24 * 60 * 60 * 1000; // 24 hours
        const remaining = cooldownEnd - now;

        if (remaining > 0) {
          return {
            status: "cooldown" as const,
            nextAttempt: 3,
            nextVersion: "C" as const,
            cooldownMs: remaining,
            cooldownUntil: new Date(cooldownEnd),
            previousAttempts: attempts.map(a => ({
              attempt: a.attempt,
              score: a.score,
              passed: a.passed,
              version: a.examVersion,
              completedAt: a.completedAt,
            })),
          };
        }

        return {
          status: "eligible" as const,
          nextAttempt: 3,
          nextVersion: "C" as const,
          cooldownMs: 0,
          cooldownUntil: null,
          previousAttempts: attempts.map(a => ({
            attempt: a.attempt,
            score: a.score,
            passed: a.passed,
            version: a.examVersion,
            completedAt: a.completedAt,
          })),
        };
      }

      // 3+ attempts — must re-study
      return {
        status: "locked" as const,
        cooldownMs: 0,
        cooldownUntil: null,
        previousAttempts: attempts.map(a => ({
          attempt: a.attempt,
          score: a.score,
          passed: a.passed,
          version: a.examVersion,
          completedAt: a.completedAt,
        })),
      };
    }),

  /**
   * Submit an exam result with version tracking.
   * Validates that the attempt is actually allowed before saving.
   */
  submitExamResult: publicProcedure
    .input(z.object({
      token: z.string(),
      moduleId: z.number().int().min(1).max(5),
      score: z.number().int().min(0).max(100),
      passed: z.boolean(),
      attempt: z.number().int().min(1).max(3),
      examVersion: z.enum(["A", "B", "C"]),
    }))
    .mutation(async ({ input }) => {
      const { db, reg } = await getRegByToken(input.token);

      // Verify this attempt is valid
      const existingAttempts = await db
        .select()
        .from(moduleExamResults)
        .where(
          and(
            eq(moduleExamResults.registrationId, reg.id),
            eq(moduleExamResults.moduleId, input.moduleId)
          )
        );

      // Check if already passed
      if (existingAttempts.some(a => a.passed)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "כבר עברת את המבחן הזה" });
      }

      // Check attempt count
      if (existingAttempts.length >= 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "מיצית את כל הניסיונות. חזור על המודול." });
      }

      // Verify attempt number matches
      const expectedAttempt = existingAttempts.length + 1;
      if (input.attempt !== expectedAttempt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `ניסיון לא תקין. צפוי ניסיון ${expectedAttempt}` });
      }

      // Verify version matches expected
      const expectedVersion = expectedAttempt === 1 ? "A" : expectedAttempt === 2 ? "B" : "C";
      if (input.examVersion !== expectedVersion) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `גרסה לא תקינה. צפויה גרסה ${expectedVersion}` });
      }

      // Enforce cooldown server-side
      if (existingAttempts.length > 0) {
        const sortedByTime = [...existingAttempts].sort(
          (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );
        const lastAttemptTime = new Date(sortedByTime[0].completedAt).getTime();
        const now = Date.now();

        if (expectedAttempt === 2) {
          // 1-hour cooldown after attempt 1
          const cooldownEnd = lastAttemptTime + 60 * 60 * 1000;
          if (now < cooldownEnd) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "עדיין בתקופת המתנה. נסה שוב מאוחר יותר." });
          }
        } else if (expectedAttempt === 3) {
          // 24-hour cooldown after attempt 2
          const cooldownEnd = lastAttemptTime + 24 * 60 * 60 * 1000;
          if (now < cooldownEnd) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "עדיין בתקופת המתנה (24 שעות). נסה שוב מאוחר יותר." });
          }
        }
      }

      await db.insert(moduleExamResults).values({
        registrationId: reg.id,
        moduleId: input.moduleId,
        score: input.score,
        passed: input.passed,
        attempt: input.attempt,
        examVersion: input.examVersion,
      });

      return { success: true };
    }),

  /**
   * Reset exam attempts for a module (allows re-study and retry).
   * Called when student chooses to re-study the module.
   */
  resetModuleExam: publicProcedure
    .input(z.object({
      token: z.string(),
      moduleId: z.number().int().min(1).max(5),
    }))
    .mutation(async ({ input }) => {
      const { db, reg } = await getRegByToken(input.token);

      // Only allow reset if all 3 attempts failed (locked state)
      const attempts = await db
        .select()
        .from(moduleExamResults)
        .where(
          and(
            eq(moduleExamResults.registrationId, reg.id),
            eq(moduleExamResults.moduleId, input.moduleId)
          )
        );

      if (attempts.some(a => a.passed)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "כבר עברת את המבחן — אין צורך באיפוס" });
      }

      if (attempts.length < 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "עדיין יש לך ניסיונות נוספים" });
      }

      // Delete all attempts for this module to allow fresh start
      await db.delete(moduleExamResults).where(
        and(
          eq(moduleExamResults.registrationId, reg.id),
          eq(moduleExamResults.moduleId, input.moduleId)
        )
      );

      return { success: true };
    }),
});
