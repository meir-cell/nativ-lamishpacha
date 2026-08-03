import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { faqItems } from "../../drizzle/schema";
import { eq, like, sql } from "drizzle-orm";
import { verifyAdmin } from "./_adminAuth";

export const adminFaqRouter = router({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.pageSize;
      let query = db.select().from(faqItems);
      const conditions: any[] = [];
      if (input.search) {
        conditions.push(like(faqItems.question, `%${input.search}%`));
      }
      if (input.category) {
        conditions.push(eq(faqItems.category, input.category));
      }
      const rows = await (conditions.length > 0
        ? query.where(conditions.length === 1 ? conditions[0]! : sql`${conditions[0]} AND ${conditions[1]}`)
        : query)
        .orderBy(faqItems.category, faqItems.sortOrder)
        .limit(input.pageSize)
        .offset(offset);

      const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(faqItems);
      return { items: rows, total: Number(count) };
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db.select().from(faqItems).where(eq(faqItems.id, input.id));
      if (!row) throw new Error("FAQ item not found");
      return row;
    }),

  create: publicProcedure
    .input(z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      category: z.string().default("כללי"),
      sortOrder: z.number().default(0),
      published: z.number().default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(faqItems).values(input);
      return { success: true };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      question: z.string().min(1).optional(),
      answer: z.string().min(1).optional(),
      category: z.string().optional(),
      sortOrder: z.number().optional(),
      published: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...data } = input;
      await db.update(faqItems).set(data).where(eq(faqItems.id, id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(faqItems).where(eq(faqItems.id, input.id));
      return { success: true };
    }),

  getCategories: publicProcedure
    .query(async ({ ctx }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.selectDistinct({ category: faqItems.category }).from(faqItems);
      return rows.map(r => r.category).filter(Boolean) as string[];
    }),
});
