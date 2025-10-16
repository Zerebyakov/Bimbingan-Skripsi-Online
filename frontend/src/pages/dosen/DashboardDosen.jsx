import React, { useEffect, useState } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import {
  RefreshCw,
  Users,
  FileText,
  FolderOpen,
  Calendar,
} from "lucide-react";

const DashboardDosen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setFadeIn(false);
    try {
      const res = await axios.get(`${baseUrl}dosen/dashboard`, {
        withCredentials: true,
      });
      setData(res.data.data);
      setTimeout(() => {
        setLoading(false);
        setFadeIn(true);
      }, 350);
    } catch (error) {
      console.error("Error fetching dosen dashboard:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <DosenLayout>
      <div
        className={`transition-all duration-500 ease-in-out ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
      >
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Dashboard Dosen
              </h1>
              <p className="text-gray-500 text-sm">
                Pantau aktivitas dan progres bimbingan mahasiswa Anda.
              </p>
            </div>

            <button
              onClick={fetchDashboard}
              className={`flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition ${loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Menyegarkan..." : "Refresh"}
            </button>
          </div>

          {/* Statistik Section */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-slide">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg shimmer"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-24 h-3 shimmer rounded-md"></div>
                    <div className="w-16 h-5 shimmer rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            data && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-slide">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Users className="text-gray-700" size={24} />
                  </div>
                  <div>
                    <h2 className="text-sm text-gray-500 font-medium">
                      Total Bimbingan
                    </h2>
                    <p className="text-xl font-semibold text-gray-800">
                      {data.statistics.totalBimbingan || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <FolderOpen className="text-gray-700" size={24} />
                  </div>
                  <div>
                    <h2 className="text-sm text-gray-500 font-medium">
                      Bimbingan Aktif
                    </h2>
                    <p className="text-xl font-semibold text-gray-800">
                      {data.statistics.bimbinganAktif || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <FileText className="text-gray-700" size={24} />
                  </div>
                  <div>
                    <h2 className="text-sm text-gray-500 font-medium">
                      Mahasiswa Stagnan
                    </h2>
                    <p className="text-xl font-semibold text-gray-800">
                      {data.mahasiswaStagnan?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Daftar Mahasiswa */}
          <div
            className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-500 ${fadeIn ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users size={18} className="text-gray-600" />
                Mahasiswa Bimbingan Aktif
              </h2>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-100">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-5 flex justify-between items-center animate-fade-slide"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="w-40 h-4 shimmer rounded-md"></div>
                      <div className="w-28 h-3 shimmer rounded-md"></div>
                      <div className="w-full h-3 shimmer rounded-md"></div>
                    </div>
                    <div className="w-16 h-5 shimmer rounded-md"></div>
                  </div>
                ))}
              </div>
            ) : data.mahasiswaBimbingan?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.mahasiswaBimbingan.map((mhs) => (
                  <div
                    key={mhs.id_pengajuan}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50 transition-all duration-300 ease-in-out"
                  >
                    <div>
                      <h3 className="text-base font-medium text-gray-800">
                        {mhs.Mahasiswa?.nama_lengkap}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mhs.Mahasiswa?.nim} • Semester {mhs.Mahasiswa?.semester}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium text-gray-800">
                          Judul:
                        </span>{" "}
                        {mhs.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {mhs.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${mhs.status === "diterima"
                            ? "bg-green-100 text-green-700"
                            : mhs.status === "revisi"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        {mhs.status}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                        <Calendar size={12} />{" "}
                        {new Date(mhs.updatedAt).toLocaleDateString("id-ID")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm py-10">
                Belum ada mahasiswa bimbingan saat ini.
              </p>
            )}
          </div>
        </div>
      </div>
    </DosenLayout>
  );
};

export default DashboardDosen;
