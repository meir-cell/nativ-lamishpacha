/**
 * AdminSurveys — view satisfaction survey results and module exam results.
 * Accessible at /admin/surveys (admin only).
 */
import { trpc } from "@/lib/trpc";
import { Star, BarChart2, BookCheck, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "wouter";

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          fill={s <= value ? "#F0C040" : "transparent"}
          stroke={s <= value ? "#F0C040" : "#555577"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function avg(arr: number[]): string {
  if (!arr.length) return "—";
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}

export default function AdminSurveys() {
  const surveysQuery = trpc.surveyExam.adminSurveys.useQuery();
  const examsQuery = trpc.surveyExam.adminExamResults.useQuery();

  if (surveysQuery.isLoading || examsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.98 0.002 250)" }}>
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  if (surveysQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.98 0.002 250)" }}>
        <p className="text-red-500 font-bold">גישה נדחתה — יש להיכנס עם חשבון הבעלים</p>
      </div>
    );
  }

  const surveys = surveysQuery.data ?? [];
  const exams = examsQuery.data ?? [];

  // Compute averages per module
  const moduleIds = Array.from(new Set(surveys.map((s) => s.moduleId))).sort((a, b) => a - b);

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "oklch(0.98 0.002 250)", direction: "rtl" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/nlp/admin/registrations">
            <button className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700">
              <ArrowRight size={16} />
              חזרה לרשימת תלמידים
            </button>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.20 0.02 265)" }}>
          📊 תוצאות סקרים ומבחנים
        </h1>
        <p className="text-sm mb-8" style={{ color: "oklch(0.50 0.01 265)" }}>
          {surveys.length} סקרים · {exams.length} מבחנים
        </p>

        {/* Survey averages by module */}
        {moduleIds.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "oklch(0.25 0.02 265)" }}>
              <BarChart2 size={20} className="text-amber-500" />
              ממוצעי שביעות רצון לפי מודול
            </h2>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "oklch(0.88 0.005 250)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "oklch(0.94 0.005 250)", color: "oklch(0.40 0.01 265)" }}>
                    <th className="px-4 py-3 text-right font-semibold">מודול</th>
                    <th className="px-4 py-3 text-center font-semibold">כללי</th>
                    <th className="px-4 py-3 text-center font-semibold">תוכן</th>
                    <th className="px-4 py-3 text-center font-semibold">UX</th>
                    <th className="px-4 py-3 text-center font-semibold">רלוונטיות</th>
                    <th className="px-4 py-3 text-center font-semibold">המלצה</th>
                    <th className="px-4 py-3 text-center font-semibold">מספר</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleIds.map((modId, i) => {
                    const modSurveys = surveys.filter((s) => s.moduleId === modId);
                    return (
                      <tr
                        key={modId}
                        style={{
                          background: i % 2 === 0 ? "white" : "oklch(0.97 0.002 250)",
                          borderTop: "1px solid oklch(0.92 0.003 250)",
                        }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "oklch(0.25 0.02 265)" }}>
                          מודול {modId}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <StarDisplay value={Math.round(parseFloat(avg(modSurveys.map(s => s.overallRating))))} />
                            <span className="text-xs text-gray-400">{avg(modSurveys.map(s => s.overallRating))}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <StarDisplay value={Math.round(parseFloat(avg(modSurveys.map(s => s.contentRating))))} />
                            <span className="text-xs text-gray-400">{avg(modSurveys.map(s => s.contentRating))}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <StarDisplay value={Math.round(parseFloat(avg(modSurveys.map(s => s.uxRating))))} />
                            <span className="text-xs text-gray-400">{avg(modSurveys.map(s => s.uxRating))}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <StarDisplay value={Math.round(parseFloat(avg(modSurveys.map(s => s.relevanceRating))))} />
                            <span className="text-xs text-gray-400">{avg(modSurveys.map(s => s.relevanceRating))}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <StarDisplay value={Math.round(parseFloat(avg(modSurveys.map(s => s.recommendRating))))} />
                            <span className="text-xs text-gray-400">{avg(modSurveys.map(s => s.recommendRating))}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 font-medium">
                          {modSurveys.length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Individual survey comments */}
        {surveys.filter((s) => s.comment).length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "oklch(0.25 0.02 265)" }}>
              <MessageSquare size={20} className="text-amber-500" />
              הערות תלמידים
            </h2>
            <div className="space-y-3">
              {surveys
                .filter((s) => s.comment)
                .map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "white",
                      border: "1px solid oklch(0.88 0.005 250)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-amber-600">מודול {s.moduleId}</span>
                      <div className="flex items-center gap-1">
                        <StarDisplay value={s.overallRating} />
                        <span className="text-xs text-gray-400 mr-1">
                          {new Date(s.submittedAt).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: "oklch(0.35 0.01 265)" }}>
                      {s.comment}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Exam results */}
        {exams.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "oklch(0.25 0.02 265)" }}>
              <BookCheck size={20} className="text-amber-500" />
              תוצאות מבחנים
            </h2>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "oklch(0.88 0.005 250)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "oklch(0.94 0.005 250)", color: "oklch(0.40 0.01 265)" }}>
                    <th className="px-4 py-3 text-right font-semibold">מודול</th>
                    <th className="px-4 py-3 text-center font-semibold">ציון</th>
                    <th className="px-4 py-3 text-center font-semibold">עבר/נכשל</th>
                    <th className="px-4 py-3 text-center font-semibold">ניסיון</th>
                    <th className="px-4 py-3 text-center font-semibold">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((e, i) => (
                    <tr
                      key={e.id}
                      style={{
                        background: i % 2 === 0 ? "white" : "oklch(0.97 0.002 250)",
                        borderTop: "1px solid oklch(0.92 0.003 250)",
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "oklch(0.25 0.02 265)" }}>
                        מודול {e.moduleId}
                      </td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: e.score >= 70 ? "#16a34a" : "#dc2626" }}>
                        {e.score}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: e.passed ? "oklch(0.92 0.08 145)" : "oklch(0.95 0.06 25)",
                            color: e.passed ? "oklch(0.30 0.12 145)" : "oklch(0.35 0.12 25)",
                          }}
                        >
                          {e.passed ? "עבר ✓" : "נכשל ✗"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{e.attempt}</td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">
                        {new Date(e.completedAt).toLocaleDateString("he-IL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {surveys.length === 0 && exams.length === 0 && (
          <div className="text-center py-20" style={{ color: "oklch(0.55 0.01 265)" }}>
            <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">אין נתונים עדיין</p>
            <p className="text-sm mt-1">הנתונים יופיעו כאשר תלמידים יסיימו מודולים וימלאו סקרים</p>
          </div>
        )}
      </div>
    </div>
  );
}
