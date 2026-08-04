# Project TODO

- [x] הוספת HYP credentials כ-secrets (HYP_USERNAME, HYP_PASSWORD, HYP_TERMINAL_NUMBER)
- [x] בניית server endpoint /api/hyp/create-payment ליצירת דף תשלום
- [x] יצירת קומפוננט Payment בפרונטאנד עם שדה סכום חופשי וכפתור "לתשלום"
- [x] הוספת דף PaymentSuccess ודף PaymentError
- [x] רישום נתיבים ב-App.tsx
- [x] הוספת כפתור "לתשלום" בתחתית האתר (Footer)
- [ ] קבלת אישור SSLHTTP מ-HYP למסוף 4502340126 (פנייה ל-supportyaad@hyp.co.il) — ממתין לאישור חיצוני
- [ ] בדיקת end-to-end של תשלום אמיתי לאחר קבלת האישור — ממתין לאישור חיצוני
- [x] העתקת כל תמונות meir-asor.co.il לאחסון קבוע (17 תמונות)
- [x] העתקת כל תמונות Unsplash לאחסון קבוע (5 תמונות)
- [x] העתקת כל תמונות cloudfront לאחסון קבוע (4 תמונות)
- [x] הסרת כפילות "גישור ככלי טיפולי בישוב סכסוכים בין בני זוג"
- [x] הסרת כפילויות "גירושין בהסכמה" (2 גרסאות ישנות)
- [x] הוספת מאמר "גירושין בהסכמה – הדרך המכבדת לסיום קשר הנישואין" עם שמע ותמונה
- [x] הוספת מאמר "חסיון בהליך הגישור" עם שמע ותמונה
- [x] יצירת TTS לכל 17 המאמרים שחסר להם שמע
- [x] עדכון כל 28 המאמרים עם audioSrc
- [x] הוספת ספר "באתי לגני" לדף הספרים עם תמונה מתאימה ותיאור
- [x] הוספת slug ייחודי לכל 7 הספרים ב-Books.tsx
- [x] עדכון כפתורי WhatsApp ופייסבוק לשלוח URL ספציפי (/books/:slug)
- [x] יצירת shared/books-data.ts עם מטאדטה לשרת (slug, title, subtitle, description, imageStorageKey)
- [x] הוספת endpoint /og-book-image/:slug.jpg שמחזיר תמונה ישירות (HTTP 200, ללא redirect)
- [x] הוספת OG middleware לנתיב /books/:slug עם og:title, og:description, og:image ייחודיים
- [x] הוספת route /books/:slug ב-App.tsx
- [x] שילוב קורס NLP Practitioner — 14 טבלאות DB, כל ה-routers, דפים, קומפוננטים, lib files
- [x] הוספת נתיבים /nlp/* לאתר נתיב למשפחה
- [x] תיקון כניסה לקורס NLP — הרחבת עמודת token מ-varchar(64) ל-varchar(512) בטבלת registrations
- [x] תיקון כל קישורי URL בדפי NLP — /admin → /nlp/admin, /chat → /nlp/chat, /terms → /nlp/terms, /forgot-password → /nlp/forgot-password
- [x] הוספת מפתח OpenAI API לפרויקט המאוחד לצורך TTS בשיעורים
- [x] שינוי ברירת מחדל של טאב כניסה ל"כניסה" (במקום "הרשמה")
- [x] הוספת route לדף נגישות NLP (/nlp/accessibility)

## כניסה לניהול — שיפורים נוספים
- [x] תיבת "זכור אותי" — שומרת session ל-30 יום (במקום 24 שעות)
- [x] קישור "שכחתי סיסמה" — מציג טופס איפוס סיסמה
- [x] עדכון server endpoint לתמוך ב-rememberMe (כולל הוספת כל endpoints חסרים: login, logout, me, activity-log, contacts, forgot-password, reset-password, backup)
- [x] checkpoint ו-deploy

## מערכת ניהול מלאה — פאנלים חדשים

### ניהול מאמרים
- [x] הוספת טבלת articles ל-DB (שלוג, כותרת, תקציר, תוכן, img, audioSrc, category, date, readTime, published)
- [x] הוספת tRPC procedures: articles.list, articles.get, articles.create, articles.update, articles.delete, articles.generateAudio
- [x] בניית AdminArticles.tsx — רשימת מאמרים עם חיפוש/סינון, עריכה inline, מחיקה
- [x] בניית ArticleEditor.tsx — עורך מאמר מלא: כותרת, תוכן markdown, תמונה, שמע, קטגוריה, תאריך (שולב ב-AdminArticles)
- [x] הוספת route /admin/articles ו-/admin/articles/:slug (הוסף כ-tab ב-Admin.tsx)

### ניהול קידום אורגני (SEO)
- [x] הוספת טבלת seo_settings ל-DB (page_key, title, description, og_title, og_description, og_image, keywords, canonical)
- [x] הוספת tRPC procedures: seo.getAll, seo.update
- [x] בניית AdminSEO.tsx — טבלה עם כל דפי האתר, עריכת meta tags לכל דף
- [x] שילוב SEO settings בדפי האתר (dynamic meta tags) — useSEO hook בכל דפי האתר הראשיים (Home, CoupleTherapy, Mediation, LegalAdvice, Articles, FAQ, Books)
- [x] הוספת route /admin/seo (הוסף כ-tab)

### ניהול קורס NLP
- [x] בניית AdminNLP.tsx — hub שמפנה לכל דפי הניהול של קורס NLP
- [x] הוספת לינק ל-/nlp/admin בניווט מערכת הניהול הראשית
- [x] הוספת route /admin/nlp (הוסף כ-tab)

### ניהול רכיבי האתר
- [x] הוספת טבלת site_content ל-DB (key, value, type: text/html/json, updated_at)
- [x] הוספת tRPC procedures: siteContent.getAll, siteContent.update
- [x] בניית AdminSiteContent.tsx — ניהול: Hero text, Services, About, Contact info, Footer
- [x] הוספת route /admin/site-content (הוסף כ-tab)

### ניווט מערכת הניהול
- [x] שדרוג Admin.tsx לתמיכה בניווט צד עם כל הפאנלים החדשים
- [x] הוספת sidebar navigation עם: פניות, מאמרים, SEO, קורס NLP, תוכן האתר, גיבוי, יומן

## שיפורי פאנל ניהול — אוגוסט 2026

- [x] הוספת ניהול ספרים לפאנל (CRUD לטבלת books)
- [x] הוספת ניהול שאלות נפוצות (FAQ) לפאנל (CRUD לטבלת faq)
- [x] הוספת דשבורד סטטיסטיקות (פניות לאורך זמן, מאמרים, רשומי NLP)
- [x] תיקון סנכרון תוכן האתר — ערכי DB יגברו על ברירות מחדל
- [x] אימות מחיקת פניות end-to-end
- [x] הוספת טבלאות books ו-faq לסכמת Drizzle ודחיפה ל-DB
- [x] הוספת routers בשרת לספרים ו-FAQ

## סנכרון תוכן האתר — השלמות

- [x] הוספת פרוצדורת tRPC ציבורית (publicSiteContent.getAll) ללא אימות אדמין
- [x] חיבור Home.tsx לנתוני site_content מה-DB (החלפת hardcoded texts)
- [x] נרמול מפתחות legacy ב-site_content (hero.title_line1 → hero.title.line1)

## שיפורי UX — אוגוסט 2026

- [x] skeleton loader לדשבורד סטטיסטיקות בזמן טעינת נתונים
- [x] חיפוש וסינון בפאנל ניהול ספרים
- [x] חיפוש וסינון בפאנל ניהול שאלות נפוצות
- [x] toast notifications לכל פעולות CRUD (יצירה, עדכון, מחיקה)

## תיקוני NLP Admin — אוגוסט 2026

- [x] תיקון קישורי ניווט ב-AdminSettings.tsx מ-/admin/... ל-/nlp/admin/...
- [x] תיקון הוראות SMTP לעברית (Railway Secrets)
- [x] תיקון getStats — מחזיר 0 בצורה חלקה כשטבלאות ריקות/חסרות
- [x] הוספת יצירה אוטומטית של כל טבלאות NLP בהפעלת השרת (registrations, lesson_progress, module_exam_results, certificates, satisfaction_surveys, lesson_positions)
- [x] אישור שנתיב /nlp/admin/updates קיים ב-App.tsx (404 ב-Railway היה בגלל ניסיון גישה ל-/admin/updates ללא nlp/)

## תיקוני RTL טבלאות — אוגוסט 2026

- [x] הזזת עמודת "פעולות" לצד ימין (ראשון ב-RTL) בטבלת ספרים
- [x] הזזת עמודת "פעולות" לצד ימין (ראשון ב-RTL) בטבלת מאמרים
- [x] הזזת עמודת "פעולות" לצד ימין (ראשון ב-RTL) בטבלת שאלות נפוצות
- [x] תיקון ownerProcedure לקבל admin_session cookie (תיקון טעינת דף רישומי NLP)

## שיפורי דף SEO — אוגוסט 2026

- [x] שדרוג דף ניהול SEO — עיצוב מקצועי עם לוח בקרה, ציון SEO, לשוניות (עריכה/תצוגה מקדימה/ניתוח)
- [x] הוספת כפתור "הצעת AI" לכל דף — יוצר כותרת, תיאור, מילות מפתח ו-OG אוטומטית
- [x] הוספת מונה תווים ויזואלי (ירוק/כתום/אדום) לשדות כותרת ותיאור Meta
- [x] תצוגה מקדימה של תוצאת גוגל ושיתוף ברשתות חברתיות
- [x] כפתור "ייצור AI לכל הדפים" — עיבוד סדרתי עם progress bar ומצב לכל דף
- [x] הגדרת SMTP ל-Gmail עם App Password
