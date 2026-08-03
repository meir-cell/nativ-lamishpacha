import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Users, Award, BookOpen, BarChart3, MessageSquare, FileText,
  Settings, ChevronLeft, TrendingUp, Clock, AlertTriangle, Volume2,
} from "lucide-react";

export default function AdminDashboard() {
  const { user: authUser, loading: authLoading } = useAuth();
  const ownerToken = typeof window !== "undefined" ? localStorage.getItem("nlp_course_token") || "" : "";
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin-token") || "" : "";

  // Determine if user has admin access via any method
  const isAdminViaOAuth = authUser?.role === "admin";
  const hasTokenAccess = !!(ownerToken || adminToken);
  const hasAccess = isAdminViaOAuth || hasTokenAccess;

  const { data: stats, isLoading } = trpc.nlpAdmin.getStats.useQuery(
    { ownerToken: ownerToken || undefined, adminSecret: adminToken || undefined },
    { enabled: hasAccess && !authLoading, retry: false }
  );

  const navItems = [
    { label: "דשבורד", href: "/nlp/admin", active: true },
    { label: "רישומים", href: "/nlp/admin/registrations" },
    { label: "עדכוני תוכן", href: "/nlp/admin/updates" },
    { label: "סקרים", href: "/nlp/admin/surveys" },
    { label: "הגדרות", href: "/nlp/admin/settings" },
    { label: "מילון הגייה", href: "/nlp/admin/pronunciation" },
    { label: "עורך הקראה", href: "/nlp/admin/tts-editor" },
    { label: "גיבוי", href: "/nlp/admin/backup" },
  ];

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a12" }}>
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No access at all - show message
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0a0a12", color: "#e8e8f0", direction: "rtl" }}>
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="mx-auto mb-4 text-amber-400" />
          <h1 className="text-xl font-bold mb-2" style={{ color: "#F0C040" }}>גישה לדשבורד מנהל</h1>
          <p className="text-sm mb-6" style={{ color: "#8888aa" }}>
            יש להתחבר עם חשבון הבעלים כדי לגשת לדשבורד.
            <br />
            אם אתה הבעלים, התחבר דרך הקורס עם המייל שלך.
          </p>
          <Link href="/nlp" className="text-amber-400 underline text-sm">חזרה לקורס</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{ background: "#0a0a12", color: "#e8e8f0", fontFamily: "'Segoe UI', Arial, sans-serif", direction: "rtl" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)" }}
          >
            <BarChart3 size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#F0C040" }}>דשבורד מנהל</h1>
            <p className="text-sm" style={{ color: "#8888aa" }}>סקירה כללית של מערכת הקורס</p>
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

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Users size={20} />}
                label="נרשמים"
                value={stats.totalRegistrations}
                color="#4CAF50"
              />
              <StatCard
                icon={<Award size={20} />}
                label="תעודות הונפקו"
                value={stats.totalCertificates}
                color="#C9A84C"
              />
              <StatCard
                icon={<BookOpen size={20} />}
                label="שיעורים שהושלמו"
                value={stats.totalLessonCompletions}
                color="#2196F3"
              />
              <StatCard
                icon={<BarChart3 size={20} />}
                label="מבחנים שהוגשו"
                value={stats.totalExamResults}
                color="#9C27B0"
              />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <StatCard
                icon={<MessageSquare size={20} />}
                label="נרשמים שאישרו מיילים"
                value={stats.emailOptInCount}
                color="#FF9800"
              />
              <StatCard
                icon={<Settings size={20} />}
                label="SMTP"
                value={stats.smtpConfigured ? "מוגדר ✓" : "לא מוגדר"}
                color={stats.smtpConfigured ? "#4CAF50" : "#f44336"}
                subtitle={stats.smtpHost || undefined}
              />
            </div>

            {/* Quick links */}
            <h2 className="text-lg font-bold mb-4" style={{ color: "#F0C040" }}>גישה מהירה</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickLink
                href="/nlp/admin/registrations"
                icon={<Users size={18} />}
                label="ניהול נרשמים"
                description="צפייה ברשימת הנרשמים, סטטוס, ופעילות"
              />
              <QuickLink
                href="/nlp/admin/surveys"
                icon={<MessageSquare size={18} />}
                label="סקרים ומבחנים"
                description="תוצאות סקרי שביעות רצון ומבחנים"
              />
              <QuickLink
                href="/nlp/admin/updates"
                icon={<FileText size={18} />}
                label="עדכוני תוכן"
                description="ניהול תוכן נוסף לשיעורים"
              />
              <QuickLink
                href="/nlp/admin/backup"
                icon={<TrendingUp size={18} />}
                label="גיבוי האתר"
                description="הורדת גיבוי מלא — מסד נתונים + קוד מקור"
              />
            </div>
          </>
        ) : (
          <div className="text-center text-slate-500 py-12">
            <p>לא ניתן לטעון נתונים. נסה לרענן את הדף.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div
      className="rounded-xl p-5 border transition-all hover:scale-[1.02]"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        <span className="text-sm font-medium" style={{ color: "#8888aa" }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs mt-1" style={{ color: "#6666aa" }}>{subtitle}</p>}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <div
        className="rounded-xl p-4 border cursor-pointer transition-all hover:border-amber-400/40 hover:bg-amber-400/5"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: "#C9A84C" }}>{icon}</span>
          <span className="text-sm font-semibold text-white">{label}</span>
          <ChevronLeft size={14} className="mr-auto text-slate-500" />
        </div>
        <p className="text-xs" style={{ color: "#8888aa" }}>{description}</p>
      </div>
    </Link>
  );
}
