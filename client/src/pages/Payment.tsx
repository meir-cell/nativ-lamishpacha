import { useState } from "react";
import { CreditCard, ShieldCheck, Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

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
          description: description || "תשלום — נתיב למשפחה",
          successUrl: `${window.location.origin}/payment-success`,
          errorUrl: `${window.location.origin}/payment-error`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.paymentUrl) {
        setError(data.message || data.error || "שגיאה ביצירת דף התשלום. נסה שוב.");
        return;
      }

      // Redirect to HYP payment page
      window.location.href = data.paymentUrl;
    } catch {
      setError("שגיאת תקשורת. נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-16 px-4"
      style={{ background: "var(--brand-cream, #FAF7F2)" }}
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "rgba(196,149,106,0.15)" }}
          >
            <CreditCard size={32} style={{ color: "#C4956A" }} />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "#3D2314" }}
          >
            תשלום מאובטח
          </h1>
          <p className="text-sm" style={{ color: "#7A5C4A", fontFamily: "'Assistant', sans-serif" }}>
            מאיר שמעון עשור — נתיב למשפחה
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-lg"
          style={{ background: "#FFFFFF", border: "1px solid rgba(196,149,106,0.15)" }}
        >
          {/* Amount */}
          <div className="mb-5">
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "#3D2314", fontFamily: "'Assistant', sans-serif" }}
            >
              סכום לתשלום (₪)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="הזן סכום"
                className="w-full rounded-xl px-4 py-3 text-lg font-bold outline-none transition-all"
                style={{
                  border: `2px solid ${error ? "#E53E3E" : amount ? "#C4956A" : "rgba(196,149,106,0.3)"}`,
                  fontFamily: "'Assistant', sans-serif",
                  color: "#3D2314",
                  background: "#FAFAFA",
                  direction: "ltr",
                  textAlign: "right",
                }}
              />
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold"
                style={{ color: "#C4956A" }}
              >
                ₪
              </span>
            </div>
          </div>

          {/* Optional description */}
          <div className="mb-6">
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "#3D2314", fontFamily: "'Assistant', sans-serif" }}
            >
              הערה (אופציונלי)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="לדוגמה: פגישת ייעוץ, טיפול זוגי..."
              className="w-full rounded-xl px-4 py-3 outline-none transition-all"
              style={{
                border: "2px solid rgba(196,149,106,0.3)",
                fontFamily: "'Assistant', sans-serif",
                color: "#3D2314",
                background: "#FAFAFA",
                fontSize: "15px",
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4"
              style={{ background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.2)" }}
            >
              <AlertCircle size={16} style={{ color: "#E53E3E", flexShrink: 0 }} />
              <span className="text-sm" style={{ color: "#C53030", fontFamily: "'Assistant', sans-serif" }}>
                {error}
              </span>
            </div>
          )}

          {/* Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div
              className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between"
              style={{ background: "rgba(196,149,106,0.08)", border: "1px solid rgba(196,149,106,0.2)" }}
            >
              <span className="text-sm font-medium" style={{ color: "#7A5C4A", fontFamily: "'Assistant', sans-serif" }}>
                סה"כ לתשלום
              </span>
              <span className="text-xl font-black" style={{ color: "#C4956A", fontFamily: "'Noto Serif Hebrew', serif" }}>
                ₪{parseFloat(amount).toLocaleString("he-IL")}
              </span>
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePayment}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-4 font-bold text-lg transition-all active:scale-[0.98]"
            style={{
              background:
                loading || !amount || parseFloat(amount) <= 0
                  ? "rgba(196,149,106,0.4)"
                  : "#C4956A",
              color: "#FFFFFF",
              fontFamily: "'Assistant', sans-serif",
              cursor: loading || !amount || parseFloat(amount) <= 0 ? "not-allowed" : "pointer",
              boxShadow: loading || !amount || parseFloat(amount) <= 0
                ? "none"
                : "0 4px 20px rgba(196,149,106,0.4)",
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
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm transition-all"
            style={{ color: "#C4956A", fontFamily: "'Assistant', sans-serif" }}
          >
            ← חזרה לאתר
          </a>
        </div>
      </div>
    </div>
  );
}
