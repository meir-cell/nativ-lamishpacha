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

## גיבוי
- [x] הוספת endpoint לשרת: GET /api/backup/full — מייצא MySQL dump + קוד כ-ZIP
- [x] הגנה על endpoint הגיבוי — רק owner מורשה
- [x] הוספת עמוד גיבוי בפאנל הניהול (/nlp/admin/backup) עם כפתורי הורדה
- [x] בדיקה ו-checkpoint
