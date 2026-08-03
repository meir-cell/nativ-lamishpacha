/**
 * Seed script v2: uses exact keys from AdminSiteContent.tsx defaults.
 * Run with: node scripts/seed-site-content-v2.mjs
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

console.log("\n=== Seeding site_content (v2 — matching AdminSiteContent.tsx keys) ===");

const siteContentRows = [
  // Hero section — keys match AdminSiteContent.tsx exactly
  { key: "hero.badge", label: "תג Hero (מעל הכותרת)", value: "פגישת ייעוץ ראשונית — ללא עלות וללא התחייבות", type: "text", section: "hero" },
  { key: "hero.title.line1", label: "כותרת Hero — שורה 1", value: "הדרך לפתרון", type: "text", section: "hero" },
  { key: "hero.title.line2", label: "כותרת Hero — שורה 2 (מודגשת)", value: "מתחילה בשיחה אחת", type: "text", section: "hero" },
  { key: "hero.subtitle", label: "תת-כותרת Hero", value: "מאיר שמעון עשור — 33 שנות ניסיון בטיפול זוגי, גישור טיפולי וייעוץ משפטי בבתי הדין הרבניים. ליווי מקצועי, דיסקרטי ואנושי בצמתי החיים המשפחתיים.", type: "text", section: "hero" },
  { key: "hero.cta.primary", label: "כפתור ראשי Hero", value: "קבע פגישת ייעוץ חינם", type: "text", section: "hero" },
  { key: "hero.phone", label: "מספר טלפון Hero", value: "054-2111-288", type: "text", section: "hero" },
  { key: "hero.stat1.num", label: "סטטיסטיקה 1 — מספר", value: "33+", type: "text", section: "hero" },
  { key: "hero.stat1.label", label: "סטטיסטיקה 1 — תווית", value: "שנות ניסיון", type: "text", section: "hero" },
  { key: "hero.stat2.num", label: "סטטיסטיקה 2 — מספר", value: "3", type: "text", section: "hero" },
  { key: "hero.stat2.label", label: "סטטיסטיקה 2 — תווית", value: "אזורים בארץ", type: "text", section: "hero" },
  { key: "hero.stat3.num", label: "סטטיסטיקה 3 — מספר", value: "100%", type: "text", section: "hero" },
  { key: "hero.stat3.label", label: "סטטיסטיקה 3 — תווית", value: "דיסקרטיות", type: "text", section: "hero" },

  // About section
  { key: "about.title", label: "כותרת 'אודות'", value: "מאיר שמעון עשור", type: "text", section: "about" },
  { key: "about.subtitle", label: "תת-כותרת 'אודות'", value: "מטפל זוגי, מגשר ויועץ משפטי", type: "text", section: "about" },
  { key: "about.bio", label: "ביוגרפיה קצרה", value: "למעלה מ־33 שנות ניסיון בליווי יחידים, זוגות ומשפחות בהתמודדות עם סכסוכים ואתגרי חיים מורכבים.", type: "text", section: "about" },

  // Services section
  { key: "services.title", label: "כותרת מדור שירותים", value: "כיצד אוכל לסייע לך", type: "text", section: "services" },
  { key: "services.badge", label: "תג מדור שירותים", value: "תחומי הפעילות", type: "text", section: "services" },

  // Contact section
  { key: "contact.phone", label: "מספר טלפון", value: "054-2111-288", type: "text", section: "contact" },
  { key: "contact.email", label: "כתובת אימייל", value: "meir@nativ-lamishpacha.co.il", type: "text", section: "contact" },
  { key: "contact.address.jerusalem", label: "כתובת — ירושלים", value: "ירושלים — רח' יפו 216", type: "text", section: "contact" },
  { key: "contact.address.bnei-brak", label: "כתובת — בני ברק", value: "בני ברק — רח' ביאליק 2", type: "text", section: "contact" },
  { key: "contact.address.beit-shemesh", label: "כתובת — בית שמש / אשדוד", value: "אשדוד — רח' הרצל 58", type: "text", section: "contact" },
  { key: "contact.whatsapp", label: "מספר וואצאפ (ללא +)", value: "972542111288", type: "text", section: "contact" },

  // Footer
  { key: "footer.tagline", label: "תגית Footer", value: "ליווי מקצועי, דיסקרטי ואנושי", type: "text", section: "footer" },
  { key: "footer.copyright", label: "זכויות יוצרים", value: "© 2026 נתיב למשפחה — מאיר שמעון עשור. כל הזכויות שמורות.", type: "text", section: "footer" },
];

for (const row of siteContentRows) {
  await upsert("site_content", "key", row.key, row);
}

await db.end();
console.log(`\nDone! ${siteContentRows.length} items seeded.`);
