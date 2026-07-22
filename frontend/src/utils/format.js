// Format skor kemiripan: 4 desimal untuk nilai analitis, 2 desimal untuk ringkasan badge.
export const formatScore = (value, digits = 4) => Number(value || 0).toFixed(digits);

// Format skor kemiripan sebagai persentase yang ramah orang awam
// (skor 0-1 dari model → "95.0%"). digits 0 untuk ringkasan, 1 untuk detail.
export const formatPercent = (value, digits = 1) =>
  `${(Number(value || 0) * 100).toFixed(digits)}%`;

// Ambang "sangat mirip" — selaras dengan strong_threshold di ml-service (app.py).
export const STRONG_SIMILARITY_THRESHOLD = 0.85;

// Tingkat kemiripan per kandidat (sistem tiga tingkat):
// - sangat_mirip  : skor >= strong (hampir duplikat)
// - perlu_ditinjau: skor >= threshold tervalidasi (0.44) tetapi < strong
// - aman          : di bawah ambang keputusan
export const getSimilarityLevel = (score, threshold, strong) => {
  const s = Number(score || 0);
  const th = Number(threshold ?? 0.44);
  const st = Number(strong ?? STRONG_SIMILARITY_THRESHOLD);
  if (s >= st) return "sangat_mirip";
  if (s >= th) return "perlu_ditinjau";
  return "aman";
};

export const SIMILARITY_LEVEL_META = {
  sangat_mirip: { label: "Sangat mirip", className: "bg-red-100 text-red-700" },
  perlu_ditinjau: { label: "Perlu ditinjau", className: "bg-yellow-100 text-yellow-700" },
  aman: { label: "Di bawah ambang", className: "bg-green-100 text-green-700" },
};
