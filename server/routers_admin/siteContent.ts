import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { siteContent } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

async function verifyAdmin(ctx: any) {
  const cookieHeader = ctx.req?.headers?.cookie || "";
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  if (!match) throw new Error("Unauthorized");
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
    await jwtVerify(match[1], secret);
  } catch {
    throw new Error("Unauthorized");
  }
}

export const adminSiteContentRouter = router({
  getAll: publicProcedure
    .input(z.object({ section: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(siteContent);
      if (input.section) return rows.filter(r => r.section === input.section);
      return rows;
    }),

  update: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
      label: z.string().optional(),
      type: z.enum(["text", "html", "json", "url"]).optional(),
      section: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(siteContent).where(eq(siteContent.key, input.key));
      if (existing.length > 0) {
        await db.update(siteContent).set({ value: input.value, label: input.label, type: input.type, section: input.section }).where(eq(siteContent.key, input.key));
      } else {
        await db.insert(siteContent).values(input);
      }
      return { success: true };
    }),

  bulkUpdate: publicProcedure
    .input(z.array(z.object({
      key: z.string(),
      value: z.string(),
      label: z.string().optional(),
      type: z.enum(["text", "html", "json", "url"]).optional(),
      section: z.string().optional(),
    })))
    .mutation(async ({ ctx, input }) => {
      await verifyAdmin(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      for (const item of input) {
        const existing = await db.select().from(siteContent).where(eq(siteContent.key, item.key));
        if (existing.length > 0) {
          await db.update(siteContent).set({ value: item.value, label: item.label, type: item.type, section: item.section }).where(eq(siteContent.key, item.key));
        } else {
          await db.insert(siteContent).values(item);
        }
      }
      return { success: true };
    }),
});
