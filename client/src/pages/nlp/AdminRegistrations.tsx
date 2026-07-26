// AdminRegistrations.tsx — Full subscriber report with search, sort, stats, CSV export
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Users, Mail, Phone, Calendar, Search, Download, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp } from "lucide-react";

type SortField = "fullName" | "email" | "createdAt";
type SortDir = "asc" | "desc";

export default function AdminRegistrations() {
  const { data: registrations, isLoading } = trpc.registration.list.useQuery();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Stats
  const stats = useMemo(() => {
    if (!registrations) return { total: 0, thisWeek: 0, today: 0 };
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;
    return {
      total: registrations.length,
      thisWeek: registrations.filter(r => new Date(r.createdAt).getTime() > weekAgo).length,
      today: registrations.filter(r => new Date(r.createdAt).getTime() > dayAgo).length,
    };
  }, [registrations]);

  // Filter + sort
  const filtered = useMemo(() => {
    if (!registrations) return [];
    const q = search.trim().toLowerCase();
    let list = q
      ? registrations.filter(r =>
          r.fullName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q)
        )
      : [...registrations];

    list.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortField === "createdAt") {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      } else {
        av = (a[sortField] ?? "").toLowerCase();
        bv = (b[sortField] ?? "").toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [registrations, search, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={13} className="opacity-30" />;
    return sortDir === "asc"
      ? <ArrowUp size={13} style={{ color: "oklch(0.45 0.18 280)" }} />
      : <ArrowDown size={13} style={{ color: "oklch(0.45 0.18 280)" }} />;
  }

  // CSV export
  function exportCSV() {
    if (!filtered.length) return;
    const headers = ["#", "שם מלא", "מייל", "טלפון", "תאריך הרשמה"];
    const rows = filtered.map((r, i) => [
      i + 1,
      `"${r.fullName}"`,
      r.email,
      r.phone,
      new Date(r.createdAt).toLocaleString("he-IL"),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `נרשמים-קורס-NLP-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const purple = "oklch(0.45 0.18 280)";
  const bg = "oklch(0.98 0.002 250)";
  const border = "oklch(0.90 0.005 250)";
  const textDark = "oklch(0.15 0.01 250)";
  const textMid = "oklch(0.40 0.01 250)";
  const textLight = "oklch(0.55 0.01 250)";

  return (
    <div className="min-h-screen p-6" style={{ background: bg, direction: "rtl" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: purple }}>
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: textDark }}>דוח מנויים</h1>
              <p className="text-sm" style={{ color: textLight }}>קורס NLP Practitioner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/nlp/admin/surveys"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "oklch(0.94 0.005 250)", color: textMid, border: `1px solid ${border}` }}
            >
              📊 סקרים
            </a>
            <button
              onClick={exportCSV}
              disabled={!filtered.length}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filtered.length ? purple : "oklch(0.88 0.005 250)",
                color: filtered.length ? "white" : textLight,
                cursor: filtered.length ? "pointer" : "not-allowed",
              }}>
              <Download size={15} />
              ייצוא CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "סה\"כ נרשמים", value: stats.total, icon: Users, color: purple },
            { label: "השבוע", value: stats.thisWeek, icon: TrendingUp, color: "oklch(0.50 0.18 160)" },
            { label: "היום", value: stats.today, icon: Calendar, color: "oklch(0.55 0.18 30)" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "white", border: `1px solid ${border}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: color + "22" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: textDark }}>{value}</div>
                <div className="text-xs" style={{ color: textLight }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, מייל או טלפון..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-4 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: "white",
              border: `1px solid ${border}`,
              color: textDark,
              direction: "rtl",
            }}
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: purple, borderTopColor: "transparent" }} />
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-16 rounded-xl"
            style={{ background: "white", border: `1px solid ${border}`, color: textLight }}>
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p>{search ? "לא נמצאו תוצאות לחיפוש" : "אין נרשמים עדיין"}</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${border}` }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "oklch(0.94 0.005 250)" }}>
                  <th className="text-right px-4 py-3 text-xs font-semibold"
                    style={{ color: "oklch(0.35 0.01 250)" }}>#</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold cursor-pointer select-none"
                    style={{ color: "oklch(0.35 0.01 250)" }}
                    onClick={() => toggleSort("fullName")}>
                    <span className="flex items-center gap-1">שם מלא <SortIcon field="fullName" /></span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold cursor-pointer select-none"
                    style={{ color: "oklch(0.35 0.01 250)" }}
                    onClick={() => toggleSort("email")}>
                    <span className="flex items-center gap-1">מייל <SortIcon field="email" /></span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold"
                    style={{ color: "oklch(0.35 0.01 250)" }}>טלפון</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold cursor-pointer select-none"
                    style={{ color: "oklch(0.35 0.01 250)" }}
                    onClick={() => toggleSort("createdAt")}>
                    <span className="flex items-center gap-1">תאריך הרשמה <SortIcon field="createdAt" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg, idx) => (
                  <tr key={reg.id}
                    style={{
                      background: idx % 2 === 0 ? "white" : "oklch(0.97 0.002 250)",
                      borderTop: `1px solid ${border}`,
                    }}>
                    <td className="px-4 py-3 text-sm" style={{ color: textLight }}>{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: textDark }}>
                      {reg.fullName}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: textMid }}>
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} className="opacity-40 shrink-0" />
                        <a href={`mailto:${reg.email}`}
                          style={{ color: purple }}
                          className="hover:underline">{reg.email}</a>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: textMid }}>
                      <span className="flex items-center gap-1.5">
                        <Phone size={12} className="opacity-40 shrink-0" />
                        <a href={`tel:${reg.phone}`}
                          style={{ color: textMid }}
                          className="hover:underline">{reg.phone}</a>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: textLight }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="opacity-40 shrink-0" />
                        {new Date(reg.createdAt).toLocaleDateString("he-IL", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 text-xs" style={{ background: "oklch(0.96 0.003 250)", color: textLight, borderTop: `1px solid ${border}` }}>
              מציג {filtered.length} מתוך {stats.total} נרשמים
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
