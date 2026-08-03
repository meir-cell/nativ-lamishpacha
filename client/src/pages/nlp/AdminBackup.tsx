import { useState, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Download, Database, Code2, Package, AlertTriangle,
  CheckCircle2, Loader2, ChevronLeft, Shield, Info,
  Mail, Upload, RotateCcw, Calendar, Clock,
} from "lucide-react";

type TabKey = "download" | "restore" | "email" | "auto";

export default function AdminBackup() {
  const { user: authUser, loading: authLoading } = useAuth();
  const ownerToken = typeof window !== "undefined" ? localStorage.getItem("nlp_course_token") || "" : "";
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin-token") || "" : "";

  const isAdminViaOAuth = authUser?.role === "admin";
  const hasTokenAccess = !!(ownerToken || adminToken);
  const hasAccess = isAdminViaOAuth || hasTokenAccess;

  const [activeTab, setActiveTab] = useState<TabKey>("download");

  // Download state
  const [dlStatus, setDlStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [dlError, setDlError] = useState("");
  const [dlProgress, setDlProgress] = useState("");

  // Email state
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailMsg, setEmailMsg] = useState("");

  // Restore state
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [restoreMsg, setRestoreMsg] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { label: "דשבורד", href: "/nlp/admin" },
    { label: "רישומים", href: "/nlp/admin/registrations" },
    { label: "עדכוני תוכן", href: "/nlp/admin/updates" },
    { label: "סקרים", href: "/nlp/admin/surveys" },
    { label: "הגדרות", href: "/nlp/admin/settings" },
    { label: "מילון הגייה", href: "/nlp/admin/pronunciation" },
    { label: "עורך הקראה", href: "/nlp/admin/tts-editor" },
    { label: "גיבוי", href: "/nlp/admin/backup", active: true },
  ];

  const getAuthHeaders = (): Record<string, string> => {
    if (ownerToken) return { "x-owner-token": ownerToken };
    if (adminToken) return { "x-admin-secret": adminToken };
    return {};
  };

  async function handleDownload() {
    setDlStatus("loading");
    setDlError("");
    setDlProgress("מכין גיבוי...");
    try {
      setDlProgress("מתחבר לשרת...");
      const resp = await fetch("/api/backup/full", { headers: getAuthHeaders(), credentials: "include" });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `שגיאה ${resp.status}`);
      }
      setDlProgress("מוריד קובץ גיבוי...");
      const blob = await resp.blob();
      if (blob.size < 100) throw new Error("קובץ הגיבוי ריק — נסה שוב");
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      const cd = resp.headers.get("content-disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match ? match[1] : `nativ-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      setDlStatus("success");
      setDlProgress("");
    } catch (err: unknown) {
      setDlError(err instanceof Error ? err.message : String(err));
      setDlStatus("error");
      setDlProgress("");
    }
  }

  async function handleEmailBackup() {
    setEmailStatus("loading");
    setEmailMsg("שולח גיבוי למייל...");
    try {
      const resp = await fetch("/api/backup/send-email", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await resp.json();
      if (resp.ok) {
        setEmailStatus("success");
        setEmailMsg(`✅ הגיבוי נשלח ל-${data.sentTo} (${data.sizeMB} MB)`);
      } else {
        setEmailStatus("error");
        setEmailMsg(`❌ שגיאה: ${data.error}`);
      }
    } catch (err: unknown) {
      setEmailStatus("error");
      setEmailMsg(`❌ שגיאת רשת: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleRestore() {
    if (!restoreFile) return;
    if (!confirm(`⚠️ שחזור יחליף את מסד הנתונים הנוכחי!\nהאם אתה בטוח שברצונך לשחזר מ-${restoreFile.name}?`)) return;

    setRestoreStatus("loading");
    setRestoreMsg("מעלה ומשחזר...");
    try {
      const formData = new FormData();
      formData.append("backup", restoreFile);
      const headers = getAuthHeaders();
      const resp = await fetch("/api/backup/restore", {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });
      const data = await resp.json();
      if (resp.ok) {
        setRestoreStatus("success");
        setRestoreMsg(`✅ שוחזר בהצלחה: ${(data.restored || []).join(", ")}`);
      } else {
        setRestoreStatus("error");
        setRestoreMsg(`❌ שגיאה: ${data.error}`);
      }
    } catch (err: unknown) {
      setRestoreStatus("error");
      setRestoreMsg(`❌ שגיאת רשת: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a12" }}>
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0a0a12", color: "#e8e8f0", direction: "rtl" }}>
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="mx-auto mb-4 text-amber-400" />
          <h1 className="text-xl font-bold mb-2" style={{ color: "#F0C040" }}>גישה לדשבורד מנהל</h1>
          <p className="text-sm mb-6" style={{ color: "#8888aa" }}>יש להתחבר עם חשבון הבעלים כדי לגשת לדשבורד.</p>
          <Link href="/nlp" className="text-amber-400 underline text-sm">חזרה לקורס</Link>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "download", label: "הורדת גיבוי", icon: Download },
    { key: "restore", label: "שחזור", icon: RotateCcw },
    { key: "email", label: "שלח למייל", icon: Mail },
    { key: "auto", label: "גיבוי אוטומטי", icon: Calendar },
  ];

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{ background: "#0a0a12", color: "#e8e8f0", fontFamily: "'Segoe UI', Arial, sans-serif", direction: "rtl" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)" }}>
            <Package size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#F0C040" }}>גיבוי האתר</h1>
            <p className="text-sm" style={{ color: "#8888aa" }}>ניהול גיבויים — הורדה, שחזור, ושליחה במייל</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: item.active ? "linear-gradient(135deg, #C9A84C, #F0C040)" : "rgba(255,255,255,0.05)",
                color: item.active ? "#0a0a12" : "#c8c8e0",
                border: item.active ? "none" : "1px solid rgba(255,255,255,0.08)",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "linear-gradient(135deg, #C9A84C, #F0C040)" : "rgba(255,255,255,0.05)",
                color: activeTab === tab.key ? "#0a0a12" : "#c8c8e0",
                border: activeTab === tab.key ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: DOWNLOAD ── */}
        {activeTab === "download" && (
          <div className="space-y-5">
            {/* What's included */}
            <div className="rounded-xl p-6 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="text-base font-bold mb-4" style={{ color: "#F0C040" }}>מה כולל הגיבוי?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Database size={20} style={{ color: "#4CAF50", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "#e8e8f0" }}>מסד נתונים (MySQL)</div>
                    <div className="text-xs mt-1" style={{ color: "#8888aa" }}>כל הטבלאות, הנרשמים, ההתקדמות, המבחנים, ההגדרות</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code2 size={20} style={{ color: "#2196F3", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "#e8e8f0" }}>קוד מקור האתר</div>
                    <div className="text-xs mt-1" style={{ color: "#8888aa" }}>כל קבצי הפרויקט (ללא node_modules, dist, .git)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Download button */}
            <div className="rounded-xl p-6 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} style={{ color: "#F0C040" }} />
                <h2 className="text-base font-bold" style={{ color: "#F0C040" }}>הורדת גיבוי</h2>
              </div>
              <p className="text-sm mb-6" style={{ color: "#8888aa" }}>לחץ להורדת גיבוי מלא. הגיבוי מוגן — רק הבעלים יכול להוריד אותו. הגיבוי עשוי לקחת 1-2 דקות.</p>
              <button
                onClick={handleDownload}
                disabled={dlStatus === "loading"}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all disabled:opacity-60 w-full sm:w-auto justify-center"
                style={{ background: dlStatus === "loading" ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg, #C9A84C, #F0C040)", color: "#0a0a12" }}
              >
                {dlStatus === "loading" ? <><Loader2 size={18} className="animate-spin" /> {dlProgress || "מכין..."}</> : <><Download size={18} /> הורד גיבוי מלא (ZIP)</>}
              </button>
              {dlStatus === "success" && (
                <div className="flex items-center gap-2 mt-5 p-4 rounded-lg" style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)" }}>
                  <CheckCircle2 size={18} style={{ color: "#4CAF50" }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#4CAF50" }}>הגיבוי הורד בהצלחה!</div>
                    <div className="text-xs mt-1" style={{ color: "#8888aa" }}>שמור את קובץ ה-ZIP במקום בטוח</div>
                  </div>
                </div>
              )}
              {dlStatus === "error" && (
                <div className="flex items-start gap-2 mt-5 p-4 rounded-lg" style={{ background: "rgba(244,67,54,0.1)", border: "1px solid rgba(244,67,54,0.3)" }}>
                  <AlertTriangle size={18} style={{ color: "#f44336", flexShrink: 0 }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#f44336" }}>שגיאה בהורדה</div>
                    <div className="text-xs mt-1" style={{ color: "#8888aa" }}>{dlError}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: RESTORE ── */}
        {activeTab === "restore" && (
          <div className="rounded-xl p-6 border space-y-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw size={18} style={{ color: "#F0C040" }} />
              <h2 className="text-base font-bold" style={{ color: "#F0C040" }}>שחזור מקובץ גיבוי</h2>
            </div>

            <div className="p-4 rounded-lg" style={{ background: "rgba(244,67,54,0.08)", border: "1px solid rgba(244,67,54,0.25)" }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} style={{ color: "#f44336" }} />
                <span className="text-sm font-bold" style={{ color: "#f44336" }}>אזהרה חשובה</span>
              </div>
              <p className="text-xs" style={{ color: "#cc8888" }}>
                שחזור מגיבוי ישחרר את מסד הנתונים הנוכחי ויחליף אותו בנתונים מהגיבוי.
                פעולה זו <strong>אינה הפיכה</strong>. ודא שיש לך גיבוי עדכני לפני השחזור.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#c8c8e0" }}>בחר קובץ גיבוי (ZIP)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.07)", color: "#c8c8e0", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Upload size={16} />
                {restoreFile ? restoreFile.name : "בחר קובץ ZIP..."}
              </button>
              {restoreFile && (
                <p className="text-xs mt-2" style={{ color: "#8888aa" }}>
                  גודל: {(restoreFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>

            <button
              onClick={handleRestore}
              disabled={!restoreFile || restoreStatus === "loading"}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all disabled:opacity-40 w-full sm:w-auto justify-center"
              style={{ background: restoreStatus === "loading" ? "rgba(244,67,54,0.5)" : "#f44336", color: "white" }}
            >
              {restoreStatus === "loading" ? <><Loader2 size={18} className="animate-spin" /> משחזר...</> : <><RotateCcw size={18} /> שחזר מגיבוי</>}
            </button>

            {restoreMsg && (
              <div
                className="p-4 rounded-lg text-sm"
                style={{
                  background: restoreStatus === "success" ? "rgba(76,175,80,0.1)" : "rgba(244,67,54,0.1)",
                  border: `1px solid ${restoreStatus === "success" ? "rgba(76,175,80,0.3)" : "rgba(244,67,54,0.3)"}`,
                  color: restoreStatus === "success" ? "#4CAF50" : "#f44336",
                }}
              >
                {restoreMsg}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: EMAIL ── */}
        {activeTab === "email" && (
          <div className="rounded-xl p-6 border space-y-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Mail size={18} style={{ color: "#F0C040" }} />
              <h2 className="text-base font-bold" style={{ color: "#F0C040" }}>שליחת גיבוי למייל</h2>
            </div>
            <p className="text-sm" style={{ color: "#8888aa" }}>
              לחץ לשליחת גיבוי מלא ישירות לכתובת המייל של הבעלים.
              הגיבוי יישלח כקובץ ZIP מצורף למייל.
            </p>
            <div className="p-4 rounded-lg text-sm" style={{ background: "rgba(33,150,243,0.08)", border: "1px solid rgba(33,150,243,0.2)", color: "#8888aa" }}>
              <strong style={{ color: "#2196F3" }}>דרישה:</strong> יש להגדיר SMTP_HOST, SMTP_USER, SMTP_PASS ב-Railway Variables.
              ללא הגדרת SMTP, השליחה לא תעבוד.
            </div>
            <button
              onClick={handleEmailBackup}
              disabled={emailStatus === "loading"}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all disabled:opacity-60 w-full sm:w-auto justify-center"
              style={{ background: emailStatus === "loading" ? "rgba(33,150,243,0.5)" : "#2196F3", color: "white" }}
            >
              {emailStatus === "loading" ? <><Loader2 size={18} className="animate-spin" /> שולח...</> : <><Mail size={18} /> שלח גיבוי למייל</>}
            </button>
            {emailMsg && (
              <div
                className="p-4 rounded-lg text-sm"
                style={{
                  background: emailStatus === "success" ? "rgba(76,175,80,0.1)" : "rgba(244,67,54,0.1)",
                  border: `1px solid ${emailStatus === "success" ? "rgba(76,175,80,0.3)" : "rgba(244,67,54,0.3)"}`,
                  color: emailStatus === "success" ? "#4CAF50" : "#f44336",
                }}
              >
                {emailMsg}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: AUTO ── */}
        {activeTab === "auto" && (
          <div className="space-y-5">
            <div className="rounded-xl p-6 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} style={{ color: "#F0C040" }} />
                <h2 className="text-base font-bold" style={{ color: "#F0C040" }}>גיבוי אוטומטי שבועי</h2>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)" }}>
                <CheckCircle2 size={20} style={{ color: "#4CAF50", flexShrink: 0 }} />
                <div>
                  <div className="text-sm font-bold" style={{ color: "#4CAF50" }}>מוגדר ופעיל</div>
                  <div className="text-xs mt-0.5" style={{ color: "#8888aa" }}>הגיבוי האוטומטי יופעל לאחר פרסום האתר</div>
                </div>
              </div>
              <div className="space-y-3 text-sm" style={{ color: "#c8c8e0" }}>
                <div className="flex items-center gap-3">
                  <Clock size={16} style={{ color: "#C9A84C", flexShrink: 0 }} />
                  <span>מתי: <strong style={{ color: "#F0C040" }}>כל יום ראשון בשעה 06:00 (שעון ישראל)</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} style={{ color: "#C9A84C", flexShrink: 0 }} />
                  <span>שולח: גיבוי ZIP למייל הבעלים (אם SMTP מוגדר)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Database size={16} style={{ color: "#C9A84C", flexShrink: 0 }} />
                  <span>כולל: מסד נתונים מלא + קוד האתר</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5 border" style={{ background: "rgba(33,150,243,0.06)", borderColor: "rgba(33,150,243,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} style={{ color: "#2196F3" }} />
                <h3 className="text-sm font-bold" style={{ color: "#2196F3" }}>כדי שהגיבוי האוטומטי ישלח למייל</h3>
              </div>
              <p className="text-xs mb-3" style={{ color: "#8888aa" }}>הוסף את המשתנים הבאים ב-Railway → Variables:</p>
              <div className="space-y-2">
                {[
                  { key: "SMTP_HOST", example: "smtp.gmail.com" },
                  { key: "SMTP_USER", example: "your@gmail.com" },
                  { key: "SMTP_PASS", example: "your-app-password" },
                  { key: "SMTP_PORT", example: "587 (ברירת מחדל)" },
                ].map(({ key, example }) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <code className="px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.4)", color: "#F0C040" }}>{key}</code>
                    <span style={{ color: "#8888aa" }}>{example}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-xl p-5 mt-6 border" style={{ background: "rgba(33,150,243,0.06)", borderColor: "rgba(33,150,243,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} style={{ color: "#2196F3" }} />
            <h3 className="text-sm font-bold" style={{ color: "#2196F3" }}>המלצות לגיבוי</h3>
          </div>
          <ul className="text-sm space-y-1.5" style={{ color: "#8888aa" }}>
            <li>• עשה גיבוי לפני כל שינוי גדול באתר</li>
            <li>• שמור את הגיבוי בלפחות 2 מקומות שונים (מחשב + ענן)</li>
            <li>• מומלץ לעשות גיבוי אחת לשבוע</li>
            <li>• קובץ ה-ZIP כולל את כל הנתונים — שמור אותו בסיסמה אם אפשר</li>
          </ul>
        </div>

        <div className="mt-6">
          <Link href="/nlp/admin" className="flex items-center gap-1 text-sm" style={{ color: "#8888aa" }}>
            <ChevronLeft size={14} />
            חזרה לדשבורד
          </Link>
        </div>
      </div>
    </div>
  );
}
