import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, ChevronDown, Settings } from "lucide-react";

const LOGO_URL = "/manus-storage/logo_nativ_630a6168.png";

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

  const navTextColor = "var(--brand-dark)";
  const linkStyle = { color: navTextColor, fontFamily: "'Assistant', sans-serif" };

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
      style={{
        background: "white",
        boxShadow: scrolled ? "0 2px 20px rgba(92,64,51,0.12)" : "0 1px 8px rgba(92,64,51,0.06)",
        borderBottom: "1px solid rgba(196,149,106,0.15)",
      }}
    >
      <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-8">
        {/* Logo */}
        <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }} className="flex items-center gap-2 group" style={{ cursor: 'pointer' }}>
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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}
            className="text-sm font-medium transition-colors duration-200 hover:opacity-70"
            style={{ ...linkStyle, cursor: 'pointer' }}
          >
            דף הבית
          </a>

          {/* Services dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:opacity-70"
              style={linkStyle}
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
                  <Link
                    key={s.href}
                    href={s.href}
                    className="block px-5 py-3 text-sm font-medium hover:bg-amber-50 transition-colors text-right"
                    style={linkStyle}
                    onClick={() => setServicesOpen(false)}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Anchor links */}
          {[
            { label: "אודות", href: "#about" },
            { label: "מאמרים", href: "/articles", isPage: true },
            { label: "הספרים שלי", href: "/books", isPage: true },
            { label: "שאלות נפוצות", href: "/faq", isPage: true },
            { label: "צור קשר", href: "#contact" },
          ].map((link) => (
            <button
              key={link.href}
              onClick={() => handleAnchor(link.href)}
              className="text-sm font-medium transition-colors duration-200 hover:opacity-70"
              style={linkStyle}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Admin button (desktop) */}
        <a
          href="/admin"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ color: "var(--brand-mid)", border: "1px solid rgba(196,149,106,0.25)", fontFamily: "'Assistant', sans-serif" }}
          title="כניסה לממשק ניהול"
        >
          <Settings size={13} />
          ניהול
        </a>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: "var(--brand-dark)" }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "סגור תפריט" : "פתח תפריט"}
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
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); setMenuOpen(false); window.location.href = '/'; }}
              className="text-right py-3 px-4 rounded-lg text-base font-medium transition-colors hover:bg-amber-50"
              style={{ ...linkStyle, cursor: 'pointer' }}
            >
              דף הבית
            </a>
            <div className="px-4 py-2 text-xs font-semibold" style={{ color: "var(--brand-mid)" }}>
              שירותים
            </div>
            {serviceLinks.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="text-right py-2.5 px-8 rounded-lg text-sm font-medium transition-colors hover:bg-amber-50"
                style={linkStyle}
                onClick={() => setMenuOpen(false)}
              >
                {s.label}
              </Link>
            ))}
            {[
              { label: "אודות", href: "#about" },
              { label: "מאמרים", href: "/articles" },
              { label: "הספרים שלי", href: "/books" },
              { label: "שאלות נפוצות", href: "/faq" },
              { label: "צור קשר", href: "#contact" },
            ].map((link) => (
              <button
                key={link.href}
                onClick={() => handleAnchor(link.href)}
                className="text-right py-3 px-4 rounded-lg text-base font-medium transition-colors hover:bg-amber-50"
                style={linkStyle}
              >
                {link.label}
              </button>
            ))}
            <a href="tel:0542111288" className="btn-cta mt-2 justify-center">
              <Phone size={16} />
              054-2111-288
            </a>
            <a
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors hover:bg-amber-50 text-right mt-1"
              style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}
            >
              <Settings size={15} />
              ניהול
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
