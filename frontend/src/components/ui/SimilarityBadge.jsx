import React from "react";

// Peta badge status kemiripan (AMAN / PERLU_REVIEW / MIRIP) — konsisten lintas halaman.
export const SIMILARITY_STYLES = {
  MIRIP: { className: "bg-red-100 text-red-700", label: "Mirip" },
  PERLU_REVIEW: { className: "bg-yellow-100 text-yellow-700", label: "Perlu Review" },
  AMAN: { className: "bg-green-100 text-green-700", label: "Aman" },
};

const SimilarityBadge = ({
  status,
  className = "px-2 py-1 rounded text-xs font-medium",
  children,
}) => {
  const cfg = SIMILARITY_STYLES[status] || SIMILARITY_STYLES.AMAN;
  return (
    <span className={`${className} ${cfg.className}`}>
      {children ?? status}
    </span>
  );
};

export default SimilarityBadge;
