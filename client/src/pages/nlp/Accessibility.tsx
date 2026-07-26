// Accessibility Statement Page — הצהרת נגישות
// Hebrew accessibility declaration per Israeli Standard 5568 / WCAG 2.1 AA
import { Link } from "wouter";
import { ArrowRight, BookOpen, Eye, CheckCircle, Mail, Phone } from "lucide-react";

const PRIMARY = "oklch(0.52 0.18 280)";
const GOLD = "#C9A84C";

export default function Accessibility() {
  const year = new Date().getFullYear();

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      lang="he"
      style={{ background: "oklch(0.97 0.002 250)", fontFamily: "'Heebo', sans-serif" }}
    >
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-white"
        style={{ background: PRIMARY }}
      >
        דלג לתוכן הראשי
      </a>

      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
        style={{
          background: "oklch(0.12 0.015 265)",
          borderBottom: "1px solid oklch(0.22 0.015 265)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #F0C040)` }}
          >
            <BookOpen size={16} className="text-black" aria-hidden="true" />
          </div>
          <span className="font-black text-sm" style={{ color: "#F0C040" }}>
            קורס NLP Practitioner
          </span>
        </div>
        <Link href="/">
          <a
            className="flex items-center gap-1 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg"
            style={{ color: "oklch(0.75 0.01 265)", background: "oklch(0.18 0.015 265)" }}
          >
            <ArrowRight size={14} aria-hidden="true" />
            חזרה לקורס
          </a>
        </Link>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: "oklch(0.93 0.01 280)", color: PRIMARY }}
          >
            <Eye size={15} aria-hidden="true" />
            נגישות
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: "oklch(0.15 0.01 250)" }}>
            הצהרת נגישות
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.50 0.01 250)" }}>
            קורס NLP Practitioner | עודכן לאחרונה: {year}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">

          <Section number="1" title="מחויבות לנגישות">
            <p>
              אתר קורס <strong>NLP Practitioner</strong> של מאיר שמעון עשור שואף להיות נגיש לכלל המשתמשים,
              לרבות אנשים עם מוגבלויות. אנו פועלים בהתאם לתקן הישראלי{" "}
              <strong>ת"י 5568</strong> ולהנחיות הנגישות לתכני אינטרנט{" "}
              <strong>WCAG 2.1 ברמה AA</strong>.
            </p>
          </Section>

          <Section number="2" title="פעולות נגישות שבוצעו">
            <ul className="space-y-2 list-none">
              {[
                "האתר מוצג בכיוון קריאה מימין לשמאל (RTL) בהתאם לשפה העברית",
                "כל התמונות כוללות טקסט חלופי (alt text) המתאר את תוכן התמונה",
                "כפתורים ואלמנטים אינטראקטיביים כוללים תוויות ARIA לנגישות",
                "קיים קישור 'דלג לתוכן הראשי' בראש כל עמוד לניווט מהיר",
                "ניגודיות הצבעים עומדת בדרישות WCAG AA (יחס ניגודיות 4.5:1 לפחות)",
                "ניתן לנווט באתר באמצעות מקלדת בלבד",
                "גופן הטקסט ניתן להגדלה עד 200% ללא אובדן תוכן",
                "נגן הקריינות מאפשר בחירת שפה ומגדר קול להתאמה אישית",
                "ממשק הקורס תומך בקוראי מסך (screen readers)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: PRIMARY }}
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section number="3" title="תכונות נגישות בנגן הקריינות">
            <p className="mb-3">
              נגן הקריינות של הקורס כולל מספר תכונות נגישות ייחודיות:
            </p>
            <ul className="space-y-2 list-none">
              {[
                "הדגשת משפט בצהוב עדין בזמן הקראה — מסייע לעוקבים אחר הטקסט",
                "בחירת שפת קריינות: עברית, אנגלית, ערבית, רוסית, צרפתית, ספרדית",
                "בחירת מגדר קול: גבר, אישה, או כלשהו",
                "שליטה על מהירות הקראה: 0.75x עד 1.5x",
                "כפתור השתקה מהיר",
                "ניווט בין שקופיות בלחיצת כפתור",
                "הורדת תוכן השיעור כקובץ טקסט",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: GOLD }}
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section number="4" title="מגבלות ידועות">
            <p className="mb-3">
              למרות מאמצינו, ייתכנו מגבלות נגישות מסוימות:
            </p>
            <ul className="space-y-2 list-none">
              {[
                "זמינות קולות הקריינות תלויה במערכת ההפעלה ובדפדפן של המשתמש",
                "חלק מהאנימציות עשויות להפריע למשתמשים הרגישים לתנועה — מומלץ להפעיל את הגדרת 'הפחת תנועה' במערכת ההפעלה",
                "תכני וידאו חיצוניים (אם ישנם) עשויים לא לכלול כתוביות",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 text-base" aria-hidden="true">⚠️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section number="5" title="יצירת קשר בנושא נגישות">
            <p className="mb-4">
              נתקלתם בבעיית נגישות? אנו מזמינים אתכם לפנות אלינו ונשתדל לטפל בפנייה בהקדם האפשרי:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail size={15} style={{ color: PRIMARY }} aria-hidden="true" />
                <a
                  href="mailto:meir@ynrcollege.org"
                  className="font-medium hover:underline"
                  style={{ color: PRIMARY }}
                >
                  meir@ynrcollege.org
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} style={{ color: PRIMARY }} aria-hidden="true" />
                <a
                  href="https://wa.me/972542111288"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                  style={{ color: PRIMARY }}
                >
                  WhatsApp: 054-2111288
                </a>
              </div>
            </div>
            <p className="mt-4 text-xs" style={{ color: "oklch(0.50 0.01 250)" }}>
              זמן מענה מקסימלי: 5 ימי עסקים
            </p>
          </Section>

          <Section number="6" title="תאריך עדכון ההצהרה">
            <p>
              הצהרת נגישות זו עודכנה לאחרונה ב-{year}. אנו בוחנים ומעדכנים את הצהרת הנגישות
              לפחות אחת לשנה, ובעקבות כל שינוי מהותי באתר.
            </p>
          </Section>

        </div>

        {/* Bottom note */}
        <div
          className="mt-12 p-4 rounded-xl text-center text-xs"
          style={{ background: "oklch(0.93 0.01 280)", color: "oklch(0.45 0.01 250)" }}
        >
          <Eye size={14} className="inline ml-1" aria-hidden="true" />
          אתר זה פועל בהתאם לתקן הישראלי ת"י 5568 ולהנחיות WCAG 2.1 AA
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-4 text-xs mt-8"
        style={{
          borderTop: "1px solid oklch(0.90 0.005 250)",
          color: "oklch(0.55 0.01 250)",
          background: "oklch(0.97 0.002 250)",
        }}
      >
        © {year} כל הזכויות שמורות למאיר שמעון עשור | קורס NLP Practitioner
      </footer>
    </div>
  );
}

// Helper component for each section
function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "white",
        border: "1px solid oklch(0.90 0.005 250)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ background: "oklch(0.93 0.01 280)", color: PRIMARY }}
          aria-hidden="true"
        >
          {number}
        </div>
        <h2 className="text-base font-black" style={{ color: "oklch(0.18 0.01 250)" }}>
          {title}
        </h2>
      </div>
      <div className="text-sm leading-relaxed" style={{ color: "oklch(0.35 0.01 250)" }}>
        {children}
      </div>
    </div>
  );
}
