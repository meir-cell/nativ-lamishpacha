import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { useTTSPlayer } from "@/hooks/useTTSPlayer";

interface ListenButtonProps {
  text: string;
  label?: string;
}

export function ListenButton({ text, label = "האזן לתוכן" }: ListenButtonProps) {
  const { status, play } = useTTSPlayer(text);

  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const isError = status === "error";

  return (
    <button
      onClick={play}
      title={isPlaying ? "עצור הקראה" : label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 20px",
        borderRadius: "50px",
        border: `2px solid ${isError ? "rgba(229,62,62,0.5)" : "rgba(196,149,106,0.4)"}`,
        background: isPlaying
          ? "rgba(196,149,106,0.15)"
          : "rgba(196,149,106,0.08)",
        color: isError ? "#C53030" : "#C4956A",
        fontFamily: "'Assistant', sans-serif",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        minHeight: "44px",
      }}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isPlaying ? (
        <VolumeX size={16} />
      ) : (
        <Volume2 size={16} />
      )}
      {isError
        ? "שגיאה — נסה שוב"
        : isLoading
        ? "טוען..."
        : isPlaying
        ? "עצור הקראה"
        : label}
    </button>
  );
}
