import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import { Accessibility } from "lucide-react";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--brand-cream)" }} dir="rtl">
      <Navbar />
      <AccessibilityMenu />
      <WhatsAppFloat />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: "rgba(196,149,106,0.15)" }}
            >
              <Accessibility size={32} style={{ color: "var(--brand-mid)" }} />
            </div>
            <h1
              className="text-3xl md:text-4xl font-black mb-3"
              style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
            >
              הצהרת נגישות
            </h1>
            <p className="text-base" style={{ color: "#6B5040", fontFamily: "'Assistant', sans-serif" }}>
              עדכון אחרון: יוני 2026
            </p>
          </div>

          {/* Content */}
          <div
            className="rounded-2xl p-8 md:p-10 space-y-8"
            style={{ background: "white", boxShadow: "0 4px 24px rgba(61,35,20,0.08)" }}
          >
            <Section title="כללי">
              <p>
                אתר <strong>נתיב למשפחה</strong> (nativ-lamishpacha.com) מחויב לנגישות דיגיטלית ולאפשר לכלל המשתמשים,
                לרבות אנשים עם מוגבלות, לגלוש ולהשתמש בתכנים באתר בצורה נוחה ושוויונית.
              </p>
              <p>
                אנו פועלים לעמוד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
                התשע"ג–2013, ובהנחיות WCAG 2.1 ברמה AA.
              </p>
            </Section>

            <Section title="אמצעי הנגישות באתר">
              <ul className="space-y-2 list-disc list-inside">
                <li>תפריט נגישות צף בפינת המסך — מאפשר שינוי גודל גופן, ניגודיות גבוהה, קו תחת קישורים וגווני אפור</li>
                <li>האתר בנוי בעברית מלאה עם כיוון RTL תקני</li>
                <li>כל התמונות מלוות בטקסט חלופי (alt text)</li>
                <li>ניווט מקלדת — ניתן לנווט בין כל הרכיבים האינטראקטיביים באמצעות מקש Tab</li>
                <li>כפתורים וקישורים מלווים ב-aria-label מתאים לקוראי מסך</li>
                <li>ניגודיות צבעים עומדת בדרישות WCAG 2.1 AA</li>
                <li>הגופנים ניתנים להגדלה ללא שבירת הפריסה</li>
                <li>האתר תואם לדפדפנים מודרניים ולמכשירים ניידים</li>
              </ul>
            </Section>

            <Section title="רמת הנגישות">
              <p>
                האתר עומד ברמת נגישות <strong>AA</strong> בהתאם לתקן WCAG 2.1.
                אנו ממשיכים לשפר את הנגישות ולטפל בממצאים שמתגלים.
              </p>
            </Section>

            <Section title="מה לא נגיש">
              <p>
                ייתכן שחלק מהתכנים הישנים (קבצי PDF, תמונות ישנות) אינם עומדים בכל דרישות הנגישות.
                אנו עובדים על שיפורם באופן שוטף.
              </p>
            </Section>

            <Section title="פנייה בנושא נגישות">
              <p>
                נתקלתם בבעיית נגישות? נשמח לשמוע ולתקן.
              </p>
              <div className="mt-4 space-y-2">
                <p>
                  <strong>רכז נגישות:</strong> מאיר שמעון עשור
                </p>
                <p>
                  <strong>טלפון:</strong>{" "}
                  <a href="tel:0542111288" style={{ color: "var(--brand-mid)" }}>054-2111-288</a>
                </p>
                <p>
                  <strong>דוא"ל:</strong>{" "}
                  <a href="mailto:meir@ynrcollege.org" style={{ color: "var(--brand-mid)" }}>
                    meir@ynrcollege.org
                  </a>
                </p>
              </div>
              <p className="mt-4 text-sm" style={{ color: "#6B5040" }}>
                נשתדל לחזור אליכם תוך 5 ימי עסקים.
              </p>
            </Section>

            <Section title="בסיס חוקי">
              <p>
                הצהרה זו ניתנת בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח–1998,
                ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג–2013.
              </p>
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-xl font-bold mb-3 pb-2"
        style={{
          fontFamily: "'Noto Serif Hebrew', serif",
          color: "var(--brand-dark)",
          borderBottom: "2px solid rgba(196,149,106,0.3)",
        }}
      >
        {title}
      </h2>
      <div
        className="text-base leading-relaxed space-y-3"
        style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
      >
        {children}
      </div>
    </div>
  );
}
