import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ENV } from "./env";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { registrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Helper: verify admin_session cookie JWT
async function verifyAdminSessionCookie(ctx: TrpcContext): Promise<boolean> {
  try {
    const parsed = (ctx.req as any)?.cookies?.admin_session;
    const cookieHeader = (ctx.req as any)?.headers?.cookie || "";
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    const token = parsed || (match ? match[1] : null);
    if (!token) return false;
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "admin-secret");
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Path 1: Manus OAuth admin
    if (ctx.user && ctx.user.role === 'admin') {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }

    // Path 2: admin_session cookie (Railway /admin login)
    const hasCookieAdmin = await verifyAdminSessionCookie(ctx);
    if (hasCookieAdmin) {
      return next({ ctx });
    }

    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }),
);

/**
 * ownerProcedure — accepts EITHER Manus admin OAuth, admin_session cookie,
 * OR a valid registration token belonging to the OWNER_EMAIL address.
 */
export const ownerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    // Path 1: Manus OAuth admin
    if (ctx.user && ctx.user.role === 'admin') {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }
    // Path 2: admin_session cookie (Railway /admin login)
    const hasCookieAdmin = await verifyAdminSessionCookie(ctx);
    if (hasCookieAdmin) {
      return next({ ctx });
    }
    // Path 3: registration token in x-owner-token header
    const authHeader = ctx.req.headers['x-owner-token'] as string | undefined;
    const ownerEmail = ENV.ownerEmail;
    if (authHeader && ownerEmail) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'nlp-course-secret';
        const payload = jwt.verify(authHeader, JWT_SECRET) as { id: number; email: string };
        const db = await getDb();
        if (db) {
          const rows = await db
            .select({ email: registrations.email })
            .from(registrations)
            .where(eq(registrations.id, payload.id))
            .limit(1);
          if (rows.length > 0 && rows[0].email.toLowerCase() === ownerEmail.toLowerCase()) {
            return next({ ctx });
          }
        }
      } catch {
        // invalid token — fall through to error
      }
    }
    throw new TRPCError({ code: 'FORBIDDEN', message: 'גישה מוגבלת — מנהלים בלבד' });
  }),
);
