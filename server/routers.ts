import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createContact,
  deleteContact,
  getAllContacts,
  getContactStats,
  updateContactStatus,
} from "./db";
import { notifyOwner } from "./_core/notification";

// Admin-only guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "גישה מורשית למנהלים בלבד" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Contact form (public) ──────────────────────────────────────────────────
  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
        email: z.string().email("כתובת אימייל לא תקינה"),
        phone: z.string().min(9, "מספר טלפון לא תקין"),
        message: z.string().optional().default(""),
      }))
      .mutation(async ({ input }) => {
        await createContact({
          name: input.name,
          email: input.email,
          phone: input.phone,
          message: input.message,
          status: "new",
        });
        // Notify owner
        await notifyOwner({
          title: `פנייה חדשה מ-${input.name}`,
          content: `שם: ${input.name}\nאימייל: ${input.email}\nטלפון: ${input.phone}\nהודעה: ${input.message}`,
        });
        return { success: true };
      }),
  }),

  // ── Admin panel ────────────────────────────────────────────────────────────
  admin: router({
    // Stats dashboard
    stats: adminProcedure.query(async () => {
      return getContactStats();
    }),

    // List all contacts
    listContacts: adminProcedure.query(async () => {
      return getAllContacts();
    }),

    // Update contact status
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "read", "replied"]),
      }))
      .mutation(async ({ input }) => {
        await updateContactStatus(input.id, input.status);
        return { success: true };
      }),

    // Delete contact
    deleteContact: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContact(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
