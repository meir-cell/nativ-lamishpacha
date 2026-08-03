import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Plus, Search, Edit2, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  Image, Volume2, Tag, Calendar, Clock, Save, X, ArrowRight
} from "lucide-react";

const CATEGORIES = [
  "גישור ויישוב סכסוכים",
  "טיפול זוגי בנישואין",
  "משפטיים",
  "פסיכולוגיה יהודית",
  "פרקים בתניא",
  "הלכתיים - בין בני זוג",
];

type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  img: string | null;
  audioSrc: string | null;
  category: string | null;
  date: string | null;
  readTime: string | null;
  published: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function ArticleRow({ article, onEdit, onDelete, onTogglePublish }: {
  article: Article;
  onEdit: (a: Article) => void;
  onDelete: (id: number) => void;
  onTogglePublish: (id: number, published: number) => void;
}) {
  return (
    <tr className="border-b hover:bg-amber-50/30 transition-colors" style={{ borderColor: "rgba(196,149,106,0.1)" }}>
      <td className="py-3 px-4 text-right">
        <div className="font-semibold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{article.title}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--brand-mid)" }}>{article.slug}</div>
      </td>
      <td className="py-3 px-4 text-right">
        {article.category && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-mid)" }}>
            {article.category}
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1">
          {article.img && <Image size={14} style={{ color: "var(--brand-gold)" }} />}
          {article.audioSrc && <Volume2 size={14} style={{ color: "var(--brand-gold)" }} />}
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <button
          onClick={() => onTogglePublish(article.id, article.published ? 0 : 1)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors"
          style={{
            background: article.published ? "rgba(107,124,92,0.15)" : "rgba(220,38,38,0.1)",
            color: article.published ? "#6B7C5C" : "#dc2626"
          }}
        >
          {article.published ? <Eye size={10} /> : <EyeOff size={10} />}
          {article.published ? "מפורסם" : "מוסתר"}
        </button>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => onEdit(article)} className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors" title="עריכה">
            <Edit2 size={14} style={{ color: "var(--brand-gold)" }} />
          </button>
          <button onClick={() => onDelete(article.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="מחיקה">
            <Trash2 size={14} style={{ color: "#dc2626" }} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ArticleEditor({ article, onSave, onCancel }: {
  article: Partial<Article> | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    slug: article?.slug || "",
    title: article?.title || "",
    excerpt: article?.excerpt || "",
    content: article?.content || "",
    img: article?.img || "",
    audioSrc: article?.audioSrc || "",
    category: article?.category || "",
    date: article?.date || new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" }),
    readTime: article?.readTime || "",
    published: article?.published ?? 1,
    sortOrder: article?.sortOrder ?? 0,
  });

  const handleChange = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const autoSlug = (title: string) => title
    .toLowerCase()
    .replace(/[\u0590-\u05FF]/g, c => c)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0590-\u05FF-]/g, "")
    .substring(0, 80);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-4xl my-8 mx-4 rounded-2xl overflow-hidden" style={{ background: "var(--brand-cream)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(196,149,106,0.2)", background: "var(--brand-dark)" }}>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} style={{ color: "white" }} />
          </button>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
            {article?.id ? "עריכת מאמר" : "מאמר חדש"}
          </h2>
        </div>

        <div className="p-6 space-y-5" dir="rtl">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>כותרת *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => {
                handleChange("title", e.target.value);
                if (!article?.id) handleChange("slug", autoSlug(e.target.value));
              }}
              className="w-full px-3 py-2 rounded-xl border text-right"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif", fontSize: 15 }}
              placeholder="כותרת המאמר"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>Slug (URL) *</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => handleChange("slug", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-left"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "monospace", fontSize: 13, direction: "ltr" }}
              placeholder="article-slug"
            />
          </div>

          {/* Category + Date + ReadTime */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>קטגוריה</label>
              <select
                value={form.category}
                onChange={e => handleChange("category", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
              >
                <option value="">ללא קטגוריה</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תאריך</label>
              <input
                type="text"
                value={form.date}
                onChange={e => handleChange("date", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                placeholder="יולי 1, 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>זמן קריאה</label>
              <input
                type="text"
                value={form.readTime}
                onChange={e => handleChange("readTime", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                placeholder="10 דקות קריאה"
              />
            </div>
          </div>

          {/* Image + Audio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>
                <Image size={14} className="inline ml-1" />תמונה (URL)
              </label>
              <input
                type="text"
                value={form.img}
                onChange={e => handleChange("img", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-left"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "monospace", fontSize: 12, direction: "ltr" }}
                placeholder="/manus-storage/image.jpg"
              />
              {form.img && <img src={form.img} className="mt-2 h-16 w-full object-cover rounded-lg" alt="" />}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>
                <Volume2 size={14} className="inline ml-1" />שמע (URL)
              </label>
              <input
                type="text"
                value={form.audioSrc}
                onChange={e => handleChange("audioSrc", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-left"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "monospace", fontSize: 12, direction: "ltr" }}
                placeholder="/manus-storage/audio.wav"
              />
              {form.audioSrc && <audio src={form.audioSrc} controls className="mt-2 w-full h-8" />}
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תקציר</label>
            <textarea
              value={form.excerpt}
              onChange={e => handleChange("excerpt", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border resize-none"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif", fontSize: 14 }}
              placeholder="תקציר קצר של המאמר..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תוכן (Markdown)</label>
            <textarea
              value={form.content}
              onChange={e => handleChange("content", e.target.value)}
              rows={15}
              className="w-full px-3 py-2 rounded-xl border resize-y"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "monospace", fontSize: 13, direction: "rtl" }}
              placeholder="תוכן המאמר בפורמט Markdown..."
            />
          </div>

          {/* Published + Sort */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published === 1}
                onChange={e => handleChange("published", e.target.checked ? 1 : 0)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>מפורסם</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold" style={{ color: "var(--brand-dark)" }}>סדר:</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => handleChange("sortOrder", parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 rounded-lg border text-center"
                style={{ borderColor: "rgba(196,149,106,0.3)" }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onSave({ ...form, ...(article?.id ? { id: article.id } : {}) })}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
            >
              <Save size={16} />
              שמור
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all hover:bg-gray-100"
              style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminArticles() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null | false>(false);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.adminArticles.list.useQuery({
    search: search || undefined,
    category: categoryFilter || undefined,
    page: 1,
    pageSize: 100,
  });

  const createMutation = trpc.adminArticles.create.useMutation({
    onSuccess: () => { utils.adminArticles.list.invalidate(); setEditingArticle(false); }
  });
  const updateMutation = trpc.adminArticles.update.useMutation({
    onSuccess: () => { utils.adminArticles.list.invalidate(); setEditingArticle(false); }
  });
  const deleteMutation = trpc.adminArticles.delete.useMutation({
    onSuccess: () => utils.adminArticles.list.invalidate()
  });

  const handleSave = (formData: any) => {
    if (formData.id) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("האם למחוק מאמר זה?")) deleteMutation.mutate({ id });
  };

  const handleTogglePublish = (id: number, published: number) => {
    updateMutation.mutate({ id, published });
  };

  const articles = data?.articles || [];

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            ניהול מאמרים
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
            {data?.total ?? 0} מאמרים במערכת
          </p>
        </div>
        <button
          onClick={() => setEditingArticle({})}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
        >
          <Plus size={16} />
          מאמר חדש
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brand-mid)" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש מאמרים..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border"
            style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border"
          style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
        >
          <option value="">כל הקטגוריות</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(196,149,106,0.15)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--brand-dark)" }}>
              <th className="py-3 px-4 text-right text-sm font-semibold text-white" style={{ fontFamily: "'Assistant', sans-serif" }}>כותרת</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-white" style={{ fontFamily: "'Assistant', sans-serif" }}>קטגוריה</th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-white" style={{ fontFamily: "'Assistant', sans-serif" }}>מדיה</th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-white" style={{ fontFamily: "'Assistant', sans-serif" }}>סטטוס</th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-white" style={{ fontFamily: "'Assistant', sans-serif" }}>פעולות</th>
            </tr>
          </thead>
          <tbody style={{ background: "white" }}>
            {isLoading ? (
              <tr><td colSpan={5} className="py-12 text-center" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>טוען...</td></tr>
            ) : articles.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
                {search || categoryFilter ? "לא נמצאו מאמרים התואמים את החיפוש" : "אין מאמרים במערכת. לחץ על 'מאמר חדש' להוספה."}
              </td></tr>
            ) : articles.map(a => (
              <ArticleRow
                key={a.id}
                article={a as Article}
                onEdit={setEditingArticle}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {editingArticle !== false && (
        <ArticleEditor
          article={editingArticle}
          onSave={handleSave}
          onCancel={() => setEditingArticle(false)}
        />
      )}
    </div>
  );
}
