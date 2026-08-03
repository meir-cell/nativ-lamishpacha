/**
 * Shared admin authentication helper for tRPC admin routers.
 * Reads the admin_session JWT cookie set by /api/admin/login.
 */
import { TRPCError } from "@trpc/server";

function getAdminToken(ctx: any): string | null {
  // cookie-parser puts parsed cookies in req.cookies; raw header is fallback
  const parsed = ctx.req?.cookies?.admin_session;
  if (parsed) return parsed;
  const cookieHeader = ctx.req?.headers?.cookie || "";
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  return match ? match[1] : null;
}

export async function verifyAdmin(ctx: any): Promise<void> {
  const token = getAdminToken(ctx);
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin session required" });
  }
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
    await jwtVerify(token, secret);
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired admin session" });
  }
}
