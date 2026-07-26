/**
 * Course Content Index Router
 * Provides admin endpoint to re-index course content for RAG,
 * and auto-indexes on server startup.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { indexAllCourseContent } from "../indexCourseContent";
import { getDb } from "../db";
import { courseContentChunks } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

export const courseIndexRouter = router({
  /** Re-index all course content (admin only) */
  reindex: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can re-index course content");
      }

      // Dynamic import of courseData (it's a client file but we can import the data)
      const { lessons } = await import("../../client/src/lib/courseData");
      
      const result = await indexAllCourseContent(lessons as any);
      return result;
    }),

  /** Get index stats */
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view index stats");
      }

      const db = await getDb();
      if (!db) return { totalChunks: 0, lastIndexed: null };

      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(courseContentChunks);
      
      const lastRow = await db
        .select({ createdAt: courseContentChunks.createdAt })
        .from(courseContentChunks)
        .orderBy(sql`createdAt DESC`)
        .limit(1);

      return {
        totalChunks: result[0]?.count ?? 0,
        lastIndexed: lastRow[0]?.createdAt ?? null,
      };
    }),
});

/**
 * Auto-index course content on server startup if the index is empty.
 * Called once when the server boots.
 */
export async function autoIndexIfEmpty() {
  try {
    const db = await getDb();
    if (!db) return;

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(courseContentChunks);

    const count = result[0]?.count ?? 0;
    if (count === 0) {
      console.log("[RAG] Index is empty, auto-indexing course content...");
      const { lessons } = await import("../../client/src/lib/courseData");
      const indexResult = await indexAllCourseContent(lessons as any);
      console.log(`[RAG] Indexed ${indexResult.totalChunks} chunks from ${indexResult.totalLessons} lessons`);
    } else {
      console.log(`[RAG] Index already has ${count} chunks, skipping auto-index`);
    }
  } catch (error) {
    console.error("[RAG] Auto-index failed:", error);
  }
}
