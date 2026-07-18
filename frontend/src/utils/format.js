// Format skor kemiripan: 4 desimal untuk nilai analitis, 2 desimal untuk ringkasan badge.
export const formatScore = (value, digits = 4) => Number(value || 0).toFixed(digits);
