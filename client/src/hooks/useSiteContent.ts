import { trpc } from "@/lib/trpc";

// Default site content — used as fallback when DB value is missing
const SITE_CONTENT_DEFAULTS: Record<string, string> = {
  "hero.badge": "פגישת ייעוץ ראשונית — ללא עלות וללא התחייבות",
  "hero.title.line1": "הדרך לפתרון",
  "hero.title.line2": "מתחילה בשיחה אחת",
  "hero.subtitle": "מאיר שמעון עשור — 28 שנות ניסיון בטיפול זוגי, גישור טיפולי וייעוץ משפטי בבתי הדין הרבניים. ליווי מקצועי, דיסקרטי ואנושי בצמתי החיים המשפחתיים.",
  "hero.cta.primary": "קבע פגישת ייעוץ חינם",
  "hero.phone": "054-2111-288",
  "hero.stat1.num": "28+",
  "hero.stat1.label": "שנות ניסיון",
  "hero.stat2.num": "3",
  "hero.stat2.label": "מרכזים בארץ",
  "hero.stat3.num": "100%",
  "hero.stat3.label": "דיסקרטיות",
  "about.title": "מאיר שמעון עשור",
  "about.subtitle": "מטפל זוגי, מגשר ויועץ משפטי",
  "about.bio": "28 שנות ניסיון בליווי זוגות ומשפחות בצמתי החיים המשפחתיים. מומחה בטיפול זוגי, גישור טיפולי וייעוץ משפטי בבתי הדין הרבניים.",
  "services.title": "תחומים בהם אוכל לסייע לך",
  "services.badge": "תחומי הפעילות",
  "contact.phone": "054-2111-288",
  "contact.email": "meir@nativ-lamishpacha.com",
  "contact.address.jerusalem": "ירושלים — רחוב יפו 216",
  "contact.address.bnei-brak": "בני ברק — רחוב הרב שך 5",
  "contact.address.beit-shemesh": "בית שמש — רחוב נחל לכיש 7",
  "contact.whatsapp": "972542111288",
  "footer.tagline": "ליווי מקצועי, דיסקרטי ואנושי בצמתי החיים המשפחתיים",
  "footer.copyright": "© 2024 מאיר שמעון עשור. כל הזכויות שמורות.",
};

/**
 * Hook that fetches site content from DB and merges with defaults.
 * DB values always override defaults.
 * Returns a `get(key)` helper for easy access.
 */
export function useSiteContent() {
  const { data: dbContent, isLoading } = trpc.adminSiteContent.getPublic.useQuery();

  const dbMap: Record<string, string> = {};
  if (dbContent) {
    for (const row of dbContent) {
      if (row.key && row.value != null) {
        dbMap[row.key] = row.value;
      }
    }
  }

  // Also handle legacy keys stored with underscore (hero.title_line1 → hero.title.line1)
  const legacyMap: Record<string, string> = {};
  if (dbContent) {
    for (const row of dbContent) {
      if (row.key && row.value != null) {
        const normalized = row.key.replace(/_/g, ".");
        legacyMap[normalized] = row.value;
      }
    }
  }

  const get = (key: string, fallback?: string): string => {
    // DB value (exact key) takes priority
    if (dbMap[key] != null) return dbMap[key];
    // Legacy key with underscores
    if (legacyMap[key] != null) return legacyMap[key];
    // Default value
    if (SITE_CONTENT_DEFAULTS[key] != null) return SITE_CONTENT_DEFAULTS[key];
    // Explicit fallback
    return fallback ?? key;
  };

  return { get, isLoading };
}
