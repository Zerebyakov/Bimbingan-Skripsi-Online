import React, { useEffect, useState } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import { motion } from "framer-motion";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import {
  User,
  BookOpen,
  FileText,
  Bell,
  Loader2,
} from "lucide-react";

const DashboardMahasiswa = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${baseUrl}mahasiswa/dashboard`, {
          withCredentials: true,
        });
        setDashboardData(res.data.data);
      } catch (error) {
        console.error("Gagal memuat dashboard mahasiswa:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <MahasiswaLayout>
        <div className="flex justify-center items-center h-80 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Memuat data dashboard...
        </div>
      </MahasiswaLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MahasiswaLayout>
        <div className="text-center py-20 text-gray-500">
          Tidak ada data yang tersedia.
        </div>
      </MahasiswaLayout>
    );
  }

  const { mahasiswa, pengajuan, progress, notifikasi } = dashboardData;

  return (
    <MahasiswaLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Selamat Datang, {mahasiswa.nama_lengkap}
          </h1>
          <p className="text-gray-500 text-sm">
            Pantau perkembangan bimbingan dan pengajuan skripsimu di sini.
          </p>
        </div>

        {/* Info Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Mahasiswa */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white shadow-md rounded-xl p-5 border border-gray-100 flex items-center gap-4"
          >
            <div className="bg-gray-100 p-3 rounded-full">
              <User className="text-gray-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Mahasiswa</p>
              <p className="font-semibold text-gray-800">{mahasiswa.nama_lengkap}</p>
              <p className="text-sm text-gray-500">{mahasiswa.nim}</p>
            </div>
          </motion.div>

          {/* Status Pengajuan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white shadow-md rounded-xl p-5 border border-gray-100 flex items-center gap-4"
          >
            <div className="bg-gray-100 p-3 rounded-full">
              <FileText className="text-gray-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Status Pengajuan</p>
              {pengajuan ? (
                <>
                  <p
                    className={`font-semibold ${pengajuan.status === "diterima"
                      ? "text-green-600"
                      : pengajuan.status === "revisi"
                        ? "text-yellow-600"
                        : "text-gray-600"
                      }`}
                  >
                    {pengajuan.status?.toUpperCase()}
                  </p>
                  {pengajuan.rejection_reason && (
                    <p className="text-xs text-red-500 mt-1 italic">
                      {pengajuan.rejection_reason}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  Belum mengajukan judul skripsi.
                </p>
              )}
            </div>
          </motion.div>

          {/* Progress */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white shadow-md rounded-xl p-5 border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-2">
              <BookOpen className="text-gray-600" size={22} />
              <div>
                <p className="text-xs text-gray-500 uppercase">Progress Bimbingan</p>
                <p className="font-semibold text-gray-800">
                  Bab {progress/20 || 0} dari 5
                </p>
              </div>
            </div>
            {/* Progres Bar */}
            {(() => {
              // Ambil data BabSubmissions dari API dashboard
              const babList = dashboardData?.pengajuan?.BabSubmissions || [];

              // Hitung jumlah bab yang diterima
              const acceptedCount = babList.filter(
                (bab) => bab.status?.toUpperCase() === "DITERIMA"
              ).length;

              // Simpan ke progress visual
              const visualProgress = Math.min(acceptedCount, 5);
              const progressPercent = Math.min((visualProgress / 5) * 100, 100);

              // Simpan status setiap bab (jika ada)
              const babStatuses = Array.from({ length: 5 }, (_, i) => {
                const found = babList.find((bab) => bab.chapter_number === i + 1);
                return found ? found.status?.toUpperCase() : "BELUM ADA";
              });

              return (
                <>
                  {/* Progress Bar */}
                  <div className="relative w-full bg-gray-200 rounded-full h-3 mt-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 h-3 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    ></div>

                    {/* Titik Indikator BAB */}
                    {[1, 2, 3, 4, 5].map((bab, i) => {
                      const status = babStatuses[i];
                      let dotColor = "bg-gray-400";
                      if (status === "DITERIMA") dotColor = "bg-green-600";
                      else if (status === "REVISI") dotColor = "bg-yellow-500";
                      else if (status === "DITOLAK") dotColor = "bg-red-500";
                      else if (status === "MENUNGGU") dotColor = "bg-blue-400";

                      return (
                        <div
                          key={i}
                          className="absolute top-1/2 -translate-y-1/2"
                          style={{
                            left: `${(bab - 1) * 25}%`,
                            transform: "translateX(-50%)",
                          }}
                        >
                          <div className="group relative flex items-center justify-center">
                            <div
                              className={`w-3 h-3 rounded-full ${dotColor} ring-1 ring-white shadow-sm cursor-pointer`}
                            />
                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-30">
                              <div className="bg-gray-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap shadow-lg">
                                <div className="font-medium">BAB {bab}</div>
                                <div className="text-[11px] opacity-90">{status}</div>
                              </div>
                              <div className="w-2 h-2 bg-gray-800 rotate-45 mt-1 -ml-1.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Label BAB */}
                  <div className="flex justify-between mt-3 text-xs text-gray-500">
                    {[1, 2, 3, 4, 5].map((bab, i) => {
                      const status = babStatuses[i];
                      const labelColor =
                        status === "DITERIMA"
                          ? "text-green-600 font-semibold"
                          : status === "REVISI"
                            ? "text-yellow-600 font-medium"
                            : status === "DITOLAK"
                              ? "text-red-600 font-medium"
                              : "text-gray-400";
                      return (
                        <span key={bab} className={labelColor}>
                          BAB {bab}
                        </span>
                      );
                    })}
                  </div>

                  {/* Persentase */}
                  <div className="text-right mt-2 text-xs text-gray-500">
                    {progressPercent}%
                  </div>
                </>
              );
            })()}
          </motion.div>


        </div>

        {/* Dosen Pembimbing */}
        {pengajuan ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white shadow-md rounded-xl p-6 border border-gray-100 mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Dosen Pembimbing
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[pengajuan.Pembimbing1, pengajuan.Pembimbing2, pengajuan.Pembimbing3]
                .filter(Boolean)
                .map((pembimbing, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <p className="text-gray-800 font-medium">{pembimbing.nama}</p>
                    <p className="text-sm text-gray-500">{pembimbing.bidang_keahlian}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {pembimbing.email_institusi}
                    </p>
                  </div>
                ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white shadow-md rounded-xl p-6 border border-gray-100 mb-6 text-center"
          >
            <p className="text-gray-500">
              Belum ada dosen pembimbing karena belum mengajukan judul skripsi.
            </p>
          </motion.div>
        )}

        {/* Notifikasi */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white shadow-md rounded-xl p-6 border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Bell className="text-gray-700" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">
              Notifikasi Terbaru
            </h2>
          </div>

          {notifikasi?.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Belum ada notifikasi saat ini.
            </p>
          ) : (
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {notifikasi.slice(0, 5).map((notif) => (
                <li
                  key={notif.id_notif}
                  className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <p className="text-sm text-gray-800">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.createdAt).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </motion.div>
    </MahasiswaLayout>
  );
};

export default DashboardMahasiswa;
