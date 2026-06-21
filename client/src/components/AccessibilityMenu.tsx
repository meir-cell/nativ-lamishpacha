import { useState, useEffect } from "react";
import { Accessibility, X, ZoomIn, ZoomOut, Sun, Moon, Type, Link, RotateCcw } from "lucide-react";

interface AccessibilityState {
  fontSize: number; // 0 = normal, 1 = large, 2 = larger
  highContrast: boolean;
  underlineLinks: boolean;
  grayscale: boolean;
}

const DEFAULT_STATE: AccessibilityState = {
  fontSize: 0,
  highContrast: false,
  underlineLinks: false,
  grayscale: false,
};

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AccessibilityState>(DEFAULT_STATE);

  // Apply accessibility classes to <html>
  useEffect(() => {
    const html = document.documentElement;

    // Font size
    html.classList.remove("acc-font-large", "acc-font-larger");
    if (state.fontSize === 1) html.classList.add("acc-font-large");
    if (state.fontSize === 2) html.classList.add("acc-font-larger");

    // High contrast
    html.classList.toggle("acc-high-contrast", state.highContrast);

    // Underline links
    html.classList.toggle("acc-underline-links", state.underlineLinks);

    // Grayscale
    html.classList.toggle("acc-grayscale", state.grayscale);
  }, [state]);

  const update = (patch: Partial<AccessibilityState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const reset = () => setState(DEFAULT_STATE);

  const activeCount = [
    state.fontSize > 0,
    state.highContrast,
    state.underlineLinks,
    state.grayscale,
  ].filter(Boolean).length;

  return (
    <>
      {/* Global accessibility CSS */}
      <style>{`
        html.acc-font-large  { font-size: 110% !important; }
        html.acc-font-larger { font-size: 125% !important; }
        html.acc-high-contrast { filter: contrast(1.5); }
        html.acc-grayscale { filter: grayscale(1); }
        html.acc-underline-links a { text-decoration: underline !important; }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="תפריט נגישות"
        title="תפריט נגישות"
        className="fixed bottom-24 left-4 z-[9999] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ background: "#3D2314", color: "white" }}
      >
        <Accessibility size={22} />
        {activeCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
            style={{ background: "#C4956A", color: "white" }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="תפריט נגישות"
          className="fixed bottom-40 left-4 z-[9999] w-64 rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "white", border: "1px solid rgba(196,149,106,0.3)" }}
          dir="rtl"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "#3D2314", color: "white" }}
          >
            <div className="flex items-center gap-2">
              <Accessibility size={18} />
              <span className="font-bold text-sm" style={{ fontFamily: "'Assistant', sans-serif" }}>
                נגישות
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="סגור תפריט נגישות"
              className="hover:opacity-70 transition-opacity"
            >
              <X size={18} />
            </button>
          </div>

          {/* Options */}
          <div className="p-3 flex flex-col gap-2">
            {/* Font size */}
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: "#F5EFE6" }}
            >
              <span className="text-sm font-medium" style={{ color: "#3D2314", fontFamily: "'Assistant', sans-serif" }}>
                גודל טקסט
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => update({ fontSize: Math.max(0, state.fontSize - 1) })}
                  aria-label="הקטן טקסט"
                  disabled={state.fontSize === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: state.fontSize === 0 ? "#ddd" : "#C4956A", color: "white" }}
                >
                  <ZoomOut size={14} />
                </button>
                <span className="w-6 text-center text-sm font-bold" style={{ color: "#3D2314" }}>
                  {state.fontSize === 0 ? "A" : state.fontSize === 1 ? "A+" : "A++"}
                </span>
                <button
                  onClick={() => update({ fontSize: Math.min(2, state.fontSize + 1) })}
                  aria-label="הגדל טקסט"
                  disabled={state.fontSize === 2}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: state.fontSize === 2 ? "#ddd" : "#C4956A", color: "white" }}
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            {/* Toggle buttons */}
            {[
              {
                label: "ניגודיות גבוהה",
                key: "highContrast" as const,
                icon: state.highContrast ? <Moon size={16} /> : <Sun size={16} />,
              },
              {
                label: "קו תחת קישורים",
                key: "underlineLinks" as const,
                icon: <Link size={16} />,
              },
              {
                label: "גווני אפור",
                key: "grayscale" as const,
                icon: <Type size={16} />,
              },
            ].map(({ label, key, icon }) => (
              <button
                key={key}
                onClick={() => update({ [key]: !state[key] })}
                aria-pressed={state[key]}
                className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors text-right w-full"
                style={{
                  background: state[key] ? "#3D2314" : "#F5EFE6",
                  color: state[key] ? "white" : "#3D2314",
                }}
              >
                <span className="text-sm font-medium" style={{ fontFamily: "'Assistant', sans-serif" }}>
                  {label}
                </span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center`}
                  style={{ background: state[key] ? "rgba(255,255,255,0.2)" : "rgba(196,149,106,0.2)" }}>
                  {icon}
                </span>
              </button>
            ))}

            {/* Reset */}
            {activeCount > 0 && (
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors w-full mt-1"
                style={{ background: "#fee2e2", color: "#991b1b", fontFamily: "'Assistant', sans-serif" }}
              >
                <RotateCcw size={14} />
                איפוס הגדרות
              </button>
            )}
          </div>

          {/* Footer link */}
          <div
            className="px-4 py-2 text-center border-t"
            style={{ borderColor: "rgba(196,149,106,0.2)" }}
          >
            <a
              href="/accessibility"
              className="text-xs hover:underline"
              style={{ color: "#C4956A", fontFamily: "'Assistant', sans-serif" }}
            >
              הצהרת נגישות
            </a>
          </div>
        </div>
      )}
    </>
  );
}
