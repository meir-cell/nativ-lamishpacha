import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Save, RefreshCw, Home, Heart, Scale, Users, Phone, MapPin, BookOpen, Info } from "lucide-react";

// Default site content structure
const SITE_CONTENT_DEFAULTS = [
  // Hero section
  { key: "hero.badge", label: "תג Hero (מעל הכותרת)", value: "פגישת ייעוץ ראשונית — ללא עלות וללא התחייבות", section: "hero", type: "text" as const },
  { key: "hero.title.line1", label: "כותרת Hero — שורה 1", value: "הדרך לפתרון", section: "hero", type: "text" as const },
  { key: "hero.title.line2", label: "כותרת Hero — שורה 2 (מודגשת)", value: "מתחילה בשיחה אחת", section: "hero", type: "text" as const },
  { key: "hero.subtitle", label: "תת-כותרת Hero", value: "מאיר שמעון עשור — 28 שנות ניסיון בטיפול זוגי, גישור טיפולי וייעוץ משפטי בבתי הדין הרבניים. ליווי מקצועי, דיסקרטי ואנושי בצמתי החיים המשפחתיים.", section: "hero", type: "text" as const },
  { key: "hero.cta.primary", label: "כפתור ראשי Hero", value: "קבע פגישת ייעוץ חינם", section: "hero", type: "text" as const },
  { key: "hero.phone", label: "מספר טלפון Hero", value: "054-2111-288", section: "hero", type: "text" as const },
  { key: "hero.stat1.num", label: "סטטיסטיקה 1 — מספר", value: "28+", section: "hero", type: "text" as const },
  { key: "hero.stat1.label", label: "סטטיסטיקה 1 — תווית", value: "שנות ניסיון", section: "hero", type: "text" as const },
  { key: "hero.stat2.num", label: "סטטיסטיקה 2 — מספר", value: "3", section: "hero", type: "text" as const },
  { key: "hero.stat2.label", label: "סטטיסטיקה 2 — תווית", value: "מרכזים בארץ", section: "hero", type: "text" as const },
  { key: "hero.stat3.num", label: "סטטיסטיקה 3 — מספר", value: "100%", section: "hero", type: "text" as const },
  { key: "hero.stat3.label", label: "סטטיסטיקה 3 — תווית", value: "דיסקרטיות", section: "hero", type: "text" as const },

  // About section
  { key: "about.title", label: "כותרת 'אודות'", value: "מאיר שמעון עשור", section: "about", type: "text" as const },
  { key: "about.subtitle", label: "תת-כותרת 'אודות'", value: "מטפל זוגי, מגשר ויועץ משפטי", section: "about", type: "text" as const },
  { key: "about.bio", label: "ביוגרפיה קצרה", value: "28 שנות ניסיון בליווי זוגות ומשפחות בצמתי החיים המשפחתיים. מומחה בטיפול זוגי, גישור טיפולי וייעוץ משפטי בבתי הדין הרבניים.", section: "about", type: "text" as const },

  // Services
  { key: "services.title", label: "כותרת מדור שירותים", value: "תחומים בהם אוכל לסייע לך", section: "services", type: "text" as const },
  { key: "services.badge", label: "תג מדור שירותים", value: "תחומי הפעילות", section: "services", type: "text" as const },

  // Contact
  { key: "contact.phone", label: "טלפון ראשי", value: "054-2111-288", section: "contact", type: "text" as const },
  { key: "contact.email", label: "אימייל", value: "meir@nativ-lamishpacha.com", section: "contact", type: "text" as const },
  { key: "contact.address.jerusalem", label: "כתובת ירושלים", value: "ירושלים — רחוב יפו 216", section: "contact", type: "text" as const },
  { key: "contact.address.bnei-brak", label: "כתובת בני ברק", value: "בני ברק — רחוב הרב שך 5", section: "contact", type: "text" as const },
  { key: "contact.address.beit-shemesh", label: "כתובת בית שמש", value: "בית שמש — רחוב נחל לכיש 7", section: "contact", type: "text" as const },
  { key: "contact.whatsapp", label: "מספר WhatsApp", value: "972542111288", section: "contact", type: "text" as const },

  // Footer
  { key: "footer.tagline", label: "סלוגן Footer", value: "ליווי מקצועי, דיסקרטי ואנושי בצמתי החיים המשפחתיים", section: "footer", type: "text" as const },
  { key: "footer.copyright", label: "זכויות יוצרים", value: "© 2024 מאיר שמעון עשור. כל הזכויות שמורות.", section: "footer", type: "text" as const },
];

const SECTIONS = [
  { key: "hero", label: "Hero — כותרת ראשית", icon: Home },
  { key: "about", label: "אודות", icon: Info },
  { key: "services", label: "שירותים", icon: Heart },
  { key: "contact", label: "פרטי קשר", icon: Phone },
  { key: "footer", label: "Footer", icon: BookOpen },
];

function SectionPanel({ sectionKey, sectionLabel, icon: Icon, items, onSave }: {
  sectionKey: string;
  sectionLabel: string;
  icon: any;
  items: typeof SITE_CONTENT_DEFAULTS;
  onSave: (updates: { key: string; value: string; label: string; type: "text" | "html" | "json" | "url"; section: string }[]) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(items.map(i => [i.key, i.value]))
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(items.map(i => ({ ...i, value: values[i.key] ?? i.value })));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(196,149,106,0.15)", background: "white" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(196,149,106,0.1)", background: "rgba(196,149,106,0.04)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(196,149,106,0.15)" }}>
          <Icon size={18} style={{ color: "var(--brand-gold)" }} />
        </div>
        <h3 className="font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>{sectionLabel}</h3>
      </div>

      {/* Fields */}
      <div className="p-5 space-y-4" dir="rtl">
        {items.map(item => (
          <div key={item.key}>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
              {item.label}
            </label>
            {item.value.length > 80 ? (
              <textarea
                value={values[item.key] ?? item.value}
                onChange={e => setValues(v => ({ ...v, [item.key]: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
              />
            ) : (
              <input
                type="text"
                value={values[item.key] ?? item.value}
                onChange={e => setValues(v => ({ ...v, [item.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: "rgba(196,149,106,0.3)", fontFamily: "'Assistant', sans-serif" }}
              />
            )}
          </div>
        ))}

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 mt-2"
          style={{ background: saved ? "#6B7C5C" : "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}
        >
          <Save size={14} />
          {saved ? "נשמר!" : "שמור שינויים"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSiteContent() {
  const utils = trpc.useUtils();

  const { data: dbContent, isLoading } = trpc.adminSiteContent.getAll.useQuery({});

  const bulkUpdateMutation = trpc.adminSiteContent.bulkUpdate.useMutation({
    onSuccess: () => utils.adminSiteContent.getAll.invalidate()
  });

  // Merge DB values with defaults
  const getItemsForSection = (sectionKey: string) => {
    const defaults = SITE_CONTENT_DEFAULTS.filter(i => i.section === sectionKey);
    if (!dbContent) return defaults;
    const dbMap = new Map(dbContent.map(d => [d.key, d.value]));
    return defaults.map(item => ({
      ...item,
      value: dbMap.get(item.key) ?? item.value,
    }));
  };

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
        טוען...
      </div>
    );
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
          ניהול תוכן האתר
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
          עריכת טקסטים, כותרות ופרטי קשר של כל רכיבי האתר
        </p>
      </div>

      {/* Info */}
      <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(196,149,106,0.08)", border: "1px solid rgba(196,149,106,0.2)" }}>
        <p className="text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
          <strong>הערה:</strong> שינויים נשמרים במסד הנתונים. לאחר שמירה, האתר יציג את הערכים המעודכנים.
          שינויים בתמונות ובקבצי מדיה יש לבצע דרך ניהול מאמרים.
        </p>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => (
        <SectionPanel
          key={section.key}
          sectionKey={section.key}
          sectionLabel={section.label}
          icon={section.icon}
          items={getItemsForSection(section.key)}
          onSave={(updates) => bulkUpdateMutation.mutate(updates)}
        />
      ))}
    </div>
  );
}
