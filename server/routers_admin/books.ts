import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { books } from "../../drizzle/schema";
import { eq, desc, like, sql } from "drizzle-orm";
import { verifyAdmin } from "./_adminAuth";

export const adminBooksRouter = router({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.pageSize;
      let query = db.select().from(books);
      const conditions: any[] = [];
      if (input.search) {
        conditions.push(like(books.title, `%${input.search}%`));
      }
      if (input.category) {
        conditions.push(eq(books.category, input.category));
      }
      const rows = await (conditions.length > 0
        ? query.where(conditions.length === 1 ? conditions[0]! : sql`${conditions[0]} AND ${conditions[1]}`)
        : query)
        .orderBy(books.sortOrder, desc(books.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(books);
      return { books: rows, total: Number(count) };
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db.select().from(books).where(eq(books.id, input.id));
      if (!row) throw new Error("Book not found");
      return row;
    }),

  create: publicProcedure
    .input(z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      pages: z.number().optional(),
      category: z.string().optional(),
      pdfUrl: z.string().optional(),
      img: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
      published: z.number().default(1),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(books).values(input);
      return { success: true };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      pages: z.number().optional(),
      category: z.string().optional(),
      pdfUrl: z.string().optional(),
      img: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
      published: z.number().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...data } = input;
      await db.update(books).set(data).where(eq(books.id, id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(books).where(eq(books.id, input.id));
      return { success: true };
    }),

  getCategories: publicProcedure
    .query(async ({ ctx }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.selectDistinct({ category: books.category }).from(books).where(sql`category IS NOT NULL`);
      return rows.map(r => r.category).filter(Boolean) as string[];
    }),
});
