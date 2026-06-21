import { useEffect, useRef, useState } from "react";
import { BookOpen, ArrowLeft, Search, Tag, Share2, Copy, Check, Facebook } from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Link } from "wouter";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 0.6s cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

const categories = ["הכל", "גישור ויישוב סכסוכים", "הלכתיים - בין בני זוג", "הספרים שלי", "טיפול זוגי בנישואין", "משפטיים", "פסיכולוגיה יהודית"];

const articles = [
  {
    title: `מדריך ממוקד לניהול גירושין`,
    excerpt: `מדריך ממוקד לניהול הליך הגירושין בבית הדין הרבני\\n\\nמבוא\\n\\nכאשר חיי הנישואין מגיעים למשבר עמוק, ובני הזוג מבינים כי אין עוד אפשרות להמשיך את החיים המשותפים, ניצבת בפניהם אחת ההחלטות המשמעותיות ביותר `,
    category: `משפטיים`,
    date: `יוני 13, 2026`,
    img: `https://meir-asor.co.il/wp-content/uploads/2026/06/madrich-leguroshun.png`,
    href: "",
  },
  {
    title: `מונחים בפסיכולוגיה יהודית`,
    excerpt: `צמצום בפסיכולוגיה יהודית\\n\\nהמושג \\"צמצום\\" מגיע מהקבלה, בעיקר מתורת האר\\"י. במקור הקבלי, הצמצום מתאר רעיון עמוק מאוד: כדי שיהיה מקום לעולם – האינסוף \\"צמצם\\" את עצמו. \\nכלומר, האלוהות זה כמובן רעיון `,
    category: `פסיכולוגיה יהודית`,
    date: `יוני 6, 2026`,
    img: `https://meir-asor.co.il/wp-content/uploads/2026/06/pesishlogya.png`,
    href: "",
  },
  {
    title: `שלבי תהליך הגישור`,
    excerpt: `תהליך הגישור הוא הליך מובנה ליישוב סכסוכים, שבו צד שלישי ניטרלי מסייע לצדדים לנהל דיאלוג, להבין את צורכיהם ולהגיע להסכמות משותפות. על פי פישר, יורי ופטון (Fisher, Ury & Patton 2011), מטרת הגישור אינה `,
    category: `גישור ויישוב סכסוכים`,
    date: `יוני 3, 2026`,
    img: `https://meir-asor.co.il/wp-content/uploads/2026/06/gishur.png`,
    href: "",
  },
  {
    title: `פסיכיאטריה ודת`,
    excerpt: `מתוך מאמר, הרפואה לאור ההלכה, של הרב וולבה,\\n(חוברת ח' סיוון תשמ\\"ב, בית החולים קרית צנז ע\\"ש לניאדו)\\nניסוח מחודש בס\\"ד מאת: מאיר שמעון עשור\\n\\nבשנים האחרונות נושא הקשר בין פסיכיאטריה לדת הפך לנושא מ`,
    category: `פסיכולוגיה יהודית`,
    date: `יוני 3, 2026`,
    img: `https://meir-asor.co.il/wp-content/uploads/2026/06/meir-1024x1024.png`,
    href: "",
  },
  {
    title: `להיות מטפל`,
    excerpt: `דילוג לתוכן \\n\\nלהיות מטפל \\n\\nמאיר שמעון עשור \\n\\nלהיות מטפל\\n\\nמאי 1, 2024 \\n\\nהספרים שלי\\n\\nלהיות-מטפל הורד\\n\\nשתף מאמר זה:\\n\\nקשיים בזיהוי אינטרסים בהליך הגישור\\n\\nאוגוסט 11, 2020\\n\\nמאיר שמעון עש`,
    category: `הספרים שלי`,
    date: `מאי 1, 2024`,
    img: `https://meir-asor.co.il/wp-content/uploads/2024/05/Depositphotos_695947942_XL-1.jpg`,
    href: "",
  },
  {
    title: `ספר קורות חייו של רפאל יחיאל עשור זצ"ל`,
    excerpt: `קורות חייו של\\n\\nרבי רפאל יחיאל עשור זצוק\\"ל\\n\\nנולד בשנת 1939: במרוקו\\nנלב\\"ע ב ה' סיוון התשל\\"ד (26.5.1974)\\nוכך נכתב על מצבתו:\\nזאת מצבת קבורת האדם גדול בענקים, יניק וחכים איש משכיל ואיש מידות\\nגומ`,
    category: `הספרים שלי`,
    date: `מאי 1, 2024`,
    img: `https://meir-asor.co.il/wp-content/uploads/2024/05/Depositphotos_220723218_XL-1.jpg`,
    href: "",
  },
  {
    title: `שער האמונה והייחוד בהשם`,
    excerpt: `הספר ״שער האמונה והייחוד בהשם״ הוא ספר יסוד לכל אדם המבקש להעמיק את אמונתו ולחזק את הקשר שלו עם הקב״ה. הספר מציג את עקרונות האמונה היהודית בצורה בהירה ונגישה, ומספק כלים מעשיים ליישום האמונה בחיי היומ`,
    category: `הספרים שלי`,
    date: `אפריל 19, 2024`,
    img: `https://meir-asor.co.il/wp-content/uploads/2024/04/Depositphotos_368602274_XL-1.jpg`,
    href: "",
  },
  {
    title: `שער היראה והאהבה`,
    excerpt: `מצוות אהבה ויראת השם הן מצוות בסיסיות ביהדות ומהותיות לקיום ושמירת התורה והמצוות. בהתקיימן משדרגות הן את איכות לימוד התורה ועשיית המצוות והן מעצימות את הקשר המתמיד עם בורא עולם.\\n\\nבספר זה ערכנו סקירה`,
    category: `הספרים שלי`,
    date: `אפריל 19, 2024`,
    img: `https://meir-asor.co.il/wp-content/uploads/2024/04/Depositphotos_459081800_XL-1.jpg`,
    href: "",
  },
  {
    title: `גישור ככלי טיפולי בישוב סכסוכים בין בני זוג`,
    excerpt: `על הגישור הזוגי\\n\\nהגישור בכלל הוא כלי המשמש לישוב סכסוכים, יכול להות כלי טיפולי אפקטיבי קצר מועד, לטיפול במשבר מוגדר גבולות, הנוצר בין בני זוג. \\n\\nמיועד לבני זוג נשואים שנמצאים במשבר זוגי הנובע מסכס`,
    category: `גישור ויישוב סכסוכים`,
    date: `נובמבר 28, 2023`,
    img: `https://meir-asor.co.il/wp-content/uploads/2023/11/gisor.png`,
    href: "",
  },
  {
    title: `גשר השלום, הגישור ככלי לשלום`,
    excerpt: `גשר השלום – הגישור ככלי מחזיק ברכה\\n\\nהגישור ויישוב סכסוכים לאור ערך השלום\\n\\nאמרו חז\\"ל: \\"לא מצא הקדוש ברוך הוא כלי מחזיק ברכה לישראל אלא השלום, שנאמר: 'ה' עֹז לעמו ייתן, ה' יברך את עמו בשלום'\\" (מש`,
    category: `גישור ויישוב סכסוכים`,
    date: `נובמבר 11, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/11/shalom.png`,
    href: "",
  },
  {
    title: `יתרונות הגישור ככלי ליישוב סכסוכים`,
    excerpt: `חילוקי דעות המובילים לסכסוכים הם סיטואציות נורמליות כחלק ממהלך החיים שלנו. הם יכולים להתרחש בכל זמן נתון, בכל מקום, ועם כל אחד. קיימות מספר אפשרויות לפתרון סכסוכים כאשר אחת הדרכים הטובות ביותר היא באמ`,
    category: `גישור ויישוב סכסוכים`,
    date: `נובמבר 10, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/11/gishur_4.jpg`,
    href: "",
  },
  {
    title: `קשיים בזיהוי אינטרסים בהליך הגישור`,
    excerpt: `ברוב המקרים בעימות בהליך גישור, הצדדים אינם מציגים באופן ברור ושקוף את האינטרסים שלהם. **ישנם מספר סיבות לכך:**\\n\\n* **קושי ראשון, חוסר מודעות לאינטרסים:**  \\nכלומר הצדדים אינם יודעים לזהות בעצמם את ה`,
    category: `גישור ויישוב סכסוכים`,
    date: `אוגוסט 11, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/puzzle.jpg`,
    href: "",
  },
  {
    title: `עמדות אינטרסים ושקרים`,
    excerpt: `המעורבות של מגשר אינה מבטיחה את כנות הצדדים לגבי האינטרסים שלהם. הצדדים אף עלולים לשקר בכוונה. \\"צד במשא ומתן ישקר כאשר הוא טוען או כאשר ניתן יהיה להבין ממנו שהוא ייעשה מה שאינו מתכוון לעשות בזמן שהטע`,
    category: `גישור ויישוב סכסוכים`,
    date: `אוגוסט 11, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/moznaim_2.jpg`,
    href: "",
  },
  {
    title: `זיהוי אינטרסים קבלה והסכמה`,
    excerpt: `זיהוי אינטרסים:\\nהמפתח לקבלה, להסכמה ולהתקדמות במשא ומתן\\n\\nמבוא:\\n\\nאחד האתגרים המרכזיים בגישור ובמשא ומתן הוא המעבר מעיסוק ב\\"עמדות\\" לעיסוק ב\\"אינטרסים\\". בעוד שעמדה היא מה שהצד אומר שהוא רוצה, האי`,
    category: `גישור ויישוב סכסוכים`,
    date: `אוגוסט 11, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/gishor.png`,
    href: "",
  },
  {
    title: `מהלכים עקיפים לחשיפת אינטרסים`,
    excerpt: `להלן בחינה של תהליכים לחשיפת אינטרסים\\n\\n**מגשרים** משתמשים במיומנויות תקשורת על מנת לזהות אינטרסים כמו:\\n\\nהקשבה פעילה, שיקוף, ניסוח מחדש, תמצות, הכללה, חלוקה לקטעים או תבניות.\\n\\nכאשר משתמשים באחת מ`,
    category: `גישור ויישוב סכסוכים`,
    date: `אוגוסט 11, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/hand_wood.jpg`,
    href: "",
  },
  {
    title: `מהלכים ישירים לחשיפת האינטרסים`,
    excerpt: `יש מגשרים (Fisher & Ury 1981) הממליצים על תשאול ישיר לגבי אינטרסים. הם מציעים שכאשר צד בסכסוך מציג את עמדתו בפני הצד השני, הוא גם ישאל את עצמו ואת הצד השני מדוע עמדה זו חשובה. ניסוח זהיר של שאלות יכול`,
    category: `גישור ויישוב סכסוכים`,
    date: `אוגוסט 11, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/gihur_55.jpg`,
    href: "",
  },
  {
    title: `הליכים לזיהוי אינטרסים`,
    excerpt: `צדדים ומגשרים במשא ומתן משתמשים בשני סוגי תהליכים לזיהוי אינטרסים של הצדדים בסכסוך: ישירים – מודעים ועקפים – לא בולטים.\\n\\nצדדים משתמשים בהליכים עקיפים כאשר הם:\\n\\n1. משתמשים במשא ומתן בגישה של מיקוח `,
    category: `גישור ויישוב סכסוכים`,
    date: `אוגוסט 11, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/gishur_222.jpg`,
    href: "",
  },
  {
    title: `גישות פרודוקטיביות (בעלות יכולת לייצר ולהפיק)`,
    excerpt: `הבנה של אינטרסים של הצד שכנגד מסייעת להביא לתוצאות טובות יותר.  \\nאפשר להקל על זיהוי אינטרסים ע\\"י שימוש ופתוח גישות פתוחות לכך כמו:\\n\\n1. אמונה שלכל הצדדים יש אינטרסים וצרכים החשובים להם.\\n2. אמונה ש`,
    category: `גישור ויישוב סכסוכים`,
    date: `אוגוסט 11, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/gishur_1.jpg`,
    href: "",
  },
  {
    title: `גירושין בהסכמה – הדרך המכבדת לסיום קשר הנישואין`,
    excerpt: `גירושין הם מן האירועים המורכבים והרגישים ביותר בחיי המשפחה. לצד הקושי הרגשי, נדרשים בני הזוג לקבל החלטות משמעותיות שישפיעו על עתידם ועל עתיד ילדיהם. השאלה אינה רק האם להתגרש, אלא גם כיצד לעשות זאת.\\n\\`,
    category: `גישור ויישוב סכסוכים`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/giruh.jpg`,
    href: "",
  },
  {
    title: `טוען רבני או מגשר?`,
    excerpt: `במאמר זה נעסוק בדיון הלכתי אתי; הנוגע בכללי האתיקה והמוסריות של טוענים רבניים ומגשרים. ושניהם גם יחד. ובעיקר נתמקד בשאלה האם מגשר, שהינו גם טוען רבני יכול לשלב בין שני תפקידים חשובים אלו בו זמנית. ולה`,
    category: `הלכתיים - בין בני זוג`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/toen_new.jpg`,
    href: "",
  },
  {
    title: `טוען רבני`,
    excerpt: `טוען רבני הוא אדם שתפגשו רק במידה והחלטתם להתגרש. הרגע בו הנכם מחליטים להתגרש הוא רגע לא קל אשר הגיע ככל הנראה כתוצאה מתקופה ארוכה בה היחסים היו מעורערים. מצד שני, לעיתים גירושין הם דבר שעדיף לעשות במ`,
    category: `גישור ויישוב סכסוכים`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/toen_rabani.jpg`,
    href: "",
  },
  {
    title: `הסכם גירושין בהסכמה`,
    excerpt: `לא קל להחליט להתגרש. הדבר לרוב כרוך במלחמת התשה קשה בין שני הצדדים במהלכה נפגעים לא רק בני הזוג אלא גם הילדים. פתרון אחר להליך הגירושין הוא עריכת הסכם גירושין בהסכמה. בני זוג שהחליטו להתגרש במינימום מ`,
    category: `משפטיים`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/devorce_ring.jpg`,
    href: "",
  },
  {
    title: `הליך גירושין ברבנות`,
    excerpt: `הליך גירושין בבית הדין הרבני\\nהדרך הנכונה לסיים את הקשר תוך שמירה על הזכויות, המשפחה והעתיד\\nכאשר בני זוג מגיעים למסקנה כי אין עוד אפשרות להמשיך את חיי הנישואין, ניצבת בפניהם אחת ההחלטות המשמעותיות בי`,
    category: `משפטיים`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/Giroshien-1.png`,
    href: "",
  },
  {
    title: `מגשר גירושין`,
    excerpt: `זוגיות איננה דבר פשוט והדברים עשויים להפוך לקשים אף יותר לאחר הנישואין. מגורים משותפים במשך תקופה ארוכה, ילדים, חובות, לחצים בעבודה – כל אלה עשויים להוביל את הזוג לפנות אל מגשר גירושין. תפקידו של מגשר`,
    category: `משפטיים`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/yeutz.jpg`,
    href: "",
  },
  {
    title: `טוען רבני בתל אביב`,
    excerpt: `לא כדאי למהר לעשות החלטות פזיזות כשהדבר נוגע לגירושין. כרוך בכך תהליך לא קל אשר מקשה הן על בני הזוג והן על ילדיהם. אך במידה והחלטתם על כך – יתכן ותזדקקו לשירותיו של טוען רבני. כל אחד מבני הזוג יכול לב`,
    category: `משפטיים`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/judge.jpg`,
    href: "",
  },
  {
    title: `שלום בית`,
    excerpt: `נושא שלום בית הוא נושא חמקמק שיש להבהירו כאשר מדובר בהליך גירושין. כאשר בני הזוג מסתכסכים באופן תכוף ומרגישים שאין ברירה אחרת אלא להתגרש, פעמים רבות קורה כי אחד מבני הזוג מצהיר על רצונו להתגרש בעוד בן`,
    category: `הלכתיים - בין בני זוג`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/red_heart.jpg`,
    href: "",
  },
  {
    title: `תביעת גירושין`,
    excerpt: `בני זוג רבים אשר נמצאים במשבר עמוק ביחסיהם מבינים בשלב מסוים כי אין להם ברירה אלא להגיש תביעת גירושין. בתחילת התהליך ניתן עוד לחשוב על הליך כמו גירושין בהסכמה או על הליך גישור במהלכו בני הזוג יוכלו לה`,
    category: `הלכתיים - בין בני זוג`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/home_break.jpg`,
    href: "",
  },
  {
    title: `ייעוץ לגירושין`,
    excerpt: `נישואין, הצעד הראשון להגשמה עצמית וייעוד של כל אדם, אולם רבות קורה שהנישואין אינם עולים יפה, על כן קיבלנו דרך לתקן את המעוות, ויכול האדם לתת גט פיטורין לאשתו ולשחררה, מתוך ידיעה כי בוודאי נכון יותר שז`,
    category: `טיפול זוגי בנישואין`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/yeutz_legerushin.jpg`,
    href: "",
  },
  {
    title: `גביית כתובה מוגזמת`,
    excerpt: `במאמר זה נעסוק בנושא רגיש וחשוב אשר מעסיק רבים מדייני בתי הדין הרבניים בכל מיני קונסטלציות שונות ומגוונות. \\"גביית כתובה מוגזמת ומופרזת שלעיתים הסכום הנקוב בה מסתכם במיליוני שקלים\\" בעיקר נתמקד בשאלה `,
    category: `הלכתיים - בין בני זוג`,
    date: `אוגוסט 3, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/08/ketoba.png`,
    href: "",
  },
  {
    title: `מזונות זמניים בבית הדין`,
    excerpt: `רבים מהמתגרשים בוחרים בדרך הקלה שהיא הסכם גירושין, המכיל את כל הפרמטרים הנדרשים כולל מזונות ומזונות זמניים. אך ישנם פעמים שאין מנוס מפאת, שנשללה האפשרות ליצור הסכם גירושין המוסכם על הצדדים. ונאלצים אנ`,
    category: `משפטיים`,
    date: `יולי 22, 2020`,
    img: `https://meir-asor.co.il/wp-content/uploads/2020/07/gold_bridge.jpg`,
    href: "",
  }
];

// Share buttons component
function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = pageUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2" dir="rtl">
      <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
        <Share2 size={13} />
        שתף:
      </span>
      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        title="שתף בוואטסאפ"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: "#25D366", color: "white" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        title="שתף בפייסבוק"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: "#1877F2", color: "white" }}
      >
        <Facebook size={15} />
      </a>
      {/* Copy link */}
      <button
        onClick={handleCopy}
        title={copied ? "הועתק!" : "העתק קישור"}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: copied ? "#6B7C5C" : "var(--brand-gold)", color: "white" }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

// Article modal component
function ArticleModal({ article, onClose }: { article: typeof articles[0] | null; onClose: () => void }) {
  useEffect(() => {
    if (article) {
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [article]);

  if (!article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "white" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: "rgba(0,0,0,0.3)", color: "white" }}
          aria-label="סגור"
        >
          ✕
        </button>

        {/* Image */}
        {article.img && (
          <div className="aspect-[16/7] overflow-hidden">
            <img src={article.img} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="p-8 text-right" dir="rtl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(196,149,106,0.15)", color: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>
              {article.category}
            </span>
            <span className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{article.date}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
            {article.title}
          </h2>
          <div
            className="text-base leading-loose"
            style={{ color: "#3A2A1E", fontFamily: "'Assistant', sans-serif", whiteSpace: "pre-wrap" }}
          >
            {article.excerpt}
          </div>
          {/* Share buttons */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: "rgba(196,149,106,0.15)" }}>
            <ShareButtons title={article.title} />
          </div>

          <div className="mt-5 pt-5 border-t flex items-center justify-between" style={{ borderColor: "rgba(196,149,106,0.2)" }}>
            <a
              href="/#contact"
              className="btn-cta"
              onClick={onClose}
            >
              לפגישת ייעוץ חינם
              <ArrowLeft size={16} />
            </a>
            <span className="text-sm" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
              מאיר שמעון עשור
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  const [activeCategory, setActiveCategory] = useState("הכל");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null);

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === "הכל" || a.category === activeCategory;
    const matchSearch = a.title.includes(search) || a.excerpt.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "var(--brand-cream)" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="pt-32 pb-16 text-right"
        style={{ background: "var(--brand-dark)" }}
      >
        <div className="container mx-auto px-4">
          <AnimatedSection delay={100}>
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-sm mb-6 opacity-70 hover:opacity-100 transition-opacity" style={{ color: "var(--brand-gold)" }}>
                <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
                חזרה לדף הבית
              </a>
            </Link>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: "rgba(196,149,106,0.2)", color: "var(--brand-gold)", border: "1px solid rgba(196,149,106,0.3)" }}>
              <BookOpen size={14} />
              מאמרים מקצועיים
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
              ידע שמחזק אתכם
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p className="text-white/75 max-w-xl leading-relaxed" style={{ fontFamily: "'Assistant', sans-serif" }}>
              {filtered.length} מאמרים מקצועיים בנושאי גישור, טיפול זוגי, ייעוץ משפטי, הלכה ופסיכולוגיה יהודית — מאת מאיר שמעון עשור.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 sticky top-16 z-30 shadow-sm" style={{ background: "white", borderBottom: "1px solid rgba(196,149,106,0.15)" }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brand-mid)" }} />
              <input
                type="text"
                placeholder="חיפוש מאמרים..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  border: "1px solid rgba(196,149,106,0.3)",
                  fontFamily: "'Assistant', sans-serif",
                  color: "var(--brand-dark)",
                  background: "var(--brand-cream)",
                }}
              />
            </div>
            {/* Categories */}
            <div className="flex flex-wrap gap-2 justify-end">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: activeCategory === cat ? "var(--brand-gold)" : "var(--brand-cream)",
                    color: activeCategory === cat ? "white" : "var(--brand-dark)",
                    border: "1px solid rgba(196,149,106,0.3)",
                    fontFamily: "'Assistant', sans-serif",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Articles grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen size={40} className="mx-auto mb-4 opacity-30" style={{ color: "var(--brand-mid)" }} />
              <p style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>לא נמצאו מאמרים תואמים</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((a, i) => (
                <AnimatedSection key={a.title} delay={i * 50}>
                  <button
                    onClick={() => setSelectedArticle(a)}
                    className="block w-full text-right rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer"
                    style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)", boxShadow: "0 2px 12px rgba(92,64,51,0.06)" }}
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={a.img}
                        alt={a.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <div className="p-5 text-right">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(196,149,106,0.12)", color: "var(--brand-gold)", fontFamily: "'Assistant', sans-serif" }}>
                          <Tag size={10} className="inline ml-1" />
                          {a.category}
                        </span>
                        <span className="text-xs" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>{a.date}</span>
                      </div>
                      <h3 className="font-bold text-base leading-snug mb-2" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
                        {a.title}
                      </h3>
                      <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: "#4A3728", fontFamily: "'Assistant', sans-serif" }}>
                        {a.excerpt}
                      </p>
                      <div className="flex items-center justify-end">
                        <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--brand-gold)" }}>
                          קרא עוד
                          <ArrowLeft size={14} />
                        </div>
                      </div>
                    </div>
                  </button>
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: "var(--brand-dark)" }}>
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Noto Serif Hebrew', serif" }}>
              יש לך שאלה שלא מצאת תשובה?
            </h2>
            <p className="text-white/70 mb-6" style={{ fontFamily: "'Assistant', sans-serif" }}>
              פגישת ייעוץ ראשונית ללא עלות וללא התחייבות
            </p>
            <a href="/#contact" className="btn-cta">
              קבע פגישה עכשיו
              <ArrowLeft size={16} />
            </a>
          </AnimatedSection>
        </div>
      </section>

      {/* Article Modal */}
      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />

      <WhatsAppFloat />
    </div>
  );
}
