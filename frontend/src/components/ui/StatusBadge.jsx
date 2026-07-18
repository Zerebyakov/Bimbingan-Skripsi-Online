import React from "react";

// Peta warna status pengajuan — satu sumber untuk halaman admin, dosen, dan mahasiswa.
export const STATUS_STYLES = {
  diterima: "bg-green-100 text-green-700",
  revisi: "bg-yellow-100 text-yellow-700",
  diajukan: "bg-blue-100 text-blue-700",
  ditolak: "bg-red-100 text-red-700",
};

const DEFAULT_STYLE = "bg-gray-100 text-gray-700";

// className mengatur bentuk badge per halaman (rounded / pill);
// warna selalu diambil dari STATUS_STYLES agar konsisten.
const StatusBadge = ({
  status,
  className = "px-2 py-1 rounded text-xs font-medium capitalize",
  children,
}) => (
  <span className={`${className} ${STATUS_STYLES[status] || DEFAULT_STYLE}`}>
    {children ?? status}
  </span>
);

export default StatusBadge;
