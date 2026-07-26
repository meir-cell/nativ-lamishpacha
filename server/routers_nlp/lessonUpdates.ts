import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ownerProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getPendingUpdates, getAllUpdates, approveUpdate, rejectUpdate,
  getExtraSectionsForLesson, getExtraKeyPointsForLesson, getExtraExercisesForLesson,
  getLessonsWithNewContent, getRecentResearchRuns,
} from "../db";
// RAG re-index triggered via dynamic import in approve mutation

// Guard: only owner/admin can manage updates
const adminProcedure = ownerProcedure;

export const lessonUpdatesRouter = router({
  // ── Admin procedures ──────────────────────────────────────────────────────

  /** Get all pending updates awaiting review */
  getPending: adminProcedure.query(() => getPendingUpdates()),

  /** Get all updates (pending + approved + rejected) */
  getAll: adminProcedure.query(() => getAllUpdates()),

  /** Approve an update and materialize it into the approved tables */
  approve: adminProcedure
    .input(z.object({ id: z.number(), reviewNote: z.string().optional() }))
    .mutation(async ({ input }) => {
      const result = await approveUpdate(input.id, input.reviewNote);
      // Trigger re-index of course content after approval (non-blocking)
      import("../indexCourseContent").then(async (m) => {
        const { lessons } = await import("../../client/src/lib/courseData");
        await m.indexAllCourseContent(lessons as any);
        console.log("[RAG] Re-indexed after content approval");
      }).catch(console.error);
      return result;
    }),

  /** Reject an update */
  reject: adminProcedure
    .input(z.object({ id: z.number(), reviewNote: z.string().optional() }))
    .mutation(({ input }) => rejectUpdate(input.id, input.reviewNote)),

  /** Get recent research run logs */
  getResearchRuns: adminProcedure.query(() => getRecentResearchRuns()),

  // ── Student-facing procedures ─────────────────────────────────────────────

  /** Get all approved extra content for a lesson */
  getExtraContent: publicProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ input }) => {
      const [sections, keyPoints, exercises] = await Promise.all([
        getExtraSectionsForLesson(input.lessonId),
        getExtraKeyPointsForLesson(input.lessonId),
        getExtraExercisesForLesson(input.lessonId),
      ]);
      return { sections, keyPoints, exercises };
    }),

  /** Get list of lesson IDs that have new approved content (for badge display) */
  getLessonsWithNewContent: publicProcedure.query(() => getLessonsWithNewContent()),
});
