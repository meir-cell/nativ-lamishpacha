// AdminSettings — דף הגדרות מנהל עם בדיקת SMTP ומידע מערכת
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Settings, Mail, CheckCircle, XCircle, Loader2,
  Users, Award, BookOpen, BarChart3, ArrowRight, Volume2, Play, RotateCcw, AlertTriangle, Trash2,
} from "lucide-react";
import { Link } from "wouter";
import { NaturalSpeechController } from "@/lib/naturalSpeech";

export default function AdminSettings() {
  const { user: authUser, loading: authLoading } = useAuth();
  const ownerToken = typeof window !== "undefined" ? localStorage.getItem("nlp_course_token") || "" : "";
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin-token") || "" : "";

  // Determine if user has admin access via any method
  const isAdminViaOAuth = authUser?.role === "admin";
  const hasTokenAccess = !!(ownerToken || adminToken);
  const hasAccess = isAdminViaOAuth || hasTokenAccess;

  // For API calls, pass tokens if available (OAuth is handled server-side via ctx.user)
  const effectiveAdminSecret = adminToken || undefined;
  const effectiveOwnerToken = ownerToken || undefined;

  const [smtpResult, setSmtpResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { data: stats, isLoading: statsLoading } = trpc.nlpAdmin.getStats.useQuery(
    { ownerToken: effectiveOwnerToken, adminSecret: effectiveAdminSecret },
    { enabled: hasAccess && !authLoading, retry: false }
  );

  const testSmtp = trpc.nlpAdmin.testSmtp.useMutation({
    onSuccess: (data) => {
      setSmtpResult(data);
      if (data.ok) {
        toast.success("חיבור SMTP תקין!");
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      setSmtpResult({ ok: false, message: err.message });
      toast.error("שגיאה: " + err.message);
    },
  });

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a12" }}>
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No access at all - show message
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0a0a12", color: "#e8e8f0", direction: "rtl" }}>
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="mx-auto mb-4 text-amber-400" />
          <h1 className="text-xl font-bold mb-2" style={{ color: "#F0C040" }}>גישה לדשבורד מנהל</h1>
          <p className="text-sm mb-6" style={{ color: "#8888aa" }}>
            יש להתחבר עם חשבון הבעלים כדי לגשת לדשבורד.
            <br />
            אם אתה הבעלים, התחבר דרך הקורס עם המייל שלך.
          </p>
          <Link href="/" className="text-amber-400 underline text-sm">חזרה לדף הראשי</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{ background: "#0a0a12", color: "#e8e8f0", fontFamily: "'Segoe UI', Arial, sans-serif", direction: "rtl" }}
    >
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)" }}
          >
            <Settings size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#F0C040" }}>הגדרות מנהל</h1>
            <p className="text-sm" style={{ color: "#8888aa" }}>ניהול מערכת ובדיקת שירותים</p>
          </div>
        </div>

        {/* Admin nav */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { label: "דשבורד", href: "/admin" },
            { label: "רישומים", href: "/admin/registrations" },
            { label: "עדכוני תוכן", href: "/admin/updates" },
            { label: "סקרים", href: "/admin/surveys" },
            { label: "הגדרות", href: "/admin/settings", active: true },
            { label: "מילון הגייה", href: "/admin/pronunciation" },
            { label: "עורך הקראה", href: "/admin/tts-editor" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: item.active ? "linear-gradient(135deg, #C9A84C, #F0C040)" : "rgba(255,255,255,0.05)",
                color: item.active ? "#0a0a12" : "#c8c8e0",
                border: item.active ? "none" : "1px solid rgba(255,255,255,0.08)",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Connected as admin indicator */}
        {isAdminViaOAuth && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: "rgba(80,200,80,0.08)", border: "1px solid rgba(80,200,80,0.25)" }}
          >
            <CheckCircle size={18} style={{ color: "#80e080" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#80e080" }}>מחובר כמנהל</p>
              <p className="text-xs" style={{ color: "#8888aa" }}>{authUser?.name} ({authUser?.email})</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#0f0f1a", border: "1px solid #1e1e35" }}
        >
          <h2 className="text-base font-bold mb-4" style={{ color: "#F0C040" }}>
            📊 סטטיסטיקות מערכת
          </h2>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#8888aa" }}>
              <Loader2 size={16} className="animate-spin" />
              טוען...
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: Users, label: "נרשמים", value: stats.totalRegistrations },
                { icon: Mail, label: "הסכמה למיילים", value: stats.emailOptInCount },
                { icon: Award, label: "תעודות שהונפקו", value: stats.totalCertificates },
                { icon: BookOpen, label: "שיעורים שהושלמו", value: stats.totalLessonCompletions },
                { icon: BarChart3, label: "מבחנים שנגשו", value: stats.totalExamResults },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: "#1a1a2e", border: "1px solid #2a2a45" }}
                >
                  <Icon size={20} style={{ color: "#C9A84C" }} />
                  <div>
                    <p className="text-xl font-bold" style={{ color: "#F0C040" }}>{value}</p>
                    <p className="text-xs" style={{ color: "#8888aa" }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#ff6666" }}>לא ניתן לטעון נתונים</p>
          )}
        </div>

        {/* SMTP Test */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#0f0f1a", border: "1px solid #1e1e35" }}
        >
          <h2 className="text-base font-bold mb-2" style={{ color: "#F0C040" }}>
            📧 בדיקת חיבור SMTP
          </h2>
          <p className="text-sm mb-4" style={{ color: "#8888aa" }}>
            בדוק שפרטי שרת המייל מוגדרים נכון ושהחיבור פעיל.
          </p>

          {/* SMTP status */}
          {stats && (
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-sm"
              style={{
                background: stats.smtpConfigured ? "rgba(80,200,80,0.1)" : "rgba(200,80,80,0.1)",
                border: `1px solid ${stats.smtpConfigured ? "rgba(80,200,80,0.3)" : "rgba(200,80,80,0.3)"}`,
                color: stats.smtpConfigured ? "#80e080" : "#e08080",
              }}
            >
              {stats.smtpConfigured ? <CheckCircle size={15} /> : <XCircle size={15} />}
              {stats.smtpConfigured
                ? `SMTP מוגדר: ${stats.smtpHost}`
                : "SMTP לא מוגדר — הגדר SMTP_HOST, SMTP_USER, SMTP_PASS ב-Secrets"}
            </div>
          )}

          <button
            onClick={() => testSmtp.mutate({ ownerToken: effectiveOwnerToken, adminSecret: effectiveAdminSecret })}
            disabled={testSmtp.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)", color: "#0a0a12" }}
          >
            {testSmtp.isPending ? (
              <><Loader2 size={15} className="animate-spin" /> בודק...</>
            ) : (
              <><Mail size={15} /> בדוק חיבור SMTP</>
            )}
          </button>

          {smtpResult && (
            <div
              className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: smtpResult.ok ? "rgba(80,200,80,0.1)" : "rgba(200,80,80,0.1)",
                border: `1px solid ${smtpResult.ok ? "rgba(80,200,80,0.3)" : "rgba(200,80,80,0.3)"}`,
                color: smtpResult.ok ? "#80e080" : "#e08080",
              }}
            >
              {smtpResult.ok ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> : <XCircle size={16} className="mt-0.5 flex-shrink-0" />}
              <span>{smtpResult.message}</span>
            </div>
          )}
        </div>

        {/* TTS Settings */}
        <TtsControlPanel isAdminViaOAuth={isAdminViaOAuth} adminToken={adminToken} ownerToken={ownerToken} />

        {/* Clear old tokens */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#0f0f1a", border: "1px solid #1e1e35" }}
        >
          <h2 className="text-base font-bold mb-2" style={{ color: "#F0C040" }}>
            🧹 ניקוי טוקנים ישנים
          </h2>
          <p className="text-sm mb-4" style={{ color: "#8888aa" }}>
            אם נתקלת בבעיות התחברות, ניקוי טוקנים ישנים שנשמרו בדפדפן יכול לפתור אותן.
            הפעולה מוחקת טוקנים ישנים מהדפדפן (admin-token, nlp_course_token) — ההתחברות דרך OAuth לא תיפגע.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("admin-token");
              localStorage.removeItem("nlp_course_token");
              toast.success("טוקנים ישנים נוקו בהצלחה! ההתחברות דרך OAuth ממשיכה לפעול.");
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: "rgba(200,80,80,0.15)", color: "#e08080", border: "1px solid rgba(200,80,80,0.3)" }}
          >
            <Trash2 size={15} />
            נקה טוקנים ישנים
          </button>
        </div>

        {/* Instructions */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#0f0f1a", border: "1px solid #1e1e35" }}
        >
          <h2 className="text-base font-bold mb-3" style={{ color: "#F0C040" }}>
            ⚙️ הגדרת SMTP
          </h2>
          <p className="text-sm mb-3" style={{ color: "#c8c8e0" }}>
            הגדר את הפרטים הבאים ב-<strong style={{ color: "#F0C040" }}>Settings → Secrets</strong> בפאנל הניהול של Manus:
          </p>
          <div className="space-y-2">
            {[
              { key: "SMTP_HOST", example: "smtp.brevo.com", desc: "כתובת שרת SMTP" },
              { key: "SMTP_PORT", example: "587", desc: "פורט (587 לרוב)" },
              { key: "SMTP_USER", example: "user@example.com", desc: "שם משתמש / מייל שולח" },
              { key: "SMTP_PASS", example: "••••••••", desc: "סיסמה / App Password" },
              { key: "SMTP_FROM", example: "מאיר שמעו עשור <meir@nlpcourse.co.il>", desc: "שם ומייל שולח" },
            ].map(({ key, example, desc }) => (
              <div
                key={key}
                className="flex items-start gap-3 px-3 py-2 rounded-lg text-xs"
                style={{ background: "#1a1a2e", border: "1px solid #2a2a45" }}
              >
                <code style={{ color: "#F0C040", fontFamily: "monospace", minWidth: "140px" }}>{key}</code>
                <span style={{ color: "#8888aa" }}>{desc}</span>
                <code style={{ color: "#666688", marginRight: "auto" }}>{example}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** TTS Control Panel — adjust narration settings with live preview */
function TtsControlPanel({ isAdminViaOAuth, adminToken, ownerToken }: { isAdminViaOAuth: boolean; adminToken: string; ownerToken: string }) {
  const SAMPLE_TEXT = "שלום וברוכים הבאים לקורס. היום נלמד על עקרונות התקשורת האפקטיבית, ונתרגל טכניקות מעשיות.";

  const canSave = isAdminViaOAuth || !!(adminToken || ownerToken);

  const { data: settings, isLoading } = trpc.ttsSettings.get.useQuery();
  const updateMutation = trpc.ttsSettings.update.useMutation({
    onSuccess: () => toast.success("הגדרות הקראה נשמרו בהצלחה!"),
    onError: (err) => toast.error("שגיאה: " + err.message),
  });

  const [rate, setRate] = useState(0.88);
  const [pitch, setPitch] = useState(1.02);
  const [sentencePause, setSentencePause] = useState(220);
  const [commaPause, setCommaPause] = useState(100);
  const [prefixPause, setPrefixPause] = useState(180);
  const [mergeSpacedLetters, setMergeSpacedLetters] = useState(true);
  const [stripNikudForTts, setStripNikudForTts] = useState(true);
  const [provider, setProvider] = useState<"browser" | "openai">("openai");
  const [voice, setVoice] = useState("nova");
  const [model, setModel] = useState<"tts-1" | "tts-1-hd">("tts-1");
  const [openaiSpeed, setOpenaiSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const controllerRef = useRef<NaturalSpeechController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved settings when data arrives
  useEffect(() => {
    if (settings) {
      setRate(settings.rate);
      setPitch(settings.pitch);
      setSentencePause(settings.sentencePause);
      setCommaPause(settings.commaPause);
      setPrefixPause(settings.prefixPause);
      setMergeSpacedLetters(settings.mergeSpacedLetters);
      setStripNikudForTts(settings.stripNikudForTts);
      setProvider(settings.provider);
      setVoice(settings.voice);
      setModel(settings.model);
      setOpenaiSpeed(settings.openaiSpeed);
    }
  }, [settings]);

  const handleTest = async () => {
    // Stop any existing playback
    if (controllerRef.current) { controllerRef.current.stop(); }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setIsPlaying(true);

    if (provider === "openai") {
      // Use OpenAI TTS via server endpoint
      try {
        const res = await fetch("/api/trpc/tts.speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ json: { text: SAMPLE_TEXT, voice, model, speed: openaiSpeed } }),
        });
        const data = await res.json();
        const audioData = data?.result?.data?.json;
        if (audioData?.audio) {
          const audio = new Audio(`data:${audioData.contentType};base64,${audioData.audio}`);
          audioRef.current = audio;
          audio.onended = () => setIsPlaying(false);
          audio.onerror = () => setIsPlaying(false);
          audio.play();
        } else {
          setIsPlaying(false);
          toast.error("שגיאה ביצירת אודיו");
        }
      } catch (err) {
        setIsPlaying(false);
        toast.error("שגיאה בחיבור ל-OpenAI TTS");
      }
    } else {
      // Use Web Speech API
      const controller = new NaturalSpeechController(SAMPLE_TEXT, {
        lang: "he-IL",
        rate,
        pitch,
        sentencePause,
        commaPause,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
      controllerRef.current = controller;
      controller.play();
    }
  };

  const handleStop = () => {
    if (controllerRef.current) { controllerRef.current.stop(); }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setIsPlaying(false);
  };

  const handleSave = () => {
    if (!canSave) {
      toast.error("אין הרשאה לשמור שינויים");
      return;
    }
    updateMutation.mutate({
      ownerToken: ownerToken || undefined,
      adminSecret: adminToken || undefined,
      rate,
      pitch,
      sentencePause,
      commaPause,
      prefixPause,
      mergeSpacedLetters,
      stripNikudForTts,
      provider,
      voice,
      model,
      openaiSpeed,
    });
  };

  const handleReset = () => {
    setRate(0.88);
    setPitch(1.02);
    setSentencePause(220);
    setCommaPause(100);
    setPrefixPause(180);
    setMergeSpacedLetters(true);
    setStripNikudForTts(true);
    setProvider("openai");
    setVoice("nova");
    setModel("tts-1");
    setOpenaiSpeed(1.0);
    toast.info("הוחזרו ערכי ברירת מחדל");
  };

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "#0f0f1a", border: "1px solid #1e1e35" }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: "#8888aa" }}>
          <Loader2 size={16} className="animate-spin" />
          טוען הגדרות הקראה...
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{ background: "#0f0f1a", border: "1px solid #1e1e35" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "#F0C040" }}>
          <Volume2 size={18} />
          שליטה בהקראה (TTS)
        </h2>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
          style={{ color: "#8888aa", border: "1px solid #2a2a45" }}
        >
          <RotateCcw size={12} />
          איפוס
        </button>
      </div>

      {/* Provider toggle */}
      <div className="mb-6">
        <label className="text-sm mb-2 block" style={{ color: "#c8c8e0" }}>ספק קריינות</label>
        <div className="flex gap-2">
          <button
            onClick={() => setProvider("openai")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: provider === "openai" ? "linear-gradient(135deg, #C9A84C, #F0C040)" : "rgba(255,255,255,0.05)",
              color: provider === "openai" ? "#0a0a12" : "#c8c8e0",
              border: provider === "openai" ? "none" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            OpenAI TTS
          </button>
          <button
            onClick={() => setProvider("browser")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: provider === "browser" ? "linear-gradient(135deg, #C9A84C, #F0C040)" : "rgba(255,255,255,0.05)",
              color: provider === "browser" ? "#0a0a12" : "#c8c8e0",
              border: provider === "browser" ? "none" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            דפדפן (Web Speech)
          </button>
        </div>
      </div>

      {/* OpenAI settings */}
      {provider === "openai" && (
        <div className="space-y-4 mb-6 p-4 rounded-xl" style={{ background: "#1a1a2e", border: "1px solid #2a2a45" }}>
          <div>
            <label className="text-sm mb-2 block" style={{ color: "#c8c8e0" }}>קול</label>
            <div className="flex gap-2 flex-wrap">
              {["alloy", "echo", "fable", "onyx", "nova", "shimmer"].map((v) => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: voice === v ? "#C9A84C" : "rgba(255,255,255,0.05)",
                    color: voice === v ? "#0a0a12" : "#c8c8e0",
                    border: voice === v ? "none" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: "#c8c8e0" }}>מודל</label>
            <div className="flex gap-2">
              <button
                onClick={() => setModel("tts-1")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: model === "tts-1" ? "#C9A84C" : "rgba(255,255,255,0.05)",
                  color: model === "tts-1" ? "#0a0a12" : "#c8c8e0",
                  border: model === "tts-1" ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                tts-1 (מהיר)
              </button>
              <button
                onClick={() => setModel("tts-1-hd")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: model === "tts-1-hd" ? "#C9A84C" : "rgba(255,255,255,0.05)",
                  color: model === "tts-1-hd" ? "#0a0a12" : "#c8c8e0",
                  border: model === "tts-1-hd" ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                tts-1-hd (איכות)
              </button>
            </div>
          </div>
          <SliderControl
            label="מהירות"
            value={openaiSpeed}
            min={0.25}
            max={4.0}
            step={0.05}
            displayValue={`${openaiSpeed.toFixed(2)}x`}
            onChange={setOpenaiSpeed}
          />
        </div>
      )}

      {/* Browser TTS settings */}
      {provider === "browser" && (
        <div className="space-y-4 mb-6 p-4 rounded-xl" style={{ background: "#1a1a2e", border: "1px solid #2a2a45" }}>
          <SliderControl label="מהירות דיבור" value={rate} min={0.5} max={2.0} step={0.02} displayValue={rate.toFixed(2)} onChange={setRate} />
          <SliderControl label="גובה קול" value={pitch} min={0.5} max={2.0} step={0.02} displayValue={pitch.toFixed(2)} onChange={setPitch} />
          <SliderControl label="הפסקה בין משפטים (ms)" value={sentencePause} min={50} max={1000} step={10} displayValue={`${sentencePause}ms`} onChange={setSentencePause} />
          <SliderControl label="הפסקה בפסיקים (ms)" value={commaPause} min={30} max={500} step={10} displayValue={`${commaPause}ms`} onChange={setCommaPause} />
          <SliderControl label="הפסקה לפני תחילית (ms)" value={prefixPause} min={50} max={500} step={10} displayValue={`${prefixPause}ms`} onChange={setPrefixPause} />
        </div>
      )}

      {/* Toggles */}
      <div className="space-y-3 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mergeSpacedLetters}
            onChange={(e) => setMergeSpacedLetters(e.target.checked)}
            className="w-4 h-4 rounded accent-amber-400"
          />
          <span className="text-sm" style={{ color: "#c8c8e0" }}>מיזוג אותיות מרווחות (א נ ק ו ר → אנקור)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={stripNikudForTts}
            onChange={(e) => setStripNikudForTts(e.target.checked)}
            className="w-4 h-4 rounded accent-amber-400"
          />
          <span className="text-sm" style={{ color: "#c8c8e0" }}>הסרת ניקוד לפני הקראה (טבעי יותר)</span>
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={isPlaying ? handleStop : handleTest}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{
            background: isPlaying ? "#e04040" : "rgba(255,255,255,0.08)",
            color: isPlaying ? "white" : "#c8c8e0",
            border: isPlaying ? "none" : "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {isPlaying ? (
            <>■ עצור</>
          ) : (
            <><Play size={15} /> השמע דוגמה</>
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={updateMutation.isPending || !canSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C9A84C, #F0C040)", color: "#0a0a12" }}
        >
          {updateMutation.isPending ? (
            <><Loader2 size={15} className="animate-spin" /> שומר...</>
          ) : (
            <>💾 שמור הגדרות</>
          )}
        </button>
      </div>
    </div>
  );
}

/** Reusable slider control */
function SliderControl({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm" style={{ color: "#c8c8e0" }}>{label}</span>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: "#1a1a2e", color: "#F0C040", border: "1px solid #2a2a45" }}
        >
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to left, #C9A84C ${((value - min) / (max - min)) * 100}%, #2a2a45 ${((value - min) / (max - min)) * 100}%)`,
          accentColor: "#F0C040",
        }}
      />
    </div>
  );
}
