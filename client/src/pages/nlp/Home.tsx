import { useSEO } from "@/hooks/useSEO";
// קורס NLP Practitioner — עיצוב מקצועי ומינימליסטי
// Design: Clean Professional Light (Udemy/Coursera style) | RTL Hebrew

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import RegistrationGate, { getStoredToken, clearToken } from "@/components/RegistrationGate";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronDown, CheckCircle, Circle, Menu, X,
  Star, Brain, Zap, Target, Mic, Clock, ChevronLeft, ChevronRight, Award, Share2, Copy, Check, FlaskConical, AlignJustify, LayoutList, Settings, LogOut,
} from "lucide-react";
import { lessons, modules, instructorInfo, moduleExams, type Lesson } from "@/lib/courseData";
import { ModuleExam } from "@/components/ModuleExam";
import { getLessonDuration } from "@/lib/utils";
import NLPChatbot from "@/components/NLPChatbot";
import LessonPlayer from "@/components/LessonPlayer";
import SatisfactionSurvey from "@/components/SatisfactionSurvey";
import { trpc } from "@/lib/trpc";
import { formatHebrewDate } from "@/lib/hebrewDate";

type Tab = "player" | "content" | "quiz" | "exercises";
type ViewMode = "single" | "scroll";

const PRIMARY = "oklch(0.45 0.18 280)";
const PRIMARY_LIGHT = "oklch(0.93 0.01 280)";
const SIDEBAR_BG = "oklch(0.12 0.015 250)";
const SIDEBAR_BORDER = "oklch(0.22 0.015 250)";
const SIDEBAR_TEXT = "oklch(0.92 0.005 250)";
const SIDEBAR_MUTED = "oklch(0.55 0.01 250)";

export default function Home() {
  useSEO("nlp");
  const { user: authUser, logout } = useAuth();

  // ── Registration Gate ──
  const [gateChecked, setGateChecked] = useState(false);
  const [registeredName, setRegisteredName] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const verifyQuery = trpc.registration.verify.useQuery(
    { token: getStoredToken() ?? "" },
    {
      enabled: !!getStoredToken(),
      retry: false,
      staleTime: Infinity,
    }
  );

  useEffect(() => {
    if (!getStoredToken()) {
      setGateChecked(true);
      return;
    }
    if (verifyQuery.isSuccess) {
      if (verifyQuery.data.valid) {
        setRegisteredName(verifyQuery.data.fullName);
        setIsOwner(!!(verifyQuery.data as { isOwner?: boolean }).isOwner);
      } else {
        clearToken();
      }
      setGateChecked(true);
    } else if (verifyQuery.isError) {
      clearToken();
      setGateChecked(true);
    }
  }, [verifyQuery.isSuccess, verifyQuery.isError, verifyQuery.data]);

  const handleAuthenticated = useCallback((fullName: string) => {
    setRegisteredName(fullName);
  }, []);

  // ── All other hooks (ALL must be declared before any early returns) ──
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0]);
  const [initialSlide, setInitialSlide] = useState<number>(0);
  const [positionRestored, setPositionRestored] = useState(false);

  // Load saved position from DB
  const positionQuery = trpc.lessonPosition.getPosition.useQuery(
    { token: getStoredToken() ?? "" },
    { enabled: !!getStoredToken() && !positionRestored, staleTime: Infinity, retry: false }
  );

  // Restore position once when data arrives
  useEffect(() => {
    if (positionRestored) return;
    if (!positionQuery.data) return;
    const { lessonId, slideIndex } = positionQuery.data;
    if (lessonId) {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        setSelectedLesson(lesson);
        setInitialSlide(slideIndex ?? 0);
        // Expand the module that contains this lesson
        setExpandedModules(prev => {
          const next = new Set(Array.from(prev));
          next.add(lesson.module);
          return next;
        });
      }
    }
    setPositionRestored(true);
  }, [positionQuery.data, positionRestored]);

  // Mutation to save position
  const savePositionMutation = trpc.lessonPosition.savePosition.useMutation();

  // Fetch extra approved content for current lesson
  const { data: extraContent } = trpc.lessonUpdates.getExtraContent.useQuery(
    { lessonId: selectedLesson.id },
    { staleTime: 60_000 }
  );
  // Fetch which lessons have new content (for badges)
  const { data: lessonsWithNew } = trpc.lessonUpdates.getLessonsWithNewContent.useQuery(
    undefined,
    { staleTime: 60_000 }
  );
  const lessonsWithNewSet = new Set(lessonsWithNew ?? []);
  const [activeTab, setActiveTab] = useState<Tab>("player");
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([1]));

  // Lesson progress mutation (sends first-lesson thank-you email)
  const completeLessonMutation = trpc.lessonProgress.completeLesson.useMutation();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [activeModuleExam, setActiveModuleExam] = useState<number | null>(null); // moduleId
  const [passedModules, setPassedModules] = useState<Set<number>>(new Set());
  const [showSurveyForModule, setShowSurveyForModule] = useState<number | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  // ── Certificate ──
  const [certGenerating, setCertGenerating] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  const certCompletionQuery = trpc.certificate.checkCompletion.useQuery(
    { token: getStoredToken() ?? "" },
    { enabled: !!getStoredToken(), staleTime: 30_000, retry: false }
  );

  const generateCertMutation = trpc.certificate.generateCertificate.useMutation({
    onSuccess: () => {
      certCompletionQuery.refetch();
      setCertGenerating(false);
    },
    onError: (err) => {
      setCertError(err.message);
      setCertGenerating(false);
    },
  });

  const handleGenerateCertificate = () => {
    const token = getStoredToken();
    if (!token) return;
    setCertGenerating(true);
    setCertError(null);
    // Use course snapshot: total hours and lesson count
    const COURSE_TOTAL_HOURS = 40;
    generateCertMutation.mutate({
      token,
      totalHours: COURSE_TOTAL_HOURS,
      lessonCount: lessons.length,
    });
  };

  // ── Live clock ──
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Early returns (after ALL hooks) ──
  // Show loading spinner while checking token
  if (!gateChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.10 0.012 265)" }}>
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show registration gate if not authenticated
  if (!registeredName) {
    return (
      <>
        <RegistrationGate onAuthenticated={handleAuthenticated} />
        <NLPChatbot />
      </>
    );
  }

  const courseUrl = "https://nativ-lamishpacha.com/nlp";
  const iframeCode = `<iframe\n  src="${courseUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  allow="autoplay; clipboard-write"\n  style="border-radius: 12px; border: 1px solid #e5e7eb;"\n  title="קורס NLP Practitioner"\n></iframe>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const progress = Math.round((completedLessons.size / lessons.length) * 100);

  // Duration utility is shared from utils.ts

  const toggleModule = (id: number) => {
    setExpandedModules((prev) => {
      const next = new Set(Array.from(prev));
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openModuleExam = (moduleId: number) => {
    setActiveModuleExam(moduleId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleModuleExamPassed = (moduleId: number) => {
    const newPassed = new Set(Array.from(passedModules).concat(moduleId));
    setPassedModules(newPassed);
    setActiveModuleExam(null);
    // Show satisfaction survey after passing the exam
    setShowSurveyForModule(moduleId);
    // Refresh certificate completion status
    certCompletionQuery.refetch();
  };

  const handleReturnToModule = (moduleId: number) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (mod) {
      const firstLesson = lessons.find((l) => l.id === mod.lessons[0]);
      if (firstLesson) selectLesson(firstLesson);
    }
    setActiveModuleExam(null);
  };

  const selectLesson = (lesson: Lesson) => {
    setActiveModuleExam(null);
    setSelectedLesson(lesson);
    setInitialSlide(0); // new lesson always starts at slide 0
    setActiveTab("player");
    setQuizAnswers({});
    setQuizSubmitted(false);
    // Save position to DB
    const token = getStoredToken();
    if (token) {
      savePositionMutation.mutate({ token, lessonId: lesson.id, slideIndex: 0 });
    }
    // Auto-close sidebar on mobile after selecting a lesson
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const markComplete = () => {
    const wasCompleted = completedLessons.has(selectedLesson.id);
    setCompletedLessons((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(selectedLesson.id)) {
        next.delete(selectedLesson.id);
      } else {
        next.add(selectedLesson.id);
      }
      return next;
    });
    // If marking as completed (not un-marking), record in DB and possibly send email
    if (!wasCompleted) {
      const token = getStoredToken();
      if (token) {
        completeLessonMutation.mutate({
          token,
          lessonId: selectedLesson.id,
          lessonTitle: selectedLesson.title,
          siteUrl: window.location.origin,
        });
      }
    }
  };

  const submitQuiz = () => {
    if (Object.keys(quizAnswers).length === selectedLesson.quiz.length) {
      setQuizSubmitted(true);
    }
  };

  const quizScore = selectedLesson.quiz.filter(
    (q, i) => quizAnswers[i] === q.correct
  ).length;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "player", label: "מצגת", icon: Brain },
    { id: "content", label: "תוכן", icon: BookOpen },
    { id: "quiz", label: "חידון", icon: Target },
    { id: "exercises", label: "תרגולים", icon: Zap },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.98 0.002 250)", direction: "rtl" }}>
      {/* Skip to main content link (accessibility) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-white focus:text-sm"
        style={{ background: PRIMARY }}
      >
        דלג לתוכן הראשי
      </a>

      {/* ── TOP HEADER (Udemy-style dark header) ── */}
      <header
        className="fixed top-0 right-0 left-0 z-40 flex items-center justify-between px-4 h-14"
        style={{
          background: SIDEBAR_BG,
          borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        }}
      >
        {/* Left: menu + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: SIDEBAR_MUTED }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            aria-label={sidebarOpen ? "סגור תפריט" : "פתח תפריט"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: PRIMARY }}
            >
              <Brain size={14} className="text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">קורס NLP Practitioner</span>
          </div>
        </div>

        {/* Center: progress bar */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-8">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "oklch(0.25 0.015 250)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: PRIMARY }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs font-semibold text-white whitespace-nowrap">
            {completedLessons.size}/{lessons.length} שיעורים
          </span>
        </div>

        {/* Right: share + admin + instructor */}
        <div className="flex items-center gap-3">
          {(authUser?.role === "admin" || isOwner || localStorage.getItem("admin-token")) && (
            <a
              href="/nlp/admin"
              className="relative z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: "rgba(201,168,76,0.20)", color: "#F0C040", border: "1px solid rgba(201,168,76,0.45)", pointerEvents: "auto" }}
              aria-label="פאנל מנהל"
            >
              <Settings size={13} aria-hidden="true" />
              <span className="hidden sm:inline">מנהל</span>
            </a>
          )}
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(v => v === "single" ? "scroll" : "single")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: viewMode === "scroll" ? "rgba(100,80,200,0.25)" : "rgba(255,255,255,0.10)",
              color: viewMode === "scroll" ? "oklch(0.80 0.12 280)" : "oklch(0.85 0.005 250)",
              border: viewMode === "scroll" ? "1px solid oklch(0.45 0.18 280)" : "1px solid oklch(0.30 0.015 250)",
            }}
            title="החלף בין תצוגת שיעור בודד לגלילה רציפה"
            aria-label={viewMode === "scroll" ? "עבור לתצוגת שיעור בודד" : "עבור לתצוגת כל השיעורים"}
          >
            {viewMode === "scroll" ? <LayoutList size={13} aria-hidden="true" /> : <AlignJustify size={13} aria-hidden="true" />}
            <span className="hidden sm:inline">{viewMode === "scroll" ? "תצוגת שיעור" : "כל השיעורים"}</span>
          </button>
          <button
            onClick={() => setShowEmbed(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.10)", color: "oklch(0.85 0.005 250)", border: "1px solid oklch(0.30 0.015 250)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.16)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
            aria-label="שתף או הטמע את הקורס"
          >
            <Share2 size={13} aria-hidden="true" />
            <span className="hidden sm:inline">שתף / הטמע</span>
          </button>
          {/* Live clock */}
          <div className="hidden md:flex flex-col items-end leading-tight" style={{ color: SIDEBAR_MUTED }}>
            <span className="text-xs font-semibold tabular-nums" style={{ color: "oklch(0.80 0.005 250)" }}>
              {now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-[10px]">
              {now.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <span className="text-[10px]" style={{ color: "oklch(0.65 0.12 50)" }}>
              {formatHebrewDate(now)}
            </span>
          </div>
          <span className="text-xs hidden sm:block" style={{ color: SIDEBAR_MUTED }}>{authUser?.name || instructorInfo.name}</span>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-amber-400/50 active:scale-95"
              style={{ border: "2px solid oklch(0.30 0.015 250)" }}
              aria-label="תפריט משתמש"
            >
              <img
                src={instructorInfo.photo}
                alt={authUser?.name || instructorInfo.name}
                className="w-full h-full object-cover"
              />
            </button>
            {userMenuOpen && (
              <div
                className="absolute left-0 top-10 z-[60] min-w-[160px] rounded-xl shadow-xl py-2"
                style={{ background: "oklch(0.15 0.015 250)", border: "1px solid oklch(0.25 0.015 250)" }}
              >
                {authUser && (
                  <div className="px-4 py-2 border-b" style={{ borderColor: "oklch(0.25 0.015 250)" }}>
                    <p className="text-xs font-semibold text-white truncate">{authUser.name}</p>
                    <p className="text-[10px] truncate" style={{ color: SIDEBAR_MUTED }}>{authUser.email}</p>
                  </div>
                )}
                {(authUser?.role === "admin" || isOwner || localStorage.getItem("admin-token")) && (
                  <a
                    href="/nlp/admin"
                    className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-white/5 transition-colors"
                    style={{ color: "#F0C040" }}
                  >
                    <Settings size={13} />
                    <span>פאנל מנהל</span>
                  </a>
                )}
                <button
                  onClick={() => { setUserMenuOpen(false); logout(); }}
                  className="flex items-center gap-2 px-4 py-2 text-xs w-full text-right hover:bg-white/5 transition-colors"
                  style={{ color: "oklch(0.75 0.15 25)" }}
                >
                  <LogOut size={13} />
                  <span>יציאה</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-14 min-h-screen">

        {/* ── SIDEBAR (dark, Udemy-style) ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="fixed top-14 right-0 bottom-0 z-30 overflow-hidden"
              style={{
                background: SIDEBAR_BG,
                borderLeft: `1px solid ${SIDEBAR_BORDER}`,
              }}
            >
              <div className="w-[280px] h-full overflow-y-auto">

                {/* Progress summary */}
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: SIDEBAR_MUTED }}>התקדמות הקורס</span>
                    <span className="text-xs font-bold text-white">{progress}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: "oklch(0.22 0.015 250)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: PRIMARY }}
                    />
                  </div>
                </div>

                {/* Course content label */}
                <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: SIDEBAR_MUTED }}>
                    תוכן הקורס
                  </p>
                </div>

                {/* Modules */}
                <div>
                  {modules.map((mod) => (
                    <div key={mod.id} style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
                        style={{ color: SIDEBAR_TEXT, background: "oklch(0.16 0.015 250)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.18 0.015 250)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.16 0.015 250)")}
                      >
                        <span>{mod.title}</span>
                        <motion.div animate={{ rotate: expandedModules.has(mod.id) ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={14} style={{ color: SIDEBAR_MUTED }} />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {expandedModules.has(mod.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {mod.lessons.map((lessonId) => {
                              const lesson = lessons.find((l) => l.id === lessonId)!;
                              const isActive = selectedLesson.id === lesson.id && activeModuleExam === null;
                              const isDone = completedLessons.has(lesson.id);
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => selectLesson(lesson)}
                                  className="w-full flex items-start gap-3 px-4 py-3 text-sm transition-colors"
                                  style={{
                                    background: isActive ? "rgba(100,80,200,0.15)" : "transparent",
                                    borderRight: isActive ? `3px solid ${PRIMARY}` : "3px solid transparent",
                                  }}
                                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                                >
                                  <div className="flex-shrink-0 mt-0.5">
                                    {isDone
                                      ? <CheckCircle size={14} style={{ color: "#22c55e" }} />
                                      : <Circle size={14} style={{ color: SIDEBAR_MUTED }} />}
                                  </div>
                                  <div className="flex-1 text-right">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="leading-snug" style={{ color: isActive ? "white" : SIDEBAR_TEXT, fontWeight: isActive ? 600 : 400 }}>
                                        {lesson.title}
                                      </p>
                                      {lessonsWithNewSet.has(lesson.id) && (
                                        <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(201,168,76,0.25)", color: "#C9A84C" }}>חדש</span>
                                      )}
                                    </div>
                                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: SIDEBAR_MUTED }}>
                                      <Clock size={11} />
                                      {getLessonDuration(lesson)}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                            {/* Module Exam Button */}
                            {(() => {
                              const exam = moduleExams.find((e) => e.moduleId === mod.id);
                              if (!exam) return null;
                              const isExamActive = activeModuleExam === mod.id;
                              const isPassed = passedModules.has(mod.id);
                              return (
                                <button
                                  key={`exam-${mod.id}`}
                                  onClick={() => openModuleExam(mod.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                                  style={{
                                    background: isExamActive ? "rgba(201,168,76,0.15)" : "transparent",
                                    borderRight: isExamActive ? "3px solid #C9A84C" : "3px solid transparent",
                                  }}
                                  onMouseEnter={e => { if (!isExamActive) e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}
                                  onMouseLeave={e => { if (!isExamActive) e.currentTarget.style.background = "transparent"; }}
                                >
                                  <div className="flex-shrink-0">
                                    {isPassed
                                      ? <Award size={14} style={{ color: "#C9A84C" }} />
                                      : <Target size={14} style={{ color: "#C9A84C" }} />}
                                  </div>
                                  <div className="flex-1 text-right">
                                    <p className="leading-snug font-semibold" style={{ color: isExamActive ? "#C9A84C" : "#C9A84C", opacity: isExamActive ? 1 : 0.8 }}>
                                      {isPassed ? "✓ מבחן מסכם" : "מבחן מסכם"}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: SIDEBAR_MUTED }}>10 שאלות • ציון עובר 60%</p>
                                  </div>
                                </button>
                              );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Instructor card */}
                <div className="p-4 m-3 rounded-xl" style={{ background: "oklch(0.18 0.015 250)", border: `1px solid ${SIDEBAR_BORDER}` }}>
                  <div className="flex items-center gap-3">
                    <img
                      src={instructorInfo.photo}
                      alt={instructorInfo.name}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                      style={{ border: "2px solid oklch(0.30 0.015 250)" }}
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{instructorInfo.name}</p>
                      <p className="text-xs" style={{ color: SIDEBAR_MUTED }}>{instructorInfo.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── MAIN CONTENT ── */}
        <main
          id="main-content"
          className="flex-1 transition-all duration-300"
          style={{ marginRight: sidebarOpen ? "280px" : "0" }}
        >
          <div className="max-w-3xl mx-auto px-4 py-6">

            {/* ══ CONTINUOUS SCROLL VIEW ══ */}
            {viewMode === "scroll" && (
              <div className="space-y-12">
                {lessons.map((lesson) => (
                  <motion.div
                    key={lesson.id}
                    id={`lesson-${lesson.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: lesson.id * 0.03 }}
                    className="rounded-2xl overflow-hidden shadow-sm"
                    style={{ border: "1px solid oklch(0.88 0.005 250)", background: "white" }}
                  >
                    {/* Lesson banner */}
                    <div className="relative" style={{ height: "140px" }}>
                      <img src={lesson.thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.60) 100%)" }} />
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ background: "rgba(0,0,0,0.50)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                        {lesson.moduleTitle}
                      </span>
                      <div className="absolute top-3 left-3 flex items-center gap-1 text-white text-xs"
                        style={{ background: "rgba(0,0,0,0.50)", backdropFilter: "blur(6px)", padding: "4px 8px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)" }}>
                        <Clock size={11} />
                        <span>{getLessonDuration(lesson)}</span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <h2 className="text-lg font-black text-white drop-shadow-md">
                          שיעור {lesson.id}: {lesson.title}
                        </h2>
                        <p className="text-xs text-white/80">{lesson.subtitle}</p>
                      </div>
                      {/* Completed badge */}
                      {completedLessons.has(lesson.id) && (
                        <div className="absolute top-3" style={{ left: "50%", transform: "translateX(-50%)" }}>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ background: "oklch(0.92 0.08 145)", color: "oklch(0.30 0.12 145)" }}>
                            <CheckCircle size={11} /> הושלם
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      {/* Intro */}
                      <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.01 250)" }}>{lesson.content.intro}</p>

                      {/* Sections */}
                      {lesson.content.sections.map((section, i) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: "oklch(0.97 0.002 250)", border: "1px solid oklch(0.90 0.005 250)" }}>
                          <h3 className="text-sm font-bold mb-2" style={{ color: "oklch(0.15 0.01 250)" }}>{section.title}</h3>
                          {section.highlight && (
                            <div className="p-2.5 rounded-lg mb-2 text-xs font-medium"
                              style={{ background: PRIMARY_LIGHT, color: PRIMARY, border: `1px solid oklch(0.82 0.05 280)` }}>
                              💡 {section.highlight}
                            </div>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "oklch(0.35 0.01 250)" }}>{section.text}</p>
                        </div>
                      ))}

                      {/* Key Points */}
                      <div className="p-4 rounded-xl" style={{ background: "oklch(0.97 0.002 250)", border: "1px solid oklch(0.90 0.005 250)" }}>
                        <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "oklch(0.15 0.01 250)" }}>
                          <Star size={14} style={{ color: PRIMARY }} /> נקודות מפתח
                        </h3>
                        <ul className="space-y-1.5">
                          {lesson.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "oklch(0.35 0.01 250)" }}>
                              <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Summary */}
                      <div className="p-4 rounded-xl" style={{ background: PRIMARY_LIGHT, border: `1px solid oklch(0.82 0.05 280)` }}>
                        <h3 className="text-sm font-bold mb-1" style={{ color: PRIMARY }}>סיכום</h3>
                        <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.01 250)" }}>{lesson.content.summary}</p>
                      </div>

                      {/* Action row */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => { setSelectedLesson(lesson); setActiveTab("player"); setViewMode("single"); }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                          style={{ background: PRIMARY, color: "white" }}
                        >
                          <Mic size={14} /> צפה במצגת
                        </button>
                        <button
                          onClick={() => setCompletedLessons(prev => {
                            const next = new Set(Array.from(prev));
                            next.has(lesson.id) ? next.delete(lesson.id) : next.add(lesson.id);
                            return next;
                          })}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                          style={{
                            background: completedLessons.has(lesson.id) ? "oklch(0.92 0.08 145)" : "oklch(0.97 0.002 250)",
                            color: completedLessons.has(lesson.id) ? "oklch(0.30 0.12 145)" : "oklch(0.45 0.01 250)",
                            border: `1px solid ${completedLessons.has(lesson.id) ? "oklch(0.78 0.12 145)" : "oklch(0.88 0.005 250)"}`,
                          }}
                        >
                          <CheckCircle size={14} />
                          {completedLessons.has(lesson.id) ? "הושלם ✓" : "סמן כהושלם"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ══ SINGLE LESSON VIEW ══ */}
            {viewMode === "single" && (
            <>
            {/* ── MODULE EXAM VIEW (ternary) ── */}
            {activeModuleExam !== null ? (() => {
              const exam = moduleExams.find((e) => e.moduleId === activeModuleExam);
              if (!exam) return null;
              return (
                <motion.div
                  key={`exam-${activeModuleExam}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl overflow-hidden shadow-sm"
                  style={{ border: "1px solid oklch(0.88 0.005 250)", background: "oklch(0.10 0.015 260)" }}
                >
                  <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <h2 className="text-lg font-bold text-white">{exam.moduleTitle}</h2>
                    <p className="text-xs text-slate-400">מבחן מסכם — {exam.moduleTitle}</p>
                  </div>
                  <ModuleExam
                    exam={exam}
                    onPassed={() => handleModuleExamPassed(activeModuleExam!)}
                    onReturnToModule={() => handleReturnToModule(activeModuleExam!)}
                  />
                </motion.div>
              );
            })() : (
            <>
            <motion.div
              key={selectedLesson.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-5"
            >
              {/* ── Lesson Hero: image left + info right ── */}
              <div
                className="rounded-2xl overflow-hidden mb-5 shadow-sm"
                style={{ border: "1px solid oklch(0.88 0.005 250)", background: "white" }}
              >
                {/* Top: image banner with gradient overlay */}
                <div className="relative" style={{ height: "160px" }}>
                  <img
                    src={selectedLesson.thumbnail}
                    alt={selectedLesson.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Dark gradient so text is always readable */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)" }}
                  />
                  {/* Module badge — top right */}
                  <span
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: "rgba(0,0,0,0.50)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    {selectedLesson.moduleTitle}
                  </span>
                  {/* Duration badge — top left */}
                  <div
                    className="absolute top-3 left-3 flex items-center gap-1 text-white text-xs"
                    style={{ background: "rgba(0,0,0,0.50)", backdropFilter: "blur(6px)", padding: "4px 8px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    <Clock size={11} />
                    <span>{getLessonDuration(selectedLesson)}</span>
                  </div>
                  {/* Lesson number — bottom left overlay */}
                  <div className="absolute bottom-3 left-3">
                    <h1 className="text-lg font-black text-white drop-shadow-md">
                      שיעור {selectedLesson.id}: {selectedLesson.title}
                    </h1>
                    <p className="text-xs text-white/80">{selectedLesson.subtitle}</p>
                  </div>
                </div>

                {/* Bottom: action bar */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: "oklch(0.98 0.003 250)", borderTop: "1px solid oklch(0.90 0.005 250)" }}
                >
                  <p className="text-sm" style={{ color: "oklch(0.45 0.01 250)" }}>
                    {selectedLesson.description}
                  </p>
                  <button
                    onClick={markComplete}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all mr-3 active:scale-95"
                  style={{
                    background: completedLessons.has(selectedLesson.id) ? "oklch(0.92 0.08 145)" : PRIMARY,
                    color: completedLessons.has(selectedLesson.id) ? "oklch(0.30 0.12 145)" : "white",
                    border: completedLessons.has(selectedLesson.id) ? `1px solid oklch(0.78 0.12 145)` : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <CheckCircle size={15} />
                  {completedLessons.has(selectedLesson.id) ? "הושלם ✓ לחץ לביטול" : "סמן כהושלם"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ── NOAM INLINE BANNER ── */}
            <div
              className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl cursor-pointer select-none"
              style={{
                background: "oklch(0.13 0.014 265)",
                border: "1.5px solid rgba(201,168,76,0.45)",
                boxShadow: "0 2px 12px rgba(201,168,76,0.18)",
              }}
              onClick={() => {
                window.location.href = "/nlp/chat";
              }}
            >
              <div className="relative flex-shrink-0">
                <img
                  src="/manus-storage/presenter_avatar_1_690638b6.png"
                  alt="נועם"
                  style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid #C9A84C" }}
                />
                <span style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", border: "2px solid oklch(0.13 0.014 265)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: "#F0C040" }}>מנטור NLP — מורה ושותף לתרגול</p>
                <p className="text-xs truncate" style={{ color: "oklch(0.55 0.01 265)" }}>שאל שאלות, תרגל טכניקות, או דבר אליי בקול 🎙️</p>
              </div>
              <div className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.30)" }}>
                שאל
              </div>
            </div>

            {/* ── TABS ── */}
            <div
              className="flex gap-0 mb-5 rounded-lg overflow-hidden"
              style={{ border: "1px solid oklch(0.88 0.005 250)", background: "white" }}
            >
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm font-medium transition-all"
                  style={{
                    background: activeTab === id ? PRIMARY : "transparent",
                    color: activeTab === id ? "white" : "oklch(0.45 0.01 250)",
                    borderLeft: id !== "exercises" ? "1px solid oklch(0.88 0.005 250)" : "none",
                  }}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* ── TAB CONTENT ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedLesson.id}-${activeTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >

                {/* ══ PLAYER TAB ══ */}
                {activeTab === "player" && (
                  <LessonPlayer
                    lesson={selectedLesson}
                    initialSlide={initialSlide}
                    onSlideChange={(slideIndex) => {
                      const token = getStoredToken();
                      if (token) {
                        savePositionMutation.mutate({ token, lessonId: selectedLesson.id, slideIndex });
                      }
                    }}
                  />
                )}

                {/* ══ CONTENT TAB ══ */}
                {activeTab === "content" && (
                  <div className="space-y-4">
                    {/* Intro */}
                    <div className="p-5 rounded-xl bg-white shadow-sm" style={{ border: "1px solid oklch(0.88 0.005 250)" }}>
                      <p className="text-base leading-relaxed" style={{ color: "oklch(0.25 0.01 250)" }}>
                        {selectedLesson.content.intro}
                      </p>
                    </div>

                    {/* AI-researched extra sections */}
                    {extraContent?.sections && extraContent.sections.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mt-2 mb-1">
                          <div className="h-px flex-1" style={{ background: "oklch(0.88 0.005 250)" }} />
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}>✦ תוכן חדש מחקרי</span>
                          <div className="h-px flex-1" style={{ background: "oklch(0.88 0.005 250)" }} />
                        </div>
                        {extraContent.sections.map((section, i) => (
                          <div key={`extra-section-${i}`} className="p-5 rounded-xl bg-white shadow-sm" style={{ border: "1px solid rgba(201,168,76,0.3)" }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>חדש</span>
                              <h3 className="text-base font-bold" style={{ color: "oklch(0.15 0.01 250)" }}>{section.title}</h3>
                            </div>
                            {section.highlight && (
                              <div className="p-3 rounded-lg mb-3 text-sm font-medium" style={{ background: "rgba(201,168,76,0.08)", color: "#8a6d20", border: "1px solid rgba(201,168,76,0.2)" }}>
                                💡 {section.highlight}
                              </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "oklch(0.35 0.01 250)" }}>{section.body}</p>
                            {section.source && (
                              <p className="text-xs mt-3 pt-2" style={{ color: "oklch(0.55 0.01 250)", borderTop: "1px solid oklch(0.92 0.005 250)" }}>
                                📚 {section.source}
                                {section.sourceUrl && <a href={section.sourceUrl} target="_blank" rel="noopener noreferrer" className="mr-1 underline" style={{ color: "oklch(0.45 0.18 280)" }}>קישור</a>}
                              </p>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {/* Sections */}
                    {selectedLesson.content.sections.map((section, i) => (
                      <div key={i} className="p-5 rounded-xl bg-white shadow-sm" style={{ border: "1px solid oklch(0.88 0.005 250)" }}>
                        <h3 className="text-base font-bold mb-3" style={{ color: "oklch(0.15 0.01 250)" }}>
                          {section.title}
                        </h3>
                        {section.highlight && (
                          <div
                            className="p-3 rounded-lg mb-3 text-sm font-medium"
                            style={{ background: PRIMARY_LIGHT, color: PRIMARY, border: `1px solid oklch(0.82 0.05 280)` }}
                          >
                            💡 {section.highlight}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "oklch(0.35 0.01 250)" }}>
                          {section.text}
                        </p>
                        {section.example && (
                          <div
                            className="mt-3 p-3 rounded-lg text-sm"
                            style={{
                              background: "rgba(201,168,76,0.06)",
                              border: "1px solid rgba(201,168,76,0.22)",
                              borderRight: "3px solid rgba(201,168,76,0.5)",
                              color: "oklch(0.40 0.01 250)",
                            }}
                          >
                            <span className="font-bold text-xs block mb-1" style={{ color: "#8a6d20" }}>💡 דוגמה</span>
                            {section.example}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Key Points */}
                    <div className="p-5 rounded-xl bg-white shadow-sm" style={{ border: "1px solid oklch(0.88 0.005 250)" }}>
                      <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "oklch(0.15 0.01 250)" }}>
                        <Star size={16} style={{ color: PRIMARY }} /> נקודות מפתח
                      </h3>
                      <ul className="space-y-2">
                        {selectedLesson.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "oklch(0.35 0.01 250)" }}>
                            <CheckCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                            {point}
                          </li>
                        ))}
                        {/* Extra key points from AI research */}
                        {extraContent?.keyPoints?.map((kp, i) => (
                          <li key={`extra-kp-${i}`} className="flex items-start gap-2.5 text-sm">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}>חדש</span>
                            <span style={{ color: "oklch(0.35 0.01 250)" }}>{kp.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Summary */}
                    <div className="p-5 rounded-xl" style={{ background: PRIMARY_LIGHT, border: `1px solid oklch(0.82 0.05 280)` }}>
                      <h3 className="text-base font-bold mb-2" style={{ color: PRIMARY }}>סיכום השיעור</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.01 250)" }}>
                        {selectedLesson.content.summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* ══ QUIZ TAB ══ */}
                {activeTab === "quiz" && (
                  <div className="space-y-4">
                    {!quizSubmitted ? (
                      <>
                        {selectedLesson.quiz.map((q, i) => (
                          <div key={i} className="p-5 rounded-xl bg-white shadow-sm" style={{ border: "1px solid oklch(0.88 0.005 250)" }}>
                            <p className="text-sm font-semibold mb-3" style={{ color: "oklch(0.15 0.01 250)" }}>
                              {i + 1}. {q.question}
                            </p>
                            <div className="space-y-2">
                              {q.options.map((opt, j) => (
                                <button
                                  key={j}
                                  onClick={() => setQuizAnswers((prev) => ({ ...prev, [i]: j }))}
                                  className="w-full text-right px-4 py-2.5 rounded-lg text-sm transition-all"
                                  style={{
                                    background: quizAnswers[i] === j ? PRIMARY_LIGHT : "oklch(0.97 0.002 250)",
                                    border: quizAnswers[i] === j ? `1.5px solid ${PRIMARY}` : "1.5px solid oklch(0.88 0.005 250)",
                                    color: quizAnswers[i] === j ? PRIMARY : "oklch(0.30 0.01 250)",
                                    fontWeight: quizAnswers[i] === j ? 600 : 400,
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={submitQuiz}
                          disabled={Object.keys(quizAnswers).length < selectedLesson.quiz.length}
                          className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                          style={{
                            background: Object.keys(quizAnswers).length < selectedLesson.quiz.length ? "oklch(0.88 0.005 250)" : PRIMARY,
                            color: Object.keys(quizAnswers).length < selectedLesson.quiz.length ? "oklch(0.55 0.01 250)" : "white",
                          }}
                        >
                          הגש תשובות
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-8 rounded-xl bg-white shadow-sm" style={{ border: "1px solid oklch(0.88 0.005 250)" }}>
                        <div className="text-5xl mb-3">{quizScore === selectedLesson.quiz.length ? "🎉" : quizScore >= selectedLesson.quiz.length / 2 ? "👍" : "💪"}</div>
                        <p className="text-2xl font-black mb-1" style={{ color: PRIMARY }}>{quizScore}/{selectedLesson.quiz.length}</p>
                        <p className="text-sm mb-4" style={{ color: "oklch(0.50 0.01 250)" }}>
                          {quizScore === selectedLesson.quiz.length ? "מושלם! ענית נכון על הכל" : `ענית נכון על ${quizScore} שאלות`}
                        </p>
                        <div className="space-y-2 text-right">
                          {selectedLesson.quiz.map((q, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg"
                              style={{ background: quizAnswers[i] === q.correct ? "oklch(0.95 0.02 145)" : "oklch(0.97 0.01 20)" }}>
                              <span>{quizAnswers[i] === q.correct ? "✅" : "❌"}</span>
                              <div>
                                <p style={{ color: "oklch(0.20 0.01 250)" }}>{q.question}</p>
                                {quizAnswers[i] !== q.correct && (
                                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.18 280)" }}>
                                    תשובה נכונה: {q.options[q.correct]}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                          className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold"
                          style={{ background: PRIMARY, color: "white" }}
                        >
                          נסה שוב
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ EXERCISES TAB ══ */}
                {activeTab === "exercises" && (
                  <div className="space-y-3">
                    {selectedLesson.exercises.map((ex, i) => (
                      <div key={i} className="p-5 rounded-xl bg-white shadow-sm" style={{ border: "1px solid oklch(0.88 0.005 250)" }}>
                        <div className="flex items-start gap-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                            style={{ background: PRIMARY_LIGHT, color: PRIMARY }}
                          >
                            {i + 1}
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.25 0.01 250)" }}>{ex}</p>
                        </div>
                      </div>
                    ))}
                    {/* Extra exercises from AI research */}
                    {extraContent?.exercises && extraContent.exercises.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-px flex-1" style={{ background: "oklch(0.88 0.005 250)" }} />
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}>✦ תרגילים חדשים</span>
                          <div className="h-px flex-1" style={{ background: "oklch(0.88 0.005 250)" }} />
                        </div>
                        {extraContent.exercises.map((ex, i) => (
                          <div key={`extra-ex-${i}`} className="p-5 rounded-xl bg-white shadow-sm" style={{ border: "1px solid rgba(201,168,76,0.3)" }}>
                            <div className="flex items-start gap-3">
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}>חדש</span>
                              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.25 0.01 250)" }}>{ex.text}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* ── PREV / NEXT ── */}
            <div className="flex justify-between items-center mt-8 pt-5" style={{ borderTop: "1px solid oklch(0.88 0.005 250)" }}>
              <button
                onClick={() => {
                  const prev = lessons.find((l) => l.id === selectedLesson.id - 1);
                  if (prev) selectLesson(prev);
                }}
                disabled={selectedLesson.id === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: selectedLesson.id === 1 ? "oklch(0.94 0.005 250)" : "white",
                  color: selectedLesson.id === 1 ? "oklch(0.70 0.01 250)" : "oklch(0.25 0.01 250)",
                  border: "1px solid oklch(0.88 0.005 250)",
                }}
              >
                <ChevronRight size={16} />
                שיעור קודם
              </button>

              <div className="flex items-center gap-1">
                {lessons.map((l) => (
                  <div
                    key={l.id}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{
                      background: l.id === selectedLesson.id ? PRIMARY : completedLessons.has(l.id) ? "#22c55e" : "oklch(0.85 0.005 250)",
                      transform: l.id === selectedLesson.id ? "scale(1.4)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  const next = lessons.find((l) => l.id === selectedLesson.id + 1);
                  if (next) selectLesson(next);
                }}
                disabled={selectedLesson.id === lessons.length}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: selectedLesson.id === lessons.length ? "oklch(0.94 0.005 250)" : PRIMARY,
                  color: selectedLesson.id === lessons.length ? "oklch(0.70 0.01 250)" : "white",
                  border: "none",
                }}
              >
                שיעור הבא
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* ── CERTIFICATE SECTION ── */}
            {(() => {
              const certData = certCompletionQuery.data;
              const allPassed = certData?.allPassed ?? false;
              const passedCount = certData?.passedCount ?? 0;
              const totalModules = certData?.totalModules ?? 5;
              const latestCert = certData?.latestCertificate;

              // Show progress toward certificate if some modules passed
              if (passedCount > 0 && passedCount < totalModules) {
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-5 rounded-xl"
                    style={{ background: "oklch(0.97 0.002 250)", border: "1px solid oklch(0.88 0.005 250)" }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Award size={22} style={{ color: "#C9A84C" }} />
                      <div>
                        <p className="text-sm font-bold" style={{ color: "oklch(0.15 0.01 250)" }}>התקדמות לתעודה</p>
                        <p className="text-xs" style={{ color: "oklch(0.50 0.01 250)" }}>{passedCount} מתוך {totalModules} מבחנים עברת</p>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: "oklch(0.90 0.005 250)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(passedCount / totalModules) * 100}%`, background: "linear-gradient(to left, #F0C040, #C9A84C)" }}
                      />
                    </div>
                  </motion.div>
                );
              }

              // All modules passed — show certificate UI
              if (allPassed) {
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 rounded-2xl overflow-hidden"
                    style={{ border: "2px solid #C9A84C", boxShadow: "0 4px 24px rgba(201,168,76,0.25)" }}
                  >
                    {/* Gold header */}
                    <div
                      className="px-6 py-4 flex items-center gap-3"
                      style={{ background: "linear-gradient(135deg, #8a6d20, #C9A84C, #F0C040, #C9A84C)" }}
                    >
                      <Award size={28} className="text-white flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-black text-white">🎓 כל הכבוד! עברת את כל המבחנים!</h3>
                        <p className="text-sm text-white/85">אתה זכאי לתעודת NLP Practitioner</p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6" style={{ background: "linear-gradient(135deg, #fffdf5, #fff9e6)" }}>
                      {latestCert ? (
                        // Certificate already generated
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.3)" }}>
                            <CheckCircle size={20} style={{ color: "#22c55e" }} />
                            <div className="flex-1">
                              <p className="text-sm font-bold" style={{ color: "oklch(0.15 0.01 250)" }}>תעודה מספר {latestCert.certNumber}</p>
                              <p className="text-xs" style={{ color: "oklch(0.50 0.01 250)" }}>
                                הונפקה ב-{new Date(latestCert.issuedAt).toLocaleDateString("he-IL")}
                                {" • "}{latestCert.totalHours} שעות לימוד
                                {" • "}{latestCert.moduleCount} מודולים
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            {latestCert.pdfUrl && (
                              <a
                                href={latestCert.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                                style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)", color: "#1a1000", textDecoration: "none" }}
                              >
                                <Award size={16} />
                                הורד תעודה (PDF)
                              </a>
                            )}
                            <button
                              onClick={handleGenerateCertificate}
                              disabled={certGenerating}
                              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                              style={{ background: "rgba(201,168,76,0.12)", color: "#8a6d20", border: "1px solid rgba(201,168,76,0.3)" }}
                            >
                              {certGenerating ? (
                                <><div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /> מייצר...</>
                              ) : (
                                "חדש תעודה"
                              )}
                            </button>
                          </div>

                          {certError && (
                            <p className="text-xs text-red-600 text-center">{certError}</p>
                          )}
                        </div>
                      ) : (
                        // No certificate yet — prompt to generate
                        <div className="space-y-4 text-center">
                          <p className="text-sm" style={{ color: "oklch(0.35 0.01 250)" }}>
                            לחץ על הכפתור כדי לייצר את תעודת ה-NLP Practitioner שלך
                          </p>
                          <button
                            onClick={handleGenerateCertificate}
                            disabled={certGenerating}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-bold transition-all active:scale-95"
                            style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)", color: "#1a1000" }}
                          >
                            {certGenerating ? (
                              <><div className="w-5 h-5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" /> מייצר תעודה...</>
                            ) : (
                              <><Award size={18} /> צור תעודת הסמכה</>  
                            )}
                          </button>
                          {certError && (
                            <p className="text-xs text-red-600">{certError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              }

              return null;
            })()}
            </>
            )
            }
            </>
            )}{/* end viewMode === single */}

          </div>
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer
        className="text-center py-4 text-xs"
        style={{
          borderTop: "1px solid oklch(0.90 0.005 250)",
          color: "oklch(0.55 0.01 250)",
          background: "oklch(0.97 0.002 250)",
        }}
        dir="rtl"
      >
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span>© {new Date().getFullYear()} כל הזכויות שמורות למאיר שמעון עשור | קורס NLP Practitioner</span>
          <span style={{ color: "oklch(0.80 0.005 250)" }}>|</span>
          <a
            href="/nlp/terms"
            className="hover:underline transition-colors"
            style={{ color: "oklch(0.50 0.01 250)" }}
          >
            תקנון
          </a>
          <span style={{ color: "oklch(0.80 0.005 250)" }}>|</span>
          <a
            href="/nlp/accessibility"
            className="hover:underline transition-colors"
            style={{ color: "oklch(0.50 0.01 250)" }}
          >
            הצהרת נגישות
          </a>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <NLPChatbot />
      {/* ── SATISFACTION SURVEY MODAL ── */}
      {showSurveyForModule !== null && (() => {
        const mod = modules.find((m) => m.id === showSurveyForModule);
        return (
          <SatisfactionSurvey
            moduleId={showSurveyForModule}
            moduleTitle={mod?.title ?? `מודול ${showSurveyForModule}`}
            onClose={() => setShowSurveyForModule(null)}
          />
        );
      })()}

      {/* ── EMBED MODAL ── */}
      <AnimatePresence>
        {showEmbed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowEmbed(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: "white", border: "1px solid oklch(0.88 0.005 250)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid oklch(0.90 0.005 250)" }}>
                <div className="flex items-center gap-2">
                  <Share2 size={18} style={{ color: PRIMARY }} />
                  <h3 className="text-base font-bold" style={{ color: "oklch(0.15 0.01 250)" }}>שתף / הטמע את הקורס</h3>
                </div>
                <button onClick={() => setShowEmbed(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={16} style={{ color: "oklch(0.50 0.01 250)" }} />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-5 space-y-4">
                {/* Direct link */}
                <div>
                  <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "oklch(0.50 0.01 250)" }}>קישור ישיר לקורס</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={courseUrl}
                      className="flex-1 text-sm px-3 py-2 rounded-lg"
                      style={{ background: "oklch(0.97 0.002 250)", border: "1px solid oklch(0.88 0.005 250)", color: "oklch(0.25 0.01 250)", direction: "ltr" }}
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(courseUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
                      className="px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      style={{ background: PRIMARY, color: "white" }}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? "הועתק" : "העתק"}
                    </button>
                  </div>
                </div>

                {/* Iframe embed */}
                <div>
                  <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "oklch(0.50 0.01 250)" }}>קוד הטמעה (iframe) לאתר שלך</p>
                  <div
                    className="p-3 rounded-lg text-xs font-mono leading-relaxed"
                    style={{ background: "oklch(0.97 0.002 250)", border: "1px solid oklch(0.88 0.005 250)", color: "oklch(0.30 0.01 250)", direction: "ltr", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                  >
                    {iframeCode}
                  </div>
                  <button
                    onClick={copyEmbed}
                    className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                    style={{ background: copied ? "#22c55e" : PRIMARY, color: "white" }}
                  >
                    {copied ? <><Check size={16} /> הקוד הועתק!</> : <><Copy size={16} /> העתק קוד הטמעה</>}
                  </button>
                </div>

                {/* Instructions */}
                <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: "oklch(0.93 0.01 280)", color: "oklch(0.35 0.01 250)", border: "1px solid oklch(0.82 0.05 280)" }}>
                  <p className="font-semibold mb-1" style={{ color: PRIMARY }}>איך להטמיע באתר שלך (meir-asor.co.il)?</p>
                  <p>1. העתק את קוד ה-iframe למעלה</p>
                  <p>2. בעורך Elementor — גרור בלוק "HTML" לעמוד</p>
                  <p>3. הדבק את הקוד בתוך בלוק ה-HTML</p>
                  <p>4. שמור ופרסם — הקורס יופיע ישירות בעמוד!</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
