import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createContact,
  deleteContact,
  getAllContacts,
  getDashboardStats,
  getContactStats,
  updateContactStatus,
} from "./db";
import { notifyOwner } from "./_core/notification";

// NLP routers
import { lessonUpdatesRouter } from "./routers_nlp/lessonUpdates";
import { nlpChatRouter } from "./routers_nlp/nlpChat";
import { registrationRouter } from "./routers_nlp/registration";
import { lessonTranslateRouter } from "./routers_nlp/lessonTranslate";
import { slideTranslateRouter } from "./routers_nlp/slideTranslate";
import { lessonProgressRouter } from "./routers_nlp/lessonProgress";
import { surveyExamRouter } from "./routers_nlp/surveyExam";
import { expandSlideRouter } from "./routers_nlp/expandSlide";
import { lessonPositionRouter } from "./routers_nlp/lessonPosition";
import { certificateRouter } from "./routers_nlp/certificate";
import { adminRouter as nlpAdminRouter } from "./routers_nlp/admin";
import { examVersionsRouter } from "./routers_nlp/examVersions";
import { nikudRouter } from "./routers_nlp/nikud";
import { pronunciationOverridesRouter } from "./routers_nlp/pronunciationOverrides";
import { courseIndexRouter } from "./routers_nlp/courseIndex";
import { ttsSettingsRouter } from "./routers_nlp/ttsSettings";
import { ttsRouter } from "./routers_nlp/tts";

// Admin panel routers
import { adminArticlesRouter } from "./routers_admin/articles";
import { adminSeoRouter } from "./routers_admin/seo";
import { adminSiteContentRouter } from "./routers_admin/siteContent";
import { adminBooksRouter } from "./routers_admin/books";
import { adminFaqRouter } from "./routers_admin/faq";


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
        await notifyOwner({
          title: `פנייה חדשה מ-${input.name}`,
          content: `שם: ${input.name}\nאימייל: ${input.email}\nטלפון: ${input.phone}\nהודעה: ${input.message}`,
        });
        return { success: true };
      }),
  }),

  // ── Admin panel (nativ-lamishpacha contacts) ───────────────────────────────
  admin: router({
    stats: adminProcedure.query(async () => {
      return getContactStats();
    }),
    dashboardStats: adminProcedure.query(async () => {
      return getDashboardStats();
    }),
    listContacts: adminProcedure.query(async () => {
      return getAllContacts();
    }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "read", "replied"]),
      }))
      .mutation(async ({ input }) => {
        await updateContactStatus(input.id, input.status);
        return { success: true };
      }),
    deleteContact: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContact(input.id);
        return { success: true };
      }),
  }),

  // ── NLP Course routers ─────────────────────────────────────────────────────
  lessonUpdates: lessonUpdatesRouter,
  nlp: nlpChatRouter,
  registration: registrationRouter,
  lessonTranslate: lessonTranslateRouter,
  slideTranslate: slideTranslateRouter,
  lessonProgress: lessonProgressRouter,
  surveyExam: surveyExamRouter,
  expandSlide: expandSlideRouter,
  lessonPosition: lessonPositionRouter,
  certificate: certificateRouter,
  nlpAdmin: nlpAdminRouter,
  examVersions: examVersionsRouter,
  nikud: nikudRouter,
  pronunciationOverrides: pronunciationOverridesRouter,
  courseIndex: courseIndexRouter,
  ttsSettings: ttsSettingsRouter,
  tts: ttsRouter,

  // ── Admin Panel routers ───────────────────────────────────────────────────────────────────────────────
  adminArticles: adminArticlesRouter,
  adminSeo: adminSeoRouter,
  adminSiteContent: adminSiteContentRouter,
  adminBooks: adminBooksRouter,
  adminFaq: adminFaqRouter,
});

export type AppRouter = typeof appRouter;
