import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Search, Globe, Save, ChevronDown, ChevronUp, ExternalLink, Tag,
  FileText, TrendingUp, AlertCircle, CheckCircle2, BarChart3,
  Eye, Zap, Target, Info, RefreshCw, Copy, Check
} from "lucide-react";

type SeoRow = {
  pageKey: string;
  pageLabel?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  keywords?: string | null;
  canonical?: string | null;
};

// ── SEO Score Calculator ──────────────────────────────────────────────────────
function calcSeoScore(row: SeoRow): { score: number; issues: string[]; passes: string[] } {
  const issues: string[] = [];
  const passes: string[] = [];
  let score = 0;

  const titleLen = row.metaTitle?.length || 0;
  if (titleLen === 0) issues.push("חסרה כותרת Meta");
  else if (titleLen < 30) { issues.push("כותרת Meta קצרה מדי (פחות מ-30 תווים)"); score += 5; }
  else if (titleLen > 60) { issues.push("כותרת Meta ארוכה מדי (יותר מ-60 תווים)"); score += 10; }
  else { passes.push("כותרת Meta באורך אידיאלי"); score += 25; }

  const descLen = row.metaDescription?.length || 0;
  if (descLen === 0) issues.push("חסר תיאור Meta");
  else if (descLen < 70) { issues.push("תיאור Meta קצר מדי (פחות מ-70 תווים)"); score += 5; }
  else if (descLen > 160) { issues.push("תיאור Meta ארוך מדי (יותר מ-160 תווים)"); score += 10; }
  else { passes.push("תיאור Meta באורך אידיאלי"); score += 25; }

  if (row.keywords && row.keywords.split(",").filter(k => k.trim()).length >= 3) {
    passes.push("מילות מפתח מוגדרות"); score += 20;
  } else if (row.keywords) {
    issues.push("מעט מדי מילות מפתח (מומלץ לפחות 3)"); score += 10;
  } else {
    issues.push("חסרות מילות מפתח");
  }

  if (row.ogTitle) { passes.push("כותרת OG מוגדרת"); score += 15; }
  else issues.push("חסרה כותרת OG לשיתוף");

  if (row.ogImage) { passes.push("תמונת OG מוגדרת"); score += 15; }
  else issues.push("חסרת תמונת OG");

  return { score: Math.min(score, 100), issues, passes };
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#6B7C5C" : score >= 50 ? "#C4956A" : "#dc2626";
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(196,149,106,0.15)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-black text-lg leading-none" style={{ color }}>{score}</div>
        <div className="text-xs" style={{ color: "var(--brand-mid)" }}>/ 100</div>
      </div>
    </div>
  );
}

// ── Google Preview ────────────────────────────────────────────────────────────
function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid #e0e0e0" }}>
      <div className="text-xs mb-1" style={{ color: "#202124", fontFamily: "Arial, sans-serif" }}>
        <span style={{ color: "#006621" }}>{url}</span>
      </div>
      <div className="text-lg font-medium mb-1 leading-snug" style={{ color: "#1a0dab", fontFamily: "Arial, sans-serif" }}>
        {title || "כותרת הדף"}
      </div>
      <div className="text-sm leading-relaxed" style={{ color: "#545454", fontFamily: "Arial, sans-serif" }}>
        {description || "תיאור הדף יופיע כאן בתוצאות החיפוש של Google..."}
      </div>
    </div>
  );
}

// ── Keyword Density Tool ──────────────────────────────────────────────────────
function KeywordDensity({ keywords, description }: { keywords: string; description: string }) {
  const kws = keywords.split(",").map(k => k.trim()).filter(Boolean);
  if (!kws.length || !description) return null;
  const words = description.toLowerCase().split(/\s+/);
  const total = words.length;
  return (
    <div className="mt-3 space-y-1">
      {kws.slice(0, 5).map(kw => {
        const count = words.filter(w => w.includes(kw.toLowerCase())).length;
        const density = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
        const pct = Math.min(parseFloat(density) * 20, 100);
        return (
          <div key={kw} className="flex items-center gap-2 text-xs">
            <span className="w-24 truncate font-medium" style={{ color: "var(--brand-dark)" }}>{kw}</span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(196,149,106,0.15)" }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 5 ? "#dc2626" : pct > 0 ? "#6B7C5C" : "rgba(196,149,106,0.3)" }} />
            </div>
            <span style={{ color: "var(--brand-mid)", minWidth: 32 }}>{density}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-amber-50 transition-colors"
      title="העתק"
    >
      {copied ? <Check size={12} style={{ color: "#6B7C5C" }} /> : <Copy size={12} style={{ color: "var(--brand-mid)" }} />}
    </button>
  );
}

// ── SEO Page Row ──────────────────────────────────────────────────────────────
function SeoPageRow({ row, onSave }: { row: SeoRow; onSave: (data: SeoRow) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<SeoRow>({ ...row });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "analysis">("edit");

  const { score, issues, passes } = useMemo(() => calcSeoScore(form), [form]);

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const scoreColor = score >= 80 ? "#6B7C5C" : score >= 50 ? "#C4956A" : "#dc2626";
  const pageUrl = `https://www.nativ-lamishpacha.com/${row.pageKey === "home" ? "" : row.pageKey}`;

  return (
    <div className="rounded-2xl overflow-hidden mb-3 transition-shadow hover:shadow-md" style={{ border: "1px solid rgba(196,149,106,0.2)", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      {/* Row header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-amber-50/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp size={16} style={{ color: "var(--brand-gold)" }} /> : <ChevronDown size={16} style={{ color: "var(--brand-gold)" }} />}
          <a
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="hover:underline flex items-center gap-1"
            style={{ color: "var(--brand-mid)", fontSize: 12 }}
          >
            <ExternalLink size={11} />
            /{row.pageKey === "home" ? "" : row.pageKey}
          </a>
        </div>
        <div className="flex items-center gap-4">
          {/* Mini score bar */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full" style={{ background: "rgba(196,149,106,0.15)" }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${score}%`, background: scoreColor }} />
            </div>
            <span className="text-xs font-bold" style={{ color: scoreColor }}>{score}</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
            {row.pageLabel}
          </span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t" style={{ borderColor: "rgba(196,149,106,0.1)" }} dir="rtl">
          {/* Tabs */}
          <div className="flex border-b px-5" style={{ borderColor: "rgba(196,149,106,0.1)", background: "rgba(196,149,106,0.03)" }}>
            {([
              { id: "edit", label: "עריכה", icon: FileText },
              { id: "preview", label: "תצוגה מקדימה", icon: Eye },
              { id: "analysis", label: "ניתוח SEO", icon: BarChart3 },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors"
                style={{
                  borderColor: activeTab === tab.id ? "var(--brand-gold)" : "transparent",
                  color: activeTab === tab.id ? "var(--brand-dark)" : "var(--brand-mid)",
                  fontFamily: "'Assistant', sans-serif",
                }}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Edit Tab */}
          {activeTab === "edit" && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Meta Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>
                      <FileText size={11} className="inline ml-1" />כותרת Meta (title)
                    </label>
                    <CopyBtn text={form.metaTitle || ""} />
                  </div>
                  <input
                    type="text"
                    value={form.metaTitle || ""}
                    onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                    placeholder="כותרת לכרטיסיית הדפדפן..."
                    maxLength={60}
                  />
                  <div className="flex justify-between mt-0.5">
                    <span className="text-xs" style={{ color: "var(--brand-mid)" }}>אידיאלי: 50-60 תווים</span>
                    <span className="text-xs font-medium" style={{ color: (form.metaTitle?.length || 0) > 55 ? "#dc2626" : "#6B7C5C" }}>
                      {form.metaTitle?.length || 0}/60
                    </span>
                  </div>
                </div>

                {/* OG Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>
                      <Globe size={11} className="inline ml-1" />כותרת OG (שיתוף)
                    </label>
                    <CopyBtn text={form.ogTitle || ""} />
                  </div>
                  <input
                    type="text"
                    value={form.ogTitle || ""}
                    onChange={e => setForm(f => ({ ...f, ogTitle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                    placeholder="כותרת לשיתוף ברשתות חברתיות..."
                    maxLength={60}
                  />
                  <div className="text-xs mt-0.5" style={{ color: "var(--brand-mid)" }}>לפייסבוק, ווטסאפ, טוויטר</div>
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>תיאור Meta (description)</label>
                  <CopyBtn text={form.metaDescription || ""} />
                </div>
                <textarea
                  value={form.metaDescription || ""}
                  onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                  style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                  placeholder="תיאור קצר של הדף לתוצאות חיפוש..."
                  maxLength={160}
                />
                <div className="flex justify-between mt-0.5">
                  <span className="text-xs" style={{ color: "var(--brand-mid)" }}>אידיאלי: 120-160 תווים</span>
                  <span className="text-xs font-medium" style={{ color: (form.metaDescription?.length || 0) > 150 ? "#dc2626" : "#6B7C5C" }}>
                    {form.metaDescription?.length || 0}/160
                  </span>
                </div>
              </div>

              {/* OG Description */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תיאור OG (שיתוף)</label>
                <textarea
                  value={form.ogDescription || ""}
                  onChange={e => setForm(f => ({ ...f, ogDescription: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                  style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                  placeholder="תיאור לשיתוף ברשתות חברתיות..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* OG Image */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>
                    תמונת OG (URL)
                  </label>
                  <input
                    type="text"
                    value={form.ogImage || ""}
                    onChange={e => setForm(f => ({ ...f, ogImage: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm text-left"
                    style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "monospace", direction: "ltr" }}
                    placeholder="/manus-storage/og-image.jpg"
                  />
                  <div className="text-xs mt-0.5" style={{ color: "var(--brand-mid)" }}>מומלץ: 1200×630 פיקסלים</div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>
                    <Tag size={11} className="inline ml-1" />מילות מפתח (מופרדות בפסיק)
                  </label>
                  <input
                    type="text"
                    value={form.keywords || ""}
                    onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                    placeholder="טיפול זוגי, גישור, ייעוץ משפטי"
                  />
                  <div className="text-xs mt-0.5" style={{ color: "var(--brand-mid)" }}>
                    {form.keywords ? `${form.keywords.split(",").filter(k => k.trim()).length} מילות מפתח` : "מומלץ 3-8 מילות מפתח"}
                  </div>
                </div>
              </div>

              {/* Canonical */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>Canonical URL (אופציונלי)</label>
                <input
                  type="text"
                  value={form.canonical || ""}
                  onChange={e => setForm(f => ({ ...f, canonical: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm text-left"
                  style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "monospace", direction: "ltr" }}
                  placeholder="https://www.nativ-lamishpacha.com/..."
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: saved ? "#6B7C5C" : "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
                >
                  <Save size={14} />
                  {saved ? "נשמר!" : "שמור שינויים"}
                </button>
                {saved && <span className="text-xs" style={{ color: "#6B7C5C" }}>✓ הנתונים עודכנו בהצלחה</span>}
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === "preview" && (
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search size={14} style={{ color: "var(--brand-gold)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
                    תצוגה מקדימה בגוגל
                  </span>
                </div>
                <GooglePreview
                  title={form.metaTitle || ""}
                  description={form.metaDescription || ""}
                  url={pageUrl}
                />
              </div>

              {/* Social preview */}
              {(form.ogTitle || form.ogDescription) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe size={14} style={{ color: "var(--brand-gold)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
                      תצוגה מקדימה לשיתוף
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e0e0e0" }}>
                    {form.ogImage && (
                      <div className="h-32 bg-gray-100 flex items-center justify-center" style={{ background: "rgba(196,149,106,0.1)" }}>
                        <span className="text-xs" style={{ color: "var(--brand-mid)" }}>תמונת OG: {form.ogImage}</span>
                      </div>
                    )}
                    <div className="p-3" style={{ background: "white" }}>
                      <div className="text-xs mb-1" style={{ color: "#65676b" }}>NATIV-LAMISHPACHA.COM</div>
                      <div className="font-semibold text-sm" style={{ color: "#050505" }}>{form.ogTitle || form.metaTitle || "כותרת"}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#65676b" }}>{form.ogDescription || form.metaDescription || ""}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === "analysis" && (
            <div className="p-5">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <ScoreRing score={score} />
                  <div className="text-center mt-1 text-xs font-semibold" style={{ color: scoreColor }}>
                    {score >= 80 ? "מצוין" : score >= 50 ? "בינוני" : "חלש"}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {passes.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 size={13} style={{ color: "#6B7C5C", flexShrink: 0 }} />
                      <span style={{ color: "#4A3728" }}>{p}</span>
                    </div>
                  ))}
                  {issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <AlertCircle size={13} style={{ color: "#dc2626", flexShrink: 0 }} />
                      <span style={{ color: "#4A3728" }}>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keyword density */}
              {form.keywords && form.metaDescription && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(196,149,106,0.1)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={13} style={{ color: "var(--brand-gold)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>צפיפות מילות מפתח בתיאור</span>
                  </div>
                  <KeywordDensity keywords={form.keywords} description={form.metaDescription} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminSEO() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "good" | "needs_work" | "missing">("all");
  const utils = trpc.useUtils();

  const { data: pages, isLoading, refetch } = trpc.adminSeo.getAll.useQuery();

  const updateMutation = trpc.adminSeo.update.useMutation({
    onSuccess: () => utils.adminSeo.getAll.invalidate()
  });

  const pagesWithScore = useMemo(() =>
    (pages || []).map(p => ({ ...p, seoScore: calcSeoScore(p as SeoRow).score })),
    [pages]
  );

  const stats = useMemo(() => {
    const all = pagesWithScore;
    const good = all.filter(p => p.seoScore >= 80).length;
    const medium = all.filter(p => p.seoScore >= 50 && p.seoScore < 80).length;
    const poor = all.filter(p => p.seoScore < 50).length;
    const avgScore = all.length ? Math.round(all.reduce((s, p) => s + p.seoScore, 0) / all.length) : 0;
    return { total: all.length, good, medium, poor, avgScore };
  }, [pagesWithScore]);

  const filteredPages = useMemo(() =>
    pagesWithScore.filter(p => {
      const matchSearch = !search || p.pageLabel?.includes(search) || p.pageKey.includes(search);
      const matchFilter =
        filter === "all" ? true :
        filter === "good" ? p.seoScore >= 80 :
        filter === "needs_work" ? (p.seoScore >= 50 && p.seoScore < 80) :
        p.seoScore < 50;
      return matchSearch && matchFilter;
    }),
    [pagesWithScore, search, filter]
  );

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            ניהול קידום אורגני
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
            ניהול Meta Tags, ניתוח SEO ותצוגה מקדימה לכל דף באתר
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-amber-50"
          style={{ color: "var(--brand-mid)", border: "1px solid rgba(196,149,106,0.2)", fontFamily: "'Assistant', sans-serif" }}
        >
          <RefreshCw size={14} />
          רענן
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "ציון ממוצע", value: stats.avgScore, sub: "מתוך 100", icon: TrendingUp, color: stats.avgScore >= 80 ? "#6B7C5C" : stats.avgScore >= 50 ? "#C4956A" : "#dc2626" },
          { label: "דפים מצוינים", value: stats.good, sub: "ציון 80+", icon: CheckCircle2, color: "#6B7C5C" },
          { label: "דורשים שיפור", value: stats.medium, sub: "ציון 50-79", icon: Zap, color: "#C4956A" },
          { label: "דפים חלשים", value: stats.poor, sub: "ציון מתחת ל-50", icon: AlertCircle, color: "#dc2626" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={18} style={{ color: stat.color }} />
              <span className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{stat.sub}</span>
            </div>
            <div className="text-3xl font-black" style={{ color: stat.color, fontFamily: "'Noto Serif Hebrew', serif" }}>{stat.value}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: "rgba(196,149,106,0.06)", border: "1px solid rgba(196,149,106,0.15)" }}>
        <Info size={16} style={{ color: "var(--brand-gold)", flexShrink: 0, marginTop: 1 }} />
        <div className="text-sm leading-relaxed" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
          <strong>טיפים לקידום אורגני:</strong> כותרת Meta אידיאלית: 50-60 תווים. תיאור Meta: 120-160 תווים. השתמש במילות מפתח רלוונטיות בכותרת ובתיאור. הוסף תמונת OG לשיתוף ברשתות חברתיות.
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brand-mid)" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש דף..."
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
          />
        </div>
        <div className="flex gap-2">
          {([
            { id: "all", label: "הכל" },
            { id: "good", label: "מצוין" },
            { id: "needs_work", label: "לשיפור" },
            { id: "missing", label: "חלש" },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filter === f.id ? "var(--brand-dark)" : "white",
                color: filter === f.id ? "white" : "var(--brand-mid)",
                border: `1px solid ${filter === f.id ? "var(--brand-dark)" : "rgba(196,149,106,0.2)"}`,
                fontFamily: "'Assistant', sans-serif",
              }}
            >
              {f.label}
              {f.id !== "all" && (
                <span className="mr-1 opacity-70">
                  ({f.id === "good" ? stats.good : f.id === "needs_work" ? stats.medium : stats.poor})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pages */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl h-16 animate-pulse" style={{ background: "rgba(196,149,106,0.08)" }} />
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: "rgba(196,149,106,0.05)", border: "1px dashed rgba(196,149,106,0.2)" }}>
          <Search size={32} className="mx-auto mb-3" style={{ color: "rgba(196,149,106,0.4)" }} />
          <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>לא נמצאו דפים</p>
        </div>
      ) : (
        filteredPages.map(page => (
          <SeoPageRow
            key={page.pageKey}
            row={page as SeoRow}
            onSave={(data) => updateMutation.mutate({
              ...data,
              metaTitle: data.metaTitle ?? undefined,
              metaDescription: data.metaDescription ?? undefined,
              ogTitle: data.ogTitle ?? undefined,
              ogDescription: data.ogDescription ?? undefined,
              ogImage: data.ogImage ?? undefined,
              keywords: data.keywords ?? undefined,
              canonical: data.canonical ?? undefined,
              pageLabel: data.pageLabel ?? undefined,
            })}
          />
        ))
      )}
    </div>
  );
}
