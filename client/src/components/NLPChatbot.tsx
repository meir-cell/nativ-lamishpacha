// NLP Practitioner Course — NLP Chatbot Component
// Positioned bottom-right, answers ONLY from course content
// RTL Hebrew

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export default function NLPChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "שלום! 👋 שמי נועם ואני כאן לעזור לך בכל שאלה על חומר הקורס.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.nlp.chat.useMutation({
    onSuccess: (data) => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: data.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    },
    onError: () => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "מצטער, לא הצלחתי לעבד את השאלה. נסו שוב או נסחו אחרת.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    },
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    chatMutation.mutate({ question: userMsg.text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const GOLD = "#C9A84C";
  const GOLD_BRIGHT = "#F0C040";

  return (
    // bottom-right corner, z-50 so it's above content but below modals
    <div className="fixed bottom-20 right-6 z-40" dir="rtl">
      {/* Chat Window — opens upward, max height so it never overflows viewport */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute bottom-16 right-0 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: "320px",
              maxHeight: "calc(100vh - 120px)",
              display: "flex",
              flexDirection: "column",
              background: "oklch(0.14 0.012 265)",
              border: "1px solid oklch(0.25 0.015 265)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 24px rgba(201,168,76,0.08)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, oklch(0.18 0.015 265), oklch(0.14 0.012 265))",
                borderBottom: "1px solid oklch(0.25 0.015 265)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <img
                    src="/manus-storage/presenter_avatar_1_690638b6.png"
                    alt="נועם"
                    className="w-10 h-10 rounded-full object-cover object-top"
                    style={{ border: `2px solid ${GOLD}` }}
                  />
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
                    style={{ background: "#22c55e", border: "2px solid oklch(0.14 0.012 265)" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: GOLD_BRIGHT }}>
                    נועם
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.55 0.01 265)" }}>
                    עוזר הקורס • מחובר
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ color: "oklch(0.55 0.01 265)", background: "oklch(0.20 0.012 265)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.55 0.01 265)")}
                aria-label="סגור"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages — scrollable */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                    style={{
                      background:
                        msg.role === "assistant"
                          ? `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`
                          : "oklch(0.25 0.015 265)",
                      color: msg.role === "assistant" ? "#1a1200" : "white",
                    }}
                  >
                    {msg.role === "assistant" ? "נ" : <User size={12} />}
                  </div>
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                    style={{
                      background:
                        msg.role === "assistant"
                          ? "oklch(0.19 0.015 265)"
                          : `linear-gradient(135deg, rgba(201,168,76,0.18), rgba(240,192,64,0.08))`,
                      border:
                        msg.role === "assistant"
                          ? "1px solid oklch(0.26 0.015 265)"
                          : "1px solid rgba(201,168,76,0.28)",
                      color: "oklch(0.91 0.005 65)",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.65",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: "#1a1200" }}
                  >
                    נ
                  </div>
                  <div
                    className="rounded-xl px-3 py-2"
                    style={{
                      background: "oklch(0.19 0.015 265)",
                      border: "1px solid oklch(0.26 0.015 265)",
                    }}
                  >
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: GOLD }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.22 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-3 flex-shrink-0"
              style={{ borderTop: "1px solid oklch(0.25 0.015 265)" }}
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="שאל שאלה על הקורס..."
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "#ffffff",
                    border: "1px solid oklch(0.26 0.015 265)",
                    color: "#1a1a2e",
                  }}
                  dir="rtl"
                  disabled={isTyping}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                    color: "#1a1a2e",
                    opacity: !input.trim() || isTyping ? 0.45 : 1,
                  }}
                  aria-label="שלח"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button — hidden when closed, shown as close button when open */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-full shadow-xl"
        style={{
          display: isOpen ? undefined : "none",
          padding: isOpen ? "10px 14px" : "8px 16px 8px 10px",
          background: isOpen
            ? "oklch(0.18 0.015 265)"
            : "oklch(0.13 0.014 265)",
          border: `2px solid ${isOpen ? "oklch(0.28 0.015 265)" : GOLD}`,
          boxShadow: isOpen ? "none" : "0 4px 22px rgba(201,168,76,0.40)",
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        animate={
          !isOpen
            ? {
                boxShadow: [
                  "0 4px 22px rgba(201,168,76,0.40)",
                  "0 4px 32px rgba(201,168,76,0.65)",
                  "0 4px 22px rgba(201,168,76,0.40)",
                ],
              }
            : {}
        }
        transition={!isOpen ? { duration: 2.5, repeat: Infinity } : {}}
        aria-label={isOpen ? "סגור צ'אט" : "שאל את נועם"}
      >
        {isOpen ? (
          <>
            <X size={16} style={{ color: "oklch(0.75 0.008 265)" }} />
            <span className="text-sm font-medium" style={{ color: "oklch(0.75 0.008 265)" }}>סגור</span>
          </>
        ) : (
          <>
            <div className="relative flex-shrink-0">
              <img
                src="/manus-storage/presenter_avatar_1_690638b6.png"
                alt="נועם"
                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: `2px solid ${GOLD}` }}
              />
              <span
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: "#22c55e", border: "2px solid oklch(0.13 0.014 265)"
                }}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="text-sm font-bold leading-tight" style={{ color: GOLD_BRIGHT }}>נועם</p>
              <p className="text-xs leading-tight" style={{ color: "oklch(0.55 0.01 265)" }}>שאל אותי...</p>
            </div>
          </>
        )}
      </motion.button>


    </div>
  );
}
