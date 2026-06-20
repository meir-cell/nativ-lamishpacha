import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Phone, ArrowRight, CheckCircle2, Star, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsAppFloat";

// Intersection Observer hook for animations
export function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
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

// ── Shared Contact CTA Banner ─────────────────────────────────────────────────
export function ContactCTA({ title = "מוכן להתחיל?" }: { title?: string }) {
  return (
    <section className="py-20" style={{ background: "var(--brand-dark)" }}>
      <div className="container mx-auto px-4 text-center">
        <AnimatedSection>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Noto Serif Hebrew', serif" }}
          >
            {title}
          </h2>
          <p
            className="text-white/75 mb-8 max-w-xl mx-auto"
            style={{ fontFamily: "'Assistant', sans-serif" }}
          >
            פגישת ייעוץ ראשונית — ללא עלות וללא התחייבות. נשמח לענות על כל שאלה.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/#contact">
              <a className="btn-cta text-base">
                קבע פגישת ייעוץ חינם
                <ArrowRight size={18} />
              </a>
            </Link>
            <a
              href="tel:0542111288"
              className="btn-outline"
              style={{ color: "white", borderColor: "rgba(255,255,255,0.5)" }}
            >
              <Phone size={16} />
              054-2111-288
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ── Shared FAQ Accordion ──────────────────────────────────────────────────────
export function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-20" style={{ background: "var(--brand-cream)" }}>
      <div className="container mx-auto px-4 max-w-3xl">
        <AnimatedSection className="text-center mb-12">
          <div
            className="inline-block text-sm font-semibold mb-3 px-3 py-1 rounded-full"
            style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-mid)" }}
          >
            שאלות נפוצות
          </div>
          <h2
            className="text-3xl font-bold"
            style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
          >
            שאלות ותשובות
          </h2>
        </AnimatedSection>
        <div className="space-y-3">
          {items.map((item, i) => (
            <AnimatedSection key={i} delay={i * 60}>
              <div
                className="rounded-xl overflow-hidden border"
                style={{ borderColor: "rgba(196,149,106,0.2)", background: "white" }}
              >
                <button
                  className="w-full text-right px-6 py-4 flex items-center justify-between gap-4"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <ChevronDown
                    size={18}
                    style={{
                      color: "var(--brand-gold)",
                      transform: open === i ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="font-semibold text-base"
                    style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
                  >
                    {item.q}
                  </span>
                </button>
                {open === i && (
                  <div
                    className="px-6 pb-5 text-sm leading-relaxed text-right"
                    style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Shared Testimonials Strip ─────────────────────────────────────────────────
export function TestimonialsStrip({
  items,
}: {
  items: { text: string; name: string; city: string }[];
}) {
  return (
    <section className="py-20" style={{ background: "white" }}>
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-12">
          <h2
            className="text-3xl font-bold"
            style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
          >
            מה אומרים הלקוחות
          </h2>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {items.map((t, i) => (
            <AnimatedSection key={i} delay={i * 100}>
              <div className="testimonial-card h-full">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} fill="#C4956A" style={{ color: "#C4956A" }} />
                  ))}
                </div>
                <p
                  className="text-sm leading-relaxed mb-4"
                  style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}
                >
                  {t.text}
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
                    >
                      {t.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--brand-mid)" }}>
                      {t.city}
                    </div>
                  </div>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: "var(--brand-gold)" }}
                  >
                    {t.name[0]}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Service Page Wrapper ──────────────────────────────────────────────────────
export interface ServicePageProps {
  children: React.ReactNode;
}

export function ServicePage({ children }: ServicePageProps) {
  return (
    <div className="min-h-screen" dir="rtl">
      <Navbar />
      {children}
      <WhatsAppFloat />
    </div>
  );
}

export { CheckCircle2 };
