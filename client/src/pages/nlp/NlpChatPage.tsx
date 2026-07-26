import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Send, Mic, MicOff, Volume2, VolumeX, ArrowRight, X,
  Bot, User, Loader2, Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { NaturalSpeechController } from "@/lib/naturalSpeech";
import { OpenAITtsController, getOpenAIVoiceForGender } from "@/lib/openaiTts";
import { useTtsSettings } from "@/hooks/useTtsSettings";
import TalkingAvatar from "@/components/TalkingAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NlpChatPage() {
  const { ttsSettings } = useTtsSettings();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversationMutation = trpc.nlp.conversation.useMutation();

  // Get TTS gender from localStorage
  const [ttsGender, setTtsGender] = useState<"male" | "female">(() => {
    return (localStorage.getItem("tts-gender") as "male" | "female") || "female";
  });

  // Listen for gender changes
  useEffect(() => {
    const handler = () => {
      setTtsGender((localStorage.getItem("tts-gender") as "male" | "female") || "female");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "he-IL";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const chatControllerRef = useRef<NaturalSpeechController | null>(null);
  const openaiChatCtrlRef = useRef<OpenAITtsController | null>(null);
  const trpcUtils = trpc.useUtils();
  const trpcClientRef = useRef(trpcUtils.client);

  const speakText = useCallback((text: string) => {
    try { window.speechSynthesis?.cancel(); } catch {}
    if (chatControllerRef.current) { chatControllerRef.current.stop(); chatControllerRef.current = null; }
    if (openaiChatCtrlRef.current) { openaiChatCtrlRef.current.stop(); openaiChatCtrlRef.current = null; }
    setIsSpeaking(true);

    if (ttsSettings.provider === "openai") {
      // Use OpenAI TTS directly — pick voice based on gender preference
      const gender = (localStorage.getItem("tts-gender") as "male" | "female") || "female";
      const volumeBoostVal = parseFloat(localStorage.getItem("tts-volume-boost") || "2.0");
      const controller = new OpenAITtsController(text, {
        voice: getOpenAIVoiceForGender(ttsSettings.voice, gender),
        model: ttsSettings.model,
        speed: ttsSettings.openaiSpeed,
        volume: volumeBoostVal,
        mergeSpacedLetters: ttsSettings.mergeSpacedLetters,
        stripNikudForTts: ttsSettings.stripNikudForTts,
        sentencePause: ttsSettings.sentencePause,
        onEnd: () => {
          setIsSpeaking(false);
          openaiChatCtrlRef.current = null;
        },
        onError: () => {
          setIsSpeaking(false);
          openaiChatCtrlRef.current = null;
        },
      }, trpcClientRef.current);
      openaiChatCtrlRef.current = controller;
      controller.play();
      return;
    }

    // Browser TTS — get nikud first for better pronunciation
    fetch("/api/trpc/nikud.addNikud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ json: { text: text.slice(0, 5000) } }),
    })
      .then((r) => r.json())
      .then((data: any) => {
        const nikudText: string = data?.result?.data?.json?.text ?? text;
        doSpeak(nikudText);
      })
      .catch(() => {
        doSpeak(text);
      });
  }, [ttsSettings]);

  const doSpeak = (textToSpeak: string) => {
    const voices = window.speechSynthesis.getVoices();
    const hebrewVoice = voices.find((v) => v.lang.startsWith("he") || v.lang.startsWith("iw"));

    const controller = new NaturalSpeechController(textToSpeak, {
      lang: "he-IL",
      rate: ttsSettings.rate,
      pitch: ttsSettings.pitch,
      voice: hebrewVoice ?? null,
      sentencePause: ttsSettings.sentencePause,
      commaPause: ttsSettings.commaPause,
      mergeSpacedLetters: ttsSettings.mergeSpacedLetters,
      stripNikudForTts: ttsSettings.stripNikudForTts,
      onEnd: () => {
        setIsSpeaking(false);
        chatControllerRef.current = null;
      },
      onError: () => {
        setIsSpeaking(false);
        chatControllerRef.current = null;
      },
    });

    chatControllerRef.current = controller;
    controller.play();
  };

  const stopSpeaking = () => {
    if (openaiChatCtrlRef.current) { openaiChatCtrlRef.current.stop(); openaiChatCtrlRef.current = null; }
    if (chatControllerRef.current) { chatControllerRef.current.stop(); chatControllerRef.current = null; }
    try { window.speechSynthesis?.cancel(); } catch {}
    setIsSpeaking(false);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const result = await conversationMutation.mutateAsync({
        messages: messages.slice(-20), // Keep last 20 messages for context
        newMessage: trimmed,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: result.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-speak response if enabled
      if (autoSpeak) {
        // Small delay to let the UI update first
        setTimeout(() => speakText(result.answer), 300);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "מצטער, יש בעיה טכנית. נסה שוב בעוד רגע.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4" dir="rtl">
        <div className="text-center max-w-md">
          <Brain className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h1 className="text-2xl font-bold text-white mb-2">מנטור NLP</h1>
          <p className="text-gray-400 mb-6">
            כדי לשוחח עם המנטור, יש להתחבר תחילה
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
          >
            התחבר לקורס
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0f]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">מנטור NLP</h1>
              <p className="text-gray-500 text-xs">מורה ושותף לתרגול</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 rounded-lg transition-colors ${
                autoSpeak
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-gray-800 text-gray-500"
              }`}
              title={autoSpeak ? "השמעה אוטומטית פעילה" : "השמעה אוטומטית כבויה"}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {/* Close / Back button */}
            <a
              href="/nlp"
              className="p-2 rounded-lg bg-gray-800 hover:bg-red-600/30 text-gray-400 hover:text-red-300 transition-colors"
              title="סגור וחזור לקורס"
            >
              <X className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Messages area with avatar */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Avatar + Welcome — shown when no messages */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-10">
              <TalkingAvatar
                isSpeaking={isSpeaking}
                gender={ttsGender}
              />
              <h2 className="text-lg font-bold text-white mt-4 mb-1">שלום! אני המנטור שלך</h2>
              <p className="text-gray-400 text-sm text-center max-w-sm">
                אני כאן כדי לענות על שאלות, להסביר מושגים, ולתרגל איתך טכניקות NLP. אפשר גם לדבר אליי בקול!
              </p>
            </div>
          )}

          {/* Avatar — shown inline when there are messages */}
          {messages.length > 0 && (
            <div className="flex justify-center mb-4">
              <TalkingAvatar
                isSpeaking={isSpeaking}
                gender={ttsGender}
                isMinimized={false}
              />
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-blue-600/20 border border-blue-500/30 text-white"
                        : "bg-gray-800/80 border border-gray-700/50 text-gray-100"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => {
                          if (isSpeaking) {
                            stopSpeaking();
                          } else {
                            speakText(msg.content);
                          }
                        }}
                        className="mt-2 p-1 rounded hover:bg-gray-700/50 text-gray-500 hover:text-amber-400 transition-colors"
                        title={isSpeaking ? "עצור השמעה" : "השמע תשובה"}
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 bg-[#0a0a0f]/95 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2 bg-gray-800/50 border border-gray-700 rounded-2xl px-3 py-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="שאל שאלה או בקש תרגול..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm min-h-[36px] max-h-[120px] py-1"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex items-center gap-1">
              {/* Mic button */}
              <button
                onClick={toggleListening}
                disabled={!recognitionRef.current || isLoading}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? "bg-red-500/20 text-red-400 animate-pulse"
                    : "hover:bg-gray-700 text-gray-400 hover:text-white"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
                title={isListening ? "הפסק הקלטה" : "דבר (Speech-to-Text)"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              {/* Send button */}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="שלח"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          {isListening && (
            <p className="text-center text-red-400 text-xs mt-2 animate-pulse">
              🎙️ מקשיב... דבר עכשיו
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
