// RegistrationGate.tsx
// Full-screen gate shown before course content.
// Two tabs: Register (new student) | Login (returning student)
// Stores JWT token in localStorage under "nlp_course_token"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Eye, EyeOff, Loader2, UserPlus, LogIn } from "lucide-react";

const TOKEN_KEY = "nlp_course_token";

export function getStoredToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function storeToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

interface Props {
  onAuthenticated: (fullName: string) => void;
}

export default function RegistrationGate({ onAuthenticated }: Props) {
  const [tab, setTab] = useState<"register" | "login">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const registerMutation = trpc.registration.register.useMutation({
    onSuccess: (data) => {
      storeToken(data.token);
      onAuthenticated(data.fullName);
    },
    onError: (err) => setError(err.message),
  });

  const loginMutation = trpc.registration.login.useMutation({
    onSuccess: (data) => {
      storeToken(data.token);
      onAuthenticated(data.fullName);
    },
    onError: (err) => setError(err.message),
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    registerMutation.mutate({
      fullName: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      emailOptIn,
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  const inputStyle = {
    background: "oklch(0.11 0.008 265)",
    border: "1px solid oklch(0.24 0.012 265)",
    color: "oklch(0.90 0.005 65)",
    borderRadius: "0.5rem",
    height: "2.25rem",
    fontSize: "0.85rem",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg, oklch(0.10 0.012 265), oklch(0.07 0.006 265))" }}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo & Title */}
        <div className="text-center mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)" }}
          >
            <Brain size={22} className="text-black" />
          </div>
          <h1 className="text-xl font-bold mb-0.5" style={{ color: "#F0C040" }}>
            קורס NLP Practitioner
          </h1>
          <p className="text-xs" style={{ color: "oklch(0.55 0.01 265)" }}>
            מאיר שמעו עשור | NLP Trainer מוסמך
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "oklch(0.14 0.012 265)",
            border: "1px solid oklch(0.22 0.012 265)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          }}
        >
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: "1px solid oklch(0.20 0.012 265)" }}>
            {(["register", "login"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className="flex-1 py-2.5 text-xs font-semibold transition-colors"
                style={{
                  color: tab === t ? "#F0C040" : "oklch(0.50 0.01 265)",
                  borderBottom: tab === t ? "2px solid #F0C040" : "2px solid transparent",
                  background: "transparent",
                }}
              >
                {t === "register" ? (
                  <span className="flex items-center justify-center gap-1.5"><UserPlus size={13} /> הרשמה</span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5"><LogIn size={13} /> כניסה</span>
                )}
              </button>
            ))}
          </div>

          <div className="px-5 py-4">
            <AnimatePresence mode="wait">
              {tab === "register" ? (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-3"
                >
                  <div>
                    <Label className="text-xs mb-1 block font-medium" style={{ color: "oklch(0.70 0.01 265)" }}>
                      שם מלא *
                    </Label>
                    <Input
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="ישראל ישראלי"
                      required
                      className="text-right"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-medium" style={{ color: "oklch(0.70 0.01 265)" }}>
                      כתובת מייל *
                    </Label>
                    <Input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="israel@example.com"
                      required
                      dir="ltr"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-medium" style={{ color: "oklch(0.70 0.01 265)" }}>
                      טלפון נייד *
                    </Label>
                    <Input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="050-1234567"
                      required
                      dir="ltr"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-medium" style={{ color: "oklch(0.70 0.01 265)" }}>
                      סיסמה * (לפחות 6 תווים)
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="בחר סיסמה"
                        required
                        minLength={6}
                        dir="ltr"
                        style={{ ...inputStyle, paddingLeft: "2.25rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2"
                        style={{ color: "oklch(0.50 0.01 265)" }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Email opt-in checkbox */}
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={emailOptIn}
                      onChange={(e) => setEmailOptIn(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 rounded accent-yellow-400 cursor-pointer"
                    />
                    <span className="text-[11px] leading-relaxed" style={{ color: "oklch(0.55 0.01 265)" }}>
                      אני מסכים לקבל עדכונים ותכנים מהקורס בדוא״ל — ניתן לבטל בכל עת
                    </span>
                  </label>

                  {error && (
                    <p className="text-xs text-red-400 text-center py-1.5 px-2.5 rounded-lg"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full font-bold py-2 text-sm mt-1"
                    style={{
                      background: "linear-gradient(135deg, #C9A84C, #F0C040)",
                      color: "#000",
                      border: "none",
                      borderRadius: "0.5rem",
                      height: "2.25rem",
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin mx-auto" />
                    ) : (
                      "הירשם לקורס בחינם"
                    )}
                  </Button>

                  <p className="text-[11px] text-center" style={{ color: "oklch(0.45 0.01 265)" }}>
                    כבר נרשמת?{" "}
                    <button type="button" onClick={() => setTab("login")}
                      className="underline" style={{ color: "#C9A84C" }}>
                      לחץ כאן להתחברות
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-3"
                >
                  <div>
                    <Label className="text-xs mb-1 block font-medium" style={{ color: "oklch(0.70 0.01 265)" }}>
                      כתובת מייל
                    </Label>
                    <Input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="israel@example.com"
                      required
                      dir="ltr"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-medium" style={{ color: "oklch(0.70 0.01 265)" }}>
                      סיסמה
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="הסיסמה שלך"
                        required
                        dir="ltr"
                        style={{ ...inputStyle, paddingLeft: "2.25rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2"
                        style={{ color: "oklch(0.50 0.01 265)" }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 text-center py-1.5 px-2.5 rounded-lg"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full font-bold py-2 text-sm mt-1"
                    style={{
                      background: "linear-gradient(135deg, #C9A84C, #F0C040)",
                      color: "#000",
                      border: "none",
                      borderRadius: "0.5rem",
                      height: "2.25rem",
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin mx-auto" />
                    ) : (
                      "כניסה לקורס"
                    )}
                  </Button>

                  <p className="text-[11px] text-center" style={{ color: "oklch(0.45 0.01 265)" }}>
                    <a href="/nlp/forgot-password" style={{ color: "#C9A84C" }} className="underline">
                      שכחתי סיסמה
                    </a>
                  </p>

                  <p className="text-[11px] text-center" style={{ color: "oklch(0.45 0.01 265)" }}>
                    עדיין לא נרשמת?{" "}
                    <button type="button" onClick={() => setTab("register")}
                      className="underline" style={{ color: "#C9A84C" }}>
                      לחץ כאן להרשמה
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-[10px] text-center mt-3" style={{ color: "oklch(0.35 0.01 265)" }}>
          הפרטים שלך מאובטחים ולא יועברו לצד שלישי
        </p>
      </motion.div>
    </div>
  );
}
