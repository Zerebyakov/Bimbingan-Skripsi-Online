import React, { useEffect, useState } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import { motion } from "framer-motion";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import {
  User,
  BookOpen,
  FileText,
  Bell,
  Loader2,
  CalendarDays,
  GraduationCap,
} from "lucide-react";
import SplitText from "../../components/SplitText";
import PageMeta from "../../components/PageMeta";
import GraduationCelebration from "../../components/ui/GraduationCelebration";

const DashboardMahasiswa = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [riwayatPeriode, setRiwayatPeriode] = useState([]);

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

    const fetchRiwayatPeriode = async () => {
      try {
        const res = await axios.get(`${baseUrl}mahasiswa/periode`, {
          withCredentials: true,
        });
        setRiwayatPeriode(res.data.data || []);
      } catch (error) {
        console.error("Gagal memuat riwayat periode:", error);
      }
    };

    fetchDashboard();
    fetchRiwayatPeriode();
  }, []);

  // Tampilkan perayaan kelulusan sekali saat skripsi sudah diarsipkan
  useEffect(() => {
    const pengajuan = dashboardData?.pengajuan;
    if (pengajuan?.Arsip) {
      const flagKey = `graduation_celebrated_${pengajuan.id_pengajuan}`;
      if (!localStorage.getItem(flagKey)) {
        setShowCelebration(true);
      }
    }
  }, [dashboardData]);

  const closeCelebration = () => {
    const pengajuan = dashboardData?.pengajuan;
    if (pengajuan) {
      localStorage.setItem(
        `graduation_celebrated_${pengajuan.id_pengajuan}`,
        String(Date.now())
      );
    }
    setShowCelebration(false);
  };

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

  const { mahasiswa, pengajuan, progress, notifikasi, periodeAktif } = dashboardData;

  const isSelesai = Boolean(pengajuan?.Arsip);

  // Hitung sisa hari menuju akhir periode bimbingan
  const deadlineDate = periodeAktif?.tanggalSelesaiBimbingan
    ? new Date(periodeAktif.tanggalSelesaiBimbingan)
    : null;
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000)
    : null;

  return (
    <MahasiswaLayout>
      <PageMeta
        title="Dashboard Mahasiswa"
      />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            <SplitText
              text={`Selamat Datang, ${mahasiswa.nama_lengkap}`}
              className="text-2xl font-semibold text-center"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
          </h1>
          <p className="text-gray-500 text-sm">
            Pantau perkembangan bimbingan dan pengajuan skripsimu di sini.
          </p>
        </div>

        {/* Banner kelulusan */}
        {isSelesai && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-3">
              <GraduationCap size={28} />
              <div>
                <p className="font-semibold text-lg">Skripsi Selesai — Selamat! 🎉</p>
                <p className="text-sm text-emerald-50">
                  Skripsimu telah diarsipkan
                  {pengajuan.Arsip?.tanggalSelesai
                    ? ` pada ${new Date(pengajuan.Arsip.tanggalSelesai).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`
                    : ""}.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCelebration(true)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition shrink-0"
            >
              Rayakan lagi 🎉
            </button>
          </motion.div>
        )}

        {/* Deadline periode bimbingan */}
        {!isSelesai && periodeAktif && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-xl p-5 border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${daysLeft !== null && daysLeft < 0
              ? "bg-red-50 border-red-200"
              : daysLeft !== null && daysLeft <= 14
                ? "bg-yellow-50 border-yellow-200"
                : "bg-white border-gray-100"
              }`}
          >
            <div className="flex items-center gap-3">
              <CalendarDays
                size={24}
                className={
                  daysLeft !== null && daysLeft < 0
                    ? "text-red-600"
                    : daysLeft !== null && daysLeft <= 14
                      ? "text-yellow-600"
                      : "text-gray-600"
                }
              />
              <div>
                <p className="text-xs text-gray-500 uppercase">
                  Periode Bimbingan Aktif
                </p>
                <p className="font-semibold text-gray-800">
                  {periodeAktif.tahun_akademik} — Semester{" "}
                  <span className="capitalize">{periodeAktif.semester}</span>
                </p>
                {deadlineDate ? (
                  <p className="text-sm text-gray-600">
                    Batas akhir bimbingan:{" "}
                    <span className="font-medium">
                      {deadlineDate.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Batas akhir periode belum ditetapkan admin.
                  </p>
                )}
              </div>
            </div>

            {daysLeft !== null && (
              <div
                className={`text-center px-4 py-2 rounded-lg font-semibold shrink-0 ${daysLeft < 0
                  ? "bg-red-100 text-red-700"
                  : daysLeft <= 14
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-emerald-50 text-emerald-700"
                  }`}
              >
                {daysLeft < 0 ? (
                  <span className="text-sm">
                    Periode berakhir — bimbingan dilanjutkan ke periode berikutnya
                  </span>
                ) : (
                  <>
                    <span className="text-xl">{daysLeft}</span>
                    <span className="text-sm block">hari tersisa</span>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Info Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Mahasiswa */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white shadow-md rounded-xl p-5 border border-gray-100 flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
              {dashboardData.mahasiswa.foto ? (
                <img
                  src={`${imageUrl}${dashboardData.mahasiswa.foto}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="text-gray-600" size={22} />
              )}
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
                  Bab {progress / 20 || 0} dari 5
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
                    <p className="text-gray-800 font-medium">{pembimbing.nama} {pembimbing.gelar}</p>
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
        {/* Riwayat Periode */}
        {riwayatPeriode.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="bg-white shadow-md rounded-xl p-6 border border-gray-100 mt-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="text-gray-700" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">
                Riwayat Periode Skripsi
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2">Tahun Akademik</th>
                    <th className="px-4 py-2">Semester</th>
                    <th className="px-4 py-2">Rentang Bimbingan</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatPeriode.map((p) => (
                    <tr key={p.id_periode} className="border-t border-gray-100">
                      <td className="px-4 py-2">{p.tahun_akademik}</td>
                      <td className="px-4 py-2 capitalize">{p.semester}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {p.tanggalMulaiBimbingan
                          ? new Date(p.tanggalMulaiBimbingan).toLocaleDateString("id-ID")
                          : "—"}{" "}
                        s.d.{" "}
                        {p.tanggalSelesaiBimbingan
                          ? new Date(p.tanggalSelesaiBimbingan).toLocaleDateString("id-ID")
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {p.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                            Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Overlay perayaan kelulusan */}
      {showCelebration && (
        <GraduationCelebration
          nama={mahasiswa?.nama_lengkap || "Mahasiswa"}
          onClose={closeCelebration}
        />
      )}
    </MahasiswaLayout>
  );
};

export default DashboardMahasiswa;
