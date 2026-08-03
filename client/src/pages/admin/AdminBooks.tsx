import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Save, X, BookOpen, FileText } from "lucide-react";

const CATEGORIES = [
  "מחקר אקדמי",
  "פסיכולוגיה יהודית",
  "הספרים שלי",
  "חסידות",
  "הלכה",
];

type Book = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  pages: number | null;
  category: string | null;
  pdfUrl: string | null;
  img: string | null;
  color: string | null;
  icon: string | null;
  published: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function BookRow({ book, onEdit, onDelete, onTogglePublish }: {
  book: Book;
  onEdit: (b: Book) => void;
  onDelete: (id: number) => void;
  onTogglePublish: (id: number, published: number) => void;
}) {
  return (
    <tr className="border-b hover:bg-amber-50/30 transition-colors" style={{ borderColor: "rgba(196,149,106,0.1)" }}>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center gap-2 justify-end">
          {book.icon && <span className="text-lg">{book.icon}</span>}
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{book.title}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--brand-mid)" }}>{book.subtitle}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        {book.category && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-mid)" }}>
            {book.category}
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-center text-sm" style={{ color: "var(--brand-mid)" }}>
        {book.pages ? `${book.pages} עמ'` : "—"}
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1">
          {book.pdfUrl && <span title="יש PDF"><FileText size={14} style={{ color: "var(--brand-gold)" }} /></span>}
          {book.img && <span title="יש תמונה"><BookOpen size={14} style={{ color: "var(--brand-gold)" }} /></span>}
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <button
          onClick={() => onTogglePublish(book.id, book.published ? 0 : 1)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors"
          style={{
            background: book.published ? "rgba(107,124,92,0.15)" : "rgba(220,38,38,0.1)",
            color: book.published ? "#6B7C5C" : "#dc2626"
          }}
        >
          {book.published ? <Eye size={10} /> : <EyeOff size={10} />}
          {book.published ? "מפורסם" : "מוסתר"}
        </button>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => onEdit(book)} className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors" title="עריכה">
            <Edit2 size={14} style={{ color: "var(--brand-gold)" }} />
          </button>
          <button onClick={() => onDelete(book.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="מחיקה">
            <Trash2 size={14} style={{ color: "#dc2626" }} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function BookEditor({ book, onSave, onCancel }: {
  book: Partial<Book> | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    slug: book?.slug || "",
    title: book?.title || "",
    subtitle: book?.subtitle || "",
    description: book?.description || "",
    pages: book?.pages || 0,
    category: book?.category || "",
    pdfUrl: book?.pdfUrl || "",
    img: book?.img || "",
    color: book?.color || "#C4956A",
    icon: book?.icon || "📚",
    published: book?.published ?? 1,
    sortOrder: book?.sortOrder ?? 0,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "rgba(196,149,106,0.2)" }}>
          <h2 className="text-xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            {book?.id ? "עריכת ספר" : "הוספת ספר חדש"}
          </h2>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>כותרת *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm text-right"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="שם הספר"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>Slug *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)", direction: "ltr" }}
                value={form.slug}
                onChange={e => set("slug", e.target.value)}
                placeholder="book-slug"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>כותרת משנה</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm text-right"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
              value={form.subtitle}
              onChange={e => set("subtitle", e.target.value)}
              placeholder="תיאור קצר"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תיאור</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm text-right"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
              rows={4}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="תיאור מפורט של הספר"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>קטגוריה</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm text-right"
                style={{ borderColor: "rgba(196,149,106,0.3)" }}
                value={form.category}
                onChange={e => set("category", e.target.value)}
              >
                <option value="">-- בחר --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>מספר עמודים</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)" }}
                value={form.pages}
                onChange={e => set("pages", parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>סדר תצוגה</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)" }}
                value={form.sortOrder}
                onChange={e => set("sortOrder", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>קישור PDF</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)", direction: "ltr" }}
                value={form.pdfUrl}
                onChange={e => set("pdfUrl", e.target.value)}
                placeholder="/manus-storage/book.pdf"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תמונת שער</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)", direction: "ltr" }}
                value={form.img}
                onChange={e => set("img", e.target.value)}
                placeholder="/manus-storage/book.jpg"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>צבע</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ borderColor: "rgba(196,149,106,0.3)" }}
                  value={form.color}
                  onChange={e => set("color", e.target.value)}
                />
                <input
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "rgba(196,149,106,0.3)", direction: "ltr" }}
                  value={form.color}
                  onChange={e => set("color", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>אייקון</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm text-center"
                style={{ borderColor: "rgba(196,149,106,0.3)" }}
                value={form.icon}
                onChange={e => set("icon", e.target.value)}
                placeholder="📚"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>סטטוס</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm text-right"
                style={{ borderColor: "rgba(196,149,106,0.3)" }}
                value={form.published}
                onChange={e => set("published", parseInt(e.target.value))}
              >
                <option value={1}>מפורסם</option>
                <option value={0}>מוסתר</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t justify-end" style={{ borderColor: "rgba(196,149,106,0.2)" }}>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border text-sm font-semibold" style={{ borderColor: "rgba(196,149,106,0.3)", color: "var(--brand-mid)" }}>
            ביטול
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ background: "var(--brand-gold)", color: "white" }}
          >
            <Save size={14} />
            שמור
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBooks() {
  const [search, setSearch] = useState("");
  const [editingBook, setEditingBook] = useState<Partial<Book> | null | false>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const utils = trpc.useUtils();

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const { data, isLoading, error: listError } = trpc.adminBooks.list.useQuery({ search: search || undefined });

  const createMutation = trpc.adminBooks.create.useMutation({
    onSuccess: () => { utils.adminBooks.list.invalidate(); setEditingBook(false); showFeedback("success", "ספר נוסף בהצלחה"); },
    onError: (e) => showFeedback("error", "שגיאה: " + e.message),
  });
  const updateMutation = trpc.adminBooks.update.useMutation({
    onSuccess: () => { utils.adminBooks.list.invalidate(); setEditingBook(false); showFeedback("success", "ספר עודכן בהצלחה"); },
    onError: (e) => showFeedback("error", "שגיאה: " + e.message),
  });
  const deleteMutation = trpc.adminBooks.delete.useMutation({
    onSuccess: () => { utils.adminBooks.list.invalidate(); showFeedback("success", "ספר נמחק בהצלחה"); },
    onError: (e) => showFeedback("error", "שגיאה: " + e.message),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleSave = (form: any) => {
    if (!form.title.trim() || !form.slug.trim()) {
      showFeedback("error", "כותרת ו-slug הם שדות חובה");
      return;
    }
    if (editingBook && (editingBook as Book).id) {
      updateMutation.mutate({ id: (editingBook as Book).id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("האם למחוק את הספר?")) deleteMutation.mutate({ id });
  };

  const handleTogglePublish = (id: number, published: number) => {
    updateMutation.mutate({ id, published });
  };

  const books = data?.books || [];
  const total = data?.total || 0;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-lg" style={{ background: feedback.type === "success" ? "#6B7C5C" : "#dc2626", color: "white" }}>
          {feedback.msg}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            ניהול ספרים
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-mid)" }}>
            {total} ספרים במאגר
          </p>
        </div>
        <button
          onClick={() => setEditingBook({})}
          disabled={isMutating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--brand-gold)", color: "white" }}
        >
          <Plus size={16} />
          ספר חדש
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brand-mid)" }} />
        <input
          className="w-full border rounded-xl px-4 py-2.5 pr-10 text-sm text-right"
          style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
          placeholder="חיפוש ספרים..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(196,149,106,0.2)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(196,149,106,0.08)" }}>
              <th className="py-3 px-4 text-right text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>ספר</th>
              <th className="py-3 px-4 text-right text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>קטגוריה</th>
              <th className="py-3 px-4 text-center text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>עמודים</th>
              <th className="py-3 px-4 text-center text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>קבצים</th>
              <th className="py-3 px-4 text-center text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>סטטוס</th>
              <th className="py-3 px-4 text-center text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm" style={{ color: "var(--brand-mid)" }}>טוען...</td></tr>
            ) : books.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm" style={{ color: "var(--brand-mid)" }}>לא נמצאו ספרים</td></tr>
            ) : (
              books.map(book => (
                <BookRow
                  key={book.id}
                  book={book}
                  onEdit={b => setEditingBook(b)}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor modal */}
      {editingBook !== false && (
        <BookEditor
          book={editingBook}
          onSave={handleSave}
          onCancel={() => setEditingBook(false)}
        />
      )}
    </div>
  );
}
