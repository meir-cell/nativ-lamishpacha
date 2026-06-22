// Shared article metadata for Open Graph tags
// Keep in sync with client/src/pages/Articles.tsx

export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt: string;
  img: string;
  category: string;
}

export const ARTICLES_META: ArticleMeta[] = [
  {
    slug: "madrich-gerushin",
    title: "מדריך ממוקד לניהול גירושין",
    excerpt: "מדריך ממוקד לניהול הליך הגירושין בבית הדין הרבני — מבוא, סמכויות, שלבים וייעוץ מקצועי.",
    img: "https://meir-asor.co.il/wp-content/uploads/2026/06/madrich-leguroshun.png",
    category: "משפטיים",
  },
  {
    slug: "munachim-psikologia-yehudit",
    title: "מונחים בפסיכולוגיה יהודית",
    excerpt: "צמצום, חשבון נפש ומושגים מרכזיים בפסיכולוגיה יהודית — משמעות ויישום.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/psych.jpg",
    category: "בריאות הנפש",
  },
  {
    slug: "shlavey-hagishur",
    title: "שלבי תהליך הגישור",
    excerpt: "סקירה מקיפה של שלבי תהליך הגישור — מהפגישה הראשונה ועד להסכם.",
    img: "https://meir-asor.co.il/wp-content/uploads/2023/11/gisor.png",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "psikiatriya-vedat",
    title: "פסיכיאטריה ודת",
    excerpt: "הקשר בין פסיכיאטריה לדת — נושא מורכב ורב פנים.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/psych.jpg",
    category: "בריאות הנפש",
  },
  {
    slug: "gishur-tipuli-bnei-zug",
    title: "גישור ככלי טיפולי בישוב סכסוכים בין בני זוג",
    excerpt: "גישור טיפולי הוא כלי ייחודי המשלב בין עולם הגישור לעולם הטיפול הנפשי.",
    img: "https://meir-asor.co.il/wp-content/uploads/2023/11/gisor.png",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "gesher-hashalom",
    title: "גשר השלום — הגישור ככלי מחזיק ברכה",
    excerpt: "הגישור ויישוב סכסוכים לאור ערך השלום — לא מצא הקדוש ברוך הוא כלי מחזיק ברכה לישראל אלא השלום.",
    img: "https://meir-asor.co.il/wp-content/uploads/2023/11/gisor.png",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "yitronot-hagishur",
    title: "יתרונות הגישור ככלי ליישוב סכסוכים",
    excerpt: "חילוקי דעות המובילים לסכסוכים הם סיטואציות נורמליות כחלק ממהלך החיים שלנו.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/11/gishur_4.jpg",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "kashyim-zihuy-intresim",
    title: "קשיים בזיהוי אינטרסים בהליך הגישור",
    excerpt: "ברוב המקרים בעימות בהליך גישור, הצדדים אינם מציגים באופן ברור ושקוף את האינטרסים שלהם.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/puzzle.jpg",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "amadot-intresim-shkarim",
    title: "עמדות אינטרסים ושקרים",
    excerpt: "המעורבות של מגשר אינה מבטיחה את כנות הצדדים לגבי האינטרסים שלהם.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/moznaim_2.jpg",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "zihuy-intresim-kabala-haskama",
    title: "זיהוי אינטרסים קבלה והסכמה",
    excerpt: "זיהוי אינטרסים — המפתח לקבלה, להסכמה ולהתקדמות במשא ומתן.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/gishor.png",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "mahalakhim-akifim",
    title: "מהלכים עקיפים לחשיפת אינטרסים",
    excerpt: "מגשרים משתמשים במיומנויות תקשורת על מנת לזהות אינטרסים.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/hand_wood.jpg",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "mahalakhim-yesharim",
    title: "מהלכים ישירים לחשיפת האינטרסים",
    excerpt: "מהלכים ישירים הם כלים שמגשרים וצדדים במשא ומתן משתמשים בהם כדי לחשוף באופן מפורש את האינטרסים.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/gihur_55.jpg",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "matzavey-zihuy-intresim",
    title: "מצבי זיהוי אינטרסים: המפתח לקבלה, להסכמה ולהתקדמות במשא ומתן",
    excerpt: "אחד האתגרים המרכזיים בגישור ובמשא ומתן הוא המעבר מעיסוק בעמדות לעיסוק באינטרסים.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/gishur_222.jpg",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "gishot-produktiviot",
    title: "גישות פרודוקטיביות (בעלות יכולת לייצר ולהפיק)",
    excerpt: "הבנה של אינטרסים של הצד שכנגד מסייעת להביא לתוצאות טובות יותר.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/gishur_1.jpg",
    category: "גישור ויישוב סכסוכים",
  },
  {
    slug: "gerushin-behaskama-darkha",
    title: "גירושין בהסכמה – הדרך המכבדת לסיום קשר הנישואין",
    excerpt: "בני זוג רבים אשר נמצאים במשבר עמוק ביחסיהם מבינים כי אין להם ברירה אלא להגיש תביעת גירושין.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/giruh.jpg",
    category: "גירושין וייעוץ משפטי",
  },
  {
    slug: "gerushin-behaskama-madrich",
    title: "גירושין בהסכמה – המדריך המלא לתהליך מהיר, חסכוני והוגן (2026)",
    excerpt: "גירושין בהסכמה הם הדרך המהירה, החסכונית וההוגנת ביותר לסיום נישואין בישראל.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/devorce_ring.jpg",
    category: "גירושין וייעוץ משפטי",
  },
  {
    slug: "halich-gerushin-brabanut",
    title: "הליך גירושין ברבנות",
    excerpt: "הליך גירושין ברבנות בישראל כפופים לדין האישי שחל על הצדדים.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/Giroshien-1.png",
    category: "גירושין וייעוץ משפטי",
  },
  {
    slug: "yeutz-zugi-trom-gerushin",
    title: "ייעוץ זוגי טרום לגירושין",
    excerpt: "לרוב האנשים גירושין זה אחד האירועים הטראומטיים ביותר בחיים.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/yeutz_legerushin.jpg",
    category: "גירושין וייעוץ משפטי",
  },
  {
    slug: "gviyat-ketuba-mugzemet",
    title: "גביית כתובה מוגזמת",
    excerpt: "במאמר זה נעסוק בנושא רגיש וחשוב אשר מעסיק רבים מדייני בתי הדין הרבניים.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/08/ketoba.png",
    category: "גירושין וייעוץ משפטי",
  },
  {
    slug: "mezonot-zmaniyim",
    title: "מזונות זמניים בבית הדין",
    excerpt: "רבים מהמתגרשים בוחרים בדרך הקלה שהיא הסכם גירושין, המכיל את כל הפרמטרים הנדרשים כולל מזונות.",
    img: "https://meir-asor.co.il/wp-content/uploads/2020/07/gold_bridge.jpg",
    category: "גירושין וייעוץ משפטי",
  },
];

// Build a lookup map by slug
export const ARTICLES_BY_SLUG: Record<string, ArticleMeta> = Object.fromEntries(
  ARTICLES_META.map(a => [a.slug, a])
);
