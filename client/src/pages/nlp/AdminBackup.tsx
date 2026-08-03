import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Download, Database, Code2, Package, AlertTriangle,
  CheckCircle2, Loader2, ChevronLeft, Shield, Info,
} from "lucide-react";

export default function AdminBackup() {
  const { user: authUser, loading: authLoading } = useAuth();
  const ownerToken = typeof window !== "undefined" ? localStorage.getItem("nlp_course_token") || "" : "";
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin-token") || "" : "";

  const isAdminViaOAuth = authUser?.role === "admin";
  const hasTokenAccess = !!(ownerToken || adminToken);
  const hasAccess = isAdminViaOAuth || hasTokenAccess;

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState("");

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
          <p className="text-sm mb-6" style={{ color: "#8888aa" }}>
            יש להתחבר עם חשבון הבעלים כדי לגשת לדשבורד.
          </p>
          <Link href="/nlp" className="text-amber-400 underline text-sm">חזרה לקורס</Link>
        </div>
      </div>
    );
  }

  async function handleDownload() {
    setStatus("loading");
    setErrorMsg("");
    setProgress("מכין גיבוי...");

    try {
      const headers: Record<string, string> = {};

      // Use the owner token from localStorage (same as NLP admin panel)
      if (ownerToken) {
        headers["x-owner-token"] = ownerToken;
      } else if (adminToken) {
        headers["x-admin-secret"] = adminToken;
      }

      setProgress("מתחבר לשרת...");
      const resp = await fetch("/api/backup/full", { headers });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `שגיאה ${resp.status}`);
      }

      setProgress("מוריד קובץ גיבוי...");
      const blob = await resp.blob();

      if (blob.size < 100) {
        throw new Error("קובץ הגיבוי ריק — נסה שוב");
      }

      // Trigger browser download
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

      setStatus("success");
      setProgress("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
      setStatus("error");
      setProgress("");
    }
  }

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{ background: "#0a0a12", color: "#e8e8f0", fontFamily: "'Segoe UI', Arial, sans-serif", direction: "rtl" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)" }}
          >
            <Package size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#F0C040" }}>גיבוי האתר</h1>
            <p className="text-sm" style={{ color: "#8888aa" }}>הורדת גיבוי מלא — מסד נתונים + קוד מקור</p>
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

        {/* What's included */}
        <div
          className="rounded-xl p-6 mb-6 border"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <h2 className="text-base font-bold mb-4" style={{ color: "#F0C040" }}>מה כולל הגיבוי?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Database size={20} style={{ color: "#4CAF50", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="font-semibold text-sm" style={{ color: "#e8e8f0" }}>מסד נתונים (MySQL)</div>
                <div className="text-xs mt-1" style={{ color: "#8888aa" }}>
                  כל הטבלאות, הנרשמים, ההתקדמות, המבחנים, ההגדרות — קובץ SQL מלא
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Code2 size={20} style={{ color: "#2196F3", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="font-semibold text-sm" style={{ color: "#e8e8f0" }}>קוד מקור האתר</div>
                <div className="text-xs mt-1" style={{ color: "#8888aa" }}>
                  כל קבצי הפרויקט (ללא node_modules, dist, .git)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download button */}
        <div
          className="rounded-xl p-6 border"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} style={{ color: "#F0C040" }} />
            <h2 className="text-base font-bold" style={{ color: "#F0C040" }}>הורדת גיבוי</h2>
          </div>

          <p className="text-sm mb-6" style={{ color: "#8888aa" }}>
            לחץ על הכפתור להורדת גיבוי מלא. הגיבוי מוגן — רק הבעלים יכול להוריד אותו.
            הגיבוי עשוי לקחת 1-2 דקות.
          </p>

          <button
            onClick={handleDownload}
            disabled={status === "loading"}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all disabled:opacity-60 w-full sm:w-auto justify-center"
            style={{
              background: status === "loading" ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg, #C9A84C, #F0C040)",
              color: "#0a0a12",
              cursor: status === "loading" ? "not-allowed" : "pointer",
              transform: status === "loading" ? "none" : undefined,
            }}
          >
            {status === "loading" ? (
              <><Loader2 size={18} className="animate-spin" /> {progress || "מכין גיבוי..."}</>
            ) : (
              <><Download size={18} /> הורד גיבוי מלא (ZIP)</>
            )}
          </button>

          {status === "success" && (
            <div className="flex items-center gap-2 mt-5 p-4 rounded-lg" style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)" }}>
              <CheckCircle2 size={18} style={{ color: "#4CAF50", flexShrink: 0 }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#4CAF50" }}>הגיבוי הורד בהצלחה!</div>
                <div className="text-xs mt-1" style={{ color: "#8888aa" }}>שמור את קובץ ה-ZIP במקום בטוח (דיסק קשיח, Google Drive, וכו')</div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-start gap-2 mt-5 p-4 rounded-lg" style={{ background: "rgba(244,67,54,0.1)", border: "1px solid rgba(244,67,54,0.3)" }}>
              <AlertTriangle size={18} style={{ color: "#f44336", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#f44336" }}>שגיאה בהורדת הגיבוי</div>
                <div className="text-xs mt-1" style={{ color: "#8888aa" }}>{errorMsg}</div>
              </div>
            </div>
          )}
        </div>

        {/* BACKUP_TOKEN fallback */}
        <div
          className="rounded-xl p-5 mt-6 border"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: "#C9A84C" }}>גיבוי ישיר (ללא כניסה לפאנל)</h3>
          <p className="text-xs mb-2" style={{ color: "#8888aa" }}>
            ניתן גם להוריד גיבוי ישירות מהדפדפן עם ה-BACKUP_TOKEN שמוגדר ב-Railway:
          </p>
          <code
            className="block text-xs p-3 rounded-lg"
            style={{ background: "rgba(0,0,0,0.4)", color: "#F0C040", direction: "ltr", wordBreak: "break-all" }}
          >
            https://nativ-lamishpacha.com/api/backup/full?token=YOUR_BACKUP_TOKEN
          </code>
        </div>

        {/* Tips */}
        <div
          className="rounded-xl p-5 mt-6 border"
          style={{ background: "rgba(33,150,243,0.06)", borderColor: "rgba(33,150,243,0.2)" }}
        >
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
