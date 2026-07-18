import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

const QUOTES = [
  "Pendidikan adalah senjata paling ampuh untuk mengubah dunia. — Nelson Mandela",
  "Sukses adalah hasil dari kerja keras, belajar dari kegagalan, dan tidak pernah menyerah.",
  "Ilmu yang bermanfaat adalah sebaik-baik bekal untuk masa depan.",
  "Perjuanganmu tidak berakhir di sini — ini adalah awal dari perjalanan yang lebih besar.",
  "Bermimpilah setinggi langit. Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang. — Ir. Soekarno",
  "Skripsi yang baik adalah skripsi yang selesai — dan kamu telah membuktikannya!",
];

// Overlay satu layar penuh dengan hujan confetti untuk merayakan kelulusan.
const GraduationCelebration = ({ nama, onClose }) => {
  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    []
  );

  const confetti = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 4,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
      })),
    []
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.7; }
        }
      `}</style>

      {/* Hujan confetti */}
      {confetti.map((c, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-sm pointer-events-none"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 0.5,
            backgroundColor: c.color,
            animation: `confetti-fall ${c.duration}s linear ${c.delay}s infinite`,
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center"
      >
        <button
          onClick={onClose}
          aria-label="Tutup perayaan"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl mb-4"
        >
          🎓
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Selamat, {nama}! 🎉
        </h1>
        <p className="text-gray-600 mb-4">
          Kamu telah menyelesaikan skripsi dan bimbinganmu telah diarsipkan.
          Perjuangan panjangmu membuahkan hasil!
        </p>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800 italic">
          "{quote}"
        </div>

        <button
          onClick={onClose}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-medium transition"
        >
          Terima kasih! 🙌
        </button>
      </motion.div>
    </div>
  );
};

export default GraduationCelebration;
