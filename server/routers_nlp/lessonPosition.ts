/**
 * Lesson position router
 * Saves and restores each student's last lesson + slide so they can resume where they left off.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { registrations, lessonPositions } from "../../drizzle/schema";

export const lessonPositionRouter = router({
  /**
   * Upsert the student's current position (lessonId + slideIndex).
   * Called whenever the student changes lesson or slide.
   */
  savePosition: publicProcedure
    .input(
      z.object({
        token: z.string(),
        lessonId: z.number().int().min(1),
        slideIndex: z.number().int().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const rows = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(eq(registrations.token, input.token))
        .limit(1);

      if (rows.length === 0) return { success: false };

      const regId = rows[0].id;

      // Check if a row already exists for this student
      const existing = await db
        .select({ id: lessonPositions.id })
        .from(lessonPositions)
        .where(eq(lessonPositions.registrationId, regId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(lessonPositions)
          .set({ lessonId: input.lessonId, slideIndex: input.slideIndex })
          .where(eq(lessonPositions.registrationId, regId));
      } else {
        await db.insert(lessonPositions).values({
          registrationId: regId,
          lessonId: input.lessonId,
          slideIndex: input.slideIndex,
        });
      }

      return { success: true };
    }),

  /**
   * Retrieve the student's last saved position.
   * Returns null lessonId if no position has been saved yet.
   */
  getPosition: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { lessonId: null, slideIndex: 0 };

      const rows = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(eq(registrations.token, input.token))
        .limit(1);

      if (rows.length === 0) return { lessonId: null, slideIndex: 0 };

      const pos = await db
        .select({ lessonId: lessonPositions.lessonId, slideIndex: lessonPositions.slideIndex })
        .from(lessonPositions)
        .where(eq(lessonPositions.registrationId, rows[0].id))
        .limit(1);

      if (pos.length === 0) return { lessonId: null, slideIndex: 0 };
      return { lessonId: pos[0].lessonId, slideIndex: pos[0].slideIndex };
    }),
});
