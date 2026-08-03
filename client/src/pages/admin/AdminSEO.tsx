import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Globe, Save, ChevronDown, ChevronUp, ExternalLink, Tag, Image, FileText } from "lucide-react";

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

function SeoPageRow({ row, onSave }: { row: SeoRow; onSave: (data: SeoRow) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<SeoRow>({ ...row });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasData = !!(row.metaTitle || row.metaDescription || row.keywords);

  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ border: "1px solid rgba(196,149,106,0.15)", background: "white" }}>
      {/* Row header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-amber-50/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp size={16} style={{ color: "var(--brand-gold)" }} /> : <ChevronDown size={16} style={{ color: "var(--brand-gold)" }} />}
          <a
            href={`/${row.pageKey === "home" ? "" : row.pageKey}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="hover:underline"
            style={{ color: "var(--brand-mid)", fontSize: 12 }}
          >
            <ExternalLink size={12} className="inline ml-1" />
            /{row.pageKey === "home" ? "" : row.pageKey}
          </a>
        </div>
        <div className="flex items-center gap-3">
          {hasData && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(107,124,92,0.15)", color: "#6B7C5C" }}>
              <Tag size={10} />מוגדר
            </span>
          )}
          <span className="font-semibold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
            {row.pageLabel}
          </span>
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: "rgba(196,149,106,0.1)" }} dir="rtl">
          <div className="pt-4 grid grid-cols-2 gap-4">
            {/* Meta Title */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>
                <FileText size={12} className="inline ml-1" />כותרת Meta (title)
              </label>
              <input
                type="text"
                value={form.metaTitle || ""}
                onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                placeholder="כותרת לכרטיסיית הדפדפן..."
                maxLength={60}
              />
              <div className="text-xs mt-0.5 text-left" style={{ color: (form.metaTitle?.length || 0) > 55 ? "#dc2626" : "var(--brand-mid)" }}>
                {form.metaTitle?.length || 0}/60
              </div>
            </div>

            {/* OG Title */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>
                <Globe size={12} className="inline ml-1" />כותרת OG (שיתוף)
              </label>
              <input
                type="text"
                value={form.ogTitle || ""}
                onChange={e => setForm(f => ({ ...f, ogTitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                placeholder="כותרת לשיתוף ברשתות חברתיות..."
                maxLength={60}
              />
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תיאור Meta (description)</label>
            <textarea
              value={form.metaDescription || ""}
              onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
              placeholder="תיאור קצר של הדף לתוצאות חיפוש..."
              maxLength={160}
            />
            <div className="text-xs mt-0.5 text-left" style={{ color: (form.metaDescription?.length || 0) > 150 ? "#dc2626" : "var(--brand-mid)" }}>
              {form.metaDescription?.length || 0}/160
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
                <Image size={12} className="inline ml-1" />תמונת OG (URL)
              </label>
              <input
                type="text"
                value={form.ogImage || ""}
                onChange={e => setForm(f => ({ ...f, ogImage: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-sm text-left"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "monospace", direction: "ltr" }}
                placeholder="/manus-storage/og-image.jpg"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>
                <Tag size={12} className="inline ml-1" />מילות מפתח (מופרדות בפסיק)
              </label>
              <input
                type="text"
                value={form.keywords || ""}
                onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                placeholder="טיפול זוגי, גישור, ייעוץ משפטי"
              />
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

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
              style={{ background: saved ? "#6B7C5C" : "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
            >
              <Save size={14} />
              {saved ? "נשמר!" : "שמור"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSEO() {
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: pages, isLoading } = trpc.adminSeo.getAll.useQuery();

  const updateMutation = trpc.adminSeo.update.useMutation({
    onSuccess: () => utils.adminSeo.getAll.invalidate()
  });

  const filteredPages = (pages || []).filter(p =>
    !search || p.pageLabel?.includes(search) || p.pageKey.includes(search)
  );

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
          ניהול קידום אורגני (SEO)
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
          הגדרת meta tags, תיאורים ומילות מפתח לכל דף באתר
        </p>
      </div>

      {/* Tips */}
      <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(196,149,106,0.08)", border: "1px solid rgba(196,149,106,0.2)" }}>
        <p className="text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
          <strong>טיפים לקידום אורגני:</strong> כותרת Meta אידיאלית: 50-60 תווים. תיאור Meta: 120-160 תווים. השתמש במילות מפתח רלוונטיות בכותרת ובתיאור.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brand-mid)" }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש דף..."
          className="w-full pr-9 pl-3 py-2 rounded-xl border"
          style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
        />
      </div>

      {/* Pages */}
      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>טוען...</div>
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
