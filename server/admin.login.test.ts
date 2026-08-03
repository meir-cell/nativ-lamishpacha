/**
 * Validates that the standalone admin login endpoint works
 * with the ADMIN_USERNAME / ADMIN_PASSWORD env vars.
 */
import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

describe("Standalone admin login", () => {
  it("rejects wrong credentials with 401", async () => {
    const res = await fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "wrong", password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when no session cookie is sent to /api/admin/me", async () => {
    const res = await fetch(`${BASE}/api/admin/me`);
    expect(res.status).toBe(401);
  });

  it("logs in with correct credentials and can call /api/admin/me", async () => {
    const user = process.env.ADMIN_USERNAME || "admin";
    const pass = process.env.ADMIN_PASSWORD || "";
    if (!pass) {
      console.warn("ADMIN_PASSWORD not set — skipping success-path test");
      return;
    }

    const loginRes = await fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    expect(loginRes.status).toBe(200);

    // Extract session cookie
    const setCookie = loginRes.headers.get("set-cookie") || "";
    const cookieMatch = setCookie.match(/nativ_admin_session=([^;]+)/);
    expect(cookieMatch).not.toBeNull();
    const sessionCookie = `nativ_admin_session=${cookieMatch![1]}`;

    // Call /api/admin/me with the cookie
    const meRes = await fetch(`${BASE}/api/admin/me`, {
      headers: { Cookie: sessionCookie },
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.ok).toBe(true);
    expect(meData.username).toBe(user);
  });
});
