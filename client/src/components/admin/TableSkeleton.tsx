/**
 * TableSkeleton — animated shimmer rows for admin table loading states.
 * Usage: <TableSkeleton cols={6} rows={5} />
 */
export function TableSkeleton({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .sk-cell {
          background: linear-gradient(90deg, #f0ebe4 25%, #e8e0d5 50%, #f0ebe4 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b" style={{ borderColor: "rgba(196,149,106,0.08)" }}>
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="py-3 px-4">
              <div
                className="sk-cell"
                style={{
                  height: 14,
                  width: ci === 0 ? "75%" : ci === cols - 1 ? 60 : "55%",
                  marginRight: ci === 0 ? "auto" : undefined,
                  marginLeft: ci === cols - 1 ? "auto" : undefined,
                  margin: ci > 0 && ci < cols - 1 ? "0 auto" : undefined,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
