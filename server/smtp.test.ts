import { describe, it, expect } from "vitest";

/**
 * SMTP configuration test — verifies that all required SMTP env vars are set.
 * Does NOT actually send an email (avoids network calls in CI).
 */
describe("SMTP configuration", () => {
  it("should have SMTP_HOST set", () => {
    expect(process.env.SMTP_HOST).toBeTruthy();
  });

  it("should have SMTP_USER set", () => {
    expect(process.env.SMTP_USER).toBeTruthy();
  });

  it("should have SMTP_PASS set", () => {
    expect(process.env.SMTP_PASS).toBeTruthy();
  });

  it("should have SMTP_PORT set to a valid number", () => {
    const port = parseInt(process.env.SMTP_PORT || "0", 10);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  it("should have SMTP_FROM set to a valid email", () => {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "";
    expect(from).toMatch(/@/);
  });
});
