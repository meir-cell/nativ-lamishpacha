import { XCircle, Phone, RotateCcw } from "lucide-react";

export default function PaymentError() {
  return (
    <div
      className="min-h-screen flex items-center justify-center py-16 px-4"
      style={{ background: "var(--brand-cream, #FAF7F2)" }}
      dir="rtl"
    >
      <div className="w-full max-w-md text-center">
        {/* Error icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ background: "rgba(229,62,62,0.1)" }}
        >
          <XCircle size={44} style={{ color: "#E53E3E" }} />
        </div>

        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "#3D2314" }}
        >
          התשלום לא הושלם
        </h1>
        <p
          className="text-base mb-8 leading-relaxed"
          style={{ color: "#7A5C4A", fontFamily: "'Assistant', sans-serif" }}
        >
          אירעה שגיאה בעיבוד התשלום. ניתן לנסות שוב או לפנות אלינו ישירות.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <a
            href="/payment"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all active:scale-95"
            style={{
              background: "#C4956A",
              color: "#FFFFFF",
              fontFamily: "'Assistant', sans-serif",
            }}
          >
            <RotateCcw size={16} />
            נסה שוב
          </a>
          <a
            href="tel:0542111288"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all active:scale-95"
            style={{
              background: "rgba(196,149,106,0.12)",
              color: "#C4956A",
              border: "1px solid rgba(196,149,106,0.3)",
              fontFamily: "'Assistant', sans-serif",
            }}
          >
            <Phone size={16} />
            054-2111-288
          </a>
        </div>

        <a
          href="/"
          className="text-sm transition-all"
          style={{ color: "#7A5C4A", fontFamily: "'Assistant', sans-serif" }}
        >
          ← חזרה לאתר
        </a>
      </div>
    </div>
  );
}
