import { Users, CheckCircle2, ArrowLeft, Scale, Clock, FileText, Handshake } from "lucide-react";
import {
  ServicePage,
  AnimatedSection,
  ContactCTA,
  FAQ,
  TestimonialsStrip,
} from "@/components/ServiceLayout";
import { ListenButton } from "@/components/ListenButton";

const LISTEN_TEXT = "גישור טיפולי — מוצא ממבוי סתום בדרך מכובדת. גישור טיפולי מאפשר לפתור סכסוכים מורכבים — גירושין, חלוקת רכוש, מזונות ומשמורת — בדרך מהירה, זולה ומכבדת יותר מהליכים משפטיים מסורתיים. ההליך נמשך שבועות עד חודשים בלבד, לעומת שנים בבית משפט או בית דין. עלות הגישור נמוכה משמעותית מהוצאות משפטיות ממוצעות. במיוחד כשיש ילדים משותפים, הגישור מאפשר לשמור על שיתוף פעולה עתידי.";

const HERO_IMG =
  "/manus-storage/photo_1573497620053_76074ca7.jpg";

const advantages = [
  {
    icon: Clock,
    title: "מהיר יותר",
    desc: "הליך גישור נמשך שבועות עד חודשים, לעומת שנים בבית משפט או בית דין.",
  },
  {
    icon: Scale,
    title: "זול יותר",
    desc: "עלות הגישור נמוכה משמעותית מהוצאות משפטיות ממוצעות בהליכים מסורתיים.",
  },
  {
    icon: Handshake,
    title: "שומר על יחסים",
    desc: "במיוחד כשיש ילדים משותפים — הגישור מאפשר לשמור על שיתוף פעולה עתידי.",
  },
  {
    icon: FileText,
    title: "הסכם מחייב",
    desc: "ההסכם שנוצר בגישור ניתן לאישור בבית הדין ומקבל תוקף משפטי מלא.",
  },
];

const stages = [
  {
    num: "01",
    title: "פגישת מידע",
    desc: "הצגת תהליך הגישור, בדיקת התאמה והסכמה של שני הצדדים להתחיל.",
  },
  {
    num: "02",
    title: "מיפוי הסכסוך",
    desc: "כל צד מציג את עמדתו, צרכיו ואינטרסיו — בסביבה מכבדת ומוגנת.",
  },
  {
    num: "03",
    title: "דיון ומשא ומתן",
    desc: "בחינת אפשרויות יצירתיות לפתרון, עם ליווי מקצועי של המגשר.",
  },
  {
    num: "04",
    title: "גיבוש הסכם",
    desc: "עריכת הסכם מפורט ומאוזן שמשקף את רצון שני הצדדים.",
  },
  {
    num: "05",
    title: "אישור משפטי",
    desc: "הגשת ההסכם לאישור בית הדין הרבני לקבלת תוקף משפטי מחייב.",
  },
];

const topics = [
  "גירושין בהסכמה",
  "חלוקת רכוש ונכסים",
  "מזונות ילדים",
  "משמורת והסדרי שהות",
  "מזונות אישה",
  "כתובה",
  "סכסוכים עסקיים משפחתיים",
  "ירושות וצוואות",
];

const faqs = [
  {
    q: "מה ההבדל בין גישור לטיפול זוגי?",
    a: "טיפול זוגי מתמקד בריפוי הקשר הרגשי ושיפור התקשורת, ומתאים לזוגות שרוצים להמשיך יחד. גישור מתמקד בפתרון מחלוקת ספציפית ומוגדרת — כמו חלוקת רכוש, מזונות או משמורת — ומתאים גם לזוגות שהחליטו להיפרד.",
  },
  {
    q: "האם שני הצדדים חייבים להסכים לגישור?",
    a: "כן. גישור הוא הליך וולונטרי לחלוטין. שני הצדדים חייבים להסכים להשתתף. עם זאת, ניתן לשכנע צד מהסס על ידי הסבר היתרונות — חיסכון בזמן, כסף ועוגמת נפש.",
  },
  {
    q: "האם ניתן לבצע גישור גם כשיש עורכי דין?",
    a: "בהחלט. עורכי הדין יכולים להיות נוכחים בפגישות הגישור, לייעץ ללקוחותיהם ולבדוק את ההסכם לפני חתימה. הגישור והייצוג המשפטי משלימים זה את זה.",
  },
  {
    q: "כמה פגישות נדרשות בממוצע?",
    a: "מספר הפגישות תלוי במורכבות הסכסוך. גישורים פשוטים יכולים להסתיים ב-3–5 פגישות. גישורים מורכבים עם נושאים רבים עשויים לדרוש 8–12 פגישות.",
  },
  {
    q: "מה קורה אם לא מגיעים להסכמה?",
    a: "אם הגישור לא מצליח להגיע להסכמה מלאה, הצדדים יכולים לפנות לבית הדין הרבני. עם זאת, לעיתים קרובות גם גישור חלקי מצמצם משמעותית את הסוגיות שצריך לפתור בהליך משפטי.",
  },
];

const testimonials = [
  {
    text: "הצלחת בחכמתך וטוב ליבך לסיים את התיק שלנו במהירות ובצורה קלה יחסית, ועוד לפני פסח היינו אחרי הגט. ומעל זה שהכל בסוף התנהל בגישור ובהסכמה, ללא מריבות מיותרות.",
    name: "שמעון ב.",
    city: "באר שבע",
  },
  {
    text: "הגישור חסך לנו שנים של הליכים משפטיים ועשרות אלפי שקלים. מאיר ידע לנווט בין שני הצדדים בחכמה ובאמפתיה. הילדים שלנו הרוויחו הכי הרבה.",
    name: "ר.כ",
    city: "ירושלים",
  },
];

export default function Mediation() {
  return (
    <ServicePage>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, rgba(40,55,35,0.85) 0%, rgba(40,55,35,0.6) 60%, rgba(40,55,35,0.3) 100%)",
          }}
        />
        <div className="relative z-10 container mx-auto px-4 py-24 text-right">
          <AnimatedSection delay={100}>
            <a
              href="/#services"
              className="inline-flex items-center gap-2 text-sm mb-6 opacity-80 hover:opacity-100 transition-opacity"
              style={{ color: "#A8C5A0", fontFamily: "'Assistant', sans-serif" }}
            >
              <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
              חזרה לשירותים
            </a>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5"
              style={{
                background: "rgba(107,124,92,0.3)",
                color: "#D4EBC8",
                border: "1px solid rgba(107,124,92,0.5)",
              }}
            >
              <Users size={15} style={{ color: "#A8C5A0" }} />
              גישור טיפולי
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1
              className="text-4xl md:text-6xl font-black text-white leading-tight mb-5"
              style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
            >
              מוצא ממבוי סתום
              <br />
              <span style={{ color: "#A8C5A0" }}>בדרך מכובדת</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p
              className="text-lg text-white/85 max-w-xl leading-relaxed mb-8"
              style={{ fontFamily: "'Assistant', sans-serif" }}
            >
              גישור טיפולי מאפשר לפתור סכסוכים מורכבים — גירושין, חלוקת רכוש, מזונות ומשמורת —
              בדרך מהירה, זולה ומכבדת יותר מהליכים משפטיים מסורתיים.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={400}>
            <div className="flex flex-wrap gap-3 items-center">
              <a href="/#contact" className="btn-cta text-base" style={{ background: "#6B7C5C" }}>
                קבע פגישת ייעוץ חינם
              </a>
              <ListenButton text={LISTEN_TEXT} label="האזן לתוכן" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-20" style={{ background: "var(--brand-cream)" }}>
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <div
              className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(107,124,92,0.12)", color: "var(--brand-olive)" }}
            >
              יתרונות הגישור
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
            >
              למה לבחור בגישור?
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {advantages.map((a, i) => (
              <AnimatedSection key={a.title} delay={i * 80}>
                <div
                  className="service-card text-right h-full"
                  style={{ borderTop: "3px solid var(--brand-olive)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(107,124,92,0.12)" }}
                  >
                    <a.icon size={22} style={{ color: "var(--brand-olive)" }} />
                  </div>
                  <h3
                    className="font-bold text-base mb-2"
                    style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}
                  >
                    {a.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
                  >
                    {a.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-20" style={{ background: "white" }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <AnimatedSection delay={100} className="text-right">
              <div
                className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full"
                style={{ background: "rgba(107,124,92,0.12)", color: "var(--brand-olive)" }}
              >
                נושאי הגישור
              </div>
              <h2
                className="text-3xl font-bold mb-5"
                style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
              >
                במה אנחנו מגשרים?
              </h2>
              <p
                className="text-base leading-relaxed mb-6"
                style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
              >
                הגישור הטיפולי מתאים למגוון רחב של סכסוכים משפחתיים — מגירושין ועד סכסוכים
                עסקיים בין בני משפחה. בכל מקרה, המטרה היא הגעה להסכמה שמכבדת את שני הצדדים.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {topics.map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2 text-sm py-2 px-3 rounded-lg"
                    style={{
                      color: "#4A3728",
                      fontFamily: "'Assistant', sans-serif",
                      background: "var(--brand-cream)",
                    }}
                  >
                    <CheckCircle2 size={14} style={{ color: "var(--brand-olive)", flexShrink: 0 }} />
                    {t}
                  </div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <div
                className="rounded-2xl p-8 text-right"
                style={{ background: "var(--brand-dark)", color: "white" }}
              >
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-gold)" }}
                >
                  גישור לעומת בית דין
                </h3>
                {[
                  { label: "זמן ממוצע", gishur: "1–3 חודשים", court: "1–3 שנים" },
                  { label: "עלות", gishur: "נמוכה", court: "גבוהה מאוד" },
                  { label: "שליטה בתוצאה", gishur: "מלאה", court: "מוגבלת" },
                  { label: "פרטיות", gishur: "מלאה", court: "ציבורית" },
                  { label: "שמירה על יחסים", gishur: "כן", court: "לרוב לא" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-3 border-b text-sm"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Assistant', sans-serif" }}>
                      {row.court}
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "#A8C5A0", fontFamily: "'Assistant', sans-serif" }}
                    >
                      {row.gishur}
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: "white", fontFamily: "'Assistant', sans-serif" }}
                    >
                      {row.label}
                    </span>
                  </div>
                ))}
                <div
                  className="flex justify-between text-xs mt-2 pt-1"
                  style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Assistant', sans-serif" }}
                >
                  <span>בית דין רבני</span>
                  <span>גישור</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20" style={{ background: "var(--brand-light)" }}>
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-14">
            <div
              className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(107,124,92,0.12)", color: "var(--brand-olive)" }}
            >
              תהליך הגישור
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
            >
              שלבי התהליך
            </h2>
          </AnimatedSection>
          <div className="max-w-3xl mx-auto space-y-4">
            {stages.map((s, i) => (
              <AnimatedSection key={s.num} delay={i * 80}>
                <div
                  className="flex gap-5 items-start p-5 rounded-2xl"
                  style={{
                    background: "white",
                    border: "1px solid rgba(107,124,92,0.15)",
                    boxShadow: "0 2px 12px rgba(92,64,51,0.05)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{ background: "rgba(107,124,92,0.15)", color: "var(--brand-olive)" }}
                  >
                    {s.num}
                  </div>
                  <div className="text-right">
                    <h3
                      className="font-bold text-base mb-1"
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
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsStrip items={testimonials} />
      <FAQ items={faqs} />
      <ContactCTA title="מוכן להתחיל בגישור?" />
    </ServicePage>
  );
}
