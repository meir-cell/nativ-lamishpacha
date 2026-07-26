// Terms of Service page for NLP Practitioner Course
import { Link } from "wouter";
import { ArrowRight, BookOpen, Shield, AlertCircle, Mail, Phone } from "lucide-react";

const PRIMARY = "oklch(0.52 0.18 280)";
const GOLD = "#C9A84C";

export default function Terms() {
  const year = new Date().getFullYear();

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      style={{ background: "oklch(0.97 0.002 250)", fontFamily: "'Heebo', sans-serif" }}
    >
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
            <BookOpen size={16} className="text-black" />
          </div>
          <span className="font-black text-sm" style={{ color: "#F0C040" }}>
            קורס NLP Practitioner
          </span>
        </div>
        <Link href="/nlp">
          <a
            className="flex items-center gap-1 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg"
            style={{ color: "oklch(0.75 0.01 265)", background: "oklch(0.18 0.015 265)" }}
          >
            <ArrowRight size={14} />
            חזרה לקורס
          </a>
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: "oklch(0.93 0.01 280)", color: PRIMARY }}
          >
            <Shield size={15} />
            מסמך משפטי
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: "oklch(0.15 0.01 250)" }}>
            תקנון ותנאי שימוש
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.50 0.01 250)" }}>
            קורס NLP Practitioner | עודכן לאחרונה: {year}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <Section number="1" title="כללי">
            <p>
              ברוכים הבאים לקורס NLP Practitioner המקוון (להלן: "הקורס" או "האתר"), המופעל על ידי{" "}
              <strong>מאיר שמעון עשור</strong> (להלן: "בעל הקורס"). השימוש בקורס מהווה הסכמה מלאה
              לתנאי תקנון זה. אם אינכם מסכימים לתנאים אלה, אנא הפסיקו את השימוש באתר.
            </p>
          </Section>

          <Section number="2" title="זכויות יוצרים וקניין רוחני">
            <p>
              כל התכנים המופיעים בקורס — לרבות טקסטים, מצגות, שיעורים, תרגילים, שאלוני הערכה,
              תמונות, עיצוב ומבנה האתר — הם רכושו הבלעדי של{" "}
              <strong>מאיר שמעון עשור</strong> ומוגנים בחוק זכויות יוצרים, התשס"ח-2007.
            </p>
            <p className="mt-3">
              © {year} כל הזכויות שמורות למאיר שמעון עשור.
            </p>
            <p className="mt-3">
              אין להעתיק, לשכפל, להפיץ, לפרסם, לשדר, לתרגם, לעבד, למכור או לעשות כל שימוש מסחרי
              בתכנים ללא אישור מפורש ובכתב מבעל הקורס.
            </p>
          </Section>

          <Section number="3" title="רישיון שימוש אישי">
            <p>
              בעל הקורס מעניק לכם רישיון מוגבל, אישי, בלתי-עביר ובלתי-בלעדי לגשת לתכני הקורס
              לצורך לימוד אישי בלבד. רישיון זה אינו כולל:
            </p>
            <ul className="mt-3 space-y-1.5 list-disc list-inside" style={{ color: "oklch(0.35 0.01 250)" }}>
              <li>הוראה, הדרכה או הפצה של התכנים לאחרים</li>
              <li>שימוש מסחרי כלשהו בתכנים</li>
              <li>יצירת תכנים נגזרים מבלי אישור</li>
              <li>שיתוף גישה לחשבון עם אחרים</li>
            </ul>
          </Section>

          <Section number="4" title="תוכן הקורס ואחריות">
            <p>
              תכני הקורס מיועדים למטרות חינוכיות ולפיתוח אישי בלבד. הם אינם מהווים ייעוץ
              פסיכולוגי, פסיכיאטרי, רפואי, משפטי או כל ייעוץ מקצועי אחר.
            </p>
            <p className="mt-3">
              בעל הקורס אינו אחראי לכל נזק, ישיר או עקיף, שייגרם כתוצאה מיישום הטכניקות
              הנלמדות. האחריות ליישום הכלים מוטלת על המשתמש בלבד.
            </p>
            <p className="mt-3">
              NLP הוא תחום שנוי במחלוקת מחקרית. התכנים מוצגים כמסגרת עבודה מעשית ואינם מוצגים
              כאמת מדעית מוחלטת.
            </p>
          </Section>

          <Section number="5" title="פרטיות ואבטחת מידע">
            <p>
              האתר עשוי לאסוף מידע בסיסי על השימוש לצורך שיפור חוויית הלמידה, כגון: שיעורים
              שהושלמו, ציוני חידונים ופעילות כללית באתר.
            </p>
            <p className="mt-3">
              המידע האישי שלכם לא יועבר לצדדים שלישיים ללא הסכמתכם, למעט כנדרש על פי דין.
            </p>
            <p className="mt-3">
              האתר משתמש ב-cookies לצורך שמירת מצב ההתחברות ושיפור חוויית המשתמש.
            </p>
          </Section>

          <Section number="6" title="מדיניות קבלה לקורסים">
            <p>
              ההרשמה לקורסים באתר פתוחה לכל אדם המעוניין ללמוד ולהתפתח, בכפוף לתנאים הבאים:
            </p>
            <ul className="mt-3 space-y-1.5 list-disc list-inside" style={{ color: "oklch(0.35 0.01 250)" }}>
              <li>המועמד בן 18 ומעלה (קטינים — באישור הורה או אפוטרופוס בלבד)</li>
              <li>המועמד מבין שתכני הקורס הם לצורך לימוד ופיתוח אישי ואינם מהווים תחליף לטיפול מקצועי</li>
              <li>המועמד מתחייב לשמור על כללי התנהגות נאותים בכל אינטראקציה עם צוות הקורס ומשתתפים אחרים</li>
              <li>המועמד מסכים לתנאי תקנון זה במלואם</li>
            </ul>
            <p className="mt-3">
              <strong>שמירת זכות סירוב:</strong> בעל הקורס שומר לעצמו את הזכות לסרב לקבל משתתף או
              להפסיק את השתתפותו בכל שלב, מכל סיבה שהיא, לרבות הפרת תנאי שימוש, התנהגות בלתי
              הולמת, או חשש לשימוש לרעה בתכנים.
            </p>
            <p className="mt-3">
              <strong>תנאים מוקדמים:</strong> חלק מהקורסים המתקדמים עשויים לדרוש השלמת קורסים
              קודמים או ניסיון מוכח בתחום. דרישות אלה יפורטו בדף הקורס הרלוונטי.
            </p>
            <p className="mt-3">
              <strong>ביטול הרשמה:</strong> במקרה של סירוב קבלה, המועמד יקבל החזר מלא של כל
              תשלום ששולם, תוך 14 ימי עסקים.
            </p>
          </Section>

          <Section number="7" title="הגבלת גיל">
            <p>
              הקורס מיועד למשתמשים בני 18 ומעלה. קטינים אינם רשאים להשתמש בשירות ללא אישור הורה
              או אפוטרופוס.
            </p>
          </Section>

          <Section number="8" title="שינויים בתקנון">
            <p>
              בעל הקורס שומר לעצמו את הזכות לשנות תקנון זה בכל עת. שינויים מהותיים יפורסמו
              באתר. המשך השימוש לאחר פרסום השינויים מהווה הסכמה לתנאים המעודכנים.
            </p>
          </Section>

          <Section number="9" title="דין וסמכות שיפוט">
            <p>
              תקנון זה כפוף לדיני מדינת ישראל. כל סכסוך הנובע מהשימוש בקורס יידון בבתי המשפט
              המוסמכים במחוז תל אביב-יפו, ישראל.
            </p>
          </Section>

          <Section number="10" title="יצירת קשר">
            <p>לשאלות, פניות ובירורים ניתן לפנות:</p>
            <div
              className="mt-3 flex items-center gap-3 p-4 rounded-xl"
              style={{ background: "oklch(0.93 0.01 280)", border: "1px solid oklch(0.82 0.05 280)" }}
            >
              <div className="flex flex-col gap-2">
                <p className="font-bold text-sm" style={{ color: "oklch(0.20 0.01 250)" }}>
                  מאיר שמעון עשור
                </p>
                <a
                  href="mailto:meir@ynrcollege.org"
                  className="text-sm flex items-center gap-1.5 hover:underline"
                  style={{ color: PRIMARY }}
                >
                  <Mail size={14} />
                  meir@ynrcollege.org
                </a>
                <a
                  href="https://wa.me/972542111288"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex items-center gap-1.5 hover:underline"
                  style={{ color: PRIMARY }}
                >
                  <Phone size={14} />
                  WhatsApp: 054-2111288
                </a>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer note */}
        <div
          className="mt-12 p-4 rounded-xl text-center text-xs"
          style={{ background: "oklch(0.93 0.01 280)", color: "oklch(0.45 0.01 250)" }}
        >
          <AlertCircle size={14} className="inline ml-1" />
          תקנון זה נכנס לתוקף עם כניסתכם לאתר הקורס. שימוש בקורס מהווה הסכמה לכל תנאיו.
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
