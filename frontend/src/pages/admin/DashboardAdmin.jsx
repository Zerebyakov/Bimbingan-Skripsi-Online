import React, { useEffect, useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { useAuth } from "../../context/AuthContext";
import {
  FileText,
  Users,
  BarChart3,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion"; // optional animasi, jalankan: npm install framer-motion

const DashboardAdmin = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [arsipStats, setArsipStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch main dashboard
  const fetchDashboard = async () => {
    const res = await axios.get(`${baseUrl}admin/dashboard`, {
      withCredentials: true,
    });
    return res.data.data;
  };

  // Fetch arsip statistics (endpoint baru)
  const fetchArsipStats = async () => {
    const res = await axios.get(`${baseUrl}arsip/statistics`, {
      withCredentials: true,
    });
    // endpoint response shape: res.data.data
    return res.data.data;
  };

  // Combined fetch for both endpoints
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashData, arsipData] = await Promise.all([
        fetchDashboard(),
        fetchArsipStats(),
      ]);
      setData(dashData);
      setArsipStats(arsipData);
    } catch (error) {
      console.error("Error fetching dashboard or arsip stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = data?.statistics || {};
  const progress = data?.progressData || [];
  const logs = data?.recentLogs || [];

  // Chart data for general dashboard (kept like sebelumnya)
  const chartData = [
    { name: "Pengajuan", total: stats.totalPengajuan || 0 },
    { name: "Diterima", total: stats.pengajuanDiterima || 0 },
    { name: "Menunggu", total: stats.pengajuanMenunggu || 0 },
    { name: "Mahasiswa", total: stats.mahasiswaAktif || 0 },
    { name: "Dosen", total: stats.dosenAktif || 0 },
  ];

  // Chart data for arsip per month (from arsipStats.byMonth)
  const arsipChartData =
    (arsipStats?.byMonth || []).map((m) => ({
      name: m.monthName,
      count: m.count,
    })) || [];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center h-80 text-gray-600">
          <RefreshCw className="animate-spin mb-2" size={22} />
          <p className="text-sm text-gray-500">Memuat data dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-10"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Selamat Datang, {user?.name || "Admin"}
          </h1>
          <p className="text-gray-500 text-sm">
            Pantau statistik, pengajuan, arsip, dan aktivitas terbaru di sistem.
          </p>
        </div>

        {/* Statistik Kartu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total Pengajuan",
              value: stats.totalPengajuan,
              icon: <FileText size={18} />,
            },
            {
              title: "Diterima",
              value: stats.pengajuanDiterima,
              icon: <BarChart3 size={18} />,
            },
            {
              title: "Menunggu",
              value: stats.pengajuanMenunggu,
              icon: <Clock size={18} />,
            },
            {
              title: "Mahasiswa Aktif",
              value: stats.mahasiswaAktif,
              icon: <Users size={18} />,
            },
            {
              title: "Dosen Aktif",
              value: stats.dosenAktif,
              icon: <Users size={18} />,
            },
            {
              title: "Total Arsip",
              value: stats.totalArsip ?? (arsipStats?.totalAll ?? 0),
              icon: <FileText size={18} />,
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-4 p-4 bg-white shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition"
            >
              <div className="p-3 bg-gray-800 text-white rounded-md">
                {item.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <h3 className="text-lg font-semibold text-gray-800">
                  {item.value ?? 0}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Arsip: Kartu status & grafik bulanan */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Statistik Arsip
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: cards status */}
            <div className="lg:col-span-1 space-y-3">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-500">Ringkasan Arsip</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <p className="text-xs text-gray-500">Total Tahun {arsipStats?.year ?? "-"}</p>
                    <h4 className="text-lg font-semibold text-gray-800">{arsipStats?.totalAll ?? 0}</h4>
                    <p className="text-xs text-gray-400">Total arsip</p>
                  </div>

                  <div className="p-3 bg-white rounded-md border border-gray-100">
                    <p className="text-xs text-gray-500">Arsip Tahun</p>
                    <h4 className="text-lg font-semibold text-gray-800">{arsipStats?.byYear ?? 0}</h4>
                    <p className="text-xs text-gray-400">Jumlah arsip pada tahun</p>
                  </div>

                  <div className="p-3 bg-white rounded-md border border-gray-100">
                    <p className="text-xs text-gray-500">Selesai</p>
                    <h4 className="text-lg font-semibold text-green-700">{arsipStats?.byStatus?.selesai ?? 0}</h4>
                    <p className="text-xs text-gray-400">Arsip selesai</p>
                  </div>

                  <div className="p-3 bg-white rounded-md border border-gray-100">
                    <p className="text-xs text-gray-500">Lulus</p>
                    <h4 className="text-lg font-semibold text-blue-700">{arsipStats?.byStatus?.lulus ?? 0}</h4>
                    <p className="text-xs text-gray-400">Arsip lulus</p>
                  </div>

                  <div className="p-3 bg-white rounded-md border border-gray-100 col-span-2">
                    <p className="text-xs text-gray-500">Revisi Ulang</p>
                    <h4 className="text-lg font-semibold text-yellow-700">{arsipStats?.byStatus?.revisiUlang ?? 0}</h4>
                    <p className="text-xs text-gray-400">Arsip perlu revisi ulang</p>
                  </div>
                </div>
              </div>

              {/* small note / legenda */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-600">
                <p className="font-medium text-gray-800 mb-1">Catatan</p>
                <p className="text-xs text-gray-500">
                  Data arsip diambil berdasarkan metadata arsip yang tersimpan. Grafik menampilkan jumlah arsip per bulan.
                </p>
              </div>
            </div>

            {/* Right: grafik bulanan (menggunakan seluruh kolom kanan) */}
            <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-800">Arsip per Bulan</h3>
                <p className="text-xs text-gray-500">Tahun {arsipStats?.year ?? "-"}</p>
              </div>

              {arsipChartData.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Belum ada data arsip per bulan.</p>
              ) : (
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={arsipChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                      <YAxis tick={{ fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="#4b5563" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Grafik Statistik Umum */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Statistik Umum
          </h2>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="total" fill="#4b5563" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Progress Pengajuan */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Pengajuan Terbaru
          </h2>
          {progress.length === 0 ? (
            <p className="text-gray-500 text-sm italic">
              Belum ada pengajuan baru.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Judul</th>
                    <th className="px-4 py-2 text-left">Bidang</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.map((item) => (
                    <tr
                      key={item.id_pengajuan}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 max-w-xs truncate">{item.title}</td>
                      <td className="px-4 py-2">{item.bidang_topik}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${item.status === "diterima"
                            ? "bg-green-100 text-green-700"
                            : item.status === "menunggu"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Aktivitas Terbaru */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Aktivitas Terbaru
          </h2>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm italic">
              Belum ada aktivitas tercatat.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200 shadow-sm">
              {logs.map((log) => (
                <li key={log.id_log} className="p-4 hover:bg-gray-50">
                  <p className="text-gray-800 text-sm font-medium">
                    {log.description}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </p>
                  <p className="text-gray-400 text-xs italic">
                    oleh {log.User?.email}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </motion.div>
    </AdminLayout>
  );
};

export default DashboardAdmin;
