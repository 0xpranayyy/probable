"use client";

import React from "react";

export default function Star({ watched, onClick, size = 20 }: { watched: boolean; onClick: () => void; size?: number }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      title={watched ? "Remove from watchlist" : "Add to watchlist"}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24"
        fill={watched ? "#F0568C" : "none"}
        stroke={watched ? "#F0568C" : "#A9A2BE"} strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
      </svg>
    </button>
  );
}
