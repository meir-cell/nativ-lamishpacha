import { useState } from "react";
import { Lock, ArrowLeft, AlertCircle } from "lucide-react";

export default function Payment() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
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
      <div style={{ width: "100%", maxWidth: "420px" }}>

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
                  // Block negative sign and zero
                  if (val === "-" || val === "0" || val === "00") return;
                  setAmount(val);
                  // Inline validation
                  const num = parseFloat(val);
                  if (val && (isNaN(num) || num <= 0)) {
                    setError("הסכום חייב להיות מספר חיובי גדול מאפס");
                  } else {
                    setError(null);
                  }
                }}
                onKeyDown={(e) => {
                  // Block minus sign and 'e' (scientific notation)
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
          {amount && parseFloat(amount) > 0 && (
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
                ₪{parseFloat(amount).toLocaleString("he-IL")}
              </span>
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePayment}
            disabled={loading || !amount || parseFloat(amount) <= 0}
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
              cursor: loading || !amount || parseFloat(amount) <= 0 ? "not-allowed" : "pointer",
              background: loading || !amount || parseFloat(amount) <= 0
                ? "rgba(196,149,106,0.4)"
                : "#C4956A",
              boxShadow: loading || !amount || parseFloat(amount) <= 0
                ? "none"
                : "0 4px 20px rgba(196,149,106,0.4)",
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
            <a
              href="tel:*6488"
              style={{ color: "#C4956A", textDecoration: "none", fontWeight: 600 }}
            >
              6488*
            </a>{" "}
            שלוחה 1
            <br />
            ובמייל{" "}
            <a
              href="mailto:contact.ez@hyp.co.il"
              style={{ color: "#C4956A", textDecoration: "none", fontWeight: 600 }}
            >
              contact.ez@hyp.co.il
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
