import { z } from "zod";
import { publicProcedure, protectedProcedure, ownerProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { moduleExamResults, satisfactionSurveys, registrations } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/** Helper: look up a registration by token, throw if not found */
async function getRegByToken(token: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const rows = await db.select().from(registrations).where(eq(registrations.token, token)).limit(1);
  if (rows.length === 0) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token לא תקין" });
  return { db, reg: rows[0] };
}

export const surveyExamRouter = router({
  /** Submit a module exam result */
  submitExamResult: publicProcedure
    .input(z.object({
      token: z.string(),
      moduleId: z.number().int().min(1),
      score: z.number().int().min(0).max(100),
      passed: z.boolean(),
      attempt: z.number().int().min(1).max(2),
    }))
    .mutation(async ({ input }) => {
      const { db, reg } = await getRegByToken(input.token);
      await db.insert(moduleExamResults).values({
        registrationId: reg.id,
        moduleId: input.moduleId,
        score: input.score,
        passed: input.passed,
        attempt: input.attempt,
      });
      return { success: true };
    }),

  /** Submit a satisfaction survey */
  submitSurvey: publicProcedure
    .input(z.object({
      token: z.string(),
      moduleId: z.number().int().min(1),
      overallRating: z.number().int().min(1).max(5),
      contentRating: z.number().int().min(1).max(5),
      uxRating: z.number().int().min(1).max(5),
      relevanceRating: z.number().int().min(1).max(5),
      recommendRating: z.number().int().min(1).max(5),
      comment: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const { db, reg } = await getRegByToken(input.token);
      await db.insert(satisfactionSurveys).values({
        registrationId: reg.id,
        moduleId: input.moduleId,
        overallRating: input.overallRating,
        contentRating: input.contentRating,
        uxRating: input.uxRating,
        relevanceRating: input.relevanceRating,
        recommendRating: input.recommendRating,
        comment: input.comment ?? null,
      });
      return { success: true };
    }),

  /** Check if the current student already submitted a survey for a module */
  hasSurvey: publicProcedure
    .input(z.object({ token: z.string(), moduleId: z.number().int().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { submitted: false };
      const rows = await db.select().from(registrations).where(eq(registrations.token, input.token)).limit(1);
      if (rows.length === 0) return { submitted: false };
      const reg = rows[0];
      const existing = await db
        .select({ id: satisfactionSurveys.id })
        .from(satisfactionSurveys)
        .where(and(eq(satisfactionSurveys.registrationId, reg.id), eq(satisfactionSurveys.moduleId, input.moduleId)))
        .limit(1);
      return { submitted: existing.length > 0 };
    }),

  /** Admin: get all exam results */
  adminExamResults: ownerProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(moduleExamResults).orderBy(desc(moduleExamResults.completedAt));
    }),

  /** Admin: get all survey responses */
  adminSurveys: ownerProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(satisfactionSurveys).orderBy(desc(satisfactionSurveys.submittedAt));
    }),
});
