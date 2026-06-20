import { Scale, CheckCircle2, ArrowLeft, BookOpen, Shield, FileText, Gavel } from "lucide-react";
import {
  ServicePage,
  AnimatedSection,
  ContactCTA,
  FAQ,
  TestimonialsStrip,
} from "@/components/ServiceLayout";

const HERO_IMG =
  "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1400&q=80&fit=crop";

const legalAreas = [
  {
    icon: Gavel,
    title: "גירושין וגט",
    items: [
      "ייצוג בהליכי גירושין בבית הדין הרבני",
      "הכנת כתב תביעה לגט",
      "ניהול משא ומתן לגירושין בהסכמה",
      "טיפול בסרבנות גט",
    ],
  },
  {
    icon: Scale,
    title: "מזונות ורכוש",
    items: [
      "תביעות מזונות ילדים ואישה",
      "חלוקת רכוש ונכסים משפחתיים",
      "הסכמי ממון לפני ובמהלך הנישואין",
      "כתובה ותביעות כתובה",
    ],
  },
  {
    icon: Shield,
    title: "ילדים ומשמורת",
    items: [
      "הסדרי משמורת ושהות",
      "ייצוג בסכסוכי הורות",
      "הכנת הסכמי הורות",
      "עניינים הנוגעים לחינוך הילדים",
    ],
  },
  {
    icon: FileText,
    title: "הסכמים ומסמכים",
    items: [
      "עריכת הסכמי גירושין",
      "הסכמי שלום בית",
      "הכנת צוואות",
      "הסכמים כלכליים ליישוב סכסוכים",
    ],
  },
];

const process = [
  {
    num: "01",
    title: "ייעוץ ראשוני",
    desc: "פגישת היכרות חינמית לניתוח המצב, הצגת האפשרויות ובניית אסטרטגיה ראשונית.",
  },
  {
    num: "02",
    title: "ניתוח משפטי-הלכתי",
    desc: "בחינה מעמיקה של הסוגיות המשפטיות וההלכתיות הרלוונטיות לתיק שלך.",
  },
  {
    num: "03",
    title: "בניית אסטרטגיה",
    desc: "תכנון מפורט של ההליך — בין אם גישור, משא ומתן או ייצוג בבית הדין.",
  },
  {
    num: "04",
    title: "ייצוג וליווי",
    desc: "ליווי צמוד לאורך כל שלבי ההליך, כולל הכנה לדיונים וייצוג בפני הדיינים.",
  },
  {
    num: "05",
    title: "סיום וביצוע",
    desc: "וידוא ביצוע ההסכם, קבלת הגט, רישום הסכמים ומעקב אחר יישום ההחלטות.",
  },
];

const faqs = [
  {
    q: "מה ההבדל בין עורך דין לבין יועץ בבית הדין הרבני?",
    a: "בבתי הדין הרבניים, הצדדים יכולים להיות מיוצגים על ידי 'טוען רבני' — מי שמוסמך לייצג בפני בית הדין. מאיר שמעון עשור הוא יועץ ומלווה מקצועי בעל ידע נרחב בדיני משפחה הלכתיים ומשפטיים, ומסייע ללקוחות לנווט את ההליכים בצורה מיטבית.",
  },
  {
    q: "כמה עולה ייעוץ ראשוני?",
    a: "פגישת הייעוץ הראשונית היא ללא עלות וללא התחייבות. במהלכה נבין את המצב, נציג את האפשרויות ונדון בעלויות הצפויות לפי מורכבות התיק.",
  },
  {
    q: "האם ניתן להגיע להסכמה מחוץ לבית הדין?",
    a: "כן, ורצוי. רוב הסכסוכים המשפחתיים ניתנים לפתרון בגישור או במשא ומתן ישיר, מה שחוסך זמן, כסף ועוגמת נפש. ההסכם שנוצר מוגש לאישור בית הדין ומקבל תוקף משפטי מחייב.",
  },
  {
    q: "מה עושים כשהצד השני מסרב לגט?",
    a: "סרבנות גט היא אחת הסוגיות הקשות ביותר בדיני משפחה יהודיים. ישנם מספר כלים הלכתיים ומשפטיים להתמודד עם סרבנות — החל מלחץ בית דין ועד צווים שונים. נבחן את האפשרויות הרלוונטיות לתיק הספציפי שלך.",
  },
  {
    q: "האם ניתן לקבל ייעוץ גם אם אני לא דתי?",
    a: "בהחלט. בית הדין הרבני הוא הגוף המוסמך לענייני נישואין וגירושין בישראל לכלל היהודים — דתיים וחילוניים כאחד. הייעוץ מותאם לכל לקוח ולמצבו הספציפי.",
  },
];

const testimonials = [
  {
    text: "מאיר עשור היקר, בשמי ובשם ילדי אני רוצה להודות מקרב לב על טיפולך המסור. בעת של טלטול רגשי, כלכלי ונפשי, שימשת לנו כעוגן וסייעת לנו תוך הסתכלות רחבה מחד וירידה לפרטי פרטים מאידך.",
    name: "מ.ת",
    city: "רמת גן",
  },
  {
    text: "עשית עבודה נפלאה שקודמך לא הצליחו. הצלחת לסיים את התיק שלנו בצורה מכובדת ומהירה, תוך שמירה על כבוד שני הצדדים.",
    name: "ד.א",
    city: "ירושלים",
  },
];

export default function LegalAdvice() {
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
              "linear-gradient(to left, rgba(30,35,55,0.88) 0%, rgba(30,35,55,0.62) 60%, rgba(30,35,55,0.3) 100%)",
          }}
        />
        <div className="relative z-10 container mx-auto px-4 py-24 text-right">
          <AnimatedSection delay={100}>
            <a
              href="/#services"
              className="inline-flex items-center gap-2 text-sm mb-6 opacity-80 hover:opacity-100 transition-opacity"
              style={{ color: "#9BA8C8", fontFamily: "'Assistant', sans-serif" }}
            >
              <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
              חזרה לשירותים
            </a>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5"
              style={{
                background: "rgba(92,100,140,0.3)",
                color: "#C8D0E8",
                border: "1px solid rgba(92,100,140,0.5)",
              }}
            >
              <Scale size={15} style={{ color: "#9BA8C8" }} />
              ייעוץ משפטי
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1
              className="text-4xl md:text-6xl font-black text-white leading-tight mb-5"
              style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
            >
              ייצוג מקצועי
              <br />
              <span style={{ color: "#9BA8C8" }}>בבתי הדין הרבניים</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p
              className="text-lg text-white/85 max-w-xl leading-relaxed mb-8"
              style={{ fontFamily: "'Assistant', sans-serif" }}
            >
              ידע משפטי והלכתי מעמיק, ניסיון של 28 שנה וגישה אישית — כדי שתוכל להתמודד
              עם ההליכים בבית הדין הרבני בביטחון ובשקט נפשי.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={400}>
            <a href="/#contact" className="btn-cta text-base" style={{ background: "#5C6490" }}>
              קבע ייעוץ ראשוני חינם
            </a>
          </AnimatedSection>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20" style={{ background: "var(--brand-cream)" }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <AnimatedSection className="text-center mb-12">
            <div
              className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(92,100,140,0.1)", color: "#5C6490" }}
            >
              הגישה שלנו
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
            >
              שילוב ייחודי של ידע ואנושיות
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "ידע הלכתי ומשפטי",
                desc: "שליטה מעמיקה הן בדיני המשפחה הישראליים והן בהלכה היהודית — שילוב נדיר שמאפשר ייצוג מיטבי בבתי הדין הרבניים.",
                color: "#5C6490",
              },
              {
                icon: Shield,
                title: "ליווי אישי ודיסקרטי",
                desc: "כל לקוח מקבל ליווי אישי צמוד. אנחנו לא מפנים אתכם לעוזרים — מאיר עצמו מלווה כל תיק מתחילתו ועד סופו.",
                color: "var(--brand-gold)",
              },
              {
                icon: Scale,
                title: "אסטרטגיה מותאמת",
                desc: "כל תיק שונה. אנחנו בונים אסטרטגיה ייחודית לכל לקוח, תוך שקילת כל האפשרויות — גישור, משא ומתן או ייצוג בבית הדין.",
                color: "var(--brand-olive)",
              },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className="service-card text-right h-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${item.color}18` }}
                  >
                    <item.icon size={24} style={{ color: item.color }} />
                  </div>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
                  >
                    {item.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Legal areas */}
      <section className="py-20" style={{ background: "white" }}>
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <div
              className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(92,100,140,0.1)", color: "#5C6490" }}
            >
              תחומי הפעילות
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
            >
              במה אנחנו מטפלים?
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {legalAreas.map((area, i) => (
              <AnimatedSection key={area.title} delay={i * 80}>
                <div
                  className="rounded-2xl p-6 h-full text-right"
                  style={{
                    background: "var(--brand-cream)",
                    border: "1px solid rgba(92,100,140,0.15)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(92,100,140,0.12)" }}
                    >
                      <area.icon size={20} style={{ color: "#5C6490" }} />
                    </div>
                    <h3
                      className="font-bold text-lg"
                      style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}
                    >
                      {area.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {area.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
                      >
                        <CheckCircle2 size={14} style={{ color: "#5C6490", flexShrink: 0 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
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
              style={{ background: "rgba(92,100,140,0.1)", color: "#5C6490" }}
            >
              תהליך העבודה
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
            >
              איך אנחנו עובדים?
            </h2>
          </AnimatedSection>
          <div className="relative max-w-3xl mx-auto">
            <div
              className="absolute right-5 top-0 bottom-0 w-0.5 hidden md:block"
              style={{ background: "rgba(92,100,140,0.15)" }}
            />
            <div className="space-y-6">
              {process.map((s, i) => (
                <AnimatedSection key={s.num} delay={i * 80}>
                  <div className="flex gap-5 items-start">
                    <div className="text-right flex-1 pr-8 md:pr-12">
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
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm relative z-10"
                      style={{ background: "#5C6490", color: "white" }}
                    >
                      {i + 1}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TestimonialsStrip items={testimonials} />
      <FAQ items={faqs} />
      <ContactCTA title="צריך ייעוץ משפטי?" />
    </ServicePage>
  );
}
