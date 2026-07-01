export interface BookOGData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  imageStorageKey: string; // key under manus-storage
}

export const BOOKS: BookOGData[] = [
  {
    slug: "lihyot-metapel",
    title: "להיות מטפל",
    subtitle: "מחקר בתחום הייעוץ הנישואין והמשפחה",
    description:
      "תזה מחקרית מאת מאיר שמעון עשור M.A — עוסקת בהשפעת ההכשרה לייעוץ נישואין ומשפחה על איכות חיי המשפחה של היועץ עצמו. מחקר מעמיק המשלב פסיכולוגיה יהודית עם גישות טיפוליות מודרניות.",
    imageStorageKey: "book_lihyot_metapel_13cbbfc0.jpg",
  },
  {
    slug: "lalecet-bedarkav",
    title: "ללכת בדרכיו ולדבוק בו",
    subtitle: "הליכה בדרכי ה' ודבקות",
    description:
      "ספר עיון המתמקד במצוות הליכה בדרכי ה' — מצווה אמצעית למטרה גדולה יותר. הספר מציג את הדרך לדבקות בהשם דרך לימוד, מעשה ואמונה, תוך שילוב מקורות מהתורה, הגמרא וספרי המוסר.",
    imageStorageKey: "book_lalecet_bedarkav_375f6007.jpg",
  },
  {
    slug: "mitzvas-haemuna",
    title: "מצוות האמונה בה'",
    subtitle: "יסודות האמונה היהודית",
    description:
      "ספר מקיף העוסק במצוות האמונה בה' — הבסיס לכל התורה כולה. הספר מקבץ ידע מספרים ומאמרים שונים העוסקים באמונה לאורך ההיסטוריה היהודית, ומציג אותו בצורה נגישה ומעמיקה.",
    imageStorageKey: "book_mitzvas_haemuna_6c447e51.jpg",
  },
  {
    slug: "sulam-aliya",
    title: "סולם עליה",
    subtitle: "לדבקות בה'",
    description:
      "קונטרס 'סולם עליה לדבקות בה'' — נערך ונכתב בסיעתא דשמיא על ידי מאיר שמעון עשור. הספר מציג מדרגות ושלבים בעבודת ה' ובדרך לדבקות, ומהווה מדריך מעשי לצמיחה רוחנית.",
    imageStorageKey: "book_sulam_aliya_1be44157.jpg",
  },
  {
    slug: "rabi-rafael-ashor",
    title: "קורות חייו של רבי רפאל יחיאל עשור זצ\"ל",
    subtitle: "זיכרון ועדות",
    description:
      "ספרון לזכרו של רבי רפאל יחיאל עשור זצוק\"ל (1939–1974), שנפטר בדמי ימיו. הספר יוצא כמהדורה ראשונה לעורר זיכרונות בקרב משפחתו ומכריו, ומציג את דמותו כאדם גדול בענקים, ירא שמים ואוהב תורה.",
    imageStorageKey: "book_rabi_rafael_7f7765f2.jpg",
  },
  {
    slug: "bati-legani",
    title: "מאמר באתי לגני",
    subtitle: "מהדורה מבוארת — האדמו\"ר הריי\"צ",
    description:
      "מאמר חסידי עמוק מאת רבי יוסף יצחק שניאורסון (האדמו\"ר הריי\"צ), בעריכה והוספת ביאורים מאת מאיר שמעון עשור. המאמר עוסק בפסוק \"באתי לגני אחותי כלה\" ומבאר את ירידת השכינה לתחתונים ואת עבודת ה' בעולם הגשמי.",
    imageStorageKey: "bati_legani_garden_3d7cdee1.jpg",
  },
  {
    slug: "shaar-hayira",
    title: "שער היראה והאהבה להשם",
    subtitle: "יסודות יראת שמים ואהבת ה'",
    description:
      "ספר יסוד לכל אדם המבקש להעמיק את אמונתו. מטרת הספר להקנות ידע בסיסי ומקיף ברכישת יראת שמים ואהבה להשם ולתורתו. הידע נאסף ממקורות מקובלים ומומלצים מהספרייה התורנית.",
    imageStorageKey: "book_shaar_hayira_cecfeaf8.jpg",
  },
];

export const BOOKS_BY_SLUG: Record<string, BookOGData> = Object.fromEntries(
  BOOKS.map((b) => [b.slug, b])
);
