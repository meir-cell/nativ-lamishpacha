import { useSEO } from "@/hooks/useSEO";
import { useEffect, useRef, useState } from "react";
import { HelpCircle, ArrowLeft, ChevronDown, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Link } from "wouter";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 0.6s cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function AccordionItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <AnimatedSection delay={index * 50}>
      <div
        className="rounded-2xl overflow-hidden mb-3 transition-all"
        style={{
          background: "white",
          border: open ? "1px solid rgba(196,149,106,0.4)" : "1px solid rgba(196,149,106,0.15)",
          boxShadow: open ? "0 4px 20px rgba(92,64,51,0.08)" : "0 2px 8px rgba(92,64,51,0.04)",
        }}
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-4 p-5 text-right"
        >
          <ChevronDown
            size={18}
            style={{
              color: "var(--brand-gold)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
              flexShrink: 0,
            }}
          />
          <span className="font-semibold text-base flex-1" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            {q}
          </span>
        </button>
        {open && (
          <div className="px-5 pb-5 text-right">
            <p className="text-sm leading-relaxed" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>
              {a}
            </p>
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}

const faqSections = [
  {
    title: "כללי",
    color: "var(--brand-gold)",
    items: [
      { q: "מה ההבדל בין טיפול זוגי, גישור וייעוץ משפטי?", a: "טיפול זוגי מתמקד בריפוי הקשר הרגשי ושיפור התקשורת — מתאים לזוגות שרוצים להמשיך יחד. גישור טיפולי מתמקד בפתרון מחלוקת ספציפית (כמו חלוקת רכוש, מזונות או משמורת) בדרך מוסכמת — מתאים גם לזוגות שהחליטו להיפרד. ייעוץ משפטי מספק ייצוג וליווי מקצועי בהליכים פורמליים בפני בית הדין הרבני." },
      { q: "האם הפגישה הראשונה בתשלום?", a: "לא. פגישת הייעוץ הראשונית היא ללא עלות וללא התחייבות. במהלכה נבין את המצב, נציג את האפשרויות ונדון בהמשך הדרך. רק לאחר שתחליטו להמשיך יחד נסדיר את התשלום." },
      { q: "האם הפגישות דיסקרטיות?", a: "בהחלט. כל המידע שמועבר בפגישות חסוי לחלוטין. אנחנו מחויבים לסודיות מקצועית מלאה ולא מעבירים מידע לאף גורם ללא הסכמתכם המפורשת." },
      { q: "האם ניתן לקבל שירות גם מרחוק (זום/טלפון)?", a: "כן. אנחנו מציעים פגישות גם בפלטפורמות וידאו (זום, וואטסאפ) וגם בטלפון — לנוחותכם ולפי הצורך. פגישות מרחוק יעילות לא פחות מפגישות פנים אל פנים." },
    ],
  },
  {
    title: "טיפול זוגי",
    color: "#C4956A",
    items: [
      { q: "כמה פגישות טיפול זוגי נדרשות בממוצע?", a: "בממוצע, תהליך טיפול זוגי נמשך בין 8 ל-16 פגישות. הפגישות מתקיימות אחת לשבוע או אחת לשבועיים, בהתאם לצורך ולקצב ההתקדמות. חלק מהזוגות מרגישים שיפור משמעותי כבר לאחר 4–5 פגישות." },
      { q: "האם שני בני הזוג חייבים להגיע יחד?", a: "ברוב המקרים כן — הטיפול הזוגי מתמקד בדינמיקה בין שני בני הזוג. עם זאת, לעיתים נתחיל עם פגישות אישיות לכל אחד בנפרד, ולאחר מכן נעבור לפגישות משותפות. אנחנו מתאימים את הפורמט לצורך הספציפי." },
      { q: "האם טיפול זוגי מתאים גם לזוגות שחושבים על גירושין?", a: "כן. טיפול זוגי יכול לעזור גם לזוגות שנמצאים בשלב של שקילת פרידה — לפעמים הטיפול מחדש את הקשר, ולפעמים הוא עוזר להיפרד בצורה בריאה ומכבדת יותר. בכל מקרה, הטיפול נותן כלים שמועילים לשני הצדדים." },
    ],
  },
  {
    title: "גישור",
    color: "#6B7C5C",
    items: [
      { q: "האם שני הצדדים חייבים להסכים לגישור?", a: "כן. גישור הוא הליך וולונטרי לחלוטין. שני הצדדים חייבים להסכים להשתתף. עם זאת, ניתן לשכנע צד מהסס על ידי הסבר היתרונות — חיסכון בזמן, כסף ועוגמת נפש." },
      { q: "כמה עולה גישור לעומת הליך בבית הדין?", a: "עלות הגישור נמוכה משמעותית מהוצאות הליך בבית הדין. הליך בבית הדין עלול לעלות עשרות אלפי שקלים ולהימשך שנים. גישור מתנהל בחודשים ספורים ועולה שבריר מהעלות. נדון בעלויות הספציפיות בפגישת הייעוץ הראשונית." },
      { q: "האם הסכם הגישור מחייב משפטית?", a: "כן. הסכם גישור שנחתם על ידי שני הצדדים ניתן להגשה לאישור בית הדין הרבני, ולאחר האישור הוא מקבל תוקף של פסק דין מחייב." },
    ],
  },
  {
    title: "ייעוץ משפטי",
    color: "#5C6490",
    items: [
      { q: "מה ההבדל בין עורך דין לבין יועץ בבית הדין הרבני?", a: "בבתי הדין הרבניים, הצדדים יכולים להיות מיוצגים על ידי 'טוען רבני' — מי שמוסמך לייצג בפני בית הדין. מאיר שמעון עשור הוא יועץ ומלווה מקצועי בעל ידע נרחב בדיני משפחה הלכתיים ומשפטיים, ומסייע ללקוחות לנווט את ההליכים בצורה מיטבית." },
      { q: "האם ניתן לקבל ייעוץ גם אם אני לא דתי?", a: "בהחלט. בית הדין הרבני הוא הגוף המוסמך לענייני נישואין וגירושין בישראל לכלל היהודים — דתיים וחילוניים כאחד. הייעוץ מותאם לכל לקוח ולמצבו הספציפי." },
      { q: "מה עושים כשהצד השני מסרב לגט?", a: "סרבנות גט היא אחת הסוגיות הקשות ביותר בדיני משפחה יהודיים. ישנם מספר כלים הלכתיים ומשפטיים להתמודד עם סרבנות — החל מלחץ בית דין ועד צווים שונים. נבחן את האפשרויות הרלוונטיות לתיק הספציפי שלך." },
      { q: "כמה זמן לוקח הליך גירושין בבית הדין הרבני?", a: "משך ההליך תלוי במורכבות התיק ובשיתוף הפעולה בין הצדדים. גירושין בהסכמה יכולים להסתיים תוך מספר חודשים. הליכים שנויים במחלוקת עלולים להימשך שנים. גישור יכול לקצר משמעותית את ההליך." },
    ],
  },
];

export default function FAQPage() {
  useSEO("faq");
  const [activeSection, setActiveSection] = useState("הכל");

  const displayed = activeSection === "הכל"
    ? faqSections
    : faqSections.filter((s) => s.title === activeSection);

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "var(--brand-cream)" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 text-right" style={{ background: "var(--brand-dark)" }}>
        <div className="container mx-auto px-4">
          <AnimatedSection delay={100}>
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-sm mb-6 opacity-70 hover:opacity-100 transition-opacity" style={{ color: "var(--brand-gold)" }}>
                <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
                חזרה לדף הבית
              </a>
            </Link>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: "rgba(196,149,106,0.2)", color: "var(--brand-gold)", border: "1px solid rgba(196,149,106,0.3)" }}>
              <HelpCircle size={14} />
              שאלות נפוצות
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
              תשובות לשאלות הנפוצות
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p className="text-white/75 max-w-xl leading-relaxed" style={{ fontFamily: "'Assistant', sans-serif" }}>
              כל מה שרצית לדעת על טיפול זוגי, גישור וייעוץ משפטי — במקום אחד.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="py-6 sticky top-16 z-30 shadow-sm" style={{ background: "white", borderBottom: "1px solid rgba(196,149,106,0.15)" }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-end">
            {["הכל", ...faqSections.map((s) => s.title)].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: activeSection === tab ? "var(--brand-gold)" : "var(--brand-cream)",
                  color: activeSection === tab ? "white" : "var(--brand-dark)",
                  border: "1px solid rgba(196,149,106,0.3)",
                  fontFamily: "'Assistant', sans-serif",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {displayed.map((section) => (
            <div key={section.title} className="mb-12">
              <AnimatedSection>
                <div className="flex items-center gap-3 mb-6 text-right">
                  <div className="h-0.5 flex-1" style={{ background: `${section.color}30` }} />
                  <h2 className="text-xl font-bold" style={{ color: section.color, fontFamily: "'Noto Serif Hebrew', serif" }}>
                    {section.title}
                  </h2>
                </div>
              </AnimatedSection>
              {section.items.map((item, i) => (
                <AccordionItem key={item.q} q={item.q} a={item.a} index={i} />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: "var(--brand-dark)" }}>
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
              לא מצאת תשובה לשאלה שלך?
            </h2>
            <p className="text-white/70 mb-6" style={{ fontFamily: "'Assistant', sans-serif" }}>
              צור קשר ישירות — פגישת ייעוץ ראשונית ללא עלות
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="tel:0542111288" className="btn-cta">
                <Phone size={16} />
                054-2111-288
              </a>
              <a href="/#contact" className="btn-cta" style={{ background: "transparent", border: "1px solid rgba(196,149,106,0.5)" }}>
                השאר פרטים
                <ArrowLeft size={16} />
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <WhatsAppFloat />
    </div>
  );
}
