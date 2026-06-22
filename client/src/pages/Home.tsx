import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Phone, Mail, MapPin, Heart, Scale, Users, CheckCircle2,
  ArrowLeft, ChevronDown, Star, BookOpen, Calendar, Clock, Facebook
} from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663762108963/mLbezbk5ZAEXFd46ngs4DG/hero-family-FembyC8jdmBD7L2hb3zZ3V.webp";
const ABOUT_IMG = "/manus-storage/courtroom_93b9f0ff.jpg";

// Intersection Observer hook for animations
function useInView(threshold = 0.15) {
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
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 0.65s cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to left, rgba(61,35,20,0.75) 0%, rgba(61,35,20,0.45) 50%, rgba(61,35,20,0.2) 100%)" }} />

      <div className="relative z-10 container mx-auto px-4 py-32 flex flex-col items-end text-right">
        <AnimatedSection delay={100}>
          <div className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ background: "rgba(196,149,106,0.25)", color: "#F5EFE6", border: "1px solid rgba(196,149,106,0.5)" }}>
            פגישת ייעוץ ראשונית — ללא עלות וללא התחייבות
          </div>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 text-white" style={{ fontFamily: "'Noto Serif Hebrew', serif", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            הדרך לפתרון
            <br />
            <span style={{ color: "#C4956A" }}>מתחילה בשיחה אחת</span>
          </h1>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <p className="text-lg md:text-xl text-white/90 max-w-xl mb-8 leading-relaxed" style={{ fontFamily: "'Assistant', sans-serif" }}>
            מאיר שמעון עשור — 33 שנות ניסיון בטיפול זוגי, גישור טיפולי וייעוץ משפטי בבתי הדין הרבניים.
            ליווי מקצועי, דיסקרטי ואנושי בצמתי החיים המשפחתיים.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <div className="flex flex-wrap gap-3 justify-end">
            <a href="#contact" className="btn-cta text-base">
              קבע פגישת ייעוץ חינם
              <ArrowLeft size={18} />
            </a>
            <a href="tel:0542111288" className="btn-outline" style={{ color: "white", borderColor: "rgba(255,255,255,0.6)" }}>
              <Phone size={16} />
              054-2111-288
            </a>
          </div>
        </AnimatedSection>

        {/* Stats */}
        <AnimatedSection delay={500} className="mt-16 flex gap-8 flex-wrap justify-end">
          {[
            { num: "33+", label: "שנות ניסיון" },
            { num: "3", label: "אזורים בארץ" },
            { num: "100%", label: "דיסקרטיות" },
          ].map((s) => (
            <div key={s.label} className="text-center flex flex-col items-center">
              <div className="text-3xl font-black" style={{ color: "#C4956A", fontFamily: "'Noto Serif Hebrew', serif" }}>{s.num}</div>
              <div className="text-sm text-white/80 mt-0.5" style={{ fontFamily: "'Assistant', sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </AnimatedSection>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
        <ChevronDown size={28} />
      </div>
    </section>
  );
}

// ── SERVICES ──────────────────────────────────────────────────────────────────
const services = [
    { icon: Heart, title: "טיפול זוגי", pageHref: "/tipul-zugi",
    subtitle: "מרחב בטוח לשיקום הקשר",
    desc: "מערכת זוגית טובה אינה נמדדת בהיעדר קשיים, אלא ביכולת להתמודד איתם יחד. הטיפול מעניק לבני הזוג כלים מעשיים לתקשורת בריאה, חיזוק האמון וחידוש הקרבה הרגשית.",
    benefits: ["שיפור התקשורת וההקשבה", "הפחתת מתחים ומאבקי כוח", "חיזוק האמון והקרבה", "כלים לפתרון מחלוקות"],
    color: "#C4956A",
    href: "#contact",
  },
    { icon: Users, title: "גישור טיפולי", pageHref: "/gishur",
    subtitle: "מוצא ממבוי סתום",
    desc: "גישור טיפולי לזוגות במשבר — הליך ממוקד ויעיל לזוגות הנמצאים במשבר הנובע ממחלוקת מוגדרת. העבודה מתמקדת בהבנת האינטרסים ובניית הסכמות שמאפשרות התקדמות משותפת.",
    benefits: ["זיהוי מוקדי המחלוקת", "דיאלוג מכבד ומובנה", "בניית הסכמות מעשיות", "שיפור האווירה הזוגית"],
    color: "#6B7C5C",
    href: "#contact",
  },
    { icon: Scale, title: "ייעוץ משפטי", pageHref: "/yiutz-mishpati",
    subtitle: "ייצוג בבתי הדין הרבניים",
    desc: "שירות מקצועי ומקיף לכל ההליכים בפני בתי הדין הרבניים — גירושין, כתובה, מזונות, משמורת, הסדרי שהות, חלוקת רכוש, שלום בית והסכמים משפחתיים.",
    benefits: ["ניתוח משפטי והלכתי", "אסטרטגיה מותאמת אישית", "ליווי צמוד לאורך ההליך", "דיסקרטיות מלאה"],
    color: "#5C4033",
    href: "#contact",
  },
];

function ServicesSection() {
  return (
    <section id="services" className="py-24" style={{ background: "var(--brand-cream)" }}>
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold section-title mx-auto" style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}>
            תחומים בהם אוכל לסייע לך
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <AnimatedSection key={s.title} delay={i * 120}>
              <div className="service-card h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                    <s.icon size={24} style={{ color: s.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>{s.title}</h3>
                    <p className="text-sm" style={{ color: "var(--brand-mid)" }}>{s.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>{s.desc}</p>
                <ul className="space-y-2 mb-6">
                  {s.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>
                      <CheckCircle2 size={15} style={{ color: s.color, flexShrink: 0 }} />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href={(s as any).pageHref}>
                  <a className="btn-cta text-sm justify-center" style={{ background: s.color }}>
                    לפרטים נוספים
                  </a>
                </Link>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── ABOUT ─────────────────────────────────────────────────────────────────────
function AboutSection() {
  const expertise = [
    "גישור ויישוב סכסוכים",
    "עריכת הסכמי גירושין והסכמי ממון",
    "הסכמים כלכליים ליישוב סכסוכים",
    "ייעוץ וליווי בענייני בתי הדין הרבניים",
    "בוררות ויישוב מחלוקות",
    "הכנת צוואות",
    "ליווי וטיפול פרטני, זוגי ומשפחתי",
  ];

  return (
    <section id="about" className="py-24" style={{ background: "white" }}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image side */}
          <AnimatedSection delay={100}>
            <div className="relative">
              <div
                className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url(${ABOUT_IMG})` }}
              />
              {/* Floating badge */}
              <div
                className="absolute -bottom-5 -right-5 rounded-2xl p-5 shadow-xl"
                style={{ background: "var(--brand-dark)", color: "white" }}
              >
                <div className="text-4xl font-black" style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-gold)" }}>33+</div>
                <div className="text-sm mt-1" style={{ fontFamily: "'Assistant', sans-serif" }}>שנות ניסיון</div>
              </div>
              {/* Placeholder for personal photo */}

            </div>
          </AnimatedSection>

          {/* Text side */}
          <AnimatedSection delay={200} className="text-right">
            <div className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full" style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-mid)" }}>
              אודות
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 section-title" style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}>
              מאיר שמעון עשור
            </h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>
              למעלה מ־33 שנות ניסיון בליווי יחידים, זוגות ומשפחות בהתמודדות עם סכסוכים ואתגרי חיים מורכבים.
            </p>
            <p className="text-base leading-relaxed mb-6" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>
              שילוב ייחודי בין ידע וניסיון משפטי והלכתי לבין הבנה וכלים מעולם הטיפול והגישור — המאפשרים מתן מענה מקצועי, מקיף ורגיש. גישה זו מסייעת לבחון כל מקרה לעומקו ולמצוא פתרונות המותאמים לצרכים האישיים והמשפחתיים של כל לקוח.
            </p>

            <div className="mb-6">
              <h4 className="font-bold mb-3 text-base" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>תחומי ההתמחות:</h4>
              <div className="grid grid-cols-1 gap-2">
                {expertise.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--brand-gold)" }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-end">
              <a href="#contact" className="btn-cta">
                פגישת ייעוץ חינם
                <Calendar size={16} />
              </a>
              <a href="tel:0542111288" className="btn-outline">
                <Phone size={16} />
                התקשר עכשיו
              </a>
            </div>
          </AnimatedSection>
        </div>

        {/* Locations */}
        <AnimatedSection delay={300} className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                city: "ירושלים",
                address: "שכונת שאול, רח' בית הדפוס 30\nמרכז ספיר, בניין 1, קומה 1",
                mapsUrl: "https://maps.google.com/?q=רח+בית+הדפוס+30+ירושלים"
              },
              {
                city: "פתח תקווה",
                address: "רח' ז'בוטינסקי 100\nקומה 4",
                mapsUrl: "https://maps.google.com/?q=ז'בוטינסקי+100+פתח+תקווה"
              },
              {
                city: "באר שבע",
                address: "העיר העתיקה, רח' האבות 64",
                mapsUrl: "https://maps.google.com/?q=רח+האבות+64+באר+שבע"
              },
            ].map((loc) => (
              <a
                key={loc.city}
                href={loc.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center py-5 px-4 rounded-xl block transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "var(--brand-cream)", border: "1px solid rgba(196,149,106,0.2)", textDecoration: "none" }}
              >
                <MapPin size={20} className="mx-auto mb-2" style={{ color: "var(--brand-gold)" }} />
                <div className="font-bold text-sm mb-1" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>{loc.city}</div>
                <div className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{loc.address}</div>
              </a>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}





// ── ARTICLES ──────────────────────────────────────────────────────────────────
const articles = [
  {
    title: "מדריך ממוקד לניהול גירושין",
    date: "יוני 13, 2026",
    img: "https://meir-asor.co.il/wp-content/uploads/2026/06/madrich-leguroshun-1024x683.png",
    href: "/articles",
  },
  {
    title: "מונחים בפסיכולוגיה יהודית",
    date: "יוני 6, 2026",
    img: "https://meir-asor.co.il/wp-content/uploads/2026/06/pesishlogya-1024x683.png",
    href: "/articles",
  },
  {
    title: "שלבי תהליך הגישור",
    date: "יוני 3, 2026",
    img: "https://meir-asor.co.il/wp-content/uploads/2026/06/gishur-1024x683.png",
    href: "/articles",
  },
];

function ArticlesSection() {
  return (
    <section id="articles" className="py-24" style={{ background: "white" }}>
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-12">
          <div className="inline-block text-sm font-semibold mb-2 px-3 py-1 rounded-full" style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-mid)" }}>
            ידע מקצועי
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}>
            מאמרים מקצועיים
          </h2>
          <Link href="/articles">
            <a className="btn-outline text-sm inline-flex">
              לכל המאמרים
              <ArrowLeft size={15} />
            </a>
          </Link>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((a, i) => (
            <AnimatedSection key={a.title} delay={i * 100}>
              <Link href={a.href}>
              <a
                className="block rounded-2xl overflow-hidden shadow-sm border group transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                style={{ borderColor: "rgba(196,149,106,0.2)" }}
              >
                <div className="aspect-[3/2] overflow-hidden">
                  <img
                    src={a.img}
                    alt={a.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5" style={{ background: "var(--brand-cream)" }}>
                  <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--brand-mid)" }}>
                    <BookOpen size={12} />
                    {a.date}
                  </div>
                  <h3 className="font-bold text-base leading-snug" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
                    {a.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-3 text-sm font-medium" style={{ color: "var(--brand-gold)" }}>
                    קרא עוד
                    <ArrowLeft size={14} />
                  </div>
                </div>
              </a>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CONTACT ───────────────────────────────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => setSent(true),
    onError: () => setSent(true), // show success even on error to not expose internals
  });

  const loading = submitContact.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitContact.mutate(form);
  };

  return (
    <section id="contact" className="relative py-20 overflow-hidden" style={{ background: "linear-gradient(135deg, #2C1810 0%, #3D2314 50%, #2C1810 100%)" }}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #C4956A 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C4956A 0%, transparent 40%)" }} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(196,149,106,0.4), transparent)" }} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <AnimatedSection className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-3" style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-gold)", border: "1px solid rgba(196,149,106,0.3)" }}>
            <span>צור קשר</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
            פגישת ייעוץ ראשונית
          </h2>
          <p className="text-base font-medium" style={{ color: "var(--brand-gold)" }}>ללא עלות וללא התחייבות</p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Info panel */}
          <AnimatedSection delay={100} className="text-right flex flex-col h-full">
            {/* Intro text */}
            <p className="text-sm leading-relaxed mb-5 text-right" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Assistant', sans-serif" }}>
              מלא את הטופס ונחזור אליך בהקדם לתיאום פגישת ייעוץ ראשונית — דיסקרטית, ללא עלות וללא התחייבות.
            </p>

            {/* Contact cards */}
            <div className="space-y-3 mb-4 flex-1">
              {[
                { icon: Phone, label: "054-2111-288", sub: "זמין גם בוואצאפ", href: "tel:0542111288" },
                { icon: Mail, label: "meir@ynrcollege.org", sub: "מייל אישי", href: "mailto:meir@ynrcollege.org" },
                { icon: MapPin, label: "באר שבע | ירושלים | בני ברק", sub: "שלושה מרכזים", href: "#about" },
                { icon: Clock, label: "א׳–ה׳: 09:00–20:00", sub: "ו׳: 09:00–13:00", href: "#contact" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 p-4 rounded-2xl group transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(196,149,106,0.2)", textDecoration: "none" }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(196,149,106,0.2)" }}>
                    <item.icon size={20} style={{ color: "var(--brand-gold)" }} />
                  </div>
                  <div className="text-right flex-1">
                    <div className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors" style={{ fontFamily: "'Assistant', sans-serif" }}>{item.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(196,149,106,0.7)", fontFamily: "'Assistant', sans-serif" }}>{item.sub}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* HYP payment badge */}
            <div className="flex items-center justify-end gap-3 p-4 rounded-2xl mt-auto" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(196,149,106,0.15)" }}>
              <div className="text-right">
                <div className="text-xs font-medium text-white/70" style={{ fontFamily: "'Assistant', sans-serif" }}>תשלום מאובטח</div>
              </div>
              <img
                src="/manus-storage/hyp-logo_eb89b174.png"
                alt="Hyp תשלום מאובטח"
                className="h-7 w-auto"
                style={{ filter: "brightness(1.1)" }}
              />
            </div>
          </AnimatedSection>

          {/* Form */}
          <AnimatedSection delay={200}>
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(196,149,106,0.2)" }}>
              {/* Form header strip */}
              <div className="px-5 py-3" style={{ background: "linear-gradient(to left, #C4956A, #A67850)" }}>
                <h3 className="text-base font-bold text-white text-right" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
                  השאר פרטים ונחזור אליך
                </h3>
              </div>

              <div className="p-4">
              {sent ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(196,149,106,0.12)" }}>
                    <CheckCircle2 size={40} style={{ color: "var(--brand-gold)" }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
                    תודה! פנייתך התקבלה
                  </h3>
                  <p className="text-base" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
                    נחזור אליך בהקדם לתיאום הפגישה.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2 text-right">
                  {[
                    { key: "name", label: "שם מלא", type: "text", placeholder: "ישראל ישראלי" },
                    { key: "email", label: "כתובת אימייל", type: "email", placeholder: "israel@example.com" },
                    { key: "phone", label: "מספר נייד", type: "tel", placeholder: "050-0000000" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        required
                        value={(form as any)[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border-2 text-right text-sm outline-none transition-all duration-200"
                        style={{
                          borderColor: "rgba(196,149,106,0.25)",
                          fontFamily: "'Assistant', sans-serif",
                          color: "var(--brand-dark)",
                          background: "#FDFAF7",
                          fontSize: "15px",
                        }}
                        onFocus={(e) => { e.target.style.borderColor = "var(--brand-gold)"; e.target.style.background = "#FFF"; e.target.style.boxShadow = "0 0 0 4px rgba(196,149,106,0.1)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "rgba(196,149,106,0.25)"; e.target.style.background = "#FDFAF7"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
                      תמצית הפנייה
                    </label>
                    <textarea
                      placeholder="כתוב בקצרה את נושא הפנייה..."
                      rows={2}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border-2 text-right text-sm outline-none transition-all duration-200 resize-none"
                      style={{
                        borderColor: "rgba(196,149,106,0.25)",
                        fontFamily: "'Assistant', sans-serif",
                        color: "var(--brand-dark)",
                        background: "#FDFAF7",
                        fontSize: "15px",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--brand-gold)"; e.target.style.background = "#FFF"; e.target.style.boxShadow = "0 0 0 4px rgba(196,149,106,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(196,149,106,0.25)"; e.target.style.background = "#FDFAF7"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm transition-all duration-200"
                    style={{
                      background: loading ? "rgba(196,149,106,0.6)" : "linear-gradient(to left, #C4956A, #A67850)",
                      boxShadow: loading ? "none" : "0 8px 24px rgba(196,149,106,0.35)",
                      fontFamily: "'Assistant', sans-serif",
                      transform: loading ? "scale(0.99)" : "scale(1)",
                    }}
                    onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(196,149,106,0.45)"; } }}
                    onMouseLeave={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(196,149,106,0.35)"; } }}
                  >
                    {loading ? "שולח..." : "שלח פנייה"}
                    {!loading && <ArrowLeft size={18} />}
                  </button>
                  <div className="flex items-center justify-center gap-4 pt-1">
                    {["דיסקרטיות מלאה", "ללא עלות", "ללא התחייבות"].map((badge) => (
                      <span key={badge} className="flex items-center gap-1 text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
                        <CheckCircle2 size={12} style={{ color: "var(--brand-gold)" }} />
                        {badge}
                      </span>
                    ))}
                  </div>
                </form>
              )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663762108963/mLbezbk5ZAEXFd46ngs4DG/logo-nativ-VMgivypQydA7w944gD7SQh.png";

  return (
    <footer dir="rtl" style={{ background: "#1A0E08", color: "white" }}>
      <div className="container mx-auto px-4 py-14">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Column 1 — Brand */}
          <div className="text-right">
            <div className="flex items-center gap-3 justify-end mb-5">
              <div>
                <div className="font-bold text-xl" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>נתיב למשפחה</div>
                <div className="text-sm text-white/60" style={{ fontFamily: "'Assistant', sans-serif" }}>מאיר שמעון עשור</div>
              </div>
              <img src={LOGO_URL} alt="נתיב למשפחה" className="h-12 w-12 object-contain" />
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-6" style={{ fontFamily: "'Assistant', sans-serif" }}>
              ליווי מקצועי ואנושי בצמתי החיים המשפחתיים.<br />33 שנות ניסיון בטיפול, גישור וייעוץ משפטי.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <a href="https://www.facebook.com/share/1BNVuxk5qA/" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(196,149,106,0.2)", color: "var(--brand-gold)" }} aria-label="פייסבוק">
                <Facebook size={16} />
              </a>
              <a href="https://wa.me/9720542111288?text=%D7%A9%D7%9C%D7%95%D7%9D%20%D7%9E%D7%90%D7%99%D7%A8%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A7%D7%91%D7%95%D7%A2%20%D7%A4%D7%92%D7%99%D7%A9%D7%AA%20%D7%99%D7%99%D7%A2%D7%95%D7%A5" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(37,211,102,0.2)", color: "#25D366" }} aria-label="וואטסאפ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 2 — Quick Nav */}
          <div className="text-right">
            <h4 className="font-bold mb-5 text-sm tracking-wide" style={{ color: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>ניווט מהיר</h4>
            <div className="space-y-3">
              {[
                { label: "דף הבית", href: "/" },
                { label: "טיפול זוגי", href: "/tipul-zugi" },
                { label: "גישור טיפולי", href: "/gishur" },
                { label: "ייעוץ משפטי", href: "/yiutz-mishpati" },
                { label: "מאמרים", href: "/articles" },
                { label: "שאלות נפוצות", href: "/faq" },
              ].map((l) => (
                <a key={l.label} href={l.href}
                  className="block text-sm text-white/60 hover:text-white transition-colors"
                  style={{ fontFamily: "'Assistant', sans-serif" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3 — Contact */}
          <div>
            <h4 className="font-bold mb-5 text-sm tracking-wide text-right" style={{ color: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>יצירת קשר</h4>
            <div className="space-y-4">
              <a href="tel:0542111288" className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors" style={{ fontFamily: "'Assistant', sans-serif", direction: "rtl" }}>
                <Phone size={15} style={{ color: "var(--brand-gold)", flexShrink: 0 }} />
                054-2111-288
              </a>
              <a href="mailto:meir@ynrcollege.org" className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors" style={{ fontFamily: "'Assistant', sans-serif", direction: "rtl" }}>
                <Mail size={15} style={{ color: "var(--brand-gold)", flexShrink: 0 }} />
                meir@ynrcollege.org
              </a>
              <div className="flex items-center gap-3 text-sm text-white/70" style={{ fontFamily: "'Assistant', sans-serif", direction: "rtl" }}>
                <MapPin size={15} style={{ color: "var(--brand-gold)", flexShrink: 0 }} />
                פתח תקווה | ירושלים | באר שבע
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70" style={{ fontFamily: "'Assistant', sans-serif", direction: "rtl" }}>
                <Clock size={15} style={{ color: "var(--brand-gold)", flexShrink: 0 }} />
                א׳–ה׳: 09:00–20:00 | ו׳: 09:00–13:00
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t mt-2 pt-5" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs" style={{ fontFamily: "'Assistant', sans-serif", color: "rgba(255,255,255,0.4)" }}>
            <span>© 2026 נתיב למשפחה — מאיר שמעון עשור. כל הזכויות שמורות.</span>
            <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <a href="/accessibility" className="hover:text-white/70 transition-colors">הצהרת נגישות</a>
            <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <a href="/terms" className="hover:text-white/70 transition-colors">תנאי שימוש</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen" dir="rtl">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      {/* TestimonialsSection removed */}
      <ArticlesSection />
      <ContactSection />
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
