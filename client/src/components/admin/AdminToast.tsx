import { useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  msg: string;
}

let _nextId = 1;

/**
 * Hook that returns a toast list and a `showToast` dispatcher.
 * Toasts auto-dismiss after 3.5 s.
 */
export function useAdminToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, msg: string) => {
    const id = _nextId++;
    setToasts(prev => [...prev, { id, type, msg }]);
    setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  return { toasts, showToast, dismiss };
}

const BG: Record<ToastType, string> = {
  success: "#6B7C5C",
  error: "#dc2626",
  info: "#5C4033",
};

const ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  info: <CheckCircle size={16} />,
};

/**
 * Toast container — place once in the admin page root.
 */
export function AdminToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div
      className="fixed top-4 left-1/2 z-[200] flex flex-col gap-2 pointer-events-none"
      style={{ transform: "translateX(-50%)", minWidth: 280 }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl pointer-events-auto"
          style={{
            background: BG[t.type],
            color: "white",
            fontFamily: "'Assistant', sans-serif",
            animation: "toast-in 0.22s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          {ICON[t.type]}
          <span className="flex-1 text-right">{t.msg}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
      `}</style>
    </div>
  );
}
