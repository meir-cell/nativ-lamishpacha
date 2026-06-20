import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, ChevronDown } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663762108963/mLbezbk5ZAEXFd46ngs4DG/logo-nativ-VMgivypQydA7w944gD7SQh.png";

const serviceLinks = [
  { label: "טיפול זוגי", href: "/tipul-zugi" },
  { label: "גישור טיפולי", href: "/gishur" },
  { label: "ייעוץ משפטי", href: "/yiutz-mishpati" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [location] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isHome = location === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAnchor = (href: string) => {
    setMenuOpen(false);
    if (href.startsWith("/")) {
      window.location.href = href;
      return;
    }
    if (href.startsWith("#")) {
      if (!isHome) {
        window.location.href = "/" + href;
        return;
      }
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navTextColor = scrolled ? "var(--brand-dark)" : "var(--brand-dark)";

  // In inner pages, always show solid background
  const isSolid = !isHome || scrolled;

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
      style={{
        background: isSolid ? "white" : "transparent",
        boxShadow: isSolid ? "0 2px 20px rgba(92,64,51,0.08)" : "none",
        borderBottom: isSolid ? "1px solid rgba(196,149,106,0.15)" : "none",
      }}
    >
      <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-8">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center gap-2 group">
            <img src={LOGO_URL} alt="נתיב למשפחה" className="h-12 w-12 object-contain" />
            <div className="text-right">
              <div
                className="font-bold text-base leading-tight"
                style={{ fontFamily: "'Noto Serif Hebrew', serif", color: "var(--brand-dark)" }}
              >
                נתיב למשפחה
              </div>
              <div className="text-xs" style={{ color: "var(--brand-mid)" }}>
                מאיר שמעון עשור
              </div>
            </div>
          </a>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          {/* Home */}
          <Link href="/">
            <a
              className="text-sm font-medium transition-colors duration-200 hover:opacity-70"
              style={{ color: navTextColor, fontFamily: "'Assistant', sans-serif" }}
            >
              דף הבית
            </a>
          </Link>

          {/* Services dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:opacity-70"
              style={{ color: navTextColor, fontFamily: "'Assistant', sans-serif" }}
              onClick={() => setServicesOpen(!servicesOpen)}
            >
              <ChevronDown
                size={14}
                style={{
                  transform: servicesOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
              שירותים
            </button>
            {servicesOpen && (
              <div
                className="absolute top-full right-0 mt-2 rounded-xl shadow-xl overflow-hidden min-w-[160px]"
                style={{ background: "var(--brand-cream)", border: "1px solid rgba(196,149,106,0.2)" }}
              >
                {serviceLinks.map((s) => (
                  <Link key={s.href} href={s.href}>
                    <a
                      className="block px-5 py-3 text-sm font-medium hover:bg-amber-50 transition-colors text-right"
                      style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
                      onClick={() => setServicesOpen(false)}
                    >
                      {s.label}
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Anchor links */}
          {[
            { label: "אודות", href: "#about" },
            { label: "המלצות", href: "#testimonials" },
            { label: "מאמרים", href: "/articles", isPage: true },
            { label: "שאלות נפוצות", href: "/faq", isPage: true },
            { label: "צור קשר", href: "#contact" },
          ].map((link) => (
            <button
              key={link.href}
              onClick={() => handleAnchor(link.href)}
              className="text-sm font-medium transition-colors duration-200 hover:opacity-70"
              style={{ color: navTextColor, fontFamily: "'Assistant', sans-serif" }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* CTA phone */}
        <a
          href="tel:0542111288"
          className="hidden md:flex items-center gap-2 btn-cta text-sm py-2 px-4"
        >
          <Phone size={15} />
          054-2111-288
        </a>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: "var(--brand-dark)" }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden absolute top-full right-0 left-0 shadow-xl"
          style={{ background: "var(--brand-cream)" }}
        >
          <div className="container py-4 flex flex-col gap-1">
            <Link href="/">
              <a
                className="text-right py-3 px-4 rounded-lg text-base font-medium transition-colors hover:bg-amber-50"
                style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
                onClick={() => setMenuOpen(false)}
              >
                דף הבית
              </a>
            </Link>
            <div className="px-4 py-2 text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>
              שירותים
            </div>
            {serviceLinks.map((s) => (
              <Link key={s.href} href={s.href}>
                <a
                  className="text-right py-2.5 px-8 rounded-lg text-sm font-medium transition-colors hover:bg-amber-50"
                  style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
                  onClick={() => setMenuOpen(false)}
                >
                  {s.label}
                </a>
              </Link>
            ))}
            {[
              { label: "אודות", href: "#about" },
              { label: "המלצות", href: "#testimonials" },
              { label: "מאמרים", href: "#articles" },
              { label: "צור קשר", href: "#contact" },
            ].map((link) => (
              <button
                key={link.href}
                onClick={() => handleAnchor(link.href)}
                className="text-right py-3 px-4 rounded-lg text-base font-medium transition-colors hover:bg-amber-50"
                style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
              >
                {link.label}
              </button>
            ))}
            <a href="tel:0542111288" className="btn-cta mt-2 justify-center">
              <Phone size={16} />
              054-2111-288
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
