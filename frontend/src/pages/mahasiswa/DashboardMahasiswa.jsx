import React, { useEffect, useState } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import { motion } from "framer-motion";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import {
  User,
  BookOpen,
  FileText,
  MessageCircle,
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
              <p className="font-semibold text-gray-800">
                {mahasiswa.nama_lengkap}
              </p>
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
                <p className="text-xs text-gray-500 uppercase">Progress</p>
                <p className="font-semibold text-gray-800">
                  Bab {progress || 0}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${progress * 20 || 0}%` }}
              ></div>
            </div>
          </motion.div>
        </div>

        {/* Pembimbing */}
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
            {[pengajuan.Pembimbing1, pengajuan.Pembimbing2,pengajuan.Pembimbing3]
              .filter(Boolean)
              .map((pembimbing, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <p className="text-gray-800 font-medium">
                    {pembimbing.nama}
                  </p>
                  <p className="text-sm text-gray-500">
                    {pembimbing.bidang_keahlian}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {pembimbing.email_institusi}
                  </p>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Notifikasi Terbaru */}
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

          {notifikasi.length === 0 ? (
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
