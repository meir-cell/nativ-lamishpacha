import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Mail, Phone, MessageSquare, CheckCircle2, Clock,
  Trash2, Eye, RefreshCw, LogOut, Users, BarChart3,
  ChevronDown, ChevronUp, AlertCircle
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
    createdAt: Date;
  };
  onStatusChange: (id: number, status: ContactStatus) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (d: Date) =>
    new Date(d).toLocaleString("he-IL", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "white",
        border: contact.status === "new"
          ? "2px solid var(--brand-gold)"
          : "1px solid rgba(196,149,106,0.2)",
        boxShadow: contact.status === "new"
          ? "0 4px 20px rgba(196,149,106,0.15)"
          : "0 2px 8px rgba(92,64,51,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(contact.id); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
            style={{ color: "#dc2626" }}
            title="מחק פנייה"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={16} style={{ color: "var(--brand-mid)" }} /> : <ChevronDown size={16} style={{ color: "var(--brand-mid)" }} />}
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="font-bold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
              {contact.name}
            </div>
            <div className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
              {formatDate(contact.createdAt)}
            </div>
          </div>
          <StatusBadge status={contact.status} />
        </div>
      </div>

      {/* Expanded content */}
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

            {/* Actions */}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const { logout } = useAuth();
  const [filter, setFilter] = useState<ContactStatus | "all">("all");

  const { data: stats, refetch: refetchStats } = trpc.admin.stats.useQuery();
  const { data: contacts, isLoading, refetch: refetchContacts } = trpc.admin.listContacts.useQuery();

  const updateStatus = trpc.admin.updateStatus.useMutation({
    onSuccess: () => { refetchContacts(); refetchStats(); },
  });
  const deleteContact = trpc.admin.deleteContact.useMutation({
    onSuccess: () => { refetchContacts(); refetchStats(); },
  });

  const filtered = contacts?.filter(c =>
    filter === "all" ? true : c.status === filter
  ) ?? [];

  const handleRefresh = () => { refetchContacts(); refetchStats(); };

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "var(--brand-cream)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: "var(--brand-dark)" }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "white" }}
              title="רענן"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/10"
              style={{ color: "white/70", fontFamily: "'Assistant', sans-serif" }}
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
      </header>

      <div className="container mx-auto px-4 py-8">
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
          <div className="text-center py-16">
            <RefreshCw size={32} className="mx-auto mb-3 animate-spin" style={{ color: "var(--brand-gold)" }} />
            <p style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>טוען פניות...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
            <BarChart3 size={40} className="mx-auto mb-3 opacity-30" style={{ color: "var(--brand-mid)" }} />
            <p className="text-lg font-medium mb-1" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
              אין פניות להצגה
            </p>
            <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
              {filter === "all" ? "עדיין לא התקבלו פניות" : `אין פניות בסטטוס "${statusLabel[filter as ContactStatus]}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(contact => (
              <ContactCard
                key={contact.id}
                contact={{
                  ...contact,
                  status: contact.status as ContactStatus,
                  message: contact.message ?? "",
                }}
                onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                onDelete={(id) => {
                  if (confirm("האם למחוק פנייה זו?")) {
                    deleteContact.mutate({ id });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminLogin() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "var(--brand-cream)" }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: "var(--brand-gold)" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "var(--brand-dark)" }}>
        <div className="text-center p-8 rounded-2xl max-w-sm w-full mx-4" style={{ background: "white" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "var(--brand-gold)" }}>
            <Clock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            ממשק ניהול
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
            נתיב למשפחה — מאיר שמעון עשור
          </p>
          <a
            href={getLoginUrl()}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}
          >
            כניסה למנהל
          </a>
          <a
            href="/"
            className="block mt-3 text-sm text-center transition-colors hover:opacity-70"
            style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}
          >
            חזרה לאתר
          </a>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "var(--brand-cream)" }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: "var(--brand-gold)" }} />
      </div>
    );
  }

  // Not logged in — show login screen
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Logged in but not admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "var(--brand-cream)" }}>
        <div className="text-center p-8 rounded-2xl max-w-sm w-full mx-4" style={{ background: "white", border: "1px solid rgba(196,149,106,0.2)" }}>
          <AlertCircle size={40} className="mx-auto mb-4" style={{ color: "#dc2626" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            אין הרשאת גישה
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
            עמוד זה מיועד למנהלים בלבד
          </p>
          <a href="/" className="text-sm font-medium" style={{ color: "var(--brand-gold)" }}>
            חזרה לדף הבית
          </a>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
