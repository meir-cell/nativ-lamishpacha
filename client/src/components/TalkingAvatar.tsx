/**
 * TalkingAvatar — מציג דמות מדברת (גבר או אישה) בזמן קריינות.
 * הדמות נבחרת לפי סוג הקול: male → גבר, female → אישה.
 * תמונה סטטית עם אינדיקטור דיבור בתחתית התמונה.
 */

const AVATAR_MALE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663762108963/5wEdAVL3HyJ4sgYjBDAtJ5/avatar_male-kgP7Y7q3HFZNXFmJUr7B6E.webp";
const AVATAR_FEMALE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663762108963/5wEdAVL3HyJ4sgYjBDAtJ5/avatar_female-EAZpWHMTb2NJ7c5rJBKsTK.webp";

interface TalkingAvatarProps {
  isSpeaking: boolean;
  gender: "male" | "female";
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function TalkingAvatar({
  isSpeaking,
  gender,
  isMinimized = false,
  onToggleMinimize,
}: TalkingAvatarProps) {
  const avatarSrc = gender === "female" ? AVATAR_FEMALE : AVATAR_MALE;
  const avatarAlt = gender === "female" ? "המדריכה" : "המדריך";
  const speakingLabel = gender === "female" ? "🎙 מדברת..." : "🎙 מדבר...";



  if (isMinimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className="fixed bottom-20 left-4 z-40 w-14 h-14 rounded-full overflow-hidden border-2 shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{
          borderColor: isSpeaking ? "#F0C040" : "#555",
          boxShadow: isSpeaking ? "0 0 12px rgba(240,192,64,0.6)" : "0 2px 8px rgba(0,0,0,0.4)",
        }}
        title="הצג מדריך"
        aria-label="הצג מדריך"
      >
        <img
          src={avatarSrc}
          alt={avatarAlt}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 30%" }}
        />
        {isSpeaking && (
          <span
            className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-full"
            style={{
              background: "linear-gradient(90deg, #F0C040, #C9A84C)",
              animation: "pulse 0.6s ease-in-out infinite alternate",
            }}
          />
        )}
      </button>
    );
  }

  return (
    <div
      className="relative flex flex-col items-center select-none"
      style={{ width: 140, minWidth: 120 }}
    >
      {/* Label */}
      <div
        className="text-xs font-bold mb-1 px-2 py-0.5 rounded-full"
        style={{
          background: isSpeaking
            ? "linear-gradient(90deg,#C9A84C,#F0C040)"
            : "rgba(255,255,255,0.1)",
          color: isSpeaking ? "#1a1a2e" : "#aaa",
          transition: "all 0.4s ease",
          fontSize: "0.65rem",
          letterSpacing: "0.03em",
        }}
      >
        {isSpeaking ? speakingLabel : avatarAlt}
      </div>

      {/* Avatar container */}
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer"
        style={{
          width: 120,
          height: 160,
          border: isSpeaking
            ? "2px solid #F0C040"
            : "2px solid rgba(255,255,255,0.15)",
          boxShadow: isSpeaking
            ? "0 0 20px rgba(240,192,64,0.4), 0 4px 16px rgba(0,0,0,0.5)"
            : "0 4px 16px rgba(0,0,0,0.4)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          animation: isSpeaking ? "avatarBob 1.8s ease-in-out infinite" : "none",
          background: "#f5f5f5",
        }}
        onClick={onToggleMinimize}
        title="לחץ למזעור"
      >
        {/* Face image */}
        <img
          src={avatarSrc}
          alt={avatarAlt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 20%",
            display: "block",
          }}
        />


        {/* Speaking indicator bar at bottom */}
        {isSpeaking && (
          <div
            className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 pb-1"
            style={{
              height: 18,
              background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
            }}
          >
            {[0.4, 0.8, 1.0, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: `${h * 12}px`,
                  background: "#F0C040",
                  borderRadius: 2,
                  animation: `waveBar 0.${5 + i}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Minimize button */}
      <button
        onClick={onToggleMinimize}
        className="mt-1 text-xs opacity-50 hover:opacity-80 transition-opacity"
        style={{ color: "#aaa", fontSize: "0.6rem" }}
        aria-label="מזעור המדריך"
      >
        ▼ מזעור
      </button>

      {/* CSS keyframes */}
      <style>{`
        @keyframes avatarBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes waveBar {
          0% { transform: scaleY(0.4); opacity: 0.6; }
          100% { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
