// Unsubscribe & self-delete page — reached via link in the thank-you email
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Unsubscribe() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const [confirmed, setConfirmed] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tokenData, isLoading } = trpc.lessonProgress.validateUnsubscribeToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const deleteMutation = trpc.lessonProgress.unsubscribeAndDelete.useMutation({
    onSuccess: () => setDeleted(true),
    onError: (e) => setError(e.message),
  });

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>⚠️</div>
          <h1 style={styles.title}>קישור לא תקין</h1>
          <p style={styles.body}>הקישור שהגעת דרכו אינו תקין. אנא השתמש בקישור שנשלח אליך במייל.</p>
          <button style={styles.btn} onClick={() => navigate("/")}>חזור לדף הבית</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ ...styles.icon, animation: "spin 1s linear infinite" }}>⏳</div>
          <p style={styles.body}>מאמת קישור...</p>
        </div>
      </div>
    );
  }

  if (!tokenData?.valid) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>❌</div>
          <h1 style={styles.title}>קישור לא נמצא</h1>
          <p style={styles.body}>הקישור כבר שומש או שאינו תקין.</p>
          <button style={styles.btn} onClick={() => navigate("/")}>חזור לדף הבית</button>
        </div>
      </div>
    );
  }

  if (deleted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.icon}>✅</div>
          <h1 style={styles.title}>החשבון נמחק</h1>
          <p style={styles.body}>
            {tokenData.fullName ? `${tokenData.fullName.split(" ")[0]}, ` : ""}
            חשבונך הוסר בהצלחה מהמערכת. לא תקבל יותר מיילים מאיתנו.
          </p>
          <p style={{ ...styles.body, color: "#8888aa", fontSize: "14px", marginTop: "12px" }}>
            אם תרצה לחזור בעתיד — תמיד אפשר להירשם מחדש.
          </p>
          <button style={styles.btn} onClick={() => navigate("/")}>חזור לדף הבית</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>🗑️</div>
        <h1 style={styles.title}>הסרה ומחיקת חשבון</h1>

        <p style={styles.body}>
          שלום {tokenData.fullName?.split(" ")[0]},<br />
          האם אתה בטוח שברצונך למחוק את חשבונך ולהסיר את עצמך מרשימת התפוצה?
        </p>

        <div style={styles.warningBox}>
          <strong style={{ color: "#F0C040" }}>שים לב:</strong>
          <ul style={{ margin: "8px 0 0", paddingRight: "20px", color: "#c8c8e0", fontSize: "14px", lineHeight: "1.7" }}>
            <li>כל נתוני ההתקדמות שלך יימחקו</li>
            <li>לא תקבל יותר עדכונים מהקורס</li>
            <li>ניתן להירשם מחדש בכל עת</li>
          </ul>
        </div>

        {error && (
          <p style={{ color: "#ff6b6b", fontSize: "14px", marginBottom: "16px" }}>{error}</p>
        )}

        {!confirmed ? (
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              style={{ ...styles.btn, background: "#1a1a2e", border: "1px solid #333355", color: "#c8c8e0" }}
              onClick={() => navigate("/")}
            >
              ביטול — אני נשאר
            </button>
            <button
              style={{ ...styles.btn, background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff8080" }}
              onClick={() => setConfirmed(true)}
            >
              כן, מחק את חשבוני
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#ff8080", fontSize: "14px", marginBottom: "16px" }}>
              לחץ שוב לאישור סופי — פעולה זו אינה הפיכה
            </p>
            <button
              style={{ ...styles.btn, background: "rgba(255,80,80,0.25)", border: "1px solid rgba(255,80,80,0.5)", color: "#ff6060" }}
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ unsubscribeToken: token })}
            >
              {deleteMutation.isPending ? "מוחק..." : "אישור סופי — מחק חשבון"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0a0a12",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    direction: "rtl",
  },
  card: {
    background: "#0f0f1a",
    border: "1px solid #1e1e35",
    borderRadius: "20px",
    padding: "48px 40px",
    maxWidth: "520px",
    width: "100%",
    textAlign: "center",
  },
  icon: {
    fontSize: "48px",
    marginBottom: "20px",
  },
  title: {
    color: "#F0C040",
    fontSize: "24px",
    fontWeight: 700,
    margin: "0 0 16px",
  },
  body: {
    color: "#c8c8e0",
    fontSize: "16px",
    lineHeight: "1.7",
    margin: "0 0 24px",
  },
  warningBox: {
    background: "rgba(201,168,76,0.08)",
    border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "28px",
    textAlign: "right",
  },
  btn: {
    display: "inline-block",
    background: "linear-gradient(135deg,#c9a84c,#F0C040)",
    color: "#0a0a12",
    fontWeight: 700,
    fontSize: "15px",
    padding: "12px 32px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
  },
};
