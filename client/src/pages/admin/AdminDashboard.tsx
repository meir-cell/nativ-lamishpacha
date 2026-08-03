import { trpc } from "@/lib/trpc";
import { Users, BookOpen, GraduationCap, AlertCircle, TrendingUp, BarChart2, RefreshCw } from "lucide-react";

const MONTH_NAMES_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES_HE[parseInt(month) - 1]} ${year}`;
}

// ── SKELETON COMPONENTS ───────────────────────────────────────────────────────
function SkeletonBlock({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: "linear-gradient(90deg, #f0ebe4 25%, #e8e0d5 50%, #f0ebe4 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s infinite",
        ...style,
      }}
    />
  );
}

function KPICardSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
      <div className="flex items-center justify-between mb-3">
        <SkeletonBlock style={{ width: 40, height: 40, borderRadius: 12 }} />
        <SkeletonBlock style={{ width: 48, height: 36, borderRadius: 8 }} />
      </div>
      <SkeletonBlock style={{ width: "60%", height: 14, marginRight: "auto" }} />
    </div>
  );
}

function ChartCardSkeleton({ height = 160 }: { height?: number }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
      <div className="flex items-center gap-2 mb-4 justify-end">
        <SkeletonBlock style={{ width: 140, height: 20, borderRadius: 6 }} />
        <SkeletonBlock style={{ width: 20, height: 20, borderRadius: "50%" }} />
      </div>
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className="flex-1"
            style={{ height: `${30 + Math.random() * 60}%`, borderRadius: "6px 6px 0 0" }}
          />
        ))}
      </div>
      <SkeletonBlock style={{ width: "80%", height: 12, marginTop: 12, marginRight: "auto" }} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div dir="rtl" className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock style={{ width: 200, height: 28 }} />
          <SkeletonBlock style={{ width: 160, height: 16 }} />
        </div>
        <SkeletonBlock style={{ width: 80, height: 36, borderRadius: 12 }} />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>

      {/* Charts row skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartCardSkeleton height={128} />
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
          <div className="flex items-center gap-2 mb-4 justify-end">
            <SkeletonBlock style={{ width: 100, height: 20, borderRadius: 6 }} />
            <SkeletonBlock style={{ width: 20, height: 20, borderRadius: "50%" }} />
          </div>
          <div className="flex items-center gap-6">
            <SkeletonBlock style={{ width: 100, height: 100, borderRadius: "50%" }} />
            <div className="space-y-2 flex-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonBlock key={i} style={{ width: `${60 + i * 10}%`, height: 14 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NLP chart skeleton */}
      <ChartCardSkeleton height={128} />

      {/* Articles summary skeleton */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
        <div className="flex items-center gap-2 mb-4 justify-end">
          <SkeletonBlock style={{ width: 80, height: 20, borderRadius: 6 }} />
          <SkeletonBlock style={{ width: 20, height: 20, borderRadius: "50%" }} />
        </div>
        <div className="flex gap-6 justify-end">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-right space-y-1">
              <SkeletonBlock style={{ width: 48, height: 36, borderRadius: 8, marginRight: "auto" }} />
              <SkeletonBlock style={{ width: 60, height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CHART COMPONENTS ──────────────────────────────────────────────────────────
function BarChartSimple({ data, color, label }: { data: { month: string; count: number }[]; color: string; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold mb-3 text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{label}</div>
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-bold" style={{ color }}>{d.count > 0 ? d.count : ""}</div>
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                background: color,
                height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%`,
                opacity: d.count > 0 ? 1 : 0.2,
                minHeight: 4,
              }}
            />
            <div className="text-center" style={{ fontSize: 9, color: "var(--brand-mid)", lineHeight: 1.2 }}>
              {formatMonthLabel(d.month).split(" ")[0]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--brand-mid)" }}>
        אין נתונים
      </div>
    );
  }
  let offset = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100" className="flex-shrink-0">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f0ebe4" strokeWidth="18" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const el = (
            <circle
              key={i}
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circumference}
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          );
          offset += pct;
          return el;
        })}
        <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--brand-dark)">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2 text-xs" style={{ fontFamily: "'Assistant', sans-serif" }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span style={{ color: "var(--brand-mid)" }}>{seg.label}</span>
            <span className="font-bold mr-auto" style={{ color: "var(--brand-dark)" }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data, isLoading, error, refetch } = trpc.admin.dashboardStats.useQuery(undefined, { retry: false });

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl p-4 text-sm text-right" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
        שגיאה בטעינת הנתונים: {error.message}
      </div>
    );
  }

  const totals = data?.totals;
  const contactStatus = data?.contactStatus;
  const monthlyContacts = data?.monthlyContacts || [];
  const monthlyRegistrations = data?.monthlyRegistrations || [];

  const kpis = [
    { label: "סה״כ פניות", value: totals?.contacts ?? 0, icon: Users, color: "var(--brand-gold)" },
    { label: "פניות חדשות", value: totals?.newContacts ?? 0, icon: AlertCircle, color: "#dc2626" },
    { label: "מאמרים", value: totals?.articles ?? 0, icon: BookOpen, color: "#6B7C5C" },
    { label: "רשומי NLP", value: totals?.registrations ?? 0, icon: GraduationCap, color: "#5C4033" },
  ];

  const contactSegments = [
    { label: "חדש", value: contactStatus?.new ?? 0, color: "#C4956A" },
    { label: "נקרא", value: contactStatus?.read ?? 0, color: "#6B7C5C" },
    { label: "נענה", value: contactStatus?.replied ?? 0, color: "#5C4033" },
  ];

  return (
    <div dir="rtl" className="space-y-6">
      {/* Shimmer keyframe injected once */}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            דשבורד סטטיסטיקות
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
            סקירה כללית של פעילות האתר
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors hover:bg-amber-50"
          style={{ borderColor: "rgba(196,149,106,0.3)", color: "var(--brand-gold)" }}
        >
          <RefreshCw size={14} />
          רענן
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-5 text-right" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
              <div className="text-3xl font-black" style={{ color: kpi.color, fontFamily: "'Noto Serif Hebrew', serif" }}>{kpi.value}</div>
            </div>
            <div className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
          <div className="flex items-center gap-2 mb-4 justify-end">
            <h3 className="font-bold text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>פניות לאורך זמן</h3>
            <TrendingUp size={18} style={{ color: "var(--brand-gold)" }} />
          </div>
          <BarChartSimple data={monthlyContacts} color="var(--brand-gold)" label="פניות חדשות לפי חודש (6 חודשים אחרונים)" />
        </div>

        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
          <div className="flex items-center gap-2 mb-4 justify-end">
            <h3 className="font-bold text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>סטטוס פניות</h3>
            <BarChart2 size={18} style={{ color: "var(--brand-gold)" }} />
          </div>
          <DonutChart segments={contactSegments} total={totals?.contacts ?? 0} />
        </div>
      </div>

      {/* NLP registrations chart */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
        <div className="flex items-center gap-2 mb-4 justify-end">
          <h3 className="font-bold text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>רשומי קורס NLP לאורך זמן</h3>
          <GraduationCap size={18} style={{ color: "#5C4033" }} />
        </div>
        <BarChartSimple data={monthlyRegistrations} color="#5C4033" label="רשומים חדשים לפי חודש (6 חודשים אחרונים)" />
      </div>

      {/* Articles summary */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}>
        <div className="flex items-center gap-2 mb-4 justify-end">
          <h3 className="font-bold text-right" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>מאמרים</h3>
          <BookOpen size={18} style={{ color: "#6B7C5C" }} />
        </div>
        <div className="flex gap-6 justify-end">
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: "#6B7C5C", fontFamily: "'Noto Serif Hebrew', serif" }}>{totals?.publishedArticles ?? 0}</div>
            <div className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>מפורסמים</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: "var(--brand-gold)", fontFamily: "'Noto Serif Hebrew', serif" }}>{(totals?.articles ?? 0) - (totals?.publishedArticles ?? 0)}</div>
            <div className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>טיוטות</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>{totals?.articles ?? 0}</div>
            <div className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>סה״כ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
