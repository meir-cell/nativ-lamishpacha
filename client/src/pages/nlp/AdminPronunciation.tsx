import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

import { Link } from "wouter";
import { ArrowRight, Plus, Pencil, Trash2, Volume2, Check, X, ToggleLeft, ToggleRight, Play } from "lucide-react";
import { NaturalSpeechController } from "@/lib/naturalSpeech";
import { OpenAITtsController, getOpenAIVoiceForGender } from "@/lib/openaiTts";
import { useTtsSettings } from "@/hooks/useTtsSettings";

export default function AdminPronunciation() {
  const { ttsSettings } = useTtsSettings();
  const { user: authUser, loading: authLoading } = useAuth();
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem("admin-token") || "" : "";
  const ownerToken = typeof window !== 'undefined' ? localStorage.getItem("nlp_course_token") || "" : "";
  const isAdminViaOAuth = authUser?.role === "admin";
  const hasAccess = isAdminViaOAuth || !!(adminToken || ownerToken);
  const [newWord, setNewWord] = useState("");
  const [newReplacement, setNewReplacement] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editReplacement, setEditReplacement] = useState("");
  const [editNote, setEditNote] = useState("");

  const { data: overrides, isLoading, refetch } = trpc.pronunciationOverrides.list.useQuery(
    undefined,
    { enabled: hasAccess && !authLoading }
  );

  const addMutation = trpc.pronunciationOverrides.add.useMutation({
    onSuccess: () => {
      refetch();
      setNewWord("");
      setNewReplacement("");
      setNewNote("");
    },
  });

  const updateMutation = trpc.pronunciationOverrides.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
    },
  });

  const deleteMutation = trpc.pronunciationOverrides.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const [playingId, setPlayingId] = useState<number | null>(null);
  const testControllerRef = useRef<NaturalSpeechController | null>(null);
  const openaiTestCtrlRef = useRef<OpenAITtsController | null>(null);
  const trpcUtils = trpc.useUtils();
  const trpcClientRef = useRef(trpcUtils.client);

  const testPronunciation = useCallback((id: number, replacement: string) => {
    // Cancel any ongoing speech
    try { window.speechSynthesis?.cancel(); } catch {}
    if (testControllerRef.current) { testControllerRef.current.stop(); testControllerRef.current = null; }
    if (openaiTestCtrlRef.current) { openaiTestCtrlRef.current.stop(); openaiTestCtrlRef.current = null; }
    setPlayingId(id);

    if (ttsSettings.provider === "openai") {
      // Use OpenAI TTS directly — pick voice based on gender preference
      const gender = (localStorage.getItem("tts-gender") as "male" | "female") || "female";
      const controller = new OpenAITtsController(replacement, {
        voice: getOpenAIVoiceForGender(ttsSettings.voice, gender),
        model: ttsSettings.model,
        speed: ttsSettings.openaiSpeed,
        mergeSpacedLetters: ttsSettings.mergeSpacedLetters,
        stripNikudForTts: ttsSettings.stripNikudForTts,
        sentencePause: ttsSettings.sentencePause,
        onEnd: () => { setPlayingId(null); openaiTestCtrlRef.current = null; },
        onError: () => { setPlayingId(null); openaiTestCtrlRef.current = null; },
      }, trpcClientRef.current);
      openaiTestCtrlRef.current = controller;
      controller.play();
      return;
    }

    // Browser TTS — First get nikud for the replacement text, then speak it
    fetch("/api/trpc/nikud.addNikud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ json: { text: replacement } }),
    })
      .then(r => r.json())
      .then((data: any) => {
        const nikudText: string = data?.result?.data?.json?.text ?? replacement;
        const voices = window.speechSynthesis.getVoices();
        const hebrewVoice = voices.find(v => v.lang.startsWith("he") || v.lang.startsWith("iw"));

        const controller = new NaturalSpeechController(nikudText, {
          lang: "he-IL",
          rate: ttsSettings.rate,
          pitch: ttsSettings.pitch,
          voice: hebrewVoice ?? null,
          sentencePause: ttsSettings.sentencePause,
          commaPause: ttsSettings.commaPause,
          mergeSpacedLetters: ttsSettings.mergeSpacedLetters,
          stripNikudForTts: ttsSettings.stripNikudForTts,
          onEnd: () => { setPlayingId(null); testControllerRef.current = null; },
          onError: () => { setPlayingId(null); testControllerRef.current = null; },
        });

        testControllerRef.current = controller;
        controller.play();
      })
      .catch(() => {
        // Fallback: speak without nikud
        const voices = window.speechSynthesis.getVoices();
        const hebrewVoice = voices.find(v => v.lang.startsWith("he") || v.lang.startsWith("iw"));

        const controller = new NaturalSpeechController(replacement, {
          lang: "he-IL",
          rate: ttsSettings.rate,
          pitch: ttsSettings.pitch,
          voice: hebrewVoice ?? null,
          sentencePause: ttsSettings.sentencePause,
          commaPause: ttsSettings.commaPause,
          mergeSpacedLetters: ttsSettings.mergeSpacedLetters,
          stripNikudForTts: ttsSettings.stripNikudForTts,
          onEnd: () => { setPlayingId(null); testControllerRef.current = null; },
          onError: () => { setPlayingId(null); testControllerRef.current = null; },
        });

        testControllerRef.current = controller;
        controller.play();
      });
  }, [ttsSettings]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground" dir="rtl">
        <div className="text-center">
          <p className="mb-4">יש להתחבר עם חשבון הבעלים כדי לגשת לדף זה.</p>
          <Link href="/" className="text-amber-500 underline">חזרה לדף הראשי</Link>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    if (!newWord.trim() || !newReplacement.trim()) return;
    addMutation.mutate({
      originalWord: newWord.trim(),
      replacement: newReplacement.trim(),
      note: newNote.trim() || undefined,
    });
  };

  const handleUpdate = (id: number) => {
    updateMutation.mutate({
      id,
      originalWord: editWord.trim() || undefined,
      replacement: editReplacement.trim() || undefined,
      note: editNote.trim() || undefined,
    });
  };

  const handleToggleActive = (id: number, currentActive: boolean) => {
    updateMutation.mutate({ id, isActive: !currentActive });
  };

  const startEdit = (override: { id: number; originalWord: string; replacement: string; note: string | null }) => {
    setEditingId(override.id);
    setEditWord(override.originalWord);
    setEditReplacement(override.replacement);
    setEditNote(override.note ?? "");
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-6 h-6 text-amber-500" />
              <h1 className="text-xl font-bold">מילון חריגים — תיקוני הגייה</h1>
            </div>
            <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              חזרה לדשבורד
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            הגדר מילים שהקריינות מבטאת לא נכון — המערכת תחליף אותן לפני שליחה ל-TTS
          </p>
        </div>
      </div>

      <div className="container py-6 max-w-4xl mx-auto">
        {/* Add new override */}
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" />
            הוסף תיקון חדש
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">מילה מקורית</label>
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder='למשל: "NLP"'
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">תיקון הגייה</label>
              <input
                type="text"
                value={newReplacement}
                onChange={(e) => setNewReplacement(e.target.value)}
                placeholder='למשל: "אן אל פי"'
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">הערה (אופציונלי)</label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="למה צריך את התיקון"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!newWord.trim() || !newReplacement.trim() || addMutation.isPending}
            className="px-4 py-2 bg-amber-500 text-black font-medium rounded-md hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
          >
            {addMutation.isPending ? "מוסיף..." : "הוסף תיקון"}
          </button>
          {addMutation.isError && (
            <p className="text-red-400 text-sm mt-2">
              שגיאה: {addMutation.error.message.includes("Duplicate") ? "מילה זו כבר קיימת במילון" : addMutation.error.message}
            </p>
          )}
        </div>

        {/* Overrides list */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">רשימת תיקונים ({overrides?.length ?? 0})</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">טוען...</div>
          ) : !overrides || overrides.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>אין עדיין תיקוני הגייה</p>
              <p className="text-sm mt-1">הוסף מילים שהקריינות מבטאת לא נכון</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {overrides.map((override) => (
                <div key={override.id} className="px-5 py-3 flex items-center gap-3">
                  {editingId === override.id ? (
                    /* Edit mode */
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editWord}
                        onChange={(e) => setEditWord(e.target.value)}
                        className="px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
                      />
                      <input
                        type="text"
                        value={editReplacement}
                        onChange={(e) => setEditReplacement(e.target.value)}
                        className="px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
                      />
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="הערה"
                        className="px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
                      />
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-sm px-2 py-0.5 rounded ${override.isActive ? "bg-amber-500/20 text-amber-300" : "bg-muted text-muted-foreground line-through"}`}>
                          {override.originalWord}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className={`font-mono text-sm px-2 py-0.5 rounded ${override.isActive ? "bg-green-500/20 text-green-300" : "bg-muted text-muted-foreground line-through"}`}>
                          {override.replacement}
                        </span>
                        {override.note && (
                          <span className="text-xs text-muted-foreground">({override.note})</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {editingId === override.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(override.id)}
                          className="p-1.5 rounded hover:bg-green-500/20 text-green-400 transition-colors"
                          title="שמור"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                          title="ביטול"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => testPronunciation(override.id, override.replacement)}
                          className={`p-1.5 rounded transition-colors ${playingId === override.id ? "bg-emerald-500/30 text-emerald-300 animate-pulse" : "hover:bg-emerald-500/20 text-emerald-400"}`}
                          title="בדוק הגייה"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(override.id, override.isActive)}
                          className={`p-1.5 rounded transition-colors ${override.isActive ? "hover:bg-amber-500/20 text-amber-400" : "hover:bg-muted text-muted-foreground"}`}
                          title={override.isActive ? "השבת" : "הפעל"}
                        >
                          {override.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => startEdit(override)}
                          className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                          title="ערוך"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`למחוק את התיקון עבור "${override.originalWord}"?`)) {
                              deleteMutation.mutate({ id: override.id });
                            }
                          }}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help section */}
        <div className="mt-6 bg-card/50 border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-2">איך זה עובד?</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>הוסף מילה שהקריינות מבטאת לא נכון בעמודה "מילה מקורית"</li>
            <li>בעמודה "תיקון הגייה" כתוב איך המילה צריכה להישמע (באותיות עבריות)</li>
            <li>המערכת תחליף אוטומטית את המילה לפני שליחה לקריינות</li>
            <li>אפשר להשבית תיקון זמנית בלי למחוק אותו</li>
          </ul>
          <div className="mt-3 p-3 bg-background rounded border border-border">
            <p className="text-sm font-medium mb-1">דוגמאות:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-mono text-amber-300">NLP</span> → <span className="font-mono text-green-300">אן אל פי</span></p>
              <p><span className="font-mono text-amber-300">VAKOG</span> → <span className="font-mono text-green-300">ואקוג</span></p>
              <p><span className="font-mono text-amber-300">מטא-מודל</span> → <span className="font-mono text-green-300">מטה מודל</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
