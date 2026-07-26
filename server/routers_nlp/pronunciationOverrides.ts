import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pronunciationOverrides } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invalidateOverridesCache } from "../nikud";

export const pronunciationOverridesRouter = router({
  /** List all pronunciation overrides */
  list: protectedProcedure.query(async ({ ctx }) => {
    // Only owner/admin can manage pronunciation overrides
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const overrides = await db
      .select()
      .from(pronunciationOverrides)
      .orderBy(pronunciationOverrides.createdAt);
    return overrides;
  }),

  /** Get all active overrides (used by nikud/TTS system) */
  getActive: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const overrides = await db
      .select({
        originalWord: pronunciationOverrides.originalWord,
        replacement: pronunciationOverrides.replacement,
      })
      .from(pronunciationOverrides)
      .where(eq(pronunciationOverrides.isActive, true));
    return overrides;
  }),

  /** Add a new pronunciation override (upsert — updates if word already exists) */
  add: protectedProcedure
    .input(
      z.object({
        originalWord: z.string().min(1).max(255),
        replacement: z.string().min(1).max(255),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Check if the word already exists
      const existing = await db
        .select({ id: pronunciationOverrides.id })
        .from(pronunciationOverrides)
        .where(eq(pronunciationOverrides.originalWord, input.originalWord))
        .limit(1);

      if (existing.length > 0) {
        // Update existing override
        await db
          .update(pronunciationOverrides)
          .set({
            replacement: input.replacement,
            note: input.note ?? null,
            isActive: true,
          })
          .where(eq(pronunciationOverrides.id, existing[0].id));
      } else {
        // Insert new override
        await db.insert(pronunciationOverrides).values({
          originalWord: input.originalWord,
          replacement: input.replacement,
          note: input.note ?? null,
        });
      }

      invalidateOverridesCache();
      return { success: true };
    }),

  /** Update an existing pronunciation override */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        originalWord: z.string().min(1).max(255).optional(),
        replacement: z.string().min(1).max(255).optional(),
        note: z.string().max(500).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const { id, ...updates } = input;
      const updateData: Record<string, unknown> = {};
      if (updates.originalWord !== undefined) updateData.originalWord = updates.originalWord;
      if (updates.replacement !== undefined) updateData.replacement = updates.replacement;
      if (updates.note !== undefined) updateData.note = updates.note;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(pronunciationOverrides)
        .set(updateData)
        .where(eq(pronunciationOverrides.id, id));
      invalidateOverridesCache();
      return { success: true };
    }),

  /** Delete a pronunciation override */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .delete(pronunciationOverrides)
        .where(eq(pronunciationOverrides.id, input.id));
      invalidateOverridesCache();
      return { success: true };
    }),
});
