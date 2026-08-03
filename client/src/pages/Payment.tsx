import { useSEO } from "@/hooks/useSEO";
import { useState, useEffect } from "react";
import { Lock, ArrowLeft, AlertCircle, MessageCircle, Mail, Send } from "lucide-react";

const WHATSAPP_NUMBER = "972542111288"; // מספר הוואטסאפ של מאיר
const OWNER_EMAIL = "meir@ynrcollege.org";
const SITE_URL = "https://www.nativ-lamishpacha.com";

export default function Payment() {
  useSEO("payment");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareMode, setShareMode] = useState<"pay" | "share">("pay");

  // קריאת פרמטרים מה-URL כשלקוח מגיע דרך קישור ששלח מאיר
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAmount = params.get("amount");
    const urlNote = params.get("note");
    if (urlAmount && parseFloat(urlAmount) > 0) setAmount(urlAmount);
    if (urlNote) setDescription(urlNote);
  }, []);

  const numAmount = parseFloat(amount);
  const isValidAmount = amount !== "" && !isNaN(numAmount) && numAmount > 0;

  // בניית קישור תשלום עם פרמטרים
  const buildPaymentLink = () => {
    const params = new URLSearchParams();
    if (amount) params.set("amount", amount);
    if (description) params.set("note", description);
    return `${SITE_URL}/payment?${params.toString()}`;
  };

  // שליחה בוואטסאפ
  const handleSendWhatsApp = () => {
    if (!isValidAmount) {
      setError("נא להזין סכום תקין לפני השליחה");
      return;
    }
    const link = buildPaymentLink();
    const noteText = description ? `\nהערה: ${description}` : "";
    const msg = `שלום,\n\nמצורף קישור לתשלום מאובטח בסך ₪${parseFloat(amount).toLocaleString("he-IL")}${noteText}\n\n${link}\n\nבברכה,\nמאיר שמעון עשור — נתיב למשפחה`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // שליחה במייל
  const handleSendEmail = () => {
    if (!isValidAmount) {
      setError("נא להזין סכום תקין לפני השליחה");
      return;
    }
    const link = buildPaymentLink();
    const noteText = description ? `\nהערה: ${description}` : "";
    const subject = `קישור לתשלום — נתיב למשפחה`;
    const body = `שלום,\n\nמצורף קישור לתשלום מאובטח בסך ₪${parseFloat(amount).toLocaleString("he-IL")}${noteText}\n\nלתשלום לחץ/י כאן:\n${link}\n\nבברכה,\nמאיר שמעון עשור\nנתיב למשפחה\nטל: 054-2111-288`;
    const to = clientEmail || "";
    const mailtoUrl = `mailto:${to}?from=${encodeURIComponent(OWNER_EMAIL)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  // תשלום ישיר
  const handlePayment = async () => {
    if (!isValidAmount) {
      setError("נא להזין סכום תקין");
      return;
    }
    if (numAmount < 1) {
      setError("הסכום המינימלי הוא 1 ₪");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/hyp/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          description: description || "",
          successUrl: `${window.location.origin}/payment-success`,
          errorUrl: `${window.location.origin}/payment-error`,
          origin: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.paymentUrl) {
        setError(data.message || data.error || "שגיאה ביצירת דף התשלום. נסה שוב.");
        return;
      }

      window.location.href = data.paymentUrl;
    } catch {
      setError("שגיאת תקשורת. נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--brand-cream, #FAF7F2)", padding: "48px 16px" }}
      dir="rtl"
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <img
              src="/manus-storage/hyp-logo-correct_1b4bf09d.jpg"
              alt="HYP"
              style={{ height: "36px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <h1
            style={{
              fontFamily: "'Noto Serif Hebrew', serif",
              color: "#3D2314",
              fontSize: "clamp(1.4rem, 5vw, 1.75rem)",
              fontWeight: 700,
              marginBottom: "6px",
              lineHeight: 1.3,
            }}
          >
            תשלום מאובטח
          </h1>
          <p style={{ color: "#7A5C4A", fontFamily: "'Assistant', sans-serif", fontSize: "14px" }}>
            י.נ.ר קליניק בע"מ
          </p>
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            borderRadius: "14px",
            background: "rgba(196,149,106,0.1)",
            padding: "4px",
            marginBottom: "20px",
            gap: "4px",
          }}
        >
          <button
            onClick={() => setShareMode("pay")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "'Assistant', sans-serif",
              transition: "all 0.2s ease",
              background: shareMode === "pay" ? "#C4956A" : "transparent",
              color: shareMode === "pay" ? "#fff" : "#7A5C4A",
              boxShadow: shareMode === "pay" ? "0 2px 8px rgba(196,149,106,0.4)" : "none",
            }}
          >
            💳 תשלום עצמי
          </button>
          <button
            onClick={() => setShareMode("share")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "'Assistant', sans-serif",
              transition: "all 0.2s ease",
              background: shareMode === "share" ? "#C4956A" : "transparent",
              color: shareMode === "share" ? "#fff" : "#7A5C4A",
              boxShadow: shareMode === "share" ? "0 2px 8px rgba(196,149,106,0.4)" : "none",
            }}
          >
            <Send size={14} style={{ display: "inline", marginLeft: "4px" }} />
            שלח ללקוח
          </button>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            padding: "clamp(20px, 5vw, 32px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
            border: "1px solid rgba(196,149,106,0.15)",
          }}
        >
          {/* Amount */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "8px",
                color: "#3D2314",
                fontFamily: "'Assistant', sans-serif",
              }}
            >
              סכום לתשלום (₪)
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                inputMode="numeric"
                min="0.01"
                step="1"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "-" || val === "0" || val === "00") return;
                  setAmount(val);
                  const num = parseFloat(val);
                  if (val && (isNaN(num) || num <= 0)) {
                    setError("הסכום חייב להיות מספר חיובי גדול מאפס");
                  } else {
                    setError(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "+") {
                    e.preventDefault();
                  }
                }}
                placeholder="הזן סכום"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "12px",
                  padding: "14px 16px 14px 48px",
                  fontSize: "18px",
                  fontWeight: 700,
                  outline: "none",
                  border: `2px solid ${error ? "#E53E3E" : amount ? "#C4956A" : "rgba(196,149,106,0.3)"}`,
                  fontFamily: "'Assistant', sans-serif",
                  color: "#3D2314",
                  background: "#FAFAFA",
                  direction: "ltr",
                  textAlign: "right",
                  WebkitAppearance: "none",
                  MozAppearance: "textfield",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#C4956A",
                  pointerEvents: "none",
                }}
              >
                ₪
              </span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: shareMode === "share" ? "20px" : "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "8px",
                color: "#3D2314",
                fontFamily: "'Assistant', sans-serif",
              }}
            >
              הערה (אופציונלי)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="לדוגמה: פגישת ייעוץ, טיפול זוגי..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "15px",
                outline: "none",
                border: "2px solid rgba(196,149,106,0.3)",
                fontFamily: "'Assistant', sans-serif",
                color: "#3D2314",
                background: "#FAFAFA",
              }}
            />
          </div>

          {/* Client Email — only in share mode */}
          {shareMode === "share" && (
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "#3D2314",
                  fontFamily: "'Assistant', sans-serif",
                }}
              >
                מייל הלקוח (לשליחה במייל)
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  outline: "none",
                  border: "2px solid rgba(196,149,106,0.3)",
                  fontFamily: "'Assistant', sans-serif",
                  color: "#3D2314",
                  background: "#FAFAFA",
                  direction: "ltr",
                }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "16px",
                background: "rgba(229,62,62,0.08)",
                border: "1px solid rgba(229,62,62,0.2)",
              }}
            >
              <AlertCircle size={16} style={{ color: "#E53E3E", flexShrink: 0 }} />
              <span style={{ fontSize: "14px", color: "#C53030", fontFamily: "'Assistant', sans-serif" }}>
                {error}
              </span>
            </div>
          )}

          {/* Summary */}
          {isValidAmount && (
            <div
              style={{
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(196,149,106,0.08)",
                border: "1px solid rgba(196,149,106,0.2)",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#7A5C4A", fontFamily: "'Assistant', sans-serif" }}>
                סה"כ לתשלום
              </span>
              <span style={{ fontSize: "20px", fontWeight: 900, color: "#C4956A", fontFamily: "'Noto Serif Hebrew', serif" }}>
                ₪{numAmount.toLocaleString("he-IL")}
              </span>
            </div>
          )}

          {/* Buttons */}
          {shareMode === "pay" ? (
            /* Pay button */
            <button
              onClick={handlePayment}
              disabled={loading || !isValidAmount}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                borderRadius: "14px",
                padding: "16px",
                fontSize: "17px",
                fontWeight: 700,
                fontFamily: "'Assistant', sans-serif",
                color: "#FFFFFF",
                border: "none",
                cursor: loading || !isValidAmount ? "not-allowed" : "pointer",
                background: loading || !isValidAmount ? "rgba(196,149,106,0.4)" : "#C4956A",
                boxShadow: loading || !isValidAmount ? "none" : "0 4px 20px rgba(196,149,106,0.4)",
                transition: "all 0.15s ease",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  מעבד...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  לתשלום מאובטח
                  <ArrowLeft size={18} />
                </>
              )}
            </button>
          ) : (
            /* Share buttons */
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* WhatsApp */}
              <button
                onClick={handleSendWhatsApp}
                disabled={!isValidAmount}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  borderRadius: "14px",
                  padding: "15px",
                  fontSize: "16px",
                  fontWeight: 700,
                  fontFamily: "'Assistant', sans-serif",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: !isValidAmount ? "not-allowed" : "pointer",
                  background: !isValidAmount ? "rgba(37,211,102,0.35)" : "#25D366",
                  boxShadow: !isValidAmount ? "none" : "0 4px 16px rgba(37,211,102,0.4)",
                  transition: "all 0.15s ease",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}
              >
                <MessageCircle size={20} />
                שלח קישור בוואטסאפ
              </button>

              {/* Email */}
              <button
                onClick={handleSendEmail}
                disabled={!isValidAmount}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  borderRadius: "14px",
                  padding: "15px",
                  fontSize: "16px",
                  fontWeight: 700,
                  fontFamily: "'Assistant', sans-serif",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: !isValidAmount ? "not-allowed" : "pointer",
                  background: !isValidAmount ? "rgba(196,149,106,0.35)" : "#C4956A",
                  boxShadow: !isValidAmount ? "none" : "0 4px 16px rgba(196,149,106,0.4)",
                  transition: "all 0.15s ease",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}
              >
                <Mail size={20} />
                שלח קישור במייל
              </button>

              {/* Link preview */}
              {isValidAmount && (
                <div
                  style={{
                    borderRadius: "10px",
                    padding: "10px 14px",
                    background: "rgba(196,149,106,0.06)",
                    border: "1px solid rgba(196,149,106,0.2)",
                  }}
                >
                  <p style={{ fontSize: "11px", color: "#9A7A6A", fontFamily: "'Assistant', sans-serif", margin: "0 0 4px 0" }}>
                    הקישור שישלח:
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#C4956A",
                      fontFamily: "monospace",
                      margin: 0,
                      wordBreak: "break-all",
                      direction: "ltr",
                      textAlign: "left",
                    }}
                  >
                    {buildPaymentLink()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a
            href="/"
            style={{ fontSize: "14px", color: "#C4956A", fontFamily: "'Assistant', sans-serif", textDecoration: "none" }}
          >
            ← חזרה לאתר
          </a>
        </div>

        {/* HYP Contact Info */}
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            padding: "16px 20px",
            borderRadius: "12px",
            background: "rgba(196,149,106,0.07)",
            border: "1px solid rgba(196,149,106,0.15)",
            fontFamily: "'Assistant', sans-serif",
          }}
        >
          <p style={{ fontSize: "13px", color: "#7A5C4A", lineHeight: 1.7, margin: 0 }}>
            כאן בשבילכם לכל שאלה ועזרה בנושא,
            <br />
            בטלפון{" "}
            <a href="tel:*6488" style={{ color: "#C4956A", textDecoration: "none", fontWeight: 600 }}>
              6488*
            </a>{" "}
            שלוחה 1
            <br />
            ובמייל{" "}
            <a href="mailto:contact.ez@hyp.co.il" style={{ color: "#C4956A", textDecoration: "none", fontWeight: 600 }}>
              contact.ez@hyp.co.il
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
