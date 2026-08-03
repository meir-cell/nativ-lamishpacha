import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL || "mysql://root:NfdVgTYCESiDuMQzFPIMxAJVHWuGQrtr@altaria.proxy.rlwy.net:35506/railway";

const books = [
  {
    slug: "lihyot-metapel",
    title: "להיות מטפל",
    subtitle: "מחקר בתחום הייעוץ הנישואין והמשפחה",
    description: "תזה מחקרית מאת מאיר שמעון עשור M.A — עוסקת בהשפעת ההכשרה לייעוץ נישואין ומשפחה על איכות חיי המשפחה של היועץ עצמו. מחקר מעמיק המשלב פסיכולוגיה יהודית עם גישות טיפוליות מודרניות.",
    pages: 127,
    category: "מחקר אקדמי",
    pdfUrl: "/manus-storage/lihyot-metapel_45f65e02.pdf",
    img: "/manus-storage/book_lihyot_metapel_13cbbfc0.jpg",
    color: "#C4956A",
    icon: "📚",
    published: 1,
    sortOrder: 1,
  },
  {
    slug: "lalecet-bedarkav",
    title: "ללכת בדרכיו ולדבוק בו",
    subtitle: "הליכה בדרכי ה' ודבקות",
    description: "ספר עיון המתמקד במצוות הליכה בדרכי ה' — מצווה אמצעית למטרה גדולה יותר. הספר מציג את הדרך לדבקות בהשם דרך לימוד, מעשה ואמונה, תוך שילוב מקורות מהתורה, הגמרא וספרי המוסר.",
    pages: 223,
    category: "פסיכולוגיה יהודית",
    pdfUrl: "/manus-storage/lalecet-bedarkav_8babebd3.pdf",
    img: "/manus-storage/book_lalecet_bedarkav_375f6007.jpg",
    color: "#6B7C5C",
    icon: "✡️",
    published: 1,
    sortOrder: 2,
  },
  {
    slug: "mitzvas-haemuna",
    title: "מצוות האמונה בה'",
    subtitle: "יסודות האמונה היהודית",
    description: "ספר מקיף העוסק במצוות האמונה בה' — הבסיס לכל התורה כולה. הספר מקבץ ידע מספרים ומאמרים שונים העוסקים באמונה לאורך ההיסטוריה היהודית, ומציג אותו בצורה נגישה ומעמיקה.",
    pages: 177,
    category: "פסיכולוגיה יהודית",
    pdfUrl: "/manus-storage/mitzvas-haemuna_1bc4bfce.pdf",
    img: "/manus-storage/book_mitzvas_haemuna_6c447e51.jpg",
    color: "#5C4033",
    icon: "🕍",
    published: 1,
    sortOrder: 3,
  },
  {
    slug: "sulam-aliya",
    title: "סולם עליה",
    subtitle: "לדבקות בה'",
    description: "קונטרס 'סולם עליה לדבקות בה'' — נערך ונכתב בסיעתא דשמיא על ידי מאיר שמעון עשור. הספר מציג מדרגות ושלבים בעבודת ה' ובדרך לדבקות, ומהווה מדריך מעשי לצמיחה רוחנית.",
    pages: 140,
    category: "פסיכולוגיה יהודית",
    pdfUrl: "/manus-storage/sulam-aliya_15e93018.pdf",
    img: "/manus-storage/book_sulam_aliya_1be44157.jpg",
    color: "#8B6914",
    icon: "🌿",
    published: 1,
    sortOrder: 4,
  },
  {
    slug: "rabi-rafael-ashor",
    title: "קורות חייו של רבי רפאל יחיאל עשור זצ\"ל",
    subtitle: "זיכרון ועדות",
    description: "ספרון לזכרו של רבי רפאל יחיאל עשור זצוק\"ל (1939–1974), שנפטר בדמי ימיו. הספר יוצא כמהדורה ראשונה לעורר זיכרונות בקרב משפחתו ומכריו, ומציג את דמותו כאדם גדול בענקים, ירא שמים ואוהב תורה.",
    pages: 85,
    category: "הספרים שלי",
    pdfUrl: "/manus-storage/rabi-rafael-ashor_47aeace8.pdf",
    img: "/manus-storage/book_rabi_rafael_7f7765f2.jpg",
    color: "#4A3728",
    icon: "📖",
    published: 1,
    sortOrder: 5,
  },
  {
    slug: "bati-legani",
    title: "מאמר באתי לגני",
    subtitle: "מהדורה מבוארת — האדמו\"ר הריי\"צ",
    description: "מאמר חסידי עמוק מאת רבי יוסף יצחק שניאורסון (האדמו\"ר הריי\"צ), בעריכה והוספת ביאורים מאת מאיר שמעון עשור. המאמר עוסק בפסוק \"באתי לגני אחותי כלה\" ומבאר את ירידת השכינה לתחתונים ואת עבודת ה' בעולם הגשמי.",
    pages: 64,
    category: "חסידות",
    pdfUrl: "/manus-storage/bati_legani_1ab6e75d.pdf",
    img: "/manus-storage/bati_legani_garden_3d7cdee1.jpg",
    color: "#2E7D32",
    icon: "🌿",
    published: 1,
    sortOrder: 6,
  },
  {
    slug: "shaar-hayira",
    title: "שער היראה והאהבה להשם",
    subtitle: "יסודות יראת שמים ואהבת ה'",
    description: "ספר יסוד לכל אדם המבקש להעמיק את אמונתו. מטרת הספר להקנות ידע בסיסי ומקיף ברכישת יראת שמים ואהבה להשם ולתורתו. הידע נאסף ממקורות מקובלים ומומלצים מהספרייה התורנית.",
    pages: 163,
    category: "פסיכולוגיה יהודית",
    pdfUrl: "/manus-storage/shaar-hayira-veahava_f2c91665.pdf",
    img: "/manus-storage/book_shaar_hayira_cecfeaf8.jpg",
    color: "#2C5F8A",
    icon: "🕯️",
    published: 1,
    sortOrder: 7,
  },
];

const faqItems = [
  // כללי
  { question: "מה ההבדל בין טיפול זוגי, גישור וייעוץ משפטי?", answer: "טיפול זוגי מתמקד בריפוי הקשר הרגשי ושיפור התקשורת — מתאים לזוגות שרוצים להמשיך יחד. גישור טיפולי מתמקד בפתרון מחלוקת ספציפית (כמו חלוקת רכוש, מזונות או משמורת) בדרך מוסכמת — מתאים גם לזוגות שהחליטו להיפרד. ייעוץ משפטי מספק ייצוג וליווי מקצועי בהליכים פורמליים בפני בית הדין הרבני.", category: "כללי", sortOrder: 1 },
  { question: "האם הפגישה הראשונה בתשלום?", answer: "לא. פגישת הייעוץ הראשונית היא ללא עלות וללא התחייבות. במהלכה נבין את המצב, נציג את האפשרויות ונדון בהמשך הדרך. רק לאחר שתחליטו להמשיך יחד נסדיר את התשלום.", category: "כללי", sortOrder: 2 },
  { question: "האם הפגישות דיסקרטיות?", answer: "בהחלט. כל המידע שמועבר בפגישות חסוי לחלוטין. אנחנו מחויבים לסודיות מקצועית מלאה ולא מעבירים מידע לאף גורם ללא הסכמתכם המפורשת.", category: "כללי", sortOrder: 3 },
  { question: "האם ניתן לקבל שירות גם מרחוק (זום/טלפון)?", answer: "כן. אנחנו מציעים פגישות גם בפלטפורמות וידאו (זום, וואטסאפ) וגם בטלפון — לנוחותכם ולפי הצורך. פגישות מרחוק יעילות לא פחות מפגישות פנים אל פנים.", category: "כללי", sortOrder: 4 },
  // טיפול זוגי
  { question: "כמה פגישות טיפול זוגי נדרשות בממוצע?", answer: "בממוצע, תהליך טיפול זוגי נמשך בין 8 ל-16 פגישות. הפגישות מתקיימות אחת לשבוע או אחת לשבועיים, בהתאם לצורך ולקצב ההתקדמות. חלק מהזוגות מרגישים שיפור משמעותי כבר לאחר 4–5 פגישות.", category: "טיפול זוגי", sortOrder: 1 },
  { question: "האם שני בני הזוג חייבים להגיע יחד?", answer: "ברוב המקרים כן — הטיפול הזוגי מתמקד בדינמיקה בין שני בני הזוג. עם זאת, לעיתים נתחיל עם פגישות אישיות לכל אחד בנפרד, ולאחר מכן נעבור לפגישות משותפות. אנחנו מתאימים את הפורמט לצורך הספציפי.", category: "טיפול זוגי", sortOrder: 2 },
  { question: "האם טיפול זוגי מתאים גם לזוגות שחושבים על גירושין?", answer: "כן. טיפול זוגי יכול לעזור גם לזוגות שנמצאים בשלב של שקילת פרידה — לפעמים הטיפול מחדש את הקשר, ולפעמים הוא עוזר להיפרד בצורה בריאה ומכבדת יותר. בכל מקרה, הטיפול נותן כלים שמועילים לשני הצדדים.", category: "טיפול זוגי", sortOrder: 3 },
  // גישור
  { question: "האם שני הצדדים חייבים להסכים לגישור?", answer: "כן. גישור הוא הליך וולונטרי לחלוטין. שני הצדדים חייבים להסכים להשתתף. עם זאת, ניתן לשכנע צד מהסס על ידי הסבר היתרונות — חיסכון בזמן, כסף ועוגמת נפש.", category: "גישור", sortOrder: 1 },
  { question: "כמה עולה גישור לעומת הליך בבית הדין?", answer: "עלות הגישור נמוכה משמעותית מהוצאות הליך בבית הדין. הליך בבית הדין עלול לעלות עשרות אלפי שקלים ולהימשך שנים. גישור מתנהל בחודשים ספורים ועולה שבריר מהעלות. נדון בעלויות הספציפיות בפגישת הייעוץ הראשונית.", category: "גישור", sortOrder: 2 },
  { question: "האם הסכם הגישור מחייב משפטית?", answer: "כן. הסכם גישור שנחתם על ידי שני הצדדים ניתן להגשה לאישור בית הדין הרבני, ולאחר האישור הוא מקבל תוקף של פסק דין מחייב.", category: "גישור", sortOrder: 3 },
  // ייעוץ משפטי
  { question: "מה ההבדל בין עורך דין לבין יועץ בבית הדין הרבני?", answer: "בבתי הדין הרבניים, הצדדים יכולים להיות מיוצגים על ידי 'טוען רבני' — מי שמוסמך לייצג בפני בית הדין. מאיר שמעון עשור הוא יועץ ומלווה מקצועי בעל ידע נרחב בדיני משפחה הלכתיים ומשפטיים, ומסייע ללקוחות לנווט את ההליכים בצורה מיטבית.", category: "ייעוץ משפטי", sortOrder: 1 },
  { question: "האם ניתן לקבל ייעוץ גם אם אני לא דתי?", answer: "בהחלט. בית הדין הרבני הוא הגוף המוסמך לענייני נישואין וגירושין בישראל לכלל היהודים — דתיים וחילוניים כאחד. הייעוץ מותאם לכל לקוח ולמצבו הספציפי.", category: "ייעוץ משפטי", sortOrder: 2 },
  { question: "מה עושים כשהצד השני מסרב לגט?", answer: "סרבנות גט היא אחת הסוגיות הקשות ביותר בדיני משפחה יהודיים. ישנם מספר כלים הלכתיים ומשפטיים להתמודד עם סרבנות — החל מלחץ בית דין ועד צווים שונים. נבחן את האפשרויות הרלוונטיות לתיק הספציפי שלך.", category: "ייעוץ משפטי", sortOrder: 3 },
  { question: "כמה זמן לוקח הליך גירושין בבית הדין הרבני?", answer: "משך ההליך תלוי במורכבות התיק ובשיתוף הפעולה בין הצדדים. גירושין בהסכמה יכולים להסתיים תוך מספר חודשים. הליכים שנויים במחלוקת עלולים להימשך שנים. גישור יכול לקצר משמעותית את ההליך.", category: "ייעוץ משפטי", sortOrder: 4 },
];

async function seed() {
  const conn = await mysql.createConnection(DB_URL);
  try {
    // Seed books
    console.log("Seeding books...");
    for (const book of books) {
      await conn.execute(
        `INSERT IGNORE INTO books (slug, title, subtitle, description, pages, category, pdfUrl, img, color, icon, published, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [book.slug, book.title, book.subtitle, book.description, book.pages, book.category, book.pdfUrl, book.img, book.color, book.icon, book.published, book.sortOrder]
      );
    }
    console.log(`Seeded ${books.length} books`);

    // Seed FAQ items
    console.log("Seeding FAQ items...");
    for (const item of faqItems) {
      await conn.execute(
        `INSERT INTO faq_items (question, answer, category, sortOrder, published)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE answer = VALUES(answer)`,
        [item.question, item.answer, item.category, item.sortOrder]
      );
    }
    console.log(`Seeded ${faqItems.length} FAQ items`);
  } finally {
    await conn.end();
  }
}

seed().then(() => {
  console.log("Seeding complete!");
  process.exit(0);
}).catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
