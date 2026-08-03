import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  Mail, Phone, MessageSquare, CheckCircle2, Clock,
  Trash2, Eye, RefreshCw, LogOut, Users, BarChart3,
  ChevronDown, ChevronUp, AlertCircle, Lock, User,
  Download, Shield, Archive
} from "lucide-react";

type ContactStatus = "new" | "read" | "replied";

const statusLabel: Record<ContactStatus, string> = {
  new: "חדש",
  read: "נקרא",
  replied: "נענה",
};

const statusColor: Record<ContactStatus, string> = {
  new: "#C4956A",
  read: "#6B7C5C",
  replied: "#5C4033",
};

function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
      style={{ background: statusColor[status] }}
    >
      {status === "new" && <AlertCircle size={10} />}
      {status === "read" && <Eye size={10} />}
      {status === "replied" && <CheckCircle2 size={10} />}
      {statusLabel[status]}
    </span>
  );
}

function ContactCard({
  contact,
  onStatusChange,
  onDelete,
}: {
  contact: {
    id: number;
    name: string;
    email: string;
    phone: string;
    message: string;
    status: ContactStatus;
    createdAt: string | Date;
  };
  onStatusChange: (id: number, status: ContactStatus) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(contact.createdAt).toLocaleDateString("he-IL", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-50/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp size={16} style={{ color: "var(--brand-gold)" }} /> : <ChevronDown size={16} style={{ color: "var(--brand-gold)" }} />}
          <span className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{date}</span>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{contact.name}</div>
            <div className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{contact.phone}</div>
          </div>
          <StatusBadge status={contact.status} />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(196,149,106,0.1)" }}>
          <div className="pt-4 space-y-3 text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{contact.email}</span>
              <Mail size={14} style={{ color: "var(--brand-gold)" }} />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{contact.phone}</span>
              <Phone size={14} style={{ color: "var(--brand-gold)" }} />
            </div>
            {contact.message && (
              <div className="flex items-start gap-2 justify-end">
                <p className="text-sm leading-relaxed" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>
                  {contact.message}
                </p>
                <MessageSquare size={14} style={{ color: "var(--brand-gold)", flexShrink: 0, marginTop: 2 }} />
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2 flex-wrap">
              <a
                href={`https://wa.me/972${contact.phone.replace(/^0/, "").replace(/-/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                style={{ background: "#25D366" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                וואטסאפ
              </a>
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                style={{ background: "var(--brand-gold)" }}
              >
                <Mail size={12} />
                שלח מייל
              </a>
              {contact.status !== "replied" && (
                <button
                  onClick={() => onStatusChange(contact.id, "replied")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                  style={{ background: "#6B7C5C" }}
                >
                  <CheckCircle2 size={12} />
                  סמן כנענה
                </button>
              )}
              {contact.status === "new" && (
                <button
                  onClick={() => onStatusChange(contact.id, "read")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                  style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-dark)" }}
                >
                  <Eye size={12} />
                  סמן כנקרא
                </button>
              )}
              <button
                onClick={() => onDelete(contact.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}
              >
                <Trash2 size={12} />
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STANDALONE ADMIN SESSION HOOK ────────────────────────────────────────────
function useAdminSession() {
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSession({ username: data.username });
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setSession(null);
  };

  return { session, loading, logout, refetch: checkSession };
}

// ── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [filter, setFilter] = useState<ContactStatus | "all">("all");
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"contacts" | "backup">("contacts");
  const [backupStatus, setBackupStatus] = useState<string>("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isEmailingBackup, setIsEmailingBackup] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/contacts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleStatusChange = async (id: number, status: ContactStatus) => {
    await fetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    fetchContacts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("למחוק פנייה זו?")) return;
    // Use the tRPC endpoint for delete
    try {
      const res = await fetch("/api/trpc/admin.deleteContact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ json: { id } }),
      });
      if (res.ok) fetchContacts();
    } catch (e) { console.error(e); }
  };

  const handleDownloadBackup = async () => {
    setIsBackingUp(true);
    setBackupStatus("מכין גיבוי...");
    try {
      const res = await fetch("/api/backup/full", { credentials: "include" });
      if (!res.ok) throw new Error("שגיאה ביצירת הגיבוי");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `nativ-backup-${ts}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus("✅ הגיבוי הורד בהצלחה!");
    } catch (e: any) {
      setBackupStatus(`❌ שגיאה: ${e.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleEmailBackup = async () => {
    setIsEmailingBackup(true);
    setBackupStatus("שולח גיבוי למייל...");
    try {
      const res = await fetch("/api/backup/send-email", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setBackupStatus(`✅ הגיבוי נשלח ל-${data.sentTo} (${data.sizeMB} MB)`);
      } else {
        setBackupStatus(`❌ שגיאה: ${data.error}`);
      }
    } catch (e: any) {
      setBackupStatus(`❌ שגיאה: ${e.message}`);
    } finally {
      setIsEmailingBackup(false);
    }
  };

  const filtered = contacts.filter(c => filter === "all" ? true : c.status === filter);

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "var(--brand-cream)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: "var(--brand-dark)" }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={fetchContacts}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "white" }}
              title="רענן"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Assistant', sans-serif" }}
            >
              <LogOut size={14} />
              יציאה
            </button>
          </div>
          <div className="text-right">
            <div className="font-bold text-white text-lg" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
              ממשק ניהול
            </div>
            <div className="text-xs" style={{ color: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>
              נתיב למשפחה — מאיר שמעון עשור
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4 pb-0 flex gap-1 justify-end">
          {[
            { key: "contacts", label: "פניות", icon: Users },
            { key: "backup", label: "גיבוי", icon: Archive },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors"
              style={{
                background: activeTab === tab.key ? "var(--brand-cream)" : "transparent",
                color: activeTab === tab.key ? "var(--brand-dark)" : "rgba(255,255,255,0.7)",
                fontFamily: "'Assistant', sans-serif",
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* ── CONTACTS TAB ── */}
        {activeTab === "contacts" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "סה״כ פניות", value: stats?.total ?? 0, icon: Users, color: "var(--brand-dark)" },
                { label: "פניות חדשות", value: stats?.newCount ?? 0, icon: AlertCircle, color: "var(--brand-gold)" },
                { label: "נקראו", value: stats?.readCount ?? 0, icon: Eye, color: "#6B7C5C" },
                { label: "נענו", value: stats?.repliedCount ?? 0, icon: CheckCircle2, color: "#5C4033" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-5 text-right" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <s.icon size={20} style={{ color: s.color }} />
                    <div className="text-3xl font-black" style={{ color: s.color, fontFamily: "'Noto Serif Hebrew', serif" }}>
                      {s.value}
                    </div>
                  </div>
                  <div className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap justify-end">
              {[
                { key: "all", label: "הכל" },
                { key: "new", label: "חדשות" },
                { key: "read", label: "נקראו" },
                { key: "replied", label: "נענו" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as ContactStatus | "all")}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: filter === f.key ? "var(--brand-gold)" : "white",
                    color: filter === f.key ? "white" : "var(--brand-dark)",
                    border: "1px solid rgba(196,149,106,0.3)",
                    fontFamily: "'Assistant', sans-serif",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Contacts list */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <RefreshCw size={32} className="animate-spin" style={{ color: "var(--brand-gold)" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
                אין פניות להצגה
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(c => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── BACKUP TAB ── */}
        {activeTab === "backup" && (
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-xl font-bold text-right mb-6" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
              גיבוי האתר
            </h2>

            {/* Download backup */}
            <div className="rounded-2xl p-6 text-right" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
              <div className="flex items-center gap-3 justify-end mb-3">
                <div>
                  <h3 className="font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>הורד גיבוי</h3>
                  <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
                    מסד נתונים + קוד האתר כקובץ ZIP
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(196,149,106,0.1)" }}>
                  <Download size={22} style={{ color: "var(--brand-gold)" }} />
                </div>
              </div>
              <button
                onClick={handleDownloadBackup}
                disabled={isBackingUp}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}
              >
                {isBackingUp ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                {isBackingUp ? "מכין גיבוי..." : "הורד גיבוי מלא (ZIP)"}
              </button>
            </div>

            {/* Email backup */}
            <div className="rounded-2xl p-6 text-right" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
              <div className="flex items-center gap-3 justify-end mb-3">
                <div>
                  <h3 className="font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>שלח גיבוי למייל</h3>
                  <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
                    שולח את הגיבוי ישירות לכתובת המייל שלך
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(107,124,92,0.1)" }}>
                  <Mail size={22} style={{ color: "#6B7C5C" }} />
                </div>
              </div>
              <button
                onClick={handleEmailBackup}
                disabled={isEmailingBackup}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#6B7C5C", fontFamily: "'Assistant', sans-serif" }}
              >
                {isEmailingBackup ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />}
                {isEmailingBackup ? "שולח..." : "שלח גיבוי למייל"}
              </button>
            </div>

            {/* Status message */}
            {backupStatus && (
              <div
                className="rounded-xl p-4 text-right text-sm font-medium"
                style={{
                  background: backupStatus.startsWith("✅") ? "rgba(107,124,92,0.1)" : backupStatus.startsWith("❌") ? "rgba(220,38,38,0.1)" : "rgba(196,149,106,0.1)",
                  color: backupStatus.startsWith("✅") ? "#6B7C5C" : backupStatus.startsWith("❌") ? "#dc2626" : "var(--brand-dark)",
                  fontFamily: "'Assistant', sans-serif",
                }}
              >
                {backupStatus}
              </div>
            )}

            <div className="rounded-xl p-4 text-right text-sm" style={{ background: "rgba(196,149,106,0.08)", color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
              <strong style={{ color: "var(--brand-dark)" }}>גיבוי אוטומטי שבועי</strong> — מוגדר לרוץ כל יום ראשון ב-06:00 (שעון ישראל).
              לשליחה במייל יש להגדיר SMTP בהגדרות השרת.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── LOGIN FORM ────────────────────────────────────────────────────────────────
function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setError(data.error || "שגיאה בהתחברות");
      }
    } catch {
      setError("שגיאת רשת — נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "var(--brand-dark)" }}>
      <div className="w-full max-w-sm mx-4">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--brand-gold)" }}
          >
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
            ממשק ניהול
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Assistant', sans-serif" }}>
            נתיב למשפחה — מאיר שמעון עשור
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "white" }}
        >
          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
              שם משתמש
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-3 pr-10 rounded-xl border text-right outline-none transition-all"
                style={{
                  borderColor: "rgba(196,149,106,0.3)",
                  fontFamily: "'Assistant', sans-serif",
                  fontSize: "15px",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--brand-gold)")}
                onBlur={e => (e.target.style.borderColor = "rgba(196,149,106,0.3)")}
                placeholder="הכנס שם משתמש"
              />
              <User size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: "var(--brand-mid)" }} />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
              סיסמה
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-10 rounded-xl border text-right outline-none transition-all"
                style={{
                  borderColor: "rgba(196,149,106,0.3)",
                  fontFamily: "'Assistant', sans-serif",
                  fontSize: "15px",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--brand-gold)")}
                onBlur={e => (e.target.style.borderColor = "rgba(196,149,106,0.3)")}
                placeholder="הכנס סיסמה"
              />
              <Lock size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: "var(--brand-mid)" }} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-right" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", fontFamily: "'Assistant', sans-serif" }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            style={{ background: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>

        <a
          href="/"
          className="block text-center mt-4 text-sm transition-colors hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Assistant', sans-serif" }}
        >
          ← חזרה לאתר
        </a>
      </div>
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function Admin() {
  const { session, loading, logout, refetch } = useAdminSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "var(--brand-cream)" }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: "var(--brand-gold)" }} />
      </div>
    );
  }

  if (!session) {
    return <AdminLoginForm onSuccess={refetch} />;
  }

  return <AdminDashboard onLogout={logout} />;
}
