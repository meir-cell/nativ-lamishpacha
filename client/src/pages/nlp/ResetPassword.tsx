import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
    else setError("קישור לא תקין. בקש קישור חדש.");
  }, []);

  const reset = trpc.registration.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    reset.mutate({ token, newPassword: password });
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
          איפוס סיסמה
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: "oklch(0.65 0.005 65)" }}>
          הכנס סיסמה חדשה לחשבונך
        </p>

        {success ? (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{
              background: "rgba(240,192,64,0.12)",
              border: "1px solid rgba(240,192,64,0.35)",
              color: "oklch(0.85 0.12 75)",
            }}
          >
            ✅ הסיסמה אופסה בהצלחה! מעביר אותך לדף הכניסה...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: "oklch(0.75 0.01 65)" }}>
                סיסמה חדשה
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="לפחות 6 תווים"
                className="rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: "#fff",
                  color: "#1a1400",
                  border: "1px solid rgba(240,192,64,0.35)",
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: "oklch(0.75 0.01 65)" }}>
                אימות סיסמה
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="הכנס שוב את הסיסמה"
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
              disabled={reset.isPending || !token}
              className="rounded-xl py-3 font-semibold text-sm transition-all"
              style={{
                background: "oklch(0.72 0.15 75)",
                color: "#1a1400",
                opacity: reset.isPending || !token ? 0.7 : 1,
              }}
            >
              {reset.isPending ? "מאפס..." : "אפס סיסמה"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
