import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663762108963/mLbezbk5ZAEXFd46ngs4DG/logo-nativ-VMgivypQydA7w944gD7SQh.png";

const navLinks = [
  { label: "דף הבית", href: "#hero" },
  { label: "שירותים", href: "#services" },
  { label: "אודות", href: "#about" },
  { label: "המלצות", href: "#testimonials" },
  { label: "מאמרים", href: "#articles" },
  { label: "צור קשר", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled ? "nav-scrolled" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-8">
        {/* Logo */}
        <button onClick={() => handleNav("#hero")} className="flex items-center gap-2 group">
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
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              className="text-sm font-medium transition-colors duration-200 hover:opacity-70"
              style={{ color: scrolled ? "var(--brand-dark)" : "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
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
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="text-right py-3 px-4 rounded-lg text-base font-medium transition-colors hover:bg-amber-50"
                style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
              >
                {link.label}
              </button>
            ))}
            <a
              href="tel:0542111288"
              className="btn-cta mt-2 justify-center"
            >
              <Phone size={16} />
              054-2111-288
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
