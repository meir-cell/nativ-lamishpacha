// Admin panel — review and approve AI-researched lesson updates
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, BookOpen, Zap, Target, ChevronDown, ChevronUp,
  RefreshCw, FlaskConical, ExternalLink, AlertCircle, BarChart3,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { lessons } from "@/lib/courseData";

const PRIMARY = "oklch(0.45 0.18 280)";
const GOLD = "#C9A84C";

type FilterStatus = "all" | "pending" | "approved" | "rejected";
type FilterType = "all" | "section" | "keyPoint" | "exercise";

const TYPE_LABELS: Record<string, string> = {
  section: "סקציה חדשה",
  keyPoint: "נקודת מפתח",
  exercise: "תרגיל",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  section: <BookOpen size={14} />,
  keyPoint: <Zap size={14} />,
  exercise: <Target size={14} />,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
};

export default function AdminUpdates() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState<Record<number, string>>({});

  const { data: updates, refetch, isLoading, error } = trpc.lessonUpdates.getAll.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: runs } = trpc.lessonUpdates.getResearchRuns.useQuery();

  const approveMutation = trpc.lessonUpdates.approve.useMutation({
    onSuccess: () => refetch(),
  });
  const rejectMutation = trpc.lessonUpdates.reject.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9fb" }}>
      <RefreshCw size={24} className="animate-spin" style={{ color: PRIMARY }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9fb" }}>
      <div className="text-center">
        <AlertCircle size={40} className="mx-auto mb-3" style={{ color: "#ef4444" }} />
        <p className="text-lg font-bold" style={{ color: "oklch(0.20 0.01 250)" }}>גישה מוגבלת</p>
        <p className="text-sm mt-1" style={{ color: "oklch(0.50 0.01 250)" }}>יש להיכנס עם חשבון הבעלים</p>
      </div>
    </div>
  );

  const filtered = (updates ?? []).filter(u => {
    if (filterStatus !== "all" && u.status !== filterStatus) return false;
    if (filterType !== "all" && u.updateType !== filterType) return false;
    return true;
  });

  const pendingCount = (updates ?? []).filter(u => u.status === "pending").length;
  const approvedCount = (updates ?? []).filter(u => u.status === "approved").length;
  const rejectedCount = (updates ?? []).filter(u => u.status === "rejected").length;

  const getLessonTitle = (id: number) => lessons.find(l => l.id === id)?.title ?? `שיעור ${id}`;

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "#f8f9fb", fontFamily: "'Heebo', sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "white", borderBottom: "1px solid oklch(0.90 0.005 250)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${PRIMARY}18` }}>
            <FlaskConical size={18} style={{ color: PRIMARY }} />
          </div>
          <div>
            <h1 className="text-base font-black" style={{ color: "oklch(0.15 0.01 250)" }}>מרכז עדכוני תוכן AI</h1>
            <p className="text-xs" style={{ color: "oklch(0.55 0.01 250)" }}>עדכונים שנחקרו אקדמית ממתינים לאישורך</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-gray-100"
            style={{ color: "oklch(0.45 0.01 250)" }}>
            ← חזרה לקורס
          </a>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: `${PRIMARY}12`, color: PRIMARY }}>
            <RefreshCw size={12} />
            רענן
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "ממתינים לאישור", count: pendingCount, color: "#f59e0b", bg: "#fef3c7" },
            { label: "אושרו", count: approvedCount, color: "#22c55e", bg: "#dcfce7" },
            { label: "נדחו", count: rejectedCount, color: "#ef4444", bg: "#fee2e2" },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4 text-center" style={{ background: stat.bg }}>
              <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.count}</p>
              <p className="text-xs font-medium mt-1" style={{ color: "oklch(0.35 0.01 250)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Last research runs */}
        {runs && runs.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid oklch(0.90 0.005 250)" }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={15} style={{ color: PRIMARY }} />
              <p className="text-sm font-bold" style={{ color: "oklch(0.20 0.01 250)" }}>היסטוריית ריצות חקר</p>
            </div>
            <div className="space-y-2">
              {runs.slice(0, 5).map(run => (
                <div key={run.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg"
                  style={{ background: "oklch(0.97 0.002 250)" }}>
                  <span style={{ color: "oklch(0.45 0.01 250)" }}>
                    {new Date(run.ranAt).toLocaleString("he-IL")}
                  </span>
                  <span className="font-semibold" style={{ color: run.status === "success" ? "#22c55e" : run.status === "failed" ? "#ef4444" : "#f59e0b" }}>
                    {run.status === "success" ? "✓" : run.status === "failed" ? "✗" : "~"} {run.updatesSubmitted} עדכונים
                  </span>
                  {run.summary && <span className="max-w-xs truncate" style={{ color: "oklch(0.50 0.01 250)" }}>{run.summary}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.88 0.005 250)" }}>
            {(["all", "pending", "approved", "rejected"] as FilterStatus[]).map(s => (
              <button key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background: filterStatus === s ? PRIMARY : "white",
                  color: filterStatus === s ? "white" : "oklch(0.45 0.01 250)",
                }}>
                {s === "all" ? "הכל" : s === "pending" ? "ממתינים" : s === "approved" ? "אושרו" : "נדחו"}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.88 0.005 250)" }}>
            {(["all", "section", "keyPoint", "exercise"] as FilterType[]).map(t => (
              <button key={t}
                onClick={() => setFilterType(t)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background: filterType === t ? GOLD : "white",
                  color: filterType === t ? "white" : "oklch(0.45 0.01 250)",
                }}>
                {t === "all" ? "כל הסוגים" : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Updates list */}
        {isLoading ? (
          <div className="text-center py-16">
            <RefreshCw size={28} className="animate-spin mx-auto mb-3" style={{ color: PRIMARY }} />
            <p style={{ color: "oklch(0.55 0.01 250)" }}>טוען עדכונים...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "white", border: "1px solid oklch(0.90 0.005 250)" }}>
            <FlaskConical size={40} className="mx-auto mb-3" style={{ color: "oklch(0.75 0.01 250)" }} />
            <p className="font-bold" style={{ color: "oklch(0.35 0.01 250)" }}>
              {filterStatus === "pending" ? "אין עדכונים ממתינים כרגע" : "לא נמצאו עדכונים"}
            </p>
            <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.01 250)" }}>
              הסוכן יחקור ויגיש עדכונים חדשים בכל שבוע
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map(update => {
                const isExpanded = expandedId === update.id;
                const isPending = update.status === "pending";
                return (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: "white", border: `1px solid oklch(0.90 0.005 250)`, boxShadow: isPending ? "0 2px 12px rgba(0,0,0,0.06)" : "none" }}
                  >
                    {/* Card header */}
                    <div className="flex items-start gap-3 p-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : update.id)}>
                      {/* Type badge */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold shrink-0"
                        style={{ background: `${GOLD}18`, color: GOLD }}>
                        {TYPE_ICONS[update.updateType]}
                        {TYPE_LABELS[update.updateType]}
                      </div>

                      {/* Content preview */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-snug" style={{ color: "oklch(0.15 0.01 250)" }}>
                          {update.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.01 250)" }}>
                          {getLessonTitle(update.lessonId)} · {new Date(update.researchedAt).toLocaleDateString("he-IL")}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${STATUS_COLORS[update.status]}20`, color: STATUS_COLORS[update.status] }}>
                          {update.status === "pending" ? "ממתין" : update.status === "approved" ? "אושר" : "נדחה"}
                        </span>
                        {isExpanded ? <ChevronUp size={14} style={{ color: "oklch(0.55 0.01 250)" }} /> : <ChevronDown size={14} style={{ color: "oklch(0.55 0.01 250)" }} />}
                      </div>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "oklch(0.93 0.005 250)" }}>
                            {/* Body text */}
                            {update.body && (
                              <div className="mt-3 p-3 rounded-xl text-sm leading-relaxed"
                                style={{ background: "oklch(0.97 0.002 250)", color: "oklch(0.25 0.01 250)" }}>
                                {update.body}
                              </div>
                            )}

                            {/* Highlight */}
                            {update.highlight && (
                              <div className="p-3 rounded-xl text-sm font-medium border-r-4"
                                style={{ background: `${GOLD}10`, color: "oklch(0.35 0.01 250)", borderColor: GOLD }}>
                                "{update.highlight}"
                              </div>
                            )}

                            {/* Source */}
                            {update.source && (
                              <div className="flex items-start gap-2 text-xs" style={{ color: "oklch(0.50 0.01 250)" }}>
                                <span className="font-semibold shrink-0">מקור:</span>
                                <span>{update.source}</span>
                                {update.sourceUrl && (
                                  <a href={update.sourceUrl} target="_blank" rel="noopener noreferrer"
                                    className="shrink-0 hover:opacity-70 transition-opacity" style={{ color: PRIMARY }}>
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Review note (if already reviewed) */}
                            {update.reviewNote && (
                              <div className="text-xs p-2 rounded-lg" style={{ background: "oklch(0.95 0.005 250)", color: "oklch(0.45 0.01 250)" }}>
                                הערת סקירה: {update.reviewNote}
                              </div>
                            )}

                            {/* Action buttons (only for pending) */}
                            {isPending && (
                              <div className="space-y-2 pt-1">
                                <textarea
                                  placeholder="הערה אופציונלית (תוצג בלוג)..."
                                  value={reviewNote[update.id] ?? ""}
                                  onChange={e => setReviewNote(prev => ({ ...prev, [update.id]: e.target.value }))}
                                  rows={2}
                                  className="w-full text-xs p-2 rounded-lg resize-none"
                                  style={{ border: "1px solid oklch(0.88 0.005 250)", color: "oklch(0.25 0.01 250)", background: "oklch(0.98 0.002 250)" }}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => approveMutation.mutate({ id: update.id, reviewNote: reviewNote[update.id] })}
                                    disabled={approveMutation.isPending}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all"
                                    style={{ background: "#22c55e", color: "white" }}
                                  >
                                    <CheckCircle size={15} />
                                    אשר ופרסם לתלמידים
                                  </button>
                                  <button
                                    onClick={() => rejectMutation.mutate({ id: update.id, reviewNote: reviewNote[update.id] })}
                                    disabled={rejectMutation.isPending}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                    style={{ background: "#fee2e2", color: "#ef4444" }}
                                  >
                                    <XCircle size={15} />
                                    דחה
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
