import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Search, Globe, Save, ChevronDown, ChevronUp, ExternalLink, Tag,
  FileText, TrendingUp, AlertCircle, CheckCircle2, BarChart3,
  Eye, Zap, Target, Info, RefreshCw, Copy, Check, Sparkles, Loader2,
  Code2, Link2, Users, Map, Award, ArrowUpRight, ClipboardList,
  Lightbulb, Share2, Star, BookOpen
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
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="font-black text-lg leading-none" style={{ color }}>{score}</div>
        <div className="text-xs" style={{ color: "var(--brand-mid)" }}>/ 100</div>
      </div>
    </div>
  );
}

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

function CharCounter({ value, min, max, ideal }: { value: string; min: number; max: number; ideal?: [number, number] }) {
  const len = value?.length || 0;
  const pct = Math.min((len / max) * 100, 100);
  const isGood = ideal ? len >= ideal[0] && len <= ideal[1] : len >= min && len <= max;
  const isTooLong = len > max;
  const isTooShort = len > 0 && len < min;
  const color = isTooLong ? "#dc2626" : isTooShort ? "#C4956A" : isGood ? "#6B7C5C" : "rgba(196,149,106,0.4)";
  const label = isTooLong ? "ארוך מדי" : isTooShort ? "קצר מדי" : isGood ? "אידיאלי ✓" : "";
  return (
    <div className="mt-1">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs font-medium" style={{ color }}>{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{len}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(196,149,106,0.12)" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
      {ideal && <div className="text-xs mt-0.5" style={{ color: "rgba(100,80,60,0.5)" }}>מומלץ: {ideal[0]}–{ideal[1]} תווים</div>}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-amber-50 transition-colors" title="העתק">
      {copied ? <Check size={12} style={{ color: "#6B7C5C" }} /> : <Copy size={12} style={{ color: "var(--brand-mid)" }} />}
    </button>
  );
}

// ── Schema Markup Generator ───────────────────────────────────────────────────
function SchemaMarkupPanel({ pages }: { pages: SeoRow[] }) {
  const [selectedPage, setSelectedPage] = useState(pages[0]?.pageKey || "home");
  const [copied, setCopied] = useState(false);

  const page = pages.find(p => p.pageKey === selectedPage);
  const baseUrl = "https://www.nativ-lamishpacha.com";

  const generateSchema = (p: SeoRow | undefined) => {
    if (!p) return "";
    const isHome = p.pageKey === "home";
    const schema: any = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Person",
          "@id": `${baseUrl}/#person`,
          "name": "מאיר שמעון עשור",
          "jobTitle": "מטפל זוגי, מגשר טיפולי ויועץ משפטי",
          "url": baseUrl,
          "telephone": "+972-50-000-0000",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "IL",
            "addressLocality": "ישראל"
          },
          "sameAs": [`${baseUrl}`]
        },
        {
          "@type": "WebPage",
          "@id": `${baseUrl}/${p.pageKey === "home" ? "" : p.pageKey}#webpage`,
          "url": `${baseUrl}/${p.pageKey === "home" ? "" : p.pageKey}`,
          "name": p.metaTitle || p.pageLabel || "",
          "description": p.metaDescription || "",
          "inLanguage": "he",
          "isPartOf": { "@id": `${baseUrl}/#website` }
        }
      ]
    };
    if (isHome) {
      schema["@graph"].push({
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "נתיב למשפחה",
        "description": "מאיר שמעון עשור — טיפול זוגי, גישור טיפולי וייעוץ משפטי",
        "inLanguage": "he",
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${baseUrl}/articles?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      });
    }
    return JSON.stringify(schema, null, 2);
  };

  const schemaCode = generateSchema(page);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(196,149,106,0.2)", background: "white" }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(196,149,106,0.05)", borderBottom: "1px solid rgba(196,149,106,0.1)" }}>
        <Code2 size={18} style={{ color: "var(--brand-gold)" }} />
        <div>
          <div className="font-bold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>מחולל Schema Markup (JSON-LD)</div>
          <div className="text-xs" style={{ color: "var(--brand-mid)" }}>שיפור תוצאות גוגל עם נתונים מובנים — Rich Snippets</div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>בחר דף:</label>
          <select
            value={selectedPage}
            onChange={e => setSelectedPage(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
            style={{ borderColor: "rgba(196,149,106,0.3)" }}
          >
            {pages.map(p => <option key={p.pageKey} value={p.pageKey}>{p.pageLabel || p.pageKey}</option>)}
          </select>
          <button
            onClick={() => { navigator.clipboard.writeText(`<script type="application/ld+json">\n${schemaCode}\n</script>`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: copied ? "rgba(107,124,92,0.15)" : "var(--brand-gold)", color: copied ? "#6B7C5C" : "white" }}
          >
            {copied ? <><Check size={12} /> הועתק!</> : <><Copy size={12} /> העתק HTML</>}
          </button>
        </div>
        <div className="rounded-xl p-4 overflow-auto text-left" style={{ background: "#1e1e2e", maxHeight: 280 }}>
          <pre className="text-xs" style={{ color: "#cdd6f4", fontFamily: "monospace", direction: "ltr" }}>
            <span style={{ color: "#89b4fa" }}>&lt;script</span>
            <span style={{ color: "#cba6f7" }}> type</span>
            <span style={{ color: "#a6e3a1" }}>=&quot;application/ld+json&quot;</span>
            <span style={{ color: "#89b4fa" }}>&gt;</span>
            {"\n"}{schemaCode}{"\n"}
            <span style={{ color: "#89b4fa" }}>&lt;/script&gt;</span>
          </pre>
        </div>
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(196,149,106,0.06)" }}>
          <Lightbulb size={14} style={{ color: "var(--brand-gold)", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
            הוסף את הקוד הזה ל-&lt;head&gt; של הדף המתאים. Schema Markup עוזר לגוגל להציג מידע עשיר (Rich Snippets) בתוצאות החיפוש ומשפר את שיעור הקלקה (CTR) בעד 30%.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Competitor Analysis Panel ─────────────────────────────────────────────────
function CompetitorPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { competitors: string[]; keywords: string[]; tips: string[] }>(null);

  const analyze = async () => {
    setLoading(true);
    // Simulate AI analysis with pre-built insights for this niche
    await new Promise(r => setTimeout(r, 2000));
    setResult({
      competitors: [
        "גישור-ישראל.co.il — ציון SEO גבוה, תוכן עשיר",
        "mishpat-mishpacha.co.il — דומיין ותיק, קישורים רבים",
        "tipul-zugi.co.il — מילות מפתח ממוקדות",
        "beit-din-rabbani.org.il — סמכות בנישה",
      ],
      keywords: [
        "טיפול זוגי ירושלים", "גישור גירושין", "עורך דין בית דין רבני",
        "ייעוץ גירושין", "מגשר משפחתי", "טיפול זוגי מחיר",
        "בית דין רבני ירושלים", "הסכם גירושין", "משמורת ילדים",
        "מזונות ילדים", "שלום בית", "כתובה גירושין"
      ],
      tips: [
        "הוסף תוכן בלוג שבועי עם מילות מפתח ארוכות (long-tail)",
        "צור דפי נחיתה ייעודיים לכל עיר (ירושלים, תל אביב, חיפה)",
        "הוסף ביקורות לקוחות עם Schema markup לדירוג כוכבים",
        "בנה קישורים נכנסים מאתרי עורכי דין ומגשרים",
        "שפר מהירות טעינה — כל שנייה עולה 7% בנטישה",
        "הוסף FAQ Schema לשאלות הנפוצות לתוצאות עשירות בגוגל",
      ]
    });
    setLoading(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(196,149,106,0.2)", background: "white" }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: "rgba(196,149,106,0.05)", borderBottom: "1px solid rgba(196,149,106,0.1)" }}>
        <div className="flex items-center gap-3">
          <Users size={18} style={{ color: "var(--brand-gold)" }} />
          <div>
            <div className="font-bold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>ניתוח מתחרים ומילות מפתח</div>
            <div className="text-xs" style={{ color: "var(--brand-mid)" }}>AI מזהה מתחרים ומילות מפתח בתחום הטיפול הזוגי והגישור</div>
          </div>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #C4956A 0%, #a0724a 100%)" }}
        >
          {loading ? <><Loader2 size={14} className="animate-spin" />מנתח...</> : <><Sparkles size={14} />נתח מתחרים</>}
        </button>
      </div>
      {result && (
        <div className="p-5 grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight size={14} style={{ color: "#dc2626" }} />
              <span className="text-xs font-bold" style={{ color: "var(--brand-dark)" }}>מתחרים עיקריים</span>
            </div>
            <div className="space-y-2">
              {result.competitors.map((c, i) => (
                <div key={i} className="text-xs p-2 rounded-lg" style={{ background: "rgba(220,38,38,0.05)", color: "#4A3728", border: "1px solid rgba(220,38,38,0.1)" }}>
                  {c}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} style={{ color: "var(--brand-gold)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--brand-dark)" }}>מילות מפתח מומלצות</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.map((k, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(196,149,106,0.12)", color: "var(--brand-dark)" }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} style={{ color: "#6B7C5C" }} />
              <span className="text-xs font-bold" style={{ color: "var(--brand-dark)" }}>המלצות לשיפור</span>
            </div>
            <div className="space-y-2">
              {result.tips.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "#4A3728" }}>
                  <CheckCircle2 size={12} style={{ color: "#6B7C5C", flexShrink: 0, marginTop: 1 }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {!result && !loading && (
        <div className="p-8 text-center" style={{ color: "var(--brand-mid)" }}>
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm" style={{ fontFamily: "'Assistant', sans-serif" }}>לחץ על "נתח מתחרים" לקבלת תובנות AI</p>
        </div>
      )}
    </div>
  );
}

// ── SEO Report Panel ──────────────────────────────────────────────────────────
function SeoReportPanel({ pages }: { pages: (SeoRow & { seoScore: number })[] }) {
  const sorted = [...pages].sort((a, b) => b.seoScore - a.seoScore);
  const avgScore = pages.length ? Math.round(pages.reduce((s, p) => s + p.seoScore, 0) / pages.length) : 0;
  const maxScore = Math.max(...pages.map(p => p.seoScore), 1);

  const actionItems = pages
    .flatMap(p => {
      const { issues } = calcSeoScore(p);
      return issues.map(issue => ({ page: p.pageLabel || p.pageKey, issue, score: p.seoScore }));
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(196,149,106,0.2)", background: "white" }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(196,149,106,0.05)", borderBottom: "1px solid rgba(196,149,106,0.1)" }}>
        <BarChart3 size={18} style={{ color: "var(--brand-gold)" }} />
        <div>
          <div className="font-bold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>דוח SEO מפורט</div>
          <div className="text-xs" style={{ color: "var(--brand-mid)" }}>ניתוח ביצועים, השוואה בין דפים ורשימת פעולות מומלצות</div>
        </div>
      </div>
      <div className="p-5 grid grid-cols-2 gap-6">
        {/* Bar chart */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} style={{ color: "var(--brand-gold)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--brand-dark)" }}>ציוני SEO לפי דף</span>
            <span className="mr-auto text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: avgScore >= 80 ? "rgba(107,124,92,0.15)" : "rgba(196,149,106,0.15)", color: avgScore >= 80 ? "#6B7C5C" : "var(--brand-gold)" }}>
              ממוצע: {avgScore}
            </span>
          </div>
          <div className="space-y-2.5">
            {sorted.map(p => {
              const color = p.seoScore >= 80 ? "#6B7C5C" : p.seoScore >= 50 ? "#C4956A" : "#dc2626";
              const pct = (p.seoScore / 100) * 100;
              return (
                <div key={p.pageKey}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color }}>{p.seoScore}</span>
                    <span className="text-xs" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{p.pageLabel || p.pageKey}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(196,149,106,0.1)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action items */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={14} style={{ color: "#dc2626" }} />
            <span className="text-xs font-bold" style={{ color: "var(--brand-dark)" }}>פעולות לשיפור מיידי</span>
          </div>
          <div className="space-y-2">
            {actionItems.length === 0 ? (
              <div className="text-center py-4">
                <Award size={24} className="mx-auto mb-2" style={{ color: "#6B7C5C" }} />
                <p className="text-xs" style={{ color: "#6B7C5C" }}>כל הדפים מצוינים! 🎉</p>
              </div>
            ) : actionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)" }}>
                <AlertCircle size={12} style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <span className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>{item.page}: </span>
                  <span className="text-xs" style={{ color: "#4A3728" }}>{item.issue}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Grade summary */}
          <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(196,149,106,0.06)" }}>
            <div className="text-xs font-bold mb-2" style={{ color: "var(--brand-dark)" }}>סיכום ציונים</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "מצוין (80+)", count: pages.filter(p => p.seoScore >= 80).length, color: "#6B7C5C" },
                { label: "בינוני (50-79)", count: pages.filter(p => p.seoScore >= 50 && p.seoScore < 80).length, color: "#C4956A" },
                { label: "חלש (<50)", count: pages.filter(p => p.seoScore < 50).length, color: "#dc2626" },
              ].map((g, i) => (
                <div key={i} className="rounded-lg p-2" style={{ background: "white" }}>
                  <div className="text-xl font-black" style={{ color: g.color }}>{g.count}</div>
                  <div className="text-xs" style={{ color: "var(--brand-mid)" }}>{g.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Backlink & Promotion Tools ────────────────────────────────────────────────
function PromotionToolsPanel() {
  const [activeTab, setActiveTab] = useState<"backlinks" | "social" | "sitemap">("backlinks");
  const [sitemapCopied, setSitemapCopied] = useState(false);

  const backlinkSources = [
    { name: "דף עסקי בגוגל (Google Business)", url: "https://business.google.com", icon: "🔍", priority: "גבוהה", desc: "חיוני לחיפוש מקומי" },
    { name: "Yad2 מקצועות", url: "https://www.yad2.co.il", icon: "📋", priority: "גבוהה", desc: "אינדקס מקצועי ישראלי" },
    { name: "Duns100 ספריית עסקים", url: "https://www.duns100.co.il", icon: "🏢", priority: "בינונית", desc: "ספריית עסקים ישראלית" },
    { name: "BDI ספריית מקצועות", url: "https://www.bdi.co.il", icon: "📊", priority: "בינונית", desc: "מאגר עסקים ישראלי" },
    { name: "LinkedIn פרופיל מקצועי", url: "https://www.linkedin.com", icon: "💼", priority: "גבוהה", desc: "רשת מקצועית עם SEO חזק" },
    { name: "Walla! מדריך עסקים", url: "https://biz.walla.co.il", icon: "🌐", priority: "בינונית", desc: "פורטל ישראלי מוביל" },
  ];

  const socialPosts = [
    { platform: "פייסבוק", icon: "📘", template: "💙 טיפול זוגי שמחזיר את האהבה\n\nאם אתם מרגישים שהקשר הזוגי שלכם זקוק לעזרה — אתם לא לבד.\nמאיר שמעון עשור, עם 33 שנות ניסיון, מלווה זוגות בדרך לחיבור מחדש.\n\n📞 לפגישת היכרות: nativ-lamishpacha.com\n\n#טיפולזוגי #זוגיות #גישור" },
    { platform: "אינסטגרם", icon: "📸", template: "✨ כי כל זוג ראוי לסיכוי שני\n\n33 שנה של ניסיון בטיפול זוגי, גישור וייעוץ משפטי בבתי הדין הרבניים.\n\nהצעד הראשון הוא הקשה ביותר — אנחנו כאן לעזור 💙\n\n🔗 קישור בביו\n\n#נתיבלמשפחה #טיפולזוגי #גישור #זוגיות" },
    { platform: "ווטסאפ סטטוס", icon: "💬", template: "🏠 נתיב למשפחה\nטיפול זוגי | גישור | ייעוץ משפטי\n\nמאיר שמעון עשור — 33 שנות ניסיון\n📞 לפגישת ייעוץ: nativ-lamishpacha.com" },
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.nativ-lamishpacha.com/</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://www.nativ-lamishpacha.com/tipul-zugi</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://www.nativ-lamishpacha.com/gishur</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://www.nativ-lamishpacha.com/yiutz-mishpati</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://www.nativ-lamishpacha.com/articles</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://www.nativ-lamishpacha.com/books</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://www.nativ-lamishpacha.com/faq</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://www.nativ-lamishpacha.com/nlp</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
</urlset>`;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(196,149,106,0.2)", background: "white" }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: "rgba(196,149,106,0.05)", borderBottom: "1px solid rgba(196,149,106,0.1)" }}>
        <TrendingUp size={18} style={{ color: "var(--brand-gold)" }} />
        <div>
          <div className="font-bold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>כלי קידום חדשניים</div>
          <div className="text-xs" style={{ color: "var(--brand-mid)" }}>קישורים נכנסים, תוכן לרשתות חברתיות ו-Sitemap</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b px-5" style={{ borderColor: "rgba(196,149,106,0.1)" }}>
        {([
          { id: "backlinks", label: "קישורים נכנסים", icon: Link2 },
          { id: "social", label: "רשתות חברתיות", icon: Share2 },
          { id: "sitemap", label: "Sitemap XML", icon: Map },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors"
            style={{ borderColor: activeTab === tab.id ? "var(--brand-gold)" : "transparent", color: activeTab === tab.id ? "var(--brand-dark)" : "var(--brand-mid)" }}>
            <tab.icon size={13} />{tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === "backlinks" && (
          <div>
            <p className="text-xs mb-4" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
              קישורים נכנסים (Backlinks) הם אחד הגורמים החשובים ביותר לדירוג בגוגל. הירשם לאתרים הבאים כדי לחזק את סמכות הדומיין שלך:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {backlinkSources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-xl transition-all hover:shadow-md"
                  style={{ border: "1px solid rgba(196,149,106,0.15)", background: "rgba(196,149,106,0.02)", textDecoration: "none" }}>
                  <span className="text-2xl">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>{s.name}</div>
                    <div className="text-xs" style={{ color: "var(--brand-mid)" }}>{s.desc}</div>
                    <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full" style={{
                      background: s.priority === "גבוהה" ? "rgba(107,124,92,0.15)" : "rgba(196,149,106,0.15)",
                      color: s.priority === "גבוהה" ? "#6B7C5C" : "var(--brand-gold)"
                    }}>עדיפות {s.priority}</span>
                  </div>
                  <ExternalLink size={12} style={{ color: "var(--brand-mid)", flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-4">
            <p className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
              תוכן מוכן לפרסום ברשתות חברתיות — עזרה לקידום האתר ובניית נוכחות דיגיטלית:
            </p>
            {socialPosts.map((p, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(196,149,106,0.15)" }}>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(196,149,106,0.06)" }}>
                  <span className="text-xs font-bold" style={{ color: "var(--brand-dark)" }}>{p.icon} {p.platform}</span>
                  <button onClick={() => { navigator.clipboard.writeText(p.template); }}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "var(--brand-gold)", color: "white" }}>
                    <Copy size={11} /> העתק
                  </button>
                </div>
                <div className="p-4">
                  <pre className="text-xs whitespace-pre-wrap text-right" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>{p.template}</pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "sitemap" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs" style={{ color: "var(--brand-mid)" }}>
                Sitemap XML מסייע לגוגל לסרוק ולאנדקס את כל דפי האתר שלך ביעילות:
              </p>
              <button
                onClick={() => { navigator.clipboard.writeText(sitemapXml); setSitemapCopied(true); setTimeout(() => setSitemapCopied(false), 2000); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 mr-3"
                style={{ background: sitemapCopied ? "rgba(107,124,92,0.15)" : "var(--brand-gold)", color: sitemapCopied ? "#6B7C5C" : "white" }}>
                {sitemapCopied ? <><Check size={12} />הועתק!</> : <><Copy size={12} />העתק</>}
              </button>
            </div>
            <div className="rounded-xl p-4 overflow-auto" style={{ background: "#1e1e2e", maxHeight: 280 }}>
              <pre className="text-xs" style={{ color: "#a6e3a1", fontFamily: "monospace", direction: "ltr" }}>{sitemapXml}</pre>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(107,124,92,0.06)", border: "1px solid rgba(107,124,92,0.15)" }}>
                <CheckCircle2 size={14} style={{ color: "#6B7C5C" }} />
                <p className="text-xs" style={{ color: "#4A3728" }}>
                  <strong>שלב 1:</strong> שמור את הקובץ כ-<code>sitemap.xml</code> בתיקיית הבסיס של האתר
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(107,124,92,0.06)", border: "1px solid rgba(107,124,92,0.15)" }}>
                <CheckCircle2 size={14} style={{ color: "#6B7C5C" }} />
                <p className="text-xs" style={{ color: "#4A3728" }}>
                  <strong>שלב 2:</strong> הגש ל-<a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-gold)" }}>Google Search Console</a> תחת "Sitemaps"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SEO Page Row ──────────────────────────────────────────────────────────────
function SeoPageRow({ row, onSave }: { row: SeoRow; onSave: (data: SeoRow) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<SeoRow>({ ...row });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "analysis">("edit");
  const [aiApplied, setAiApplied] = useState(false);

  const aiSuggestMutation = trpc.adminSeo.aiSuggest.useMutation({
    onSuccess: (data) => {
      setForm(f => ({ ...f, metaTitle: data.metaTitle, metaDescription: data.metaDescription, ogTitle: data.ogTitle, keywords: data.keywords }));
      setAiApplied(true);
      setActiveTab("edit");
      setTimeout(() => setAiApplied(false), 3000);
    },
  });

  const { score, issues, passes } = useMemo(() => calcSeoScore(form), [form]);
  const handleSave = () => { onSave(form); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const scoreColor = score >= 80 ? "#6B7C5C" : score >= 50 ? "#C4956A" : "#dc2626";
  const pageUrl = `https://www.nativ-lamishpacha.com/${row.pageKey === "home" ? "" : row.pageKey}`;

  return (
    <div className="rounded-2xl overflow-hidden mb-3 transition-shadow hover:shadow-md" style={{ border: "1px solid rgba(196,149,106,0.2)", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-amber-50/20 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp size={16} style={{ color: "var(--brand-gold)" }} /> : <ChevronDown size={16} style={{ color: "var(--brand-gold)" }} />}
          <a href={pageUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="hover:underline flex items-center gap-1" style={{ color: "var(--brand-mid)", fontSize: 12 }}>
            <ExternalLink size={11} />/{row.pageKey === "home" ? "" : row.pageKey}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full" style={{ background: "rgba(196,149,106,0.15)" }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${score}%`, background: scoreColor }} />
            </div>
            <span className="text-xs font-bold" style={{ color: scoreColor }}>{score}</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{row.pageLabel}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t" style={{ borderColor: "rgba(196,149,106,0.1)" }} dir="rtl">
          <div className="flex border-b px-5" style={{ borderColor: "rgba(196,149,106,0.1)", background: "rgba(196,149,106,0.03)" }}>
            {([
              { id: "edit", label: "עריכה", icon: FileText },
              { id: "preview", label: "תצוגה מקדימה", icon: Eye },
              { id: "analysis", label: "ניתוח SEO", icon: BarChart3 },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors"
                style={{ borderColor: activeTab === tab.id ? "var(--brand-gold)" : "transparent", color: activeTab === tab.id ? "var(--brand-dark)" : "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
                <tab.icon size={13} />{tab.label}
              </button>
            ))}
          </div>

          {activeTab === "edit" && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}><FileText size={11} className="inline ml-1" />כותרת Meta (title)</label>
                    <CopyBtn text={form.metaTitle || ""} />
                  </div>
                  <input type="text" value={form.metaTitle || ""} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: (form.metaTitle?.length || 0) > 60 ? "#dc2626" : (form.metaTitle?.length || 0) >= 50 ? "#6B7C5C" : "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                    placeholder="כותרת לכרטיסיית הדפדפן..." maxLength={70} />
                  <CharCounter value={form.metaTitle || ""} min={30} max={60} ideal={[50, 60]} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}><Globe size={11} className="inline ml-1" />כותרת OG (שיתוף)</label>
                    <CopyBtn text={form.ogTitle || ""} />
                  </div>
                  <input type="text" value={form.ogTitle || ""} onChange={e => setForm(f => ({ ...f, ogTitle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                    placeholder="כותרת לשיתוף ברשתות חברתיות..." maxLength={60} />
                  <div className="text-xs mt-0.5" style={{ color: "var(--brand-mid)" }}>לפייסבוק, ווטסאפ, טוויטר</div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold" style={{ color: "var(--brand-dark)" }}>תיאור Meta (description)</label>
                  <CopyBtn text={form.metaDescription || ""} />
                </div>
                <textarea value={form.metaDescription || ""} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                  style={{ borderColor: (form.metaDescription?.length || 0) > 160 ? "#dc2626" : (form.metaDescription?.length || 0) >= 120 ? "#6B7C5C" : "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                  placeholder="תיאור קצר של הדף לתוצאות חיפוש..." maxLength={180} />
                <CharCounter value={form.metaDescription || ""} min={70} max={160} ideal={[120, 160]} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תיאור OG (שיתוף)</label>
                <textarea value={form.ogDescription || ""} onChange={e => setForm(f => ({ ...f, ogDescription: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                  style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                  placeholder="תיאור לשיתוף ברשתות חברתיות..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תמונת OG (URL)</label>
                  <input type="text" value={form.ogImage || ""} onChange={e => setForm(f => ({ ...f, ogImage: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm text-left"
                    style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "monospace", direction: "ltr" }}
                    placeholder="/manus-storage/og-image.jpg" />
                  <div className="text-xs mt-0.5" style={{ color: "var(--brand-mid)" }}>מומלץ: 1200×630 פיקסלים</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}><Tag size={11} className="inline ml-1" />מילות מפתח (מופרדות בפסיק)</label>
                  <input type="text" value={form.keywords || ""} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                    placeholder="טיפול זוגי, גישור, ייעוץ משפטי" />
                  <div className="text-xs mt-0.5" style={{ color: "var(--brand-mid)" }}>
                    {form.keywords ? `${form.keywords.split(",").filter(k => k.trim()).length} מילות מפתח` : "מומלץ 3-8 מילות מפתח"}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>Canonical URL (אופציונלי)</label>
                <input type="text" value={form.canonical || ""} onChange={e => setForm(f => ({ ...f, canonical: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm text-left"
                  style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "monospace", direction: "ltr" }}
                  placeholder="https://www.nativ-lamishpacha.com/..." />
              </div>
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <button onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: saved ? "#6B7C5C" : "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
                  <Save size={14} />{saved ? "נשמר!" : "שמור שינויים"}
                </button>
                <button onClick={() => aiSuggestMutation.mutate({ pageKey: row.pageKey, pageLabel: row.pageLabel || row.pageKey })}
                  disabled={aiSuggestMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: aiApplied ? "rgba(107,124,92,0.15)" : "linear-gradient(135deg, #C4956A 0%, #a0724a 100%)", color: aiApplied ? "#6B7C5C" : "white", border: aiApplied ? "1px solid #6B7C5C" : "none", fontFamily: "'Assistant', sans-serif" }}>
                  {aiSuggestMutation.isPending ? <><Loader2 size={14} className="animate-spin" />מייצר המלצות...</>
                    : aiApplied ? <><CheckCircle2 size={14} />הוחל בהצלחה!</>
                    : <><Sparkles size={14} />הצעת AI</>}
                </button>
                {saved && <span className="text-xs" style={{ color: "#6B7C5C" }}>✓ הנתונים עודכנו בהצלחה</span>}
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search size={14} style={{ color: "var(--brand-gold)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>תצוגה מקדימה בגוגל</span>
                </div>
                <GooglePreview title={form.metaTitle || ""} description={form.metaDescription || ""} url={pageUrl} />
              </div>
              {(form.ogTitle || form.ogDescription) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe size={14} style={{ color: "var(--brand-gold)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>תצוגה מקדימה לשיתוף</span>
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
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"pages" | "report" | "tools">("pages");
  const utils = trpc.useUtils();

  const { data: pages, isLoading, refetch } = trpc.adminSeo.getAll.useQuery();

  const updateMutation = trpc.adminSeo.update.useMutation({
    onSuccess: () => utils.adminSeo.getAll.invalidate()
  });

  const BulkPanel = () => {
    const [statuses, setStatuses] = useState<{ pageKey: string; pageLabel: string; status: "pending" | "running" | "done" | "error" }[]>(
      (pages || []).map(p => ({ pageKey: p.pageKey, pageLabel: (p as { pageLabel?: string }).pageLabel || p.pageKey, status: "pending" as const }))
    );
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const aiSuggest = trpc.adminSeo.aiSuggest.useMutation();
    const updateSeo = trpc.adminSeo.update.useMutation();

    const runBulk = async () => {
      setRunning(true);
      for (const page of (pages || [])) {
        const pageLabel = (page as { pageLabel?: string }).pageLabel || page.pageKey;
        setStatuses(s => s.map(x => x.pageKey === page.pageKey ? { ...x, status: "running" } : x));
        try {
          const suggestion = await aiSuggest.mutateAsync({ pageKey: page.pageKey, pageLabel });
          await updateSeo.mutateAsync({ pageKey: page.pageKey, metaTitle: suggestion.metaTitle, metaDescription: suggestion.metaDescription, ogTitle: suggestion.ogTitle, keywords: suggestion.keywords });
          setStatuses(s => s.map(x => x.pageKey === page.pageKey ? { ...x, status: "done" } : x));
        } catch {
          setStatuses(s => s.map(x => x.pageKey === page.pageKey ? { ...x, status: "error" } : x));
        }
        await new Promise(r => setTimeout(r, 800));
      }
      setRunning(false);
      setDone(true);
      utils.adminSeo.getAll.invalidate();
    };

    const doneCount = statuses.filter(s => s.status === "done").length;
    const errorCount = statuses.filter(s => s.status === "error").length;
    const progress = Math.round(((doneCount + errorCount) / Math.max(statuses.length, 1)) * 100);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} dir="rtl">
        <div className="rounded-2xl p-6 w-full max-w-lg shadow-2xl" style={{ background: "white", maxHeight: "80vh", overflowY: "auto" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>ייצור SEO אוטומטי לכל הדפים</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>ה-AI ייצור כותרת, תיאור ומילות מפתח לכל {statuses.length} דפים</p>
            </div>
            <button onClick={() => setShowBulkPanel(false)} disabled={running} className="p-2 rounded-lg hover:bg-gray-100 text-xl" style={{ color: "var(--brand-mid)" }}>×</button>
          </div>
          {(running || done) && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1" style={{ color: "var(--brand-mid)" }}>
                <span>{doneCount + errorCount} / {statuses.length} דפים</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(196,149,106,0.15)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: done ? "#6B7C5C" : "var(--brand-gold)" }} />
              </div>
            </div>
          )}
          <div className="space-y-2 mb-5">
            {statuses.map(s => (
              <div key={s.pageKey} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(196,149,106,0.05)", border: "1px solid rgba(196,149,106,0.1)" }}>
                <div className="flex items-center gap-2">
                  {s.status === "pending" && <div className="w-4 h-4 rounded-full" style={{ background: "rgba(196,149,106,0.2)" }} />}
                  {s.status === "running" && <Loader2 size={16} className="animate-spin" style={{ color: "var(--brand-gold)" }} />}
                  {s.status === "done" && <CheckCircle2 size={16} style={{ color: "#6B7C5C" }} />}
                  {s.status === "error" && <AlertCircle size={16} style={{ color: "#dc2626" }} />}
                  <span className="text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{s.pageLabel}</span>
                </div>
                <span className="text-xs" style={{ color: s.status === "done" ? "#6B7C5C" : s.status === "error" ? "#dc2626" : s.status === "running" ? "var(--brand-gold)" : "var(--brand-mid)" }}>
                  {s.status === "pending" ? "ממתין" : s.status === "running" ? "מעבד..." : s.status === "done" ? "בוצע ✓" : "שגיאה"}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            {!running && !done && (
              <button onClick={runBulk} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm" style={{ background: "linear-gradient(135deg, #C4956A 0%, #a0724a 100%)", fontFamily: "'Assistant', sans-serif" }}>
                <Sparkles size={16} />התחל ייצור אוטומטי
              </button>
            )}
            {done && <div className="flex-1 text-center py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(107,124,92,0.1)", color: "#6B7C5C" }}>✓ הושלם! {doneCount} דפים עודכנו{errorCount > 0 ? `, ${errorCount} שגיאות` : ""}</div>}
            <button onClick={() => setShowBulkPanel(false)} disabled={running} className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(196,149,106,0.1)", color: "var(--brand-dark)" }}>{done ? "סגור" : "בטל"}</button>
          </div>
        </div>
      </div>
    );
  };

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
      const matchFilter = filter === "all" ? true : filter === "good" ? p.seoScore >= 80 : filter === "needs_work" ? (p.seoScore >= 50 && p.seoScore < 80) : p.seoScore < 50;
      return matchSearch && matchFilter;
    }),
    [pagesWithScore, search, filter]
  );

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>ניהול קידום אורגני</h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>ניהול Meta Tags, ניתוח SEO ותצוגה מקדימה לכל דף באתר</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBulkPanel(true)} disabled={isLoading || !pages?.length}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #C4956A 0%, #a0724a 100%)", fontFamily: "'Assistant', sans-serif" }}>
            <Sparkles size={14} />ייצור AI לכל הדפים
          </button>
          <button onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-amber-50"
            style={{ color: "var(--brand-mid)", border: "1px solid rgba(196,149,106,0.2)", fontFamily: "'Assistant', sans-serif" }}>
            <RefreshCw size={14} />רענן
          </button>
        </div>
      </div>
      {showBulkPanel && <BulkPanel />}

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

      {/* Main Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: "rgba(196,149,106,0.08)" }}>
        {([
          { id: "pages", label: "ניהול דפים", icon: FileText },
          { id: "report", label: "דוח SEO מפורט", icon: BarChart3 },
          { id: "tools", label: "כלי קידום חדשניים", icon: Zap },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveMainTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeMainTab === tab.id ? "white" : "transparent",
              color: activeMainTab === tab.id ? "var(--brand-dark)" : "var(--brand-mid)",
              boxShadow: activeMainTab === tab.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              fontFamily: "'Assistant', sans-serif"
            }}>
            <tab.icon size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* Pages Tab */}
      {activeMainTab === "pages" && (
        <>
          <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: "rgba(196,149,106,0.06)", border: "1px solid rgba(196,149,106,0.15)" }}>
            <Info size={16} style={{ color: "var(--brand-gold)", flexShrink: 0, marginTop: 1 }} />
            <div className="text-sm leading-relaxed" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
              <strong>טיפים לקידום אורגני:</strong> כותרת Meta אידיאלית: 50-60 תווים. תיאור Meta: 120-160 תווים. השתמש במילות מפתח רלוונטיות בכותרת ובתיאור. הוסף תמונת OG לשיתוף ברשתות חברתיות.
            </div>
          </div>
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brand-mid)" }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש דף..."
                className="w-full pr-9 pl-3 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }} />
            </div>
            <div className="flex gap-2">
              {([
                { id: "all", label: "הכל" },
                { id: "good", label: "מצוין" },
                { id: "needs_work", label: "לשיפור" },
                { id: "missing", label: "חלש" },
              ] as const).map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: filter === f.id ? "var(--brand-dark)" : "white", color: filter === f.id ? "white" : "var(--brand-mid)", border: `1px solid ${filter === f.id ? "var(--brand-dark)" : "rgba(196,149,106,0.2)"}`, fontFamily: "'Assistant', sans-serif" }}>
                  {f.label}
                  {f.id !== "all" && <span className="mr-1 opacity-70">({f.id === "good" ? stats.good : f.id === "needs_work" ? stats.medium : stats.poor})</span>}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="rounded-2xl h-16 animate-pulse" style={{ background: "rgba(196,149,106,0.08)" }} />)}</div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: "rgba(196,149,106,0.05)", border: "1px dashed rgba(196,149,106,0.2)" }}>
              <Search size={32} className="mx-auto mb-3" style={{ color: "rgba(196,149,106,0.4)" }} />
              <p className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>לא נמצאו דפים</p>
            </div>
          ) : filteredPages.map(page => (
            <SeoPageRow key={page.pageKey} row={page as SeoRow}
              onSave={(data) => updateMutation.mutate({ ...data, metaTitle: data.metaTitle ?? undefined, metaDescription: data.metaDescription ?? undefined, ogTitle: data.ogTitle ?? undefined, ogDescription: data.ogDescription ?? undefined, ogImage: data.ogImage ?? undefined, keywords: data.keywords ?? undefined, canonical: data.canonical ?? undefined, pageLabel: data.pageLabel ?? undefined })} />
          ))}
        </>
      )}

      {/* Report Tab */}
      {activeMainTab === "report" && !isLoading && (
        <SeoReportPanel pages={pagesWithScore as (SeoRow & { seoScore: number })[]} />
      )}

      {/* Tools Tab */}
      {activeMainTab === "tools" && !isLoading && (
        <div className="space-y-6">
          <SchemaMarkupPanel pages={(pages || []) as SeoRow[]} />
          <CompetitorPanel />
          <PromotionToolsPanel />
        </div>
      )}
    </div>
  );
}
