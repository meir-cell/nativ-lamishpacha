import { Heart, CheckCircle2, ArrowLeft, Users, MessageCircle, Lightbulb, Shield } from "lucide-react";
import {
  ServicePage,
  AnimatedSection,
  ContactCTA,
  FAQ,
  TestimonialsStrip,
} from "@/components/ServiceLayout";
import { ListenButton } from "@/components/ListenButton";

const LISTEN_TEXT = "טיפול זוגי — מרחב בטוח לשיקום הקשר. כל זוג עובר משברים. השאלה אינה אם תהיו בקושי, אלא כיצד תצאו ממנו — יחד. הטיפול הזוגי מעניק לכם את הכלים, השפה והמרחב לעשות זאת. טיפול זוגי הוא תהליך מובנה ומקצועי שמסייע לשני בני הזוג להבין את הדינמיקה הפנימית של הקשר שלהם — את הדפוסים החוזרים, את הצרכים הלא-מדוברים ואת הכאבים הנסתרים. בניגוד לשיחה עם חברים או בני משפחה, הטיפול מתנהל בסביבה נייטרלית ומקצועית, שבה שני הצדדים מרגישים נשמעים ומוגנים. המטפל אינו שופט ואינו לוקח צד — הוא מנחה את הזוג לגלות יחד את הדרך קדימה.";

const HERO_IMG =
  "/manus-storage/photo_1516589178581_6397da3b.jpg";

const steps = [
  {
    num: "01",
    title: "פגישת היכרות",
    desc: "מפגש ראשוני ללא התחייבות שבו נכיר אחד את השני, נבין את הצרכים ונתאים את דרך הטיפול.",
  },
  {
    num: "02",
    title: "מיפוי הקשר",
    desc: "זיהוי דפוסי תקשורת, נקודות חוזק וצמתי קושי בקשר הזוגי — בצורה מכבדת ולא שיפוטית.",
  },
  {
    num: "03",
    title: "עבודה מעשית",
    desc: "כלים קונקרטיים לתקשורת בריאה, ניהול קונפליקטים וחיזוק הקשר הרגשי והפיזי.",
  },
  {
    num: "04",
    title: "שמירה ובנייה",
    desc: "פיתוח מיומנויות לטווח ארוך שיאפשרו לכם להתמודד עצמאית עם אתגרים עתידיים.",
  },
];

const topics = [
  { icon: MessageCircle, label: "קשיי תקשורת ומריבות חוזרות" },
  { icon: Shield, label: "שיקום אמון לאחר בגידה" },
  { icon: Heart, label: "ריחוק רגשי ואינטימיות" },
  { icon: Users, label: "הורות משותפת ומחלוקות על גידול ילדים" },
  { icon: Lightbulb, label: "משברי מעבר — לידה, פרישה, שכול" },
  { icon: CheckCircle2, label: "שיפור חיי המין והאינטימיות" },
  { icon: MessageCircle, label: "הסכמות כלכליות ומחלוקות כספיות" },
  { icon: Shield, label: "השפעת משפחות המוצא על הקשר" },
];

const faqs = [
  {
    q: "כמה זמן נמשך הטיפול הזוגי?",
    a: "משך הטיפול משתנה בהתאם למורכבות הקשר ולמטרות הזוג. בממוצע, זוגות רבים חווים שיפור משמעותי לאחר 8–16 פגישות. חלק מהזוגות ממשיכים לפגישות תחזוקה תקופתיות גם לאחר מכן.",
  },
  {
    q: "האם הטיפול מתאים גם לזוגות שחושבים על גירושין?",
    a: "כן. הטיפול הזוגי מתאים גם לזוגות שנמצאים בצומת קריטי ושוקלים פרידה. לעיתים הטיפול מסייע לחדש את הקשר, ולעיתים הוא מסייע לסיים את הקשר בצורה מכובדת ומיטיבה לשני הצדדים ולילדים.",
  },
  {
    q: "מה קורה אם רק אחד מאיתנו רוצה לבוא לטיפול?",
    a: "ניתן להתחיל בפגישות אישיות עם בן/בת הזוג המעוניין. לעיתים, לאחר שהצד המהסס רואה שינוי אמיתי, הוא מצטרף. ניתן גם לעבוד עם יחיד על דינמיקת הזוגיות.",
  },
  {
    q: "האם הפגישות דיסקרטיות?",
    a: "בהחלט. כל מה שנאמר בחדר הטיפול נשאר בחדר הטיפול. הדיסקרטיות היא ערך מרכזי בעבודתי ואני מחויב לה במלואה.",
  },
  {
    q: "האם ניתן לקבל טיפול מרחוק (זום)?",
    a: "כן, אני מציע פגישות גם בזום לזוגות שמתגוררים מחוץ לאזורי הפעילות שלי (באר שבע, ירושלים, בני ברק) או שמעדיפים את הנוחות של הבית.",
  },
];

const testimonials = [
  {
    text: "הגענו לטיפול אחרי שנים של ריחוק. מאיר הצליח ליצור מרחב בטוח שבו שנינו יכולנו לדבר בלי לפחד. היום הקשר שלנו חזק יותר מאי פעם.",
    name: "ד.ש",
    city: "ירושלים",
  },
  {
    text: "לא האמנו שאפשר לשנות דפוסים שנבנו במשך 15 שנה. הטיפול עם מאיר הוכיח לנו שאפשר. הכלים שקיבלנו ממשיכים לעבוד גם שנה אחרי סיום הטיפול.",
    name: "מ.ת",
    city: "באר שבע",
  },
];

export default function CoupleTherapy() {
  return (
    <ServicePage>
      {/* Hero */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, rgba(61,35,20,0.82) 0%, rgba(61,35,20,0.55) 60%, rgba(61,35,20,0.3) 100%)",
          }}
        />
        <div className="relative z-10 container mx-auto px-4 py-24 text-right">
          <AnimatedSection delay={100}>
            <a
              href="/#services"
              className="inline-flex items-center gap-2 text-sm mb-6 opacity-80 hover:opacity-100 transition-opacity"
              style={{ color: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}
            >
              <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
              חזרה לשירותים
            </a>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5"
              style={{
                background: "rgba(196,149,106,0.25)",
                color: "#F5EFE6",
                border: "1px solid rgba(196,149,106,0.5)",
              }}
            >
              <Heart size={15} style={{ color: "var(--brand-gold)" }} />
              טיפול זוגי
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1
              className="text-4xl md:text-6xl font-black text-white leading-tight mb-5"
              style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
            >
              מרחב בטוח
              <br />
              <span style={{ color: "#C4956A" }}>לשיקום הקשר</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p
              className="text-lg text-white/85 max-w-xl leading-relaxed mb-8"
              style={{ fontFamily: "'Assistant', sans-serif" }}
            >
              כל זוג עובר משברים. השאלה אינה אם תהיו בקושי, אלא כיצד תצאו ממנו — יחד.
              הטיפול הזוגי מעניק לכם את הכלים, השפה והמרחב לעשות זאת.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={400}>
            <div className="flex flex-wrap gap-3 items-center">
              <a href="/#contact" className="btn-cta text-base">
                קבע פגישת ייעוץ חינם
              </a>
              <ListenButton text={LISTEN_TEXT} label="האזן לתוכן" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* What is couple therapy */}
      <section className="py-20" style={{ background: "var(--brand-cream)" }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <AnimatedSection delay={100} className="text-right">
              <div
                className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full"
                style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-mid)" }}
              >
                מהו טיפול זוגי?
              </div>
              <h2
                className="text-3xl font-bold mb-5"
                style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
              >
                יותר מסתם שיחה
              </h2>
              <p
                className="text-base leading-relaxed mb-4"
                style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
              >
                טיפול זוגי הוא תהליך מובנה ומקצועי שמסייע לשני בני הזוג להבין את הדינמיקה
                הפנימית של הקשר שלהם — את הדפוסים החוזרים, את הצרכים הלא-מדוברים ואת
                הכאבים הנסתרים.
              </p>
              <p
                className="text-base leading-relaxed mb-4"
                style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
              >
                בניגוד לשיחה עם חברים או בני משפחה, הטיפול מתנהל בסביבה נייטרלית ומקצועית,
                שבה שני הצדדים מרגישים נשמעים ומוגנים. המטפל אינו שופט ואינו לוקח צד — הוא
                מנחה את הזוג לגלות יחד את הדרך קדימה.
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
              >
                הגישה המשולבת — טיפולית ומבוססת ערכים יהודיים — מאפשרת עבודה עמוקה שמכבדת
                את הזהות התרבותית והדתית של הזוג.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { num: "85%", label: "מהזוגות מדווחים על שיפור משמעותי" },
                  { num: "8–16", label: "פגישות בממוצע לשינוי אמיתי" },
                  { num: "33+", label: "שנות ניסיון בטיפול זוגי" },
                  { num: "100%", label: "דיסקרטיות מוחלטת" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl p-5 text-center"
                    style={{
                      background: "white",
                      border: "1px solid rgba(196,149,106,0.2)",
                      boxShadow: "0 2px 12px rgba(92,64,51,0.06)",
                    }}
                  >
                    <div
                      className="text-3xl font-black mb-1"
                      style={{ color: "var(--brand-gold)", fontFamily: "'Noto Serif Hebrew', serif" }}
                    >
                      {s.num}
                    </div>
                    <div
                      className="text-xs leading-snug"
                      style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Topics we treat */}
      <section className="py-20" style={{ background: "white" }}>
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <div
              className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-mid)" }}
            >
              נושאי הטיפול
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
            >
              במה אנחנו עוסקים?
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {topics.map((t, i) => (
              <AnimatedSection key={t.label} delay={i * 60}>
                <div
                  className="rounded-xl p-4 text-center flex flex-col items-center gap-3 h-full"
                  style={{
                    background: "var(--brand-cream)",
                    border: "1px solid rgba(196,149,106,0.18)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(196,149,106,0.15)" }}
                  >
                    <t.icon size={20} style={{ color: "var(--brand-gold)" }} />
                  </div>
                  <span
                    className="text-sm font-medium leading-snug"
                    style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
                  >
                    {t.label}
                  </span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20" style={{ background: "var(--brand-light)" }}>
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-14">
            <div
              className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-mid)" }}
            >
              תהליך הטיפול
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
            >
              איך זה עובד?
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <AnimatedSection key={s.num} delay={i * 100}>
                <div className="text-right relative">
                  <div
                    className="text-5xl font-black mb-3 opacity-15"
                    style={{ color: "var(--brand-gold)", fontFamily: "'Noto Serif Hebrew', serif" }}
                  >
                    {s.num}
                  </div>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
                  >
                    {s.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsStrip items={testimonials} />
      <FAQ items={faqs} />
      <ContactCTA title="מוכנים לצעד הראשון?" />
    </ServicePage>
  );
}
