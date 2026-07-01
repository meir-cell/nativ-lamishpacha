import { useEffect, useRef, useState } from "react";
import { BookOpen, Download, FileText, ExternalLink, ChevronDown, Volume2, VolumeX, Pause, Play, Share2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsAppFloat";

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
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 0.6s cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

type Book = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  pages: number;
  category: string;
  pdfUrl: string;
  color: string;
  icon: string;
  img?: string;
};

const books: Book[] = [
  {
    id: 1,
    slug: "lihyot-metapel",
    title: "להיות מטפל",
    subtitle: "מחקר בתחום הייעוץ הנישואין והמשפחה",
    description: "תזה מחקרית מאת מאיר שמעון עשור M.A — עוסקת בהשפעת ההכשרה לייעוץ נישואין ומשפחה על איכות חיי המשפחה של היועץ עצמו. מחקר מעמיק המשלב פסיכולוגיה יהודית עם גישות טיפוליות מודרניות.",
    pages: 127,
    category: "מחקר אקדמי",
    pdfUrl: "/manus-storage/lihyot-metapel_45f65e02.pdf",
    img: "/manus-storage/book_lihyot_metapel_13cbbfc0.jpg",
    color: "#C4956A",
    icon: "📚",
  },
  {
    id: 2,
    slug: "lalecet-bedarkav",
    title: "ללכת בדרכיו ולדבוק בו",
    subtitle: "הליכה בדרכי ה' ודבקות",
    description: "ספר עיון המתמקד במצוות הליכה בדרכי ה' — מצווה אמצעית למטרה גדולה יותר. הספר מציג את הדרך לדבקות בהשם דרך לימוד, מעשה ואמונה, תוך שילוב מקורות מהתורה, הגמרא וספרי המוסר.",
    pages: 223,
    category: "פסיכולוגיה יהודית",
    pdfUrl: "/manus-storage/lalecet-bedarkav_8babebd3.pdf",
    img: "/manus-storage/book_lalecet_bedarkav_375f6007.jpg",
    color: "#6B7C5C",
    icon: "✡️",
  },
  {
    id: 3,
    slug: "mitzvas-haemuna",
    title: "מצוות האמונה בה'",
    subtitle: "יסודות האמונה היהודית",
    description: "ספר מקיף העוסק במצוות האמונה בה' — הבסיס לכל התורה כולה. הספר מקבץ ידע מספרים ומאמרים שונים העוסקים באמונה לאורך ההיסטוריה היהודית, ומציג אותו בצורה נגישה ומעמיקה.",
    pages: 177,
    category: "פסיכולוגיה יהודית",
    pdfUrl: "/manus-storage/mitzvas-haemuna_1bc4bfce.pdf",
    img: "/manus-storage/book_mitzvas_haemuna_6c447e51.jpg",
    color: "#5C4033",
    icon: "🕍",
  },
  {
    id: 4,
    slug: "sulam-aliya",
    title: "סולם עליה",
    subtitle: "לדבקות בה'",
    description: "קונטרס 'סולם עליה לדבקות בה'' — נערך ונכתב בסיעתא דשמיא על ידי מאיר שמעון עשור. הספר מציג מדרגות ושלבים בעבודת ה' ובדרך לדבקות, ומהווה מדריך מעשי לצמיחה רוחנית.",
    pages: 140,
    category: "פסיכולוגיה יהודית",
    pdfUrl: "/manus-storage/sulam-aliya_15e93018.pdf",
    img: "/manus-storage/book_sulam_aliya_1be44157.jpg",
    color: "#8B6914",
    icon: "🌿",
  },
  {
    id: 5,
    slug: "rabi-rafael-ashor",
    title: "קורות חייו של רבי רפאל יחיאל עשור זצ\"ל",
    subtitle: "זיכרון ועדות",
    description: "ספרון לזכרו של רבי רפאל יחיאל עשור זצוק\"ל (1939–1974), שנפטר בדמי ימיו. הספר יוצא כמהדורה ראשונה לעורר זיכרונות בקרב משפחתו ומכריו, ומציג את דמותו כאדם גדול בענקים, ירא שמים ואוהב תורה.",
    pages: 85,
    category: "הספרים שלי",
    pdfUrl: "/manus-storage/rabi-rafael-ashor_47aeace8.pdf",
    img: "/manus-storage/book_rabi_rafael_7f7765f2.jpg",
    color: "#4A3728",
    icon: "📖",
  },
  {
    id: 7,
    slug: "bati-legani",
    title: "מאמר באתי לגני",
    subtitle: "מהדורה מבוארת — האדמו\"ר הריי\"צ",
    description: "מאמר חסידי עמוק מאת רבי יוסף יצחק שניאורסון (האדמו\"ר הריי\"צ), בעריכה והוספת ביאורים מאת מאיר שמעון עשור. המאמר עוסק בפסוק \"באתי לגני אחותי כלה\" ומבאר את ירידת השכינה לתחתונים ואת עבודת ה' בעולם הגשמי. מהדורה מבוארת עם מילות קישור, הסברים ומקורות — להנגשת המאמר ללומד בן זמננו.",
    pages: 64,
    category: "חסידות",
    pdfUrl: "/manus-storage/bati_legani_1ab6e75d.pdf",
    img: "/manus-storage/bati_legani_garden_3d7cdee1.jpg",
    color: "#2E7D32",
    icon: "🌿",
  },
  {
    id: 6,
    slug: "shaar-hayira",
    title: "שער היראה והאהבה להשם",
    subtitle: "יסודות יראת שמים ואהבת ה'",
    description: "ספר יסוד לכל אדם המבקש להעמיק את אמונתו. מטרת הספר להקנות ידע בסיסי ומקיף ברכישת יראת שמים ואהבה להשם ולתורתו. הידע נאסף ממקורות מקובלים ומומלצים מהספרייה התורנית.",
    pages: 163,
    category: "פסיכולוגיה יהודית",
    pdfUrl: "/manus-storage/shaar-hayira-veahava_f2c91665.pdf",
    img: "/manus-storage/book_shaar_hayira_cecfeaf8.jpg",
    color: "#2C5F8A",
    icon: "🕯️",
  },
];

function useTTS(text: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const play = () => {
    if (!("speechSynthesis" in window)) return;
    stop();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "he-IL";
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const hebrewVoice = voices.find(v => v.lang.startsWith("he"));
    if (hebrewVoice) utterance.voice = hebrewVoice;
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  return { isPlaying, isPaused, play, pause, resume, stop };
}

function BookCard({ book, delay }: { book: Book; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const ttsText = `${book.title}. ${book.subtitle}. ${book.description}`;
  const tts = useTTS(ttsText);

  return (
    <AnimatedSection delay={delay}>
      <div
        className="relative rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300"
        style={{
          background: "white",
          boxShadow: hovered
            ? "0 20px 60px rgba(0,0,0,0.15)"
            : "0 4px 24px rgba(0,0,0,0.08)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Book cover area */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            background: book.img ? undefined : `linear-gradient(135deg, ${book.color}18 0%, ${book.color}30 100%)`,
            borderBottom: `3px solid ${book.color}40`,
            height: book.img ? "180px" : undefined,
            paddingTop: book.img ? 0 : "2.5rem",
            paddingBottom: book.img ? 0 : "2.5rem",
            paddingLeft: book.img ? 0 : "1.5rem",
            paddingRight: book.img ? 0 : "1.5rem",
          }}
        >
          {/* Decorative book spine */}
          <div
            className="absolute right-0 top-0 bottom-0 w-3 rounded-r-none z-10"
            style={{ background: book.color, opacity: 0.7 }}
          />
          {book.img ? (
            <>
              <img
                src={book.img}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${book.color}80 0%, transparent 60%)` }} />
              <div
                className="absolute bottom-3 right-5 inline-block text-xs font-semibold px-3 py-1 rounded-full z-10"
                style={{ background: "rgba(255,255,255,0.92)", color: book.color }}
              >
                {book.category}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-3">{book.icon}</div>
              <div
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: `${book.color}20`, color: book.color }}
              >
                {book.category}
              </div>
            </div>
          )}
          {/* Pages badge */}
          <div
            className="absolute top-3 left-3 flex items-center gap-1 text-xs px-2 py-1 rounded-full z-10"
            style={{ background: "rgba(255,255,255,0.9)", color: book.color }}
          >
            <FileText size={11} />
            <span>{book.pages} עמ'</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6" dir="rtl">
          <h3
            className="text-xl font-bold mb-1 leading-tight"
            style={{ color: "#2C1810", fontFamily: "'Noto Serif Hebrew', serif" }}
          >
            {book.title}
          </h3>
          <p className="text-sm font-medium mb-3" style={{ color: book.color }}>
            {book.subtitle}
          </p>
          <p
            className="text-sm leading-relaxed flex-1 mb-5"
            style={{ color: "#5A4030", fontFamily: "'Assistant', sans-serif" }}
          >
            {book.description}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <a
              href={book.pdfUrl}
              download
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex-1 justify-center"
              style={{
                background: book.color,
                color: "white",
                textDecoration: "none",
                boxShadow: `0 4px 12px ${book.color}40`,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <Download size={15} />
              הורד PDF
            </a>
            <a
              href={book.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: `${book.color}15`,
                color: book.color,
                border: `1px solid ${book.color}30`,
                textDecoration: "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `${book.color}25`)}
              onMouseLeave={e => (e.currentTarget.style.background = `${book.color}15`)}
            >
              <ExternalLink size={15} />
              קרא
            </a>
          </div>

          {/* Share buttons */}
          <div className="mt-3 flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${book.title} — ${book.subtitle}\n${book.description}\n\nלקריאה והורדה: ${window.location.origin}/books/${book.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold flex-1 justify-center transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: "#25D366", color: "white", textDecoration: "none" }}
              title="שתף בוואטסאפ"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              וואטסאפ
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/books/${book.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold flex-1 justify-center transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: "#1877F2", color: "white", textDecoration: "none" }}
              title="שתף בפייסבוק"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              פייסבוק
            </a>
          </div>

          {/* TTS Button */}
          {"speechSynthesis" in window && (
            <div className="mt-3 flex items-center gap-2">
              {!tts.isPlaying ? (
                <button
                  onClick={tts.play}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium w-full justify-center transition-all hover:scale-105 active:scale-95"
                  style={{ background: `${book.color}12`, color: book.color, border: `1px solid ${book.color}30` }}
                  title="האזן לתיאור הספר"
                >
                  <Volume2 size={15} />
                  <span style={{ fontFamily: "'Assistant', sans-serif" }}>האזן לתיאור</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={tts.isPaused ? tts.resume : tts.pause}
                    className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium flex-1 justify-center transition-all hover:scale-105 active:scale-95"
                    style={{ background: `${book.color}20`, color: book.color, border: `1px solid ${book.color}40` }}
                  >
                    {tts.isPaused ? <Play size={14} /> : <Pause size={14} />}
                    <span style={{ fontFamily: "'Assistant', sans-serif" }}>{tts.isPaused ? "המשך" : "השהה"}</span>
                  </button>
                  <button
                    onClick={tts.stop}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    style={{ background: `${book.color}10`, color: book.color }}
                    title="עצור"
                  >
                    <VolumeX size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default function Books() {
  return (
    <div className="min-h-screen" style={{ background: "var(--brand-cream, #FAF6F0)" }} dir="rtl">
      <Navbar />

      {/* Hero */}
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2C1810 0%, #4A2C1A 50%, #3D2010 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C4956A' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <AnimatedSection delay={100}>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ background: "rgba(196,149,106,0.2)", color: "#C4956A", border: "1px solid rgba(196,149,106,0.4)" }}
            >
              <BookOpen size={16} />
              ספרים דיגיטליים — להורדה חינם
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1
              className="text-4xl md:text-5xl font-black text-white mb-4"
              style={{ fontFamily: "'Noto Serif Hebrew', serif", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
            >
              הספרים שלי
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p
              className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "'Assistant', sans-serif" }}
            >
              שבעה ספרים ומחקרים שכתבתי לאורך השנים — בתחומי הפסיכולוגיה היהודית, הגישור, הייעוץ המשפחתי והאמונה.
              כולם זמינים להורדה חינם כקובץ PDF.
            </p>
          </AnimatedSection>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
            <ChevronDown size={24} />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div
        className="py-6 border-b"
        style={{ background: "white", borderColor: "rgba(196,149,106,0.2)" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { num: "7", label: "ספרים ומחקרים" },
              { num: "979", label: "עמודים בסך הכל" },
              { num: "100%", label: "חינם להורדה" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black" style={{ color: "#C4956A", fontFamily: "'Noto Serif Hebrew', serif" }}>{s.num}</div>
                <div className="text-sm" style={{ color: "#7A6050" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Books grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book, i) => (
              <BookCard key={book.id} book={book} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: "white" }}>
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <p className="text-lg mb-2" style={{ color: "#5A4030", fontFamily: "'Assistant', sans-serif" }}>
              יש לך שאלה על אחד הספרים?
            </p>
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "#2C1810", fontFamily: "'Noto Serif Hebrew', serif" }}
            >
              אשמח לשמוע ממך
            </h2>
            <a
              href="/#contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200"
              style={{ background: "#C4956A", textDecoration: "none", boxShadow: "0 4px 16px rgba(196,149,106,0.4)" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              צור קשר
            </a>
          </AnimatedSection>
        </div>
      </section>

      <WhatsAppFloat />
    </div>
  );
}
