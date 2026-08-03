/**
 * useNlpAdminAuth — unified NLP admin authentication hook.
 *
 * Access is granted via ANY of these methods (checked in order):
 * 1. Manus OAuth: authUser.role === "admin"
 * 2. admin_session cookie: validated via GET /api/admin/me (works on Railway after /admin login)
 * 3. nlp_course_token in localStorage (owner registration JWT)
 * 4. admin-token in localStorage (legacy ADMIN_SECRET token)
 *
 * Returns:
 *   loading    — true while checking auth
 *   hasAccess  — true if any method grants access
 *   ownerToken — the nlp_course_token (for tRPC calls that need it)
 *   adminToken — the admin-token (for tRPC calls that need it)
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export interface NlpAdminAuth {
  loading: boolean;
  hasAccess: boolean;
  ownerToken: string;
  adminToken: string;
}

export function useNlpAdminAuth(): NlpAdminAuth {
  const { user: authUser, loading: authLoading } = useAuth();

  const ownerToken =
    typeof window !== "undefined" ? localStorage.getItem("nlp_course_token") || "" : "";
  const adminToken =
    typeof window !== "undefined" ? localStorage.getItem("admin-token") || "" : "";

  // Method 1: Manus OAuth admin
  const isOAuthAdmin = !authLoading && authUser?.role === "admin";

  // Method 3 & 4: localStorage tokens
  const hasTokenAccess = !!(ownerToken || adminToken);

  // Method 2: admin_session cookie (Railway /admin login)
  const [cookieAdmin, setCookieAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // Only check if we don't already have access via other methods
    if (isOAuthAdmin || hasTokenAccess) {
      setCookieAdmin(false); // don't need it
      return;
    }
    let cancelled = false;
    fetch("/api/admin/me", { credentials: "include" })
      .then(r => {
        if (!cancelled) setCookieAdmin(r.ok);
      })
      .catch(() => {
        if (!cancelled) setCookieAdmin(false);
      });
    return () => { cancelled = true; };
  }, [isOAuthAdmin, hasTokenAccess]);

  const loading =
    authLoading || (!isOAuthAdmin && !hasTokenAccess && cookieAdmin === null);

  const hasAccess = isOAuthAdmin || hasTokenAccess || cookieAdmin === true;

  return { loading, hasAccess, ownerToken, adminToken };
}
