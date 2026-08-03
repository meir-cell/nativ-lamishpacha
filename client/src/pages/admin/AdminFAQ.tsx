import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAdminToast, AdminToastContainer } from "@/components/admin/AdminToast";

const CATEGORIES = ["כללי", "טיפול זוגי", "גישור", "ייעוץ משפטי"];

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  published: number;
  createdAt: Date;
  updatedAt: Date;
};

function FaqRow({ item, onEdit, onDelete, onTogglePublish }: {
  item: FaqItem;
  onEdit: (i: FaqItem) => void;
  onDelete: (id: number) => void;
  onTogglePublish: (id: number, published: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className="border-b hover:bg-amber-50/30 transition-colors" style={{ borderColor: "rgba(196,149,106,0.1)" }}>
        {/* פעולות — ראשון (ימין ב-RTL) */}
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-start gap-2">
            <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors" title="עריכה">
              <Edit2 size={14} style={{ color: "var(--brand-gold)" }} />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="מחיקה">
              <Trash2 size={14} style={{ color: "#dc2626" }} />
            </button>
          </div>
        </td>
        {/* סטטוס */}
        <td className="py-3 px-4 text-center">
          <button
            onClick={() => onTogglePublish(item.id, item.published ? 0 : 1)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: item.published ? "rgba(107,124,92,0.15)" : "rgba(220,38,38,0.1)",
              color: item.published ? "#6B7C5C" : "#dc2626"
            }}
          >
            {item.published ? <Eye size={10} /> : <EyeOff size={10} />}
            {item.published ? "מפורסם" : "מוסתר"}
          </button>
        </td>
        {/* קטגוריה */}
        <td className="py-3 px-4 text-right">
          <span className="inline-block px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-mid)" }}>
            {item.category}
          </span>
        </td>
        {/* שאלה — אחרון (שמאל ב-RTL) */}
        <td className="py-3 px-4 text-right">
          <button
            className="flex items-center gap-2 text-right w-full"
            onClick={() => setExpanded(e => !e)}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
              {item.question}
            </span>
            <span className="mr-auto flex-shrink-0">
              {expanded ? <ChevronUp size={14} style={{ color: "var(--brand-mid)" }} /> : <ChevronDown size={14} style={{ color: "var(--brand-mid)" }} />}
            </span>
          </button>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderColor: "rgba(196,149,106,0.1)" }}>
          <td colSpan={4} className="pb-3 px-4">
            <div className="text-sm leading-relaxed p-3 rounded-lg text-right" style={{ background: "rgba(196,149,106,0.06)", color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>
              {item.answer}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function FaqEditor({ item, onSave, onCancel }: {
  item: Partial<FaqItem> | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    question: item?.question || "",
    answer: item?.answer || "",
    category: item?.category || "כללי",
    sortOrder: item?.sortOrder ?? 0,
    published: item?.published ?? 1,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "rgba(196,149,106,0.2)" }}>
          <h2 className="text-xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            {item?.id ? "עריכת שאלה" : "הוספת שאלה חדשה"}
          </h2>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>שאלה *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm text-right"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
              value={form.question}
              onChange={e => set("question", e.target.value)}
              placeholder="מה השאלה?"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--brand-dark)" }}>תשובה *</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm text-right"
              style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
              rows={5}
              value={form.answer}
              onChange={e => set("answer", e.target.value)}
              placeholder="מה התשובה?"
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
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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

export default function AdminFAQ() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingItem, setEditingItem] = useState<Partial<FaqItem> | null | false>(false);
  const { toasts, showToast, dismiss } = useAdminToast();
  const utils = trpc.useUtils();

  const { data, isLoading, error: listError } = trpc.adminFaq.list.useQuery({
    search: search || undefined,
    category: categoryFilter || undefined,
  });

  const createMutation = trpc.adminFaq.create.useMutation({
    onSuccess: () => { utils.adminFaq.list.invalidate(); setEditingItem(false); showToast("success", "שאלה נוספה בהצלחה ✓"); },
    onError: (e) => showToast("error", "שגיאה: " + e.message),
  });
  const updateMutation = trpc.adminFaq.update.useMutation({
    onSuccess: () => { utils.adminFaq.list.invalidate(); setEditingItem(false); showToast("success", "שאלה עודכנה בהצלחה ✓"); },
    onError: (e) => showToast("error", "שגיאה: " + e.message),
  });
  const deleteMutation = trpc.adminFaq.delete.useMutation({
    onSuccess: () => { utils.adminFaq.list.invalidate(); showToast("success", "שאלה נמחקה בהצלחה ✓"); },
    onError: (e) => showToast("error", "שגיאה: " + e.message),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleSave = (form: any) => {
    if (!form.question.trim() || !form.answer.trim()) {
      showToast("error", "שאלה ותשובה הם שדות חובה");
      return;
    }
    if (editingItem && (editingItem as FaqItem).id) {
      updateMutation.mutate({ id: (editingItem as FaqItem).id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("האם למחוק את השאלה?")) deleteMutation.mutate({ id });
  };

  const handleTogglePublish = (id: number, published: number) => {
    updateMutation.mutate({ id, published });
  };

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Toast notifications */}
      <AdminToastContainer toasts={toasts} dismiss={dismiss} />
      {/* Error state */}
      {listError && (
        <div className="rounded-xl p-4 text-sm text-right" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
          שגיאה בטעינת השאלות: {listError.message}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            שאלות נפוצות
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-mid)" }}>
            {total} שאלות במאגר
          </p>
        </div>
        <button
          onClick={() => setEditingItem({})}
          disabled={isMutating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--brand-gold)", color: "white" }}
        >
          <Plus size={16} />
          שאלה חדשה
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brand-mid)" }} />
          <input
            className="w-full border rounded-xl px-4 py-2.5 pr-10 text-sm text-right"
            style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
            placeholder="חיפוש שאלות..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-xl px-4 py-2.5 text-sm text-right"
          style={{ borderColor: "rgba(196,149,106,0.3)" }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">כל הקטגוריות</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(196,149,106,0.2)" }}>
        <table className="w-full" dir="rtl">
          <thead>
            <tr style={{ background: "rgba(196,149,106,0.08)" }}>
              <th className="py-3 px-4 text-right text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>פעולות</th>
              <th className="py-3 px-4 text-center text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>סטטוס</th>
              <th className="py-3 px-4 text-right text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>קטגוריה</th>
              <th className="py-3 px-4 text-right text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>שאלה</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="py-12 text-center text-sm" style={{ color: "var(--brand-mid)" }}>טוען...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-sm" style={{ color: "var(--brand-mid)" }}>לא נמצאו שאלות</td></tr>
            ) : (
              items.map(item => (
                <FaqRow
                  key={item.id}
                  item={item}
                  onEdit={i => setEditingItem(i)}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor modal */}
      {editingItem !== false && (
        <FaqEditor
          item={editingItem}
          onSave={handleSave}
          onCancel={() => setEditingItem(false)}
        />
      )}
    </div>
  );
}
