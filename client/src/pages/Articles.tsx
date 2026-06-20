import { useEffect, useRef, useState } from "react";
import { BookOpen, ArrowLeft, Search, Tag } from "lucide-react";
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

const categories = ["הכל", "טיפול זוגי", "גישור", "ייעוץ משפטי", "הורות", "גירושין"];

const articles = [
  {
    title: "הסכם ממון לפני נישואין — מה חשוב לדעת?",
    excerpt: "הסכם ממון הוא כלי משפטי חשוב שמגדיר את מעמד הרכוש של כל אחד מבני הזוג. מה כולל הסכם ממון, מתי כדאי לערוך אותו ואיך הוא מגן על שני הצדדים?",
    category: "ייעוץ משפטי",
    date: "מרץ 2024",
    img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80&fit=crop",
    href: "https://meir-asor.co.il/הסכם-ממון-לפני-נישואין/",
    readTime: "5 דקות קריאה",
  },
  {
    title: "טיפול זוגי — מתי הגיע הזמן לפנות לעזרה?",
    excerpt: "זוגות רבים ממתינים זמן רב מדי לפני שהם פונים לטיפול זוגי. כיצד לזהות את הסימנים המוקדמים שמצביעים על כך שהגיע הזמן לפנות לעזרה מקצועית?",
    category: "טיפול זוגי",
    date: "פברואר 2024",
    img: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&q=80&fit=crop",
    href: "https://meir-asor.co.il/טיפול-זוגי-מתי/",
    readTime: "4 דקות קריאה",
  },
  {
    title: "גישור בגירושין — חלופה לבית הדין",
    excerpt: "גישור בגירושין מאפשר לזוגות להגיע להסכמות בדרך מהירה, זולה ומכבדת יותר מהליכים משפטיים מסורתיים. מה היתרונות ואיך מתחילים?",
    category: "גישור",
    date: "ינואר 2024",
    img: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&q=80&fit=crop",
    href: "https://meir-asor.co.il/גישור-גירושין/",
    readTime: "6 דקות קריאה",
  },
  {
    title: "משמורת ילדים — מה אומר החוק?",
    excerpt: "סוגיית משמורת הילדים היא אחת הרגישות ביותר בהליכי גירושין. מה ההבדל בין משמורת פיזית למשמורת משפטית, ואיך בית הדין מחליט?",
    category: "גירושין",
    date: "דצמבר 2023",
    img: "https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=600&q=80&fit=crop",
    href: "https://meir-asor.co.il/משמורת-ילדים/",
    readTime: "7 דקות קריאה",
  },
  {
    title: "תקשורת בריאה בזוגיות — 5 כלים מעשיים",
    excerpt: "תקשורת היא הבסיס לכל קשר זוגי בריא. הנה 5 כלים מעשיים שתוכלו ליישם כבר היום כדי לשפר את התקשורת עם בן/בת הזוג שלכם.",
    category: "טיפול זוגי",
    date: "נובמבר 2023",
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80&fit=crop",
    href: "https://meir-asor.co.il/תקשורת-זוגית/",
    readTime: "5 דקות קריאה",
  },
  {
    title: "מזונות ילדים — כל מה שצריך לדעת",
    excerpt: "מזונות ילדים הם חובה הלכתית ומשפטית. כיצד מחשבים מזונות, מי משלם ומה קורה כשאחד הצדדים מסרב לשלם?",
    category: "ייעוץ משפטי",
    date: "אוקטובר 2023",
    img: "https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=600&q=80&fit=crop",
    href: "https://meir-asor.co.il/מזונות-ילדים/",
    readTime: "6 דקות קריאה",
  },
  {
    title: "גידול ילדים אחרי גירושין — איך לשמור על שגרה?",
    excerpt: "גירושין הם אתגר לכל המשפחה, ובמיוחד לילדים. כיצד לשמור על שגרה בריאה לילדים גם לאחר הפרידה, ומה עושים כשיש קונפליקטים בין ההורים?",
    category: "הורות",
    date: "ספטמבר 2023",
    img: "https://images.unsplash.com/photo-1484665754804-74b091211472?w=600&q=80&fit=crop",
    href: "https://meir-asor.co.il/גידול-ילדים-גירושין/",
    readTime: "5 דקות קריאה",
  },
  {
    title: "בית הדין הרבני — מדריך מקיף למתחילים",
    excerpt: "מה זה בית הדין הרבני, מה הסמכויות שלו, ואיך מתנהלים בו הליכים של גירושין, מזונות ומשמורת? מדריך מקיף לכל מי שנדרש להתמודד עם ההליכים.",
    category: "ייעוץ משפטי",
    date: "אוגוסט 2023",
    img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80&fit=crop",
    href: "https://meir-asor.co.il/בית-דין-רבני/",
    readTime: "8 דקות קריאה",
  },
];

export default function ArticlesPage() {
  const [activeCategory, setActiveCategory] = useState("הכל");
  const [search, setSearch] = useState("");

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === "הכל" || a.category === activeCategory;
    const matchSearch = a.title.includes(search) || a.excerpt.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "var(--brand-cream)" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="pt-32 pb-16 text-right"
        style={{ background: "var(--brand-dark)" }}
      >
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
              <BookOpen size={14} />
              מאמרים מקצועיים
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
              ידע שמחזק אתכם
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p className="text-white/75 max-w-xl leading-relaxed" style={{ fontFamily: "'Assistant', sans-serif" }}>
              מאמרים מקצועיים בנושאי טיפול זוגי, גישור, ייעוץ משפטי והורות — כדי שתגיעו מוכנים ומעצימים לכל שלב.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 sticky top-16 z-30 shadow-sm" style={{ background: "white", borderBottom: "1px solid rgba(196,149,106,0.15)" }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brand-mid)" }} />
              <input
                type="text"
                placeholder="חיפוש מאמרים..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  border: "1px solid rgba(196,149,106,0.3)",
                  fontFamily: "'Assistant', sans-serif",
                  color: "var(--brand-dark)",
                  background: "var(--brand-cream)",
                }}
              />
            </div>
            {/* Categories */}
            <div className="flex flex-wrap gap-2 justify-end">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: activeCategory === cat ? "var(--brand-gold)" : "var(--brand-cream)",
                    color: activeCategory === cat ? "white" : "var(--brand-dark)",
                    border: "1px solid rgba(196,149,106,0.3)",
                    fontFamily: "'Assistant', sans-serif",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Articles grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen size={40} className="mx-auto mb-4 opacity-30" style={{ color: "var(--brand-mid)" }} />
              <p style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>לא נמצאו מאמרים תואמים</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((a, i) => (
                <AnimatedSection key={a.title} delay={i * 60}>
                  <a
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                    style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)", boxShadow: "0 2px 12px rgba(92,64,51,0.06)" }}
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={a.img} alt={a.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-5 text-right">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(196,149,106,0.12)", color: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>
                          <Tag size={10} className="inline ml-1" />
                          {a.category}
                        </span>
                        <span className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{a.date}</span>
                      </div>
                      <h3 className="font-bold text-base leading-snug mb-2" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
                        {a.title}
                      </h3>
                      <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>
                        {a.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{a.readTime}</span>
                        <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--brand-gold)" }}>
                          קרא עוד
                          <ArrowLeft size={14} />
                        </div>
                      </div>
                    </div>
                  </a>
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: "var(--brand-dark)" }}>
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
              יש לך שאלה שלא מצאת תשובה?
            </h2>
            <p className="text-white/70 mb-6" style={{ fontFamily: "'Assistant', sans-serif" }}>
              פגישת ייעוץ ראשונית ללא עלות וללא התחייבות
            </p>
            <a href="/#contact" className="btn-cta">
              קבע פגישה עכשיו
              <ArrowLeft size={16} />
            </a>
          </AnimatedSection>
        </div>
      </section>

      <WhatsAppFloat />
    </div>
  );
}
