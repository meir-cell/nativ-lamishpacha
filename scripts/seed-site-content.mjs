/**
 * Seed script: populates site_content and seo_settings tables with current site data.
 * Run with: node scripts/seed-site-content.mjs
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";

config();

const db = await createConnection(process.env.DATABASE_URL);

async function upsert(table, keyCol, keyVal, data) {
  const [existing] = await db.execute(`SELECT id FROM \`${table}\` WHERE \`${keyCol}\` = ?`, [keyVal]);
  if (existing.length > 0) {
    const sets = Object.keys(data).map(k => `\`${k}\` = ?`).join(", ");
    await db.execute(`UPDATE \`${table}\` SET ${sets} WHERE \`${keyCol}\` = ?`, [...Object.values(data), keyVal]);
    console.log(`  Updated ${table}[${keyVal}]`);
  } else {
    const cols = Object.keys(data).map(k => `\`${k}\``).join(", ");
    const vals = Object.keys(data).map(() => "?").join(", ");
    await db.execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${vals})`, Object.values(data));
    console.log(`  Inserted ${table}[${keyVal}]`);
  }
}

// ─── SITE CONTENT ─────────────────────────────────────────────────────────────

console.log("\n=== Seeding site_content ===");

const siteContentRows = [
  // Hero section
  { key: "hero.badge", label: "Hero — תג עליון", value: "פגישת ייעוץ ראשונית — ללא עלות וללא התחייבות", type: "text", section: "hero" },
  { key: "hero.title_line1", label: "Hero — שורה 1 בכותרת", value: "הדרך לפתרון", type: "text", section: "hero" },
  { key: "hero.title_line2", label: "Hero — שורה 2 בכותרת (מודגשת)", value: "מתחילה בשיחה אחת", type: "text", section: "hero" },
  { key: "hero.subtitle", label: "Hero — תת-כותרת", value: "מאיר שמעון עשור — 33 שנות ניסיון בטיפול זוגי, גישור טיפולי וייעוץ משפטי בבתי הדין הרבניים. ליווי מקצועי, דיסקרטי ואנושי בצמתי החיים המשפחתיים.", type: "text", section: "hero" },
  { key: "hero.cta_primary", label: "Hero — כפתור ראשי", value: "קבע פגישת ייעוץ חינם", type: "text", section: "hero" },
  { key: "hero.phone", label: "Hero — טלפון", value: "054-2111-288", type: "text", section: "hero" },
  { key: "hero.stat1_num", label: "Hero — סטטיסטיקה 1 מספר", value: "33+", type: "text", section: "hero" },
  { key: "hero.stat1_label", label: "Hero — סטטיסטיקה 1 תווית", value: "שנות ניסיון", type: "text", section: "hero" },
  { key: "hero.stat2_num", label: "Hero — סטטיסטיקה 2 מספר", value: "3", type: "text", section: "hero" },
  { key: "hero.stat2_label", label: "Hero — סטטיסטיקה 2 תווית", value: "אזורים בארץ", type: "text", section: "hero" },
  { key: "hero.stat3_num", label: "Hero — סטטיסטיקה 3 מספר", value: "100%", type: "text", section: "hero" },
  { key: "hero.stat3_label", label: "Hero — סטטיסטיקה 3 תווית", value: "דיסקרטיות", type: "text", section: "hero" },

  // Services section
  { key: "services.section_label", label: "שירותים — תווית סקשן", value: "תחומי הפעילות", type: "text", section: "services" },
  { key: "services.section_title", label: "שירותים — כותרת סקשן", value: "כיצד אוכל לסייע לך", type: "text", section: "services" },
  { key: "services.1.title", label: "שירות 1 — כותרת", value: "טיפול זוגי", type: "text", section: "services" },
  { key: "services.1.subtitle", label: "שירות 1 — תת-כותרת", value: "מרחב בטוח לשיקום הקשר", type: "text", section: "services" },
  { key: "services.1.desc", label: "שירות 1 — תיאור", value: "מערכת זוגית טובה אינה נמדדת בהיעדר קשיים, אלא ביכולת להתמודד איתם יחד. הטיפול מעניק לבני הזוג כלים מעשיים לתקשורת בריאה, חיזוק האמון וחידוש הקרבה הרגשית.", type: "text", section: "services" },
  { key: "services.2.title", label: "שירות 2 — כותרת", value: "גישור טיפולי", type: "text", section: "services" },
  { key: "services.2.subtitle", label: "שירות 2 — תת-כותרת", value: "מוצא ממבוי סתום", type: "text", section: "services" },
  { key: "services.2.desc", label: "שירות 2 — תיאור", value: "גישור טיפולי לזוגות במשבר — הליך ממוקד ויעיל לזוגות הנמצאים במשבר הנובע ממחלוקת מוגדרת. העבודה מתמקדת בהבנת האינטרסים ובניית הסכמות שמאפשרות התקדמות משותפת.", type: "text", section: "services" },
  { key: "services.3.title", label: "שירות 3 — כותרת", value: "ייעוץ משפטי", type: "text", section: "services" },
  { key: "services.3.subtitle", label: "שירות 3 — תת-כותרת", value: "ייצוג בבתי הדין הרבניים", type: "text", section: "services" },
  { key: "services.3.desc", label: "שירות 3 — תיאור", value: "שירות מקצועי ומקיף לכל ההליכים בפני בתי הדין הרבניים — גירושין, כתובה, מזונות, משמורת, הסדרי שהות, חלוקת רכוש, שלום בית והסכמים משפחתיים.", type: "text", section: "services" },

  // About section
  { key: "about.section_label", label: "אודות — תווית סקשן", value: "אודות", type: "text", section: "about" },
  { key: "about.section_title", label: "אודות — כותרת", value: "מאיר שמעון עשור", type: "text", section: "about" },
  { key: "about.bio", label: "אודות — ביוגרפיה", value: "למעלה מ־33 שנות ניסיון בליווי יחידים, זוגות ומשפחות בהתמודדות עם סכסוכים ואתגרי חיים מורכבים.", type: "text", section: "about" },
  { key: "about.credential1", label: "אודות — תואר 1", value: "מגשר מוסמך ומטפל זוגי", type: "text", section: "about" },
  { key: "about.credential2", label: "אודות — תואר 2", value: "NLP Trainer מוסמך", type: "text", section: "about" },
  { key: "about.credential3", label: "אודות — תואר 3", value: "יועץ משפטי בבתי הדין הרבניים", type: "text", section: "about" },

  // Contact section
  { key: "contact.section_title", label: "קשר — כותרת", value: "צור קשר", type: "text", section: "contact" },
  { key: "contact.section_subtitle", label: "קשר — תת-כותרת", value: "מלא את הטופס ונחזור אליך בהקדם לתיאום פגישת ייעוץ ראשונית — דיסקרטית, ללא עלות וללא התחייבות.", type: "text", section: "contact" },
  { key: "contact.phone", label: "קשר — טלפון", value: "054-2111-288", type: "text", section: "contact" },
  { key: "contact.phone_note", label: "קשר — הערת טלפון", value: "זמין גם בוואצאפ", type: "text", section: "contact" },
  { key: "contact.email", label: "קשר — אימייל", value: "meir@nativ-lamishpacha.co.il", type: "text", section: "contact" },
  { key: "contact.address1", label: "קשר — כתובת 1", value: "ירושלים — רח' יפו 216", type: "text", section: "contact" },
  { key: "contact.address2", label: "קשר — כתובת 2", value: "בני ברק — רח' ביאליק 2", type: "text", section: "contact" },
  { key: "contact.address3", label: "קשר — כתובת 3", value: "אשדוד — רח' הרצל 58", type: "text", section: "contact" },
  { key: "contact.whatsapp_number", label: "קשר — מספר וואצאפ", value: "972542111288", type: "text", section: "contact" },
  { key: "contact.facebook_url", label: "קשר — קישור פייסבוק", value: "https://www.facebook.com/meir.ashor", type: "url", section: "contact" },

  // Footer
  { key: "footer.copyright", label: "Footer — זכויות יוצרים", value: "© 2026 נתיב למשפחה — מאיר שמעון עשור. כל הזכויות שמורות.", type: "text", section: "footer" },
  { key: "footer.tagline", label: "Footer — תגית", value: "ליווי מקצועי, דיסקרטי ואנושי", type: "text", section: "footer" },
];

for (const row of siteContentRows) {
  await upsert("site_content", "key", row.key, row);
}

// ─── SEO SETTINGS ─────────────────────────────────────────────────────────────

console.log("\n=== Seeding seo_settings ===");

const seoRows = [
  {
    pageKey: "home",
    pageLabel: "דף הבית",
    metaTitle: "נתיב למשפחה — מאיר שמעון עשור | טיפול זוגי, גישור וייעוץ משפטי",
    metaDescription: "33 שנות ניסיון בטיפול זוגי, גישור טיפולי וייעוץ משפטי בבתי הדין הרבניים. פגישת ייעוץ ראשונית ללא עלות.",
    ogTitle: "נתיב למשפחה — מאיר שמעון עשור",
    ogDescription: "ליווי מקצועי, דיסקרטי ואנושי בצמתי החיים המשפחתיים. 33 שנות ניסיון.",
    keywords: "טיפול זוגי, גישור, ייעוץ משפטי, בתי דין רבניים, גירושין, שלום בית",
    canonical: "https://nativfam-mlbezbk5.manus.space/",
  },
  {
    pageKey: "tipul-zugi",
    pageLabel: "טיפול זוגי",
    metaTitle: "טיפול זוגי | נתיב למשפחה — מאיר שמעון עשור",
    metaDescription: "טיפול זוגי מקצועי — מרחב בטוח לשיקום הקשר. כלים מעשיים לתקשורת בריאה, חיזוק האמון וחידוש הקרבה הרגשית.",
    ogTitle: "טיפול זוגי — נתיב למשפחה",
    ogDescription: "מרחב בטוח לשיקום הקשר הזוגי. 33 שנות ניסיון.",
    keywords: "טיפול זוגי, ייעוץ זוגי, שיפור תקשורת, שיקום קשר, אמון בזוגיות",
    canonical: "https://nativfam-mlbezbk5.manus.space/tipul-zugi",
  },
  {
    pageKey: "gishur",
    pageLabel: "גישור טיפולי",
    metaTitle: "גישור טיפולי | נתיב למשפחה — מאיר שמעון עשור",
    metaDescription: "גישור טיפולי לזוגות במשבר — הליך ממוקד ויעיל. בניית הסכמות שמאפשרות התקדמות משותפת.",
    ogTitle: "גישור טיפולי — נתיב למשפחה",
    ogDescription: "מוצא ממבוי סתום — גישור טיפולי לזוגות במשבר.",
    keywords: "גישור טיפולי, גישור זוגי, יישוב סכסוכים, הסכמות, מגשר",
    canonical: "https://nativfam-mlbezbk5.manus.space/gishur",
  },
  {
    pageKey: "yiutz-mishpati",
    pageLabel: "ייעוץ משפטי",
    metaTitle: "ייעוץ משפטי בבתי הדין הרבניים | נתיב למשפחה",
    metaDescription: "ייצוג מקצועי בבתי הדין הרבניים — גירושין, כתובה, מזונות, משמורת, חלוקת רכוש. 33 שנות ניסיון.",
    ogTitle: "ייעוץ משפטי — נתיב למשפחה",
    ogDescription: "ייצוג בבתי הדין הרבניים — גירושין, מזונות, משמורת.",
    keywords: "ייעוץ משפטי, בית דין רבני, גירושין, כתובה, מזונות, משמורת, חלוקת רכוש",
    canonical: "https://nativfam-mlbezbk5.manus.space/yiutz-mishpati",
  },
  {
    pageKey: "articles",
    pageLabel: "מאמרים",
    metaTitle: "מאמרים | נתיב למשפחה — מאיר שמעון עשור",
    metaDescription: "מאמרים מקצועיים בנושאי זוגיות, גישור, גירושין וחיי משפחה מאת מאיר שמעון עשור.",
    ogTitle: "מאמרים — נתיב למשפחה",
    ogDescription: "מאמרים מקצועיים בנושאי זוגיות, גישור וחיי משפחה.",
    keywords: "מאמרים, זוגיות, גישור, גירושין, משפחה, פסיכולוגיה יהודית",
    canonical: "https://nativfam-mlbezbk5.manus.space/articles",
  },
  {
    pageKey: "books",
    pageLabel: "ספרים",
    metaTitle: "ספרים | נתיב למשפחה — מאיר שמעון עשור",
    metaDescription: "ספרים מקצועיים בנושאי זוגיות, גישור ומשפחה מאת מאיר שמעון עשור.",
    ogTitle: "ספרים — נתיב למשפחה",
    ogDescription: "ספרים מקצועיים בנושאי זוגיות וגישור.",
    keywords: "ספרים, זוגיות, גישור, משפחה, מאיר שמעון עשור",
    canonical: "https://nativfam-mlbezbk5.manus.space/books",
  },
  {
    pageKey: "faq",
    pageLabel: "שאלות נפוצות",
    metaTitle: "שאלות נפוצות | נתיב למשפחה — מאיר שמעון עשור",
    metaDescription: "תשובות לשאלות הנפוצות ביותר על טיפול זוגי, גישור וייעוץ משפטי.",
    ogTitle: "שאלות נפוצות — נתיב למשפחה",
    ogDescription: "כל מה שרצית לדעת על טיפול זוגי, גישור וייעוץ משפטי.",
    keywords: "שאלות נפוצות, טיפול זוגי, גישור, ייעוץ משפטי, FAQ",
    canonical: "https://nativfam-mlbezbk5.manus.space/faq",
  },
  {
    pageKey: "payment",
    pageLabel: "תשלום",
    metaTitle: "תשלום | נתיב למשפחה — מאיר שמעון עשור",
    metaDescription: "תשלום מאובטח עבור שירותי טיפול זוגי, גישור וייעוץ משפטי.",
    ogTitle: "תשלום — נתיב למשפחה",
    ogDescription: "תשלום מאובטח עבור שירותי נתיב למשפחה.",
    keywords: "תשלום, שירותי טיפול, גישור, ייעוץ",
    canonical: "https://nativfam-mlbezbk5.manus.space/payment",
  },
  {
    pageKey: "nlp",
    pageLabel: "קורס NLP",
    metaTitle: "קורס NLP Practitioner | נתיב למשפחה — מאיר שמעון עשור",
    metaDescription: "קורס NLP Practitioner מקצועי — כלים לשינוי דפוסי חשיבה, שיפור תקשורת ופיתוח אישי. מאיר שמעון עשור, NLP Trainer.",
    ogTitle: "קורס NLP Practitioner — נתיב למשפחה",
    ogDescription: "כלים לשינוי דפוסי חשיבה ופיתוח אישי. NLP Trainer מוסמך.",
    keywords: "NLP, קורס NLP, NLP Practitioner, פיתוח אישי, שינוי דפוסי חשיבה, תקשורת",
    canonical: "https://nativfam-mlbezbk5.manus.space/nlp",
  },
];

for (const row of seoRows) {
  await upsert("seo_settings", "pageKey", row.pageKey, row);
}

await db.end();
console.log("\nAll done!");
