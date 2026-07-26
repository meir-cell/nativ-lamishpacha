import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const forgot = trpc.registration.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    forgot.mutate({ email, origin: window.location.origin });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      dir="rtl"
      style={{ background: "oklch(0.14 0.02 65)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{
          background: "oklch(0.18 0.02 65)",
          border: "1px solid rgba(240,192,64,0.25)",
        }}
      >
        <h1
          className="text-2xl font-bold mb-2 text-center"
          style={{ color: "oklch(0.85 0.12 75)" }}
        >
          שכחתי סיסמה
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: "oklch(0.65 0.005 65)" }}>
          הכנס את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה
        </p>

        {sent ? (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{
              background: "rgba(240,192,64,0.12)",
              border: "1px solid rgba(240,192,64,0.35)",
              color: "oklch(0.85 0.12 75)",
            }}
          >
            ✅ אם כתובת המייל קיימת במערכת, נשלח אליה קישור לאיפוס הסיסמה.
            <br />
            <span style={{ color: "oklch(0.65 0.005 65)" }}>
              בדוק את תיבת הדואר שלך (כולל ספאם).
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: "oklch(0.75 0.01 65)" }}>
                כתובת מייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: "#fff",
                  color: "#1a1400",
                  border: "1px solid rgba(240,192,64,0.35)",
                }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={forgot.isPending}
              className="rounded-xl py-3 font-semibold text-sm transition-all"
              style={{
                background: "oklch(0.72 0.15 75)",
                color: "#1a1400",
                opacity: forgot.isPending ? 0.7 : 1,
              }}
            >
              {forgot.isPending ? "שולח..." : "שלח קישור לאיפוס"}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-6" style={{ color: "oklch(0.55 0.005 65)" }}>
          <Link href="/nlp" style={{ color: "oklch(0.72 0.15 75)" }}>
            ← חזרה לכניסה
          </Link>
        </p>
      </div>
    </div>
  );
}
