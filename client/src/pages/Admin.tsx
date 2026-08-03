import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Mail, Phone, MessageSquare, CheckCircle2,
  Trash2, Eye, EyeOff, RefreshCw, LogOut, Users,
  ChevronDown, ChevronUp, AlertCircle, Lock, User,
  Download, Shield, Archive, Activity, KeyRound,
  ArrowRight, Send, CheckCircle, MapPin, Calendar
} from "lucide-react";

type ContactStatus = "new" | "read" | "replied";
type AdminTab = "contacts" | "backup" | "log";
type LoginView = "login" | "forgot" | "reset";

const statusLabel: Record<ContactStatus, string> = { new: "חדש", read: "נקרא", replied: "נענה" };
const statusColor: Record<ContactStatus, string> = { new: "#C4956A", read: "#6B7C5C", replied: "#5C4033" };

const actionLabels: Record<string, { label: string; color: string }> = {
  login: { label: "כניסה למערכת", color: "#6B7C5C" },
  login_failed: { label: "ניסיון כניסה נכשל", color: "#dc2626" },
  logout: { label: "יציאה מהמערכת", color: "#C4956A" },
  view_activity_log: { label: "צפייה ביומן", color: "#5C4033" },
  backup_download: { label: "הורדת גיבוי", color: "#6B7C5C" },
  backup_email: { label: "שליחת גיבוי למייל", color: "#6B7C5C" },
  forgot_password_request: { label: "בקשת איפוס סיסמה", color: "#C4956A" },
  password_reset: { label: "איפוס סיסמה", color: "#6B7C5C" },
};

function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: statusColor[status] }}>
      {status === "new" && <AlertCircle size={10} />}
      {status === "read" && <Eye size={10} />}
      {status === "replied" && <CheckCircle2 size={10} />}
      {statusLabel[status]}
    </span>
  );
}

function ContactCard({ contact, onStatusChange, onDelete }: {
  contact: { id: number; name: string; email: string; phone: string; message: string; status: ContactStatus; createdAt: string | Date };
  onStatusChange: (id: number, status: ContactStatus) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(contact.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-50/30 transition-colors" onClick={() => setExpanded(!expanded)}>
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
                <p className="text-sm leading-relaxed" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>{contact.message}</p>
                <MessageSquare size={14} style={{ color: "var(--brand-gold)", flexShrink: 0, marginTop: 2 }} />
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2 flex-wrap">
              <a href={"https://wa.me/972" + contact.phone.replace(/^0/, "").replace(/-/g, "")} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90" style={{ background: "#25D366" }}>
                וואטסאפ
              </a>
              <a href={"mailto:" + contact.email} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90" style={{ background: "var(--brand-gold)" }}>
                <Mail size={12} /> שלח מייל
              </a>
              {contact.status !== "replied" && (
                <button onClick={() => onStatusChange(contact.id, "replied")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90" style={{ background: "#6B7C5C" }}>
                  <CheckCircle2 size={12} /> סמן כנענה
                </button>
              )}
              {contact.status === "new" && (
                <button onClick={() => onStatusChange(contact.id, "read")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90" style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-dark)" }}>
                  <Eye size={12} /> סמן כנקרא
                </button>
              )}
              <button onClick={() => onDelete(contact.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
                <Trash2 size={12} /> מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityLogTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetchLogs = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/activity-log?limit=200", { credentials: "include" });
      if (res.ok) setLogs(await res.json());
      else setError("שגיאה בטעינת היומן");
    } catch { setError("שגיאת רשת"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" }) + " " + dt.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-amber-50" style={{ color: "var(--brand-gold)", border: "1px solid rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> רענן
        </button>
        <h2 className="text-xl font-bold text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>יומן פעולות</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw size={32} className="animate-spin" style={{ color: "var(--brand-gold)" }} /></div>
      ) : error ? (
        <div className="text-center py-8 text-red-500" style={{ fontFamily: "'Assistant', sans-serif" }}>{error}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)", color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>אין פעולות ביומן עדיין</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-right" style={{ fontFamily: "'Assistant', sans-serif" }}>
              <thead>
                <tr style={{ background: "rgba(196,149,106,0.08)", borderBottom: "1px solid rgba(196,149,106,0.15)" }}>
                  <th className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>פרטים</th>
                  <th className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>IP</th>
                  <th className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>משתמש</th>
                  <th className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>פעולה</th>
                  <th className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>תאריך ושעה</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const meta = actionLabels[log.action] || { label: log.action, color: "var(--brand-mid)" };
                  return (
                    <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid rgba(196,149,106,0.08)" : "none" }} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--brand-mid)", maxWidth: 200 }}>{log.details || "—"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--brand-mid)" }}>
                        <span className="flex items-center gap-1 justify-end"><MapPin size={10} />{log.ipAddress || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--brand-dark)" }}>{log.username}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: meta.color }}>{meta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--brand-mid)" }}>
                        <span className="flex items-center gap-1 justify-end"><Calendar size={10} />{formatDate(log.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-right" style={{ color: "var(--brand-mid)", borderTop: "1px solid rgba(196,149,106,0.1)", fontFamily: "'Assistant', sans-serif" }}>
            מציג {logs.length} פעולות אחרונות
          </div>
        </div>
      )}
    </div>
  );
}

function useAdminSession() {
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { credentials: "include" });
      if (res.ok) { const data = await res.json(); setSession({ username: data.username }); }
      else setSession(null);
    } catch { setSession(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { checkSession(); }, [checkSession]);
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST", credentials: "include" }); setSession(null); };
  return { session, loading, logout, refetch: checkSession };
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [filter, setFilter] = useState<ContactStatus | "all">("all");
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("contacts");
  const [backupStatus, setBackupStatus] = useState<string>("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isEmailingBackup, setIsEmailingBackup] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/contacts", { credentials: "include" });
      if (res.ok) { const data = await res.json(); setContacts(data.contacts || []); setStats(data.stats || null); }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleStatusChange = async (id: number, status: ContactStatus) => {
    await fetch("/api/admin/contacts/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status }) });
    fetchContacts();
  };
  const handleDelete = async (id: number) => {
    if (!confirm("למחוק פנייה זו?")) return;
    try { const res = await fetch("/api/trpc/admin.deleteContact", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ json: { id } }) }); if (res.ok) fetchContacts(); } catch (e) { console.error(e); }
  };
  const handleDownloadBackup = async () => {
    setIsBackingUp(true); setBackupStatus("מכין גיבוי...");
    try {
      const res = await fetch("/api/backup/full", { credentials: "include" });
      if (!res.ok) throw new Error("שגיאה ביצירת הגיבוי");
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "nativ-backup-" + new Date().toISOString().slice(0, 10) + ".zip"; a.click(); URL.revokeObjectURL(url);
      setBackupStatus("✅ הגיבוי הורד בהצלחה!");
    } catch (e: any) { setBackupStatus("❌ שגיאה: " + e.message); }
    finally { setIsBackingUp(false); }
  };
  const handleEmailBackup = async () => {
    setIsEmailingBackup(true); setBackupStatus("שולח גיבוי למייל...");
    try {
      const res = await fetch("/api/backup/send-email", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) setBackupStatus("✅ הגיבוי נשלח ל-" + data.sentTo);
      else setBackupStatus("❌ שגיאה: " + data.error);
    } catch (e: any) { setBackupStatus("❌ שגיאה: " + e.message); }
    finally { setIsEmailingBackup(false); }
  };

  const filtered = contacts.filter(c => filter === "all" ? true : c.status === filter);
  const tabs: { key: AdminTab; label: string; icon: any }[] = [
    { key: "contacts", label: "פניות", icon: Users },
    { key: "backup", label: "גיבוי", icon: Archive },
    { key: "log", label: "יומן פעולות", icon: Activity },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "var(--brand-cream)" }}>
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: "var(--brand-dark)" }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={fetchContacts} className="p-2 rounded-lg transition-colors hover:bg-white/10" style={{ color: "white" }} title="רענן"><RefreshCw size={16} /></button>
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/10" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Assistant', sans-serif" }}>
              <LogOut size={14} /> יציאה
            </button>
          </div>
          <div className="text-right">
            <div className="font-bold text-white text-lg" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>ממשק ניהול</div>
            <div className="text-xs" style={{ color: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>נתיב למשפחה — מאיר שמעון עשור</div>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-0 flex gap-1 justify-end">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors"
              style={{ background: activeTab === tab.key ? "var(--brand-cream)" : "transparent", color: activeTab === tab.key ? "var(--brand-dark)" : "rgba(255,255,255,0.7)", fontFamily: "'Assistant', sans-serif" }}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {activeTab === "contacts" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "סה״כ פניות", value: stats?.total ?? 0, icon: Users, color: "var(--brand-dark)" },
                { label: "פניות חדשות", value: stats?.newCount ?? 0, icon: AlertCircle, color: "var(--brand-gold)" },
                { label: "נקראו", value: stats?.readCount ?? 0, icon: Eye, color: "#6B7C5C" },
                { label: "נענו", value: stats?.repliedCount ?? 0, icon: CheckCircle2, color: "#5C4033" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-5 text-right" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
                  <div className="flex items-center justify-between mb-2"><s.icon size={20} style={{ color: s.color }} /><div className="text-3xl font-black" style={{ color: s.color, fontFamily: "'Noto Serif Hebrew', serif" }}>{s.value}</div></div>
                  <div className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-6 flex-wrap justify-end">
              {[{ key: "all", label: "הכל" }, { key: "new", label: "חדשות" }, { key: "read", label: "נקראו" }, { key: "replied", label: "נענו" }].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key as ContactStatus | "all")}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{ background: filter === f.key ? "var(--brand-gold)" : "white", color: filter === f.key ? "white" : "var(--brand-dark)", border: "1px solid rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}>
                  {f.label}
                </button>
              ))}
            </div>
            {isLoading ? <div className="flex justify-center py-16"><RefreshCw size={32} className="animate-spin" style={{ color: "var(--brand-gold)" }} /></div>
              : filtered.length === 0 ? <div className="text-center py-16" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>אין פניות להצגה</div>
              : <div className="space-y-3">{filtered.map(c => <ContactCard key={c.id} contact={c} onStatusChange={handleStatusChange} onDelete={handleDelete} />)}</div>}
          </>
        )}

        {activeTab === "backup" && (
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-xl font-bold text-right mb-6" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>גיבוי האתר</h2>
            <div className="rounded-2xl p-6 text-right" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
              <div className="flex items-center gap-3 justify-end mb-3">
                <div><h3 className="font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>הורד גיבוי</h3><p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>מסד נתונים + קוד האתר כקובץ ZIP</p></div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(196,149,106,0.1)" }}><Download size={22} style={{ color: "var(--brand-gold)" }} /></div>
              </div>
              <button onClick={handleDownloadBackup} disabled={isBackingUp} className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>
                {isBackingUp ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}{isBackingUp ? "מכין גיבוי..." : "הורד גיבוי מלא (ZIP)"}
              </button>
            </div>
            <div className="rounded-2xl p-6 text-right" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
              <div className="flex items-center gap-3 justify-end mb-3">
                <div><h3 className="font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>שלח גיבוי למייל</h3><p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>שולח את הגיבוי ישירות לכתובת המייל שלך</p></div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(107,124,92,0.1)" }}><Mail size={22} style={{ color: "#6B7C5C" }} /></div>
              </div>
              <button onClick={handleEmailBackup} disabled={isEmailingBackup} className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "#6B7C5C", fontFamily: "'Assistant', sans-serif" }}>
                {isEmailingBackup ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />}{isEmailingBackup ? "שולח..." : "שלח גיבוי למייל"}
              </button>
            </div>
            {backupStatus && (
              <div className="rounded-xl p-4 text-right text-sm font-medium" style={{ background: backupStatus.startsWith("✅") ? "rgba(107,124,92,0.1)" : backupStatus.startsWith("❌") ? "rgba(220,38,38,0.1)" : "rgba(196,149,106,0.1)", color: backupStatus.startsWith("✅") ? "#6B7C5C" : backupStatus.startsWith("❌") ? "#dc2626" : "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
                {backupStatus}
              </div>
            )}
            <div className="rounded-xl p-4 text-right text-sm" style={{ background: "rgba(196,149,106,0.08)", color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
              <strong style={{ color: "var(--brand-dark)" }}>גיבוי אוטומטי שבועי</strong> — מוגדר לרוץ כל יום ראשון ב-06:00 (שעון ישראל).
            </div>
          </div>
        )}

        {activeTab === "log" && <ActivityLogTab />}
      </div>
    </div>
  );
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
function AdminLoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [view, setView] = useState<LoginView>("login");
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("reset_token");
    if (token) setView("reset");
  }, []);

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: "var(--brand-dark)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, var(--brand-gold) 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--brand-gold)" }}><Shield size={20} className="text-white" /></div>
            <span className="font-bold text-white text-lg" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>נתיב למשפחה</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Assistant', sans-serif" }}>מאיר שמעון עשור</p>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
            ממשק ניהול<br /><span style={{ color: "var(--brand-gold)" }}>מאובטח ופרטי</span>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Assistant', sans-serif" }}>
            ניהול פניות, גיבויים ויומן פעולות — הכל במקום אחד, ללא תלות בשירותים חיצוניים.
          </p>
        </div>
        <div className="relative z-10 flex gap-6">
          {[{ icon: Shield, label: "כניסה מאובטחת" }, { icon: Activity, label: "יומן פעולות" }, { icon: Archive, label: "גיבוי מלא" }].map(item => (
            <div key={item.label} className="text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(196,149,106,0.2)" }}><item.icon size={18} style={{ color: "var(--brand-gold)" }} /></div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Assistant', sans-serif" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6" style={{ background: "var(--brand-cream)" }}>
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--brand-dark)" }}><Shield size={24} style={{ color: "var(--brand-gold)" }} /></div>
            <h1 className="text-xl font-black" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>ממשק ניהול</h1>
            <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>נתיב למשפחה</p>
          </div>

          {view === "login" && <LoginFormView onSuccess={onSuccess} onForgot={() => setView("forgot")} />}
          {view === "forgot" && <ForgotView onBack={() => setView("login")} />}
          {view === "reset" && <ResetView onSuccess={() => setView("login")} />}

          <a href="/" className="block text-center mt-6 text-sm transition-colors hover:opacity-70" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
            ← חזרה לאתר
          </a>
        </div>
      </div>
    </div>
  );
}

function LoginFormView({ onSuccess, onForgot }: { onSuccess: () => void; onForgot: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (res.ok) onSuccess(); else setError(data.error || "שגיאה בהתחברות");
    } catch { setError("שגיאת רשת — נסה שוב"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <div className="mb-8 text-right">
        <h2 className="text-2xl font-black mb-1" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>כניסה למערכת</h2>
        <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>הכנס את פרטי הגישה שלך</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: "white", boxShadow: "0 4px 24px rgba(92,64,51,0.08)", border: "1px solid rgba(196,149,106,0.15)" }}>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>שם משתמש</label>
          <div className="relative">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"
              className="w-full px-4 py-3 pr-10 rounded-xl border text-right outline-none transition-all"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif", fontSize: "15px" }}
              onFocus={e => (e.target.style.borderColor = "var(--brand-gold)")} onBlur={e => (e.target.style.borderColor = "rgba(196,149,106,0.3)")}
              placeholder="הכנס שם משתמש" />
            <User size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: "var(--brand-mid)" }} />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <button type="button" onClick={onForgot} className="text-xs transition-colors hover:opacity-70" style={{ color: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>שכחתי סיסמה</button>
            <label className="text-sm font-medium" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>סיסמה</label>
          </div>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
              className="w-full px-4 py-3 pr-10 pl-10 rounded-xl border text-right outline-none transition-all"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif", fontSize: "15px" }}
              onFocus={e => (e.target.style.borderColor = "var(--brand-gold)")} onBlur={e => (e.target.style.borderColor = "rgba(196,149,106,0.3)")}
              placeholder="הכנס סיסמה" />
            <Lock size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: "var(--brand-mid)" }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 -translate-y-1/2 left-3 transition-opacity hover:opacity-70"
              style={{ color: "var(--brand-mid)" }} tabIndex={-1}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {error && <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-right" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", fontFamily: "'Assistant', sans-serif" }}><AlertCircle size={14} /> {error}</div>}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          style={{ background: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}{loading ? "מתחבר..." : "כניסה"}
        </button>
      </form>
    </div>
  );
}

function ForgotView({ onBack }: { onBack: () => void }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ origin: window.location.origin }) });
      const data = await res.json();
      if (res.ok) { setSent(true); if (data.resetUrl) setResetUrl(data.resetUrl); }
      else setError(data.error || "שגיאה בשליחת המייל");
    } catch { setError("שגיאת רשת — נסה שוב"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <div className="mb-8 text-right">
        <h2 className="text-2xl font-black mb-1" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>שחזור סיסמה</h2>
        <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>נשלח קישור לאיפוס לכתובת המייל שלך</p>
      </div>
      <div className="rounded-2xl p-6" style={{ background: "white", boxShadow: "0 4px 24px rgba(92,64,51,0.08)", border: "1px solid rgba(196,149,106,0.15)" }}>
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(107,124,92,0.1)" }}><CheckCircle size={32} style={{ color: "#6B7C5C" }} /></div>
            <div>
              <p className="font-bold mb-1" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>הקישור נשלח!</p>
              <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{resetUrl ? "SMTP לא מוגדר — השתמש בקישור:" : "בדוק את תיבת המייל שלך."}</p>
            </div>
            {resetUrl && <div className="rounded-lg p-3 text-left text-xs break-all" style={{ background: "rgba(196,149,106,0.08)", color: "var(--brand-dark)", fontFamily: "monospace" }}><a href={resetUrl} style={{ color: "var(--brand-gold)" }}>{resetUrl}</a></div>}
            <button onClick={onBack} className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80" style={{ background: "var(--brand-gold)", color: "white", fontFamily: "'Assistant', sans-serif" }}>חזרה לכניסה</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl p-4 text-right text-sm" style={{ background: "rgba(196,149,106,0.08)", color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>קישור לאיפוס הסיסמה יישלח לכתובת המייל הרשומה של בעל האתר.</div>
            {error && <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", fontFamily: "'Assistant', sans-serif" }}><AlertCircle size={14} /> {error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}{loading ? "שולח..." : "שלח קישור לאיפוס"}
            </button>
            <button type="button" onClick={onBack} className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2" style={{ background: "rgba(196,149,106,0.1)", color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
              <ArrowRight size={14} /> חזרה לכניסה
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ResetView({ onSuccess }: { onSuccess: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const token = new URLSearchParams(window.location.search).get("reset_token") || "";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError("הסיסמאות אינן תואמות"); return; }
    if (newPassword.length < 8) { setError("הסיסמה חייבת להכיל לפחות 8 תווים"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ token, newPassword }) });
      const data = await res.json();
      if (res.ok) { setDone(true); window.history.replaceState({}, "", "/admin"); setTimeout(onSuccess, 2500); }
      else setError(data.error || "שגיאה באיפוס הסיסמה");
    } catch { setError("שגיאת רשת — נסה שוב"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <div className="mb-8 text-right">
        <h2 className="text-2xl font-black mb-1" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>הגדרת סיסמה חדשה</h2>
        <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>הכנס סיסמה חדשה לממשק הניהול</p>
      </div>
      <div className="rounded-2xl p-6" style={{ background: "white", boxShadow: "0 4px 24px rgba(92,64,51,0.08)", border: "1px solid rgba(196,149,106,0.15)" }}>
        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(107,124,92,0.1)" }}><CheckCircle size={32} style={{ color: "#6B7C5C" }} /></div>
            <p className="font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>הסיסמה עודכנה בהצלחה!</p>
            <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>מעביר אותך לדף הכניסה...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>סיסמה חדשה</label>
              <div className="relative">
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                  className="w-full px-4 py-3 pr-10 rounded-xl border text-right outline-none transition-all"
                  style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                  onFocus={e => (e.target.style.borderColor = "var(--brand-gold)")} onBlur={e => (e.target.style.borderColor = "rgba(196,149,106,0.3)")}
                  placeholder="לפחות 8 תווים" />
                <KeyRound size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: "var(--brand-mid)" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>אימות סיסמה</label>
              <div className="relative">
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  className="w-full px-4 py-3 pr-10 rounded-xl border text-right outline-none transition-all"
                  style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                  onFocus={e => (e.target.style.borderColor = "var(--brand-gold)")} onBlur={e => (e.target.style.borderColor = "rgba(196,149,106,0.3)")}
                  placeholder="הכנס שוב את הסיסמה" />
                <Lock size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: "var(--brand-mid)" }} />
              </div>
            </div>
            {error && <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", fontFamily: "'Assistant', sans-serif" }}><AlertCircle size={14} /> {error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <KeyRound size={16} />}{loading ? "מעדכן..." : "עדכן סיסמה"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { session, loading, logout, refetch } = useAdminSession();
  if (loading) return <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "var(--brand-cream)" }}><RefreshCw size={32} className="animate-spin" style={{ color: "var(--brand-gold)" }} /></div>;
  if (!session) return <AdminLoginPage onSuccess={refetch} />;
  return <AdminDashboard onLogout={logout} />;
}
