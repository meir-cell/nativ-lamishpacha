/**
 * Email sending helper using nodemailer with SMTP.
 * Falls back gracefully when SMTP credentials are not configured.
 * Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Email] SMTP not configured — skipping email to", opts.to);
    return false;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@nlpcourse.co.il";
  try {
    await transporter.sendMail({ from, ...opts });
    console.log("[Email] Sent to", opts.to);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

/**
 * Build the HTML for the first-lesson thank-you email.
 */
export function buildFirstLessonEmail(opts: {
  fullName: string;
  lessonTitle: string;
  siteUrl: string;
  unsubscribeToken: string;
}): { subject: string; html: string; text: string } {
  const { fullName, lessonTitle, siteUrl, unsubscribeToken } = opts;
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${unsubscribeToken}`;
  const firstName = fullName.split(" ")[0];

  const subject = `תודה ${firstName}! סיימת את השיעור הראשון שלך ב-NLP Practitioner 🧠`;

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a12;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0f0f1a;border-radius:16px;overflow:hidden;border:1px solid #1e1e35;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:40px 40px 30px;text-align:center;border-bottom:2px solid #c9a84c;">
              <div style="font-size:40px;margin-bottom:12px;">🧠</div>
              <h1 style="margin:0;color:#F0C040;font-size:24px;font-weight:700;letter-spacing:-0.5px;">קורס NLP Practitioner</h1>
              <p style="margin:8px 0 0;color:#8888aa;font-size:14px;">מאיר שמעו עשור | NLP Trainer מוסמך</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <h2 style="margin:0 0 16px;color:#F0C040;font-size:22px;">שלום ${firstName} 👋</h2>

              <p style="margin:0 0 20px;color:#c8c8e0;font-size:16px;line-height:1.7;">
                כל הכבוד! סיימת את השיעור הראשון שלך —
                <strong style="color:#F0C040;">"${lessonTitle}"</strong>.
                זה צעד משמעותי בדרך להכרה עמוקה יותר של עצמך ושל האנשים סביבך.
              </p>

              <!-- Quote box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#1a1a2e;border-right:4px solid #c9a84c;border-radius:8px;padding:20px 24px;">
                    <p style="margin:0;color:#F0C040;font-size:15px;font-style:italic;line-height:1.7;">
                      "NLP אינו רק לימוד — זוהי דרך חיים. כל שלב בחיים מביא איתו הזדמנויות חדשות לצמיחה, ומי שמכיר את הכלים יכול לנצל אותן."
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;color:#c8c8e0;font-size:16px;line-height:1.7;">
                <strong style="color:#ffffff;">הקורס מתחדש מדי יום</strong> ממקורות מאמנים מובילים בעולם —
                מאמרים, מחקרים עדכניים וטכניקות חדשות מתווספות באופן שוטף.
                לכן חשוב לחזור על הקורס מפעם לפעם, לרענן את הכלים ולהתפתח בהתאם לשלב שאתה נמצא בו בחיים.
              </p>

              <!-- Feature list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#c9a84c;font-size:18px;padding-left:12px;">✦</td>
                        <td style="color:#c8c8e0;font-size:15px;line-height:1.6;">תכנים חדשים מתווספים ממחקרים אקדמיים עדכניים</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#c9a84c;font-size:18px;padding-left:12px;">✦</td>
                        <td style="color:#c8c8e0;font-size:15px;line-height:1.6;">טכניקות מאמנים מובילים בישראל ובעולם</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#c9a84c;font-size:18px;padding-left:12px;">✦</td>
                        <td style="color:#c8c8e0;font-size:15px;line-height:1.6;">כל שלב בחיים דורש כלים שונים — הקורס מתאים את עצמו</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#F0C040);color:#0a0a12;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
                      המשך ללמוד עכשיו ←
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#8888aa;font-size:14px;line-height:1.7;text-align:center;">
                בהצלחה בהמשך הדרך,<br/>
                <strong style="color:#c8c8e0;">מאיר שמעו עשור</strong><br/>
                <span style="color:#666688;">NLP Trainer מוסמך</span>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#080810;padding:20px 40px;border-top:1px solid #1e1e35;text-align:center;">
              <p style="margin:0 0 8px;color:#444466;font-size:12px;line-height:1.6;">
                קיבלת מייל זה כי נרשמת לקורס NLP Practitioner ובחרת לקבל עדכונים.
              </p>
              <p style="margin:0;color:#444466;font-size:12px;">
                <a href="${unsubscribeUrl}" style="color:#666688;text-decoration:underline;">הסר אותי מהרשימה ומחק את חשבוני</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `שלום ${firstName},

כל הכבוד! סיימת את השיעור הראשון שלך — "${lessonTitle}".

הקורס מתחדש מדי יום ממקורות מאמנים מובילים בעולם. חשוב לחזור מפעם לפעם ולהתפתח בהתאם לשלב שאתה נמצא בו בחיים.

המשך ללמוד: ${siteUrl}

בהצלחה,
מאיר שמעו עשור

---
להסרה ומחיקת חשבון: ${unsubscribeUrl}`;

  return { subject, html, text };
}

/**
 * Build the HTML for the 7-day re-engagement reminder email.
 */
export function buildReEngagementEmail(opts: {
  fullName: string;
  siteUrl: string;
  /** Direct URL to resume at the last lesson/slide viewed */
  resumeUrl?: string;
  lastLessonTitle: string;
  unsubscribeToken: string;
}): { subject: string; html: string; text: string } {
  const { fullName, siteUrl, resumeUrl, lastLessonTitle, unsubscribeToken } = opts;
  const ctaUrl = resumeUrl ?? siteUrl;
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${unsubscribeToken}`;
  const firstName = fullName.split(" ")[0];

  const subject = `${firstName}, הקורס מחכה לך 🧠 — תכנים חדשים נוספו!`;

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a12;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0f0f1a;border-radius:16px;overflow:hidden;border:1px solid #1e1e35;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:40px 40px 30px;text-align:center;border-bottom:2px solid #c9a84c;">
              <div style="font-size:40px;margin-bottom:12px;">🧠</div>
              <h1 style="margin:0;color:#F0C040;font-size:24px;font-weight:700;letter-spacing:-0.5px;">קורס NLP Practitioner</h1>
              <p style="margin:8px 0 0;color:#8888aa;font-size:14px;">מאיר שמעו עשור | NLP Trainer מוסמך</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <h2 style="margin:0 0 16px;color:#F0C040;font-size:22px;">שלום ${firstName}, התגעגענו! 👋</h2>

              <p style="margin:0 0 20px;color:#c8c8e0;font-size:16px;line-height:1.7;">
                עברו 7 ימים מאז הביקור האחרון שלך בקורס.
                השיעור האחרון שצפית בו היה
                <strong style="color:#F0C040;">"${lastLessonTitle}"</strong> —
                מוכן להמשיך?
              </p>

              <!-- Quote box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#1a1a2e;border-right:4px solid #c9a84c;border-radius:8px;padding:20px 24px;">
                    <p style="margin:0;color:#F0C040;font-size:15px;font-style:italic;line-height:1.7;">
                      "NLP הוא דרך חיים. כל שלב בחיים מביא הזדמנויות חדשות לצמיחה — מי שמכיר את הכלים יכול לנצל אותן."
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;color:#c8c8e0;font-size:16px;line-height:1.7;">
                <strong style="color:#ffffff;">תכנים חדשים נוספו לקורס</strong> מאז ביקורך האחרון —
                מאמרים, מחקרים עדכניים וטכניקות חדשות ממאמנים מובילים בעולם.
                חשוב לחזור מפעם לפעם ולהתפתח בהתאם לשלב שאתה נמצא בו בחיים.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#F0C040);color:#0a0a12;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
                      חזור ללמוד עכשיו ←
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#8888aa;font-size:14px;line-height:1.7;text-align:center;">
                בהצלחה בהמשך הדרך,<br/>
                <strong style="color:#c8c8e0;">מאיר שמעו עשור</strong><br/>
                <span style="color:#666688;">NLP Trainer מוסמך</span>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#080810;padding:20px 40px;border-top:1px solid #1e1e35;text-align:center;">
              <p style="margin:0 0 8px;color:#444466;font-size:12px;line-height:1.6;">
                קיבלת מייל זה כי נרשמת לקורס NLP Practitioner ובחרת לקבל עדכונים.
              </p>
              <p style="margin:0;color:#444466;font-size:12px;">
                <a href="${unsubscribeUrl}" style="color:#666688;text-decoration:underline;">הסר אותי מהרשימה ומחק את חשבוני</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `שלום ${firstName},

עברו 7 ימים מאז הביקור האחרון שלך בקורס.
השיעור האחרון שצפית בו היה "${lastLessonTitle}" — מוכן להמשיך?

תכנים חדשים נוספו לקורס מאז ביקורך האחרון. חשוב לחזור מפעם לפעם ולהתפתח.

חזור ללמוד: ${ctaUrl}

בהצלחה,
מאיר שמעו עשור

---
להסרה ומחיקת חשבון: ${unsubscribeUrl}`;

  return { subject, html, text };
}
