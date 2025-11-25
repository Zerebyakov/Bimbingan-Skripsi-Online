import React, { useEffect, useState } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import {
  RefreshCw,
  Users,
  FileText,
  FolderOpen,
  Calendar,
  User,
  Hash,
  Mail,
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router";
import SplitText from "../../components/SplitText";
import PageMeta from "../../components/PageMeta";

const DashboardDosen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();

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

  const statusBadge = (status) => {
    const base = "px-2 py-1 rounded text-xs font-medium capitalize";
    if (!status) return <span className={`${base} bg-gray-100 text-gray-700`}>-</span>;
    if (status === "diterima") return <span className={`${base} bg-green-100 text-green-700`}>Diterima</span>;
    if (status === "revisi") return <span className={`${base} bg-yellow-100 text-yellow-700`}>Revisi</span>;
    if (status === "menunggu") return <span className={`${base} bg-blue-100 text-blue-700`}>Menunggu</span>;
    return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
  };

  return (
    <DosenLayout>
      <PageMeta
        title="Dashboard Dosen"
      />
      <div
        className={`transition-all duration-500 ease-in-out ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
      >
        <div className="space-y-8">
          {/*HEADER  */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              {data?.dosenInfo && (
                <h1 className="text-2xl font-semibold text-gray-800">
                  <SplitText
                    text={`Selamat Datang, ${data.dosenInfo.nama} ${data.dosenInfo.gelar} `}
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
              )}
              <p className="text-gray-500 text-sm">
                Ringkasan kegiatan bimbingan & progress mahasiswa.
              </p>
            </div>

            <button
              onClick={fetchDashboard}
              className={`flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition ${loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Menyegarkan..." : "Refresh"}
            </button>
          </div>

          {/* MINI PROFILE DOSEN (simple) */}
          {data?.dosenInfo && (
            <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                {data.dosenInfo.foto ? (
                  <img
                    src={`${imageUrl}${data.dosenInfo.foto}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={26} className="text-gray-600" />
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {data.dosenInfo.nama} {data.dosenInfo.gelar}
                </h2>
                <p className="text-sm text-gray-600">
                  {data.dosenInfo.bidang_keahlian || "-"} •{" "}
                  {data.dosenInfo.jabatan_akademik || "-"}
                </p>
              </div>
            </div>
          )}

          {/*  STATISTIK  */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                title: "Total Bimbingan",
                value: data?.statistics?.totalBimbingan ?? 0,
                icon: Users,
              },
              {
                title: "Aktif",
                value: data?.statistics?.bimbinganAktif ?? 0,
                icon: FolderOpen,
              },
              {
                title: "Pembimbing I",
                value: data?.statistics?.sebagaiPembimbing1 ?? 0,
                icon: BookOpen,
              },
              {
                title: "Pembimbing II",
                value: data?.statistics?.sebagaiPembimbing2 ?? 0,
                icon: FileText,
              },
              {
                title: "Menunggu Review",
                value: data?.statistics?.menungguReview ?? 0,
                icon: Clock,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300"
              >
                <div className="bg-gray-100 p-3 rounded-lg">
                  <item.icon className="text-gray-700" size={24} />
                </div>
                <div>
                  <h2 className="text-sm text-gray-500 font-medium">{item.title}</h2>
                  <p className="text-xl font-semibold text-gray-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/*  MAHASISWA Bimbingan (GRID)  */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users size={18} className="text-gray-600" />
                Mahasiswa Bimbingan Aktif
              </h2>
              <span className="text-sm text-gray-500">
                {data?.mahasiswaBimbingan?.length || 0} mahasiswa
              </span>
            </div>

            {loading ? (
              <p className="text-center py-8 text-gray-500 text-sm">Memuat...</p>
            ) : data?.mahasiswaBimbingan?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {data.mahasiswaBimbingan.map((mhs) => (
                  <div
                    key={mhs.id_pengajuan}
                    className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    {/* HEADER */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {mhs.Mahasiswa?.foto ? (
                          <img
                            src={`${imageUrl}${mhs.Mahasiswa.foto}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={22} className="text-gray-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-medium text-gray-800 truncate">
                          {mhs.Mahasiswa.nama_lengkap}
                        </h3>
                        <p className="text-sm text-gray-500">{mhs.Mahasiswa.nim}</p>
                      </div>
                    </div>

                    {/* JUDUL */}
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      <span className="font-medium text-gray-800">Judul:</span>{" "}
                      {mhs.title}
                    </p>

                    {/* DESKRIPSI */}
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {mhs.description}
                    </p>

                    {/* TOPIK + EMAIL + UPDATED */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} /> {mhs.bidang_topik}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {mhs.Mahasiswa.email_kampus}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />{" "}
                        {new Date(mhs.updatedAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>

                    {/* BADGE STATUS */}
                    <div className="mb-3">{statusBadge(mhs.status)}</div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigate(`/dosen/mahasiswa-bab`)
                        }
                        className="text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:shadow-sm transition"
                      >
                        Lihat Progress
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/dosen/mahasiswa-pengajuan`)
                        }
                        className="text-sm px-3 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
                      >
                        Detail Pengajuan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500 text-sm">
                Belum ada mahasiswa bimbingan.
              </p>
            )}
          </div>

          {/*  MAHASISWA STAGNAN  */}
          {data?.mahasiswaStagnan?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Mahasiswa Tanpa Progress
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {data.mahasiswaStagnan.map((mhs) => (
                  <div key={mhs.id_mahasiswa} className="p-5 hover:bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-800">
                      {mhs.nama_lengkap} • {mhs.nim}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Terakhir aktif: {mhs.lastActive || "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DosenLayout>
  );
};

export default DashboardDosen;
