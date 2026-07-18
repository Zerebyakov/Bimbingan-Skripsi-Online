// Format skor kemiripan: 4 desimal untuk nilai analitis, 2 desimal untuk ringkasan badge.
export const formatScore = (value, digits = 4) => Number(value || 0).toFixed(digits);

// Format skor kemiripan sebagai persentase yang ramah orang awam
// (skor 0-1 dari model → "95.0%"). digits 0 untuk ringkasan, 1 untuk detail.
export const formatPercent = (value, digits = 1) =>
  `${(Number(value || 0) * 100).toFixed(digits)}%`;
