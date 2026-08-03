import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

// Fallback defaults when no DB record exists for a page
const SEO_DEFAULTS: Record<string, { title: string; description: string }> = {
  home: {
    title: "נתיב למשפחה — מאיר שמעון עשור | טיפול זוגי, גישור וייעוץ משפטי",
    description: "28 שנות ניסיון בטיפול זוגי, גישור טיפולי וייעוץ משפטי בבתי הדין הרבניים. פגישת ייעוץ ראשונית ללא עלות.",
  },
  "tipul-zugi": {
    title: "טיפול זוגי | נתיב למשפחה — מאיר שמעון עשור",
    description: "טיפול זוגי מקצועי — מרחב בטוח לשיקום הקשר. כלים מעשיים לתקשורת בריאה, חיזוק האמון וחידוש הקרבה הרגשית.",
  },
  gishur: {
    title: "גישור טיפולי | נתיב למשפחה — מאיר שמעון עשור",
    description: "גישור טיפולי לזוגות במשבר — הליך ממוקד ויעיל לזוגות הנמצאים במחלוקת. בניית הסכמות שמאפשרות התקדמות משותפת.",
  },
  "yiutz-mishpati": {
    title: "ייעוץ משפטי בבתי הדין הרבניים | נתיב למשפחה",
    description: "ייצוג מקצועי בבתי הדין הרבניים — גירושין, כתובה, מזונות, משמורת, חלוקת רכוש. ניסיון של 28 שנה.",
  },
  articles: {
    title: "מאמרים | נתיב למשפחה — מאיר שמעון עשור",
    description: "מאמרים מקצועיים בנושאי זוגיות, גישור, גירושין וחיי משפחה מאת מאיר שמעון עשור.",
  },
  books: {
    title: "ספרים | נתיב למשפחה — מאיר שמעון עשור",
    description: "ספרים מקצועיים בנושאי זוגיות, גישור ומשפחה מאת מאיר שמעון עשור.",
  },
  faq: {
    title: "שאלות נפוצות | נתיב למשפחה — מאיר שמעון עשור",
    description: "תשובות לשאלות הנפוצות ביותר על טיפול זוגי, גישור וייעוץ משפטי.",
  },
  payment: {
    title: "תשלום | נתיב למשפחה — מאיר שמעון עשור",
    description: "תשלום מאובטח עבור שירותי טיפול זוגי, גישור וייעוץ משפטי.",
  },
  nlp: {
    title: "קורס NLP Practitioner | נתיב למשפחה",
    description: "קורס NLP Practitioner מקצועי — כלים לשינוי דפוסי חשיבה, שיפור תקשורת ופיתוח אישי.",
  },
};

/**
 * useSEO — fetches SEO settings from the DB for a given pageKey
 * and updates document.title + meta tags dynamically.
 * Falls back to hardcoded defaults when no DB record exists.
 *
 * Usage: useSEO("home") or useSEO("tipul-zugi")
 */
export function useSEO(pageKey: string) {
  const { data: page } = trpc.adminSeo.getByPage.useQuery(
    { pageKey },
    { staleTime: 5 * 60 * 1000 } // cache for 5 minutes
  );

  useEffect(() => {
    const defaults = SEO_DEFAULTS[pageKey];

    // Helper to set/create meta tag
    const setMeta = (name: string, content: string, prop = false) => {
      if (!content) return;
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Apply DB values first, fall back to defaults
    const title = page?.metaTitle || defaults?.title;
    const description = page?.metaDescription || defaults?.description;

    if (title) document.title = title;
    if (description) setMeta("description", description);

    // DB-only fields (no defaults needed)
    if (page?.keywords) setMeta("keywords", page.keywords);
    if (page?.ogTitle || title) setMeta("og:title", page?.ogTitle || title || "", true);
    if (page?.ogDescription || description) setMeta("og:description", page?.ogDescription || description || "", true);
    if (page?.ogImage) setMeta("og:image", page.ogImage, true);
    if (page?.canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = page.canonical;
    }
  }, [page, pageKey]);
}
