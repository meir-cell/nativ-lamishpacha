import { Link } from "wouter";
import {
  BookOpen, Users, BarChart3, Settings, Volume2, MessageSquare,
  FileText, Award, ExternalLink, ChevronLeft
} from "lucide-react";

const NLP_ADMIN_SECTIONS = [
  {
    href: "/nlp/admin",
    icon: BarChart3,
    title: "דשבורד קורס NLP",
    desc: "סטטיסטיקות כלליות: רשומים, שיעורים שהושלמו, ציונים ממוצעים",
    color: "#6B7C5C",
  },
  {
    href: "/nlp/admin/registrations",
    icon: Users,
    title: "ניהול רישומים",
    desc: "רשימת כל הנרשמים, סטטוס, תאריך הצטרפות, התקדמות",
    color: "#C4956A",
  },
  {
    href: "/nlp/admin/updates",
    icon: BookOpen,
    title: "עדכוני תוכן שיעורים",
    desc: "הוספת חומר לימוד נוסף לשיעורים קיימים: סעיפים, נקודות מפתח, תרגילים",
    color: "#5C4033",
  },
  {
    href: "/nlp/admin/surveys",
    icon: MessageSquare,
    title: "סקרים ובחינות",
    desc: "צפייה בתוצאות סקרי שביעות רצון ובחינות מודולים",
    color: "#6B7C5C",
  },
  {
    href: "/nlp/admin/tts-editor",
    icon: Volume2,
    title: "עורך TTS",
    desc: "עריכת טקסטים לנרציה, הגדרות קול, מהירות ומודל",
    color: "#C4956A",
  },
  {
    href: "/nlp/admin/pronunciation",
    icon: FileText,
    title: "מילון הגייה",
    desc: "הגדרת הגיית מילים מיוחדות לשיפור איכות ה-TTS",
    color: "#5C4033",
  },
  {
    href: "/nlp/admin/settings",
    icon: Settings,
    title: "הגדרות קורס",
    desc: "הגדרות כלליות: שם הקורס, מחיר, תנאים, הגדרות TTS",
    color: "#6B7C5C",
  },
];

export default function AdminNLP() {
  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
          ניהול קורס NLP
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
          ניהול מלא של קורס NLP Practitioner המחובר לאתר
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: "rgba(196,149,106,0.08)", border: "1px solid rgba(196,149,106,0.2)" }}>
        <BookOpen size={18} style={{ color: "var(--brand-gold)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--brand-dark)", fontFamily: "'Assistant', sans-serif" }}>
            מערכת ניהול הקורס
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
            הקורס מנוהל דרך מערכת ייעודית. לחץ על כל קטגוריה לניהול מלא.
            הסשן הנוכחי מועבר אוטומטית — אין צורך להתחבר מחדש.
          </p>
        </div>
      </div>

      {/* Grid of sections */}
      <div className="grid grid-cols-2 gap-4">
        {NLP_ADMIN_SECTIONS.map(section => (
          <Link key={section.href} href={section.href}>
            <div
              className="rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 flex items-start gap-4"
              style={{ background: "white", border: "1px solid rgba(196,149,106,0.15)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${section.color}18` }}
              >
                <section.icon size={22} style={{ color: section.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <ChevronLeft size={16} style={{ color: "var(--brand-mid)" }} />
                  <h3 className="font-bold text-sm" style={{ color: "var(--brand-dark)", fontFamily: "'Noto Serif Hebrew', serif" }}>
                    {section.title}
                  </h3>
                </div>
                <p className="text-xs mt-1 leading-relaxed text-right" style={{ color: "var(--brand-mid)", fontFamily: "'Assistant', sans-serif" }}>
                  {section.desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Direct link */}
      <div className="mt-6 text-center">
        <a
          href="/nlp/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--brand-dark)", color: "white", fontFamily: "'Assistant', sans-serif" }}
        >
          <ExternalLink size={14} />
          פתח מערכת ניהול NLP בחלון חדש
        </a>
      </div>
    </div>
  );
}
