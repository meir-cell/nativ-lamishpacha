import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Trophy, RefreshCw, BookOpen, Clock, Timer } from "lucide-react";
import type { ModuleExam as ModuleExamType, ModuleExamQuestion } from "@/lib/courseData";
import { trpc } from "@/lib/trpc";
import { getStoredToken } from "@/components/RegistrationGate";
import { useConfetti } from "@/hooks/useConfetti";

interface ModuleExamProps {
  exam: ModuleExamType;
  onPassed: () => void;
  onReturnToModule: () => void;
}

type ExamPhase = "loading" | "intro" | "cooldown" | "taking" | "results" | "locked" | "feedback";

export function ModuleExam({ exam, onPassed, onReturnToModule }: ModuleExamProps) {
  const token = getStoredToken() ?? "";
  const [phase, setPhase] = useState<ExamPhase>("loading");
  const [currentAttempt, setCurrentAttempt] = useState<1 | 2 | 3>(1);
  const [currentVersion, setCurrentVersion] = useState<"A" | "B" | "C">("A");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);
  const { fire: fireConfetti } = useConfetti();

  // Query eligibility from server
  const eligibilityQuery = trpc.examVersions.getExamEligibility.useQuery(
    { token, moduleId: exam.moduleId },
    { enabled: !!token, staleTime: 10_000, retry: false }
  );

  const submitMutation = trpc.examVersions.submitExamResult.useMutation({
    onSuccess: () => {
      eligibilityQuery.refetch();
    },
  });

  const resetMutation = trpc.examVersions.resetModuleExam.useMutation({
    onSuccess: () => {
      eligibilityQuery.refetch();
    },
  });

  // Handle query error
  useEffect(() => {
    if (eligibilityQuery.isError && !eligibilityQuery.data) {
      // If token is missing or query fails, show intro as fallback (attempt 1)
      setPhase("intro");
      setCurrentAttempt(1);
      setCurrentVersion("A");
    }
  }, [eligibilityQuery.isError]);

  // Determine phase based on eligibility data
  useEffect(() => {
    if (!eligibilityQuery.data) return;
    const data = eligibilityQuery.data;

    if (data.status === "passed") {
      // Already passed — auto-advance
      onPassed();
      return;
    }

    if (data.status === "eligible") {
      setCurrentAttempt(data.nextAttempt as 1 | 2 | 3);
      setCurrentVersion(data.nextVersion as "A" | "B" | "C");
      setPhase("intro");
      return;
    }

    if (data.status === "cooldown") {
      setCurrentAttempt(data.nextAttempt as 1 | 2 | 3);
      setCurrentVersion(data.nextVersion as "A" | "B" | "C");
      setCooldownMs(data.cooldownMs);
      setPhase("cooldown");
      return;
    }

    if (data.status === "locked") {
      setPhase("locked");
      return;
    }
  }, [eligibilityQuery.data]);

  // Cooldown timer
  useEffect(() => {
    if (phase !== "cooldown" || cooldownMs <= 0) return;
    const interval = setInterval(() => {
      setCooldownMs(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          eligibilityQuery.refetch();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, cooldownMs]);

  // Get questions for current version
  const questions: ModuleExamQuestion[] = useMemo(() => {
    if (currentVersion === "A") return exam.versionA;
    if (currentVersion === "B") return exam.versionB;
    return exam.versionC ?? exam.versionA; // fallback to A if C not available
  }, [currentVersion, exam]);

  const PASS_SCORE = 60;

  const startExam = useCallback(() => {
    setPhase("taking");
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowExplanation(false);
  }, []);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selected];
    if (currentQ + 1 < questions.length) {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      // Last question — compute final score and save to DB
      const finalScore = Math.round(
        (newAnswers.filter((a, i) => a === questions[i].correct).length / questions.length) * 100
      );
      const finalPassed = finalScore >= PASS_SCORE;

      if (token) {
        submitMutation.mutate({
          token,
          moduleId: exam.moduleId,
          score: finalScore,
          passed: finalPassed,
          attempt: currentAttempt,
          examVersion: currentVersion,
        });
      }
      setAnswers(newAnswers);
      setPhase("results");

      // Fire confetti if passed!
      if (finalPassed) {
        setTimeout(() => fireConfetti(), 300);
      }
    }
  };

  const calcScore = (ans: (number | null)[]) => {
    const correct = ans.filter((a, i) => a === questions[i].correct).length;
    return Math.round((correct / questions.length) * 100);
  };

  const score = phase === "results" || phase === "feedback" ? calcScore(answers) : 0;
  const passed = score >= PASS_SCORE;

  // Get wrong answers for feedback
  const wrongAnswers = useMemo(() => {
    if (phase !== "results" && phase !== "feedback") return [];
    return answers
      .map((a, i) => ({ index: i, selected: a, correct: questions[i].correct, question: questions[i] }))
      .filter(item => item.selected !== item.correct);
  }, [phase, answers, questions]);

  const handleShowFeedback = () => {
    setPhase("feedback");
  };

  const handleAfterResults = () => {
    if (passed) {
      onPassed();
    } else {
      // Refetch eligibility to show cooldown or locked state
      eligibilityQuery.refetch();
    }
  };

  const handleResetAndStudy = () => {
    resetMutation.mutate({ token, moduleId: exam.moduleId });
    onReturnToModule();
  };

  // Format cooldown time
  const formatCooldown = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const q = phase === "taking" ? questions[currentQ] : null;
  const progress = phase === "taking" ? ((currentQ + (selected !== null ? 1 : 0)) / questions.length) * 100 : 0;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">טוען מצב מבחן...</p>
      </div>
    );
  }

  // ─── Cooldown ─────────────────────────────────────────────────────────────
  if (phase === "cooldown") {
    const isShort = currentAttempt === 2; // 1-hour cooldown
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            ממתין לניסיון {currentAttempt}
          </h2>
          <p className="text-slate-400 mb-4">
            {isShort
              ? "ניתן לנסות שוב אחרי שעה מהניסיון הקודם. השתמש בזמן הזה לחזרה על החומר."
              : "ניתן לנסות שוב אחרי 24 שעות. מומלץ לחזור על שיעורי המודול."}
          </p>

          {/* Countdown */}
          <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700 mb-6">
            <p className="text-xs text-slate-500 mb-2">זמן נותר עד הניסיון הבא</p>
            <p className="text-4xl font-mono font-bold text-amber-400">
              {formatCooldown(cooldownMs)}
            </p>
          </div>

          <div className="flex gap-3 justify-center text-sm text-slate-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-400" />
              ניסיון {currentAttempt} — גרסה {currentVersion}
            </span>
          </div>

          <Button
            onClick={onReturnToModule}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <BookOpen className="w-4 h-4 ml-2" />
            חזרה לשיעורי המודול
          </Button>
        </div>
      </div>
    );
  }

  // ─── Locked (3 failures) ──────────────────────────────────────────────────
  if (phase === "locked") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">
            3 ניסיונות נכשלו
          </h2>
          <p className="text-slate-400 mb-6">
            לא עברת את המבחן ב-3 ניסיונות. מומלץ לחזור על שיעורי המודול ולנסות שוב מההתחלה.
          </p>
          <Button
            onClick={handleResetAndStudy}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 text-lg gap-2"
            disabled={resetMutation.isPending}
          >
            <BookOpen className="w-5 h-5" />
            {resetMutation.isPending ? "מאפס..." : "חזרה ללמוד + איפוס מבחן"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Intro ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            מבחן מסכם — {exam.moduleTitle}
          </h2>
          <p className="text-slate-400 mb-4">
            {currentAttempt === 1 && "10 שאלות רב-ברירתיות. ציון עובר: 60%. בהצלחה!"}
            {currentAttempt === 2 && "ניסיון שני — 10 שאלות חדשות (גרסה B). ציון עובר: 60%. אתה יכול!"}
            {currentAttempt === 3 && "ניסיון אחרון — 10 שאלות חדשות (גרסה C). ציון עובר: 60%. תן הכל!"}
          </p>
          <div className="flex gap-3 justify-center text-sm text-slate-500 mb-6 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" /> ניסיון {currentAttempt} מתוך 3
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" /> ציון עובר: 60%
            </span>
            <span className="flex items-center gap-1">
              <RefreshCw className="w-4 h-4 text-blue-400" /> גרסה {currentVersion}
            </span>
          </div>
          <Button
            onClick={startExam}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 text-lg"
          >
            התחל מבחן
          </Button>
        </div>
      </div>
    );
  }

  // ─── Taking ───────────────────────────────────────────────────────────────
  if (phase === "taking" && q) {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-amber-400 border-amber-400/40">
            שאלה {currentQ + 1} / {questions.length}
          </Badge>
          <Badge variant="outline" className="text-slate-400">
            ניסיון {currentAttempt} • גרסה {currentVersion}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mb-2" />

        {/* Question */}
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg leading-relaxed text-right">
              {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {q.options.map((opt, idx) => {
              let cls =
                "w-full text-right px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer text-sm ";
              if (selected === null) {
                cls += "border-slate-600 bg-slate-700/50 hover:border-amber-400/60 hover:bg-amber-400/10 text-slate-200";
              } else if (idx === q.correct) {
                cls += "border-green-500 bg-green-500/20 text-green-300 font-semibold";
              } else if (idx === selected && selected !== q.correct) {
                cls += "border-red-500 bg-red-500/20 text-red-300";
              } else {
                cls += "border-slate-700 bg-slate-800/30 text-slate-500";
              }
              return (
                <button key={idx} className={cls} onClick={() => handleSelect(idx)}>
                  <span className="flex items-center gap-2 justify-end">
                    {selected !== null && idx === q.correct && (
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    )}
                    {selected !== null && idx === selected && selected !== q.correct && (
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    {opt}
                  </span>
                </button>
              );
            })}

            {/* Explanation */}
            {showExplanation && (
              <div
                className={`mt-2 p-3 rounded-lg text-sm text-right ${
                  selected === q.correct
                    ? "bg-green-500/10 border border-green-500/30 text-green-300"
                    : "bg-red-500/10 border border-red-500/30 text-red-300"
                }`}
              >
                <strong>{selected === q.correct ? "✓ נכון! " : "✗ לא נכון. "}</strong>
                {q.explanation}
              </div>
            )}

            {selected !== null && (
              <Button
                onClick={handleNext}
                className="mt-2 bg-amber-500 hover:bg-amber-400 text-black font-bold"
              >
                {currentQ + 1 < questions.length ? "שאלה הבאה ←" : "סיום מבחן"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Feedback (detailed wrong answers) ────────────────────────────────────
  if (phase === "feedback") {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white mb-1">משוב מפורט</h2>
          <p className="text-sm text-slate-400">
            {wrongAnswers.length === 0
              ? "כל התשובות נכונות! 🎉"
              : `${wrongAnswers.length} שאלות שגויות מתוך ${questions.length}`}
          </p>
        </div>

        {wrongAnswers.map((item, idx) => (
          <Card key={idx} className="bg-slate-800/60 border-red-500/30">
            <CardContent className="p-4">
              <p className="text-white text-sm font-semibold text-right mb-3">
                {item.index + 1}. {item.question.question}
              </p>
              <div className="flex flex-col gap-2 text-sm text-right">
                <div className="flex items-center gap-2 justify-end text-red-300">
                  <span>תשובתך: {item.question.options[item.selected ?? 0]}</span>
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-2 justify-end text-green-300">
                  <span>תשובה נכונה: {item.question.options[item.correct]}</span>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                </div>
                <div className="mt-2 p-2 rounded bg-slate-700/50 text-slate-300 text-xs">
                  💡 {item.question.explanation}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={handleAfterResults}
          className="mt-4 bg-amber-500 hover:bg-amber-400 text-black font-bold"
        >
          {passed ? "המשך לשיעורים הבאים ←" : "הבנתי — המשך"}
        </Button>
      </div>
    );
  }

  // ─── Results ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6">
      <div className="text-center max-w-lg">
        {/* Score circle */}
        <div
          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center mx-auto mb-4 border-4 ${
            passed
              ? "border-green-500 bg-green-500/20"
              : "border-red-500 bg-red-500/20"
          }`}
        >
          <span className={`text-3xl font-bold ${passed ? "text-green-400" : "text-red-400"}`}>
            {score}%
          </span>
          <span className="text-xs text-slate-400">ציון</span>
        </div>

        {passed ? (
          <>
            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">כל הכבוד! עברת! 🎉</h2>
            <p className="text-slate-400 mb-4">
              עברת את מבחן המודול בציון {score}%. אתה מוכן להמשיך!
            </p>
            <div className="flex flex-col gap-3">
              {wrongAnswers.length > 0 && (
                <Button
                  onClick={handleShowFeedback}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  סקירת שגיאות ({wrongAnswers.length})
                </Button>
              )}
              <Button
                onClick={onPassed}
                className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 text-lg"
              >
                המשך לשיעורים הבאים ←
              </Button>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-amber-400 mb-2">לא עברת הפעם</h2>
            <p className="text-slate-400 mb-2">
              קיבלת {score}%. ציון עובר הוא 60%.
            </p>
            <p className="text-slate-400 mb-4 text-sm">
              {currentAttempt === 1 && "יש לך ניסיון שני (גרסה B) אחרי שעה."}
              {currentAttempt === 2 && "יש לך ניסיון אחרון (גרסה C) אחרי 24 שעות."}
              {currentAttempt === 3 && "מיצית את כל הניסיונות. חזור על המודול ונסה שוב."}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleShowFeedback}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                סקירת שגיאות ({wrongAnswers.length})
              </Button>
              <Button
                onClick={handleAfterResults}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                הבנתי — המשך
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
