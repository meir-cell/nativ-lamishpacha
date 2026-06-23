import { CheckCircle2, Phone, Mail } from "lucide-react";

export default function PaymentSuccess() {
  return (
    <div
      className="min-h-screen flex items-center justify-center py-16 px-4"
      style={{ background: "var(--brand-cream, #FAF7F2)" }}
      dir="rtl"
    >
      <div className="w-full max-w-md text-center">
        {/* Success icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ background: "rgba(107,124,92,0.15)" }}
        >
          <CheckCircle2 size={44} style={{ color: "#6B7C5C" }} />
        </div>

        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "#3D2314" }}
        >
          התשלום התקבל בהצלחה!
        </h1>
        <p
          className="text-base mb-8 leading-relaxed"
          style={{ color: "#7A5C4A", fontFamily: "'Assistant', sans-serif" }}
        >
          תודה רבה. קיבלנו את תשלומך ונחזור אליך בהקדם לתיאום.
        </p>

        {/* Contact info */}
        <div
          className="rounded-2xl p-6 mb-8 text-right"
          style={{ background: "#FFFFFF", border: "1px solid rgba(196,149,106,0.15)" }}
        >
          <p
            className="text-sm font-semibold mb-4"
            style={{ color: "#3D2314", fontFamily: "'Assistant', sans-serif" }}
          >
            לכל שאלה ניתן לפנות:
          </p>
          <div className="space-y-3">
            <a
              href="tel:0542111288"
              className="flex items-center gap-3 transition-all"
              style={{ color: "#C4956A", fontFamily: "'Assistant', sans-serif" }}
            >
              <Phone size={16} />
              <span className="font-medium">054-2111-288</span>
            </a>
            <a
              href="mailto:meir@ynrcollege.org"
              className="flex items-center gap-3 transition-all"
              style={{ color: "#C4956A", fontFamily: "'Assistant', sans-serif" }}
            >
              <Mail size={16} />
              <span className="font-medium">meir@ynrcollege.org</span>
            </a>
          </div>
        </div>

        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all active:scale-95"
          style={{
            background: "#C4956A",
            color: "#FFFFFF",
            fontFamily: "'Assistant', sans-serif",
          }}
        >
          ← חזרה לאתר
        </a>
      </div>
    </div>
  );
}
