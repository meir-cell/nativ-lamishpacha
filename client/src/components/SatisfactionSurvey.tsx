/**
 * SatisfactionSurvey — shown after a student passes a module exam.
 * Collects 5 star-rating dimensions + optional comment.
 * Submits via trpc.surveyExam.submitSurvey
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getStoredToken } from "./RegistrationGate";

interface Props {
  moduleId: number;
  moduleTitle: string;
  onClose: () => void;
}

const QUESTIONS = [
  { key: "overallRating" as const, label: "דירוג כללי של המודול" },
  { key: "contentRating" as const, label: "איכות התוכן והחומר הלימודי" },
  { key: "uxRating" as const, label: "חווית השימוש במערכת" },
  { key: "relevanceRating" as const, label: "רלוונטיות לחיי היומיום" },
  { key: "recommendRating" as const, label: "האם תמליץ לחבר?" },
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1" dir="ltr">
        <span className="text-xs ml-1" style={{ color: "oklch(0.50 0.01 265)", minWidth: "52px" }}>גרוע ←</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="transition-transform active:scale-90"
            aria-label={`${star} כוכבים`}
          >
            <Star
              size={28}
              className="transition-colors"
              fill={star <= (hovered || value) ? "#F0C040" : "transparent"}
              stroke={star <= (hovered || value) ? "#F0C040" : "#555577"}
              strokeWidth={1.5}
            />
          </button>
        ))}
        <span className="text-xs mr-1" style={{ color: "oklch(0.50 0.01 265)", minWidth: "52px" }}>→ מצוין</span>
      </div>
    </div>
  );
}

export default function SatisfactionSurvey({ moduleId, moduleTitle, onClose }: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.surveyExam.submitSurvey.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const allRated = QUESTIONS.every((q) => (ratings[q.key] ?? 0) > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRated) return;
    const token = getStoredToken();
    if (!token) return;
    submitMutation.mutate({
      token,
      moduleId,
      overallRating: ratings.overallRating,
      contentRating: ratings.contentRating,
      uxRating: ratings.uxRating,
      relevanceRating: ratings.relevanceRating,
      recommendRating: ratings.recommendRating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-lg rounded-2xl overflow-hidden"
          style={{
            background: "oklch(0.13 0.015 265)",
            border: "1px solid oklch(0.22 0.015 265)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          }}
          dir="rtl"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              background: "linear-gradient(135deg, oklch(0.16 0.02 265), oklch(0.12 0.015 265))",
              borderBottom: "1px solid oklch(0.22 0.015 265)",
            }}
          >
            <div>
              <h2 className="font-bold text-lg" style={{ color: "#F0C040" }}>
                סקר שביעות רצון
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.01 265)" }}>
                {moduleTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "oklch(0.55 0.01 265)" }}
              aria-label="סגור"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <CheckCircle2 size={56} className="mx-auto mb-4" style={{ color: "#4ade80" }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: "#F0C040" }}>
                  תודה על המשוב!
                </h3>
                <p className="text-sm mb-6" style={{ color: "oklch(0.65 0.01 265)" }}>
                  הפידבק שלך עוזר לנו לשפר את הקורס עבורך ועבור תלמידים נוספים.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)", color: "#000" }}
                >
                  סגור
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm" style={{ color: "oklch(0.70 0.01 265)" }}>
                  עזור לנו לשפר — דרג כל קטגוריה מ-1 עד 5 כוכבים:
                </p>

                {QUESTIONS.map((q) => (
                  <div key={q.key} className="flex flex-col gap-1.5">
                    <span className="text-sm" style={{ color: "oklch(0.80 0.01 265)" }}>
                      {q.label}
                    </span>
                    <StarRating
                      value={ratings[q.key] ?? 0}
                      onChange={(v) => setRatings((prev) => ({ ...prev, [q.key]: v }))}
                    />
                  </div>
                ))}

                {/* Comment */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "oklch(0.55 0.01 265)" }}>
                    הערות נוספות (אופציונלי)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="מה אהבת? מה ניתן לשפר?"
                    className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
                    style={{
                      background: "oklch(0.10 0.01 265)",
                      border: "1px solid oklch(0.25 0.015 265)",
                      color: "oklch(0.85 0.005 265)",
                      outline: "none",
                    }}
                  />
                </div>

                {submitMutation.isError && (
                  <p className="text-xs text-red-400">שגיאה בשליחה — נסה שוב</p>
                )}

                <button
                  type="submit"
                  disabled={!allRated || submitMutation.isPending}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity"
                  style={{
                    background: allRated
                      ? "linear-gradient(135deg, #C9A84C, #F0C040)"
                      : "oklch(0.25 0.01 265)",
                    color: allRated ? "#000" : "oklch(0.45 0.01 265)",
                    cursor: allRated ? "pointer" : "not-allowed",
                  }}
                >
                  {submitMutation.isPending ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <>
                      <Send size={15} />
                      שלח משוב
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
