import React, { useEffect, useState, useMemo } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import {
  FileDown,
  Edit3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Loader2,
  Search,
  Filter,
  StickyNote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import PageMeta from "../../components/PageMeta";

const ListBabMahasiswa = () => {
  const [data, setData] = useState([]); // array mahasiswaBimbingan
  const [expandedCard, setExpandedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBab, setSelectedBab] = useState(null); // bab object for modal
  const [selectedPengajuan, setSelectedPengajuan] = useState(null); // store pengajuan context
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");

  // animation wrapper state (fade-in like dashboard)
  const [fadeIn, setFadeIn] = useState(false);

  // fetch pengajuan / mahasiswa bimbingan
  const fetchData = async () => {
    setLoading(true);
    setFadeIn(false);
    try {
      const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
        withCredentials: true,
      });
      // Important: data.mahasiswaBimbingan is the array
      const list = res.data?.data?.mahasiswaBimbingan || [];
      setData(list);
      // small delay for nicer transition
      setTimeout(() => setFadeIn(true), 300);
    } catch (err) {
      Swal.fire("Gagal", "Tidak dapat memuat data mahasiswa", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // derive filtered data (keep as array)
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) =>
        (item.Mahasiswa?.nama_lengkap || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
      .map((item) => ({
        ...item,
        // filter BabSubmissions based on selected filterStatus
        BabSubmissions:
          filterStatus === "semua"
            ? item.BabSubmissions || []
            : (item.BabSubmissions || []).filter(
              (bab) => (bab.status || "").toLowerCase() === filterStatus
            ),
      }))
      // keep only mahasiswa yang punya bab (when filter applied)
      .filter((item) => (item.BabSubmissions || []).length > 0);
  }, [data, searchTerm, filterStatus]);

  // progress helper
  const getProgressAndLastChapter = (babList) => {
    if (!babList || babList.length === 0) return { progress: 0, lastChapter: 0 };
    const acceptedChapters = babList
      .filter((b) => b.status === "diterima")
      .map((b) => b.chapter_number);
    const lastChapter =
      acceptedChapters.length > 0 ? Math.max(...acceptedChapters) : 0;
    // assume 5 chapters total (same logic as before)
    const progress = Math.min(100, Math.round((lastChapter / 5) * 100));
    return { progress, lastChapter };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "diterima":
        return "bg-green-100 text-green-700 border-green-200";
      case "revisi":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "menunggu":
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // perform PUT review for a bab
  const handleReview = async () => {
    if (!status) {
      Swal.fire("Peringatan", "Pilih status terlebih dahulu", "warning");
      return;
    }
    if (status === "revisi" && !notes.trim()) {
      Swal.fire("Peringatan", "Masukkan catatan revisi", "warning");
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${baseUrl}dosen/bab/${selectedBab.id_bab}/review`,
        { status, notes: status === "revisi" ? notes : null },
        { withCredentials: true }
      );
      Swal.fire("Berhasil", "Status bab berhasil diperbarui", "success");
      setSelectedBab(null);
      setSelectedPengajuan(null);
      // refresh data
      fetchData();
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Terjadi kesalahan saat memperbarui status", "error");
    } finally {
      setSaving(false);
    }
  };

  // when click review button on a bab: check canApprove from pengajuan
  const handleOpenReview = (pengajuan, bab) => {
    // Gunakan canApprove dari response API, bukan logika manual
    const canApprove = pengajuan.canApprove === true;

    if (!canApprove) {
      // Tampilkan info bahwa hanya pembimbing utama yang bisa review
      Swal.fire({
        icon: "info",
        title: "Akses Terbatas",
        text: "Anda adalah pembimbing pendamping. Hanya pembimbing utama yang dapat mengubah status Bab.",
        confirmButtonText: "Mengerti",
      });
      return;
    }

    // pembimbing utama -> open modal to review
    setSelectedBab(bab);
    setSelectedPengajuan(pengajuan);
    setStatus(bab.status || "");
    setNotes(bab.notes || "");
  };

  // Helper untuk menampilkan role badge
  const getRoleBadge = (pengajuan) => {
    if (pengajuan.myRole === "pembimbing_utama") {
      return (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md border border-green-200">
          Pembimbing Utama
        </span>
      );
    } else if (pengajuan.myRole === "pembimbing_pendamping") {
      return (
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md border border-gray-200">
          Pembimbing Pendamping
        </span>
      );
    }
    return null;
  };

  return (
    <DosenLayout>
      <PageMeta
        title="Kelola Bab Mahasiswa"
      />
      <div
        className={`transition-all duration-500 ease-in-out px-6 py-6 ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              Manajemen Bab Mahasiswa
            </h1>
            <p className="text-gray-500 text-sm">
              Kelola, review, dan pantau progres Bab mahasiswa bimbingan Anda.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className={`flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md shadow-md hover:shadow-lg transition ${loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Menyegarkan..." : "Refresh"}
          </button>
        </div>

        {/* Filter & Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-center mb-6">
          <div className="relative w-full md:w-1/2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari nama mahasiswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-gray-300 outline-none"
            >
              <option value="semua">Semua Status</option>
              <option value="diterima">Diterima</option>
              <option value="revisi">Revisi</option>
              <option value="menunggu">Menunggu</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Loader2 className="animate-spin mb-2" />
            Memuat data mahasiswa...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076505.png"
              alt="empty"
              className="w-20 h-20 mx-auto mb-3 opacity-70"
            />
            <p className="italic">Tidak ada data ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredData.map((pengajuan, idx) => {
              const { progress, lastChapter } = getProgressAndLastChapter(
                pengajuan.BabSubmissions
              );

              return (
                <motion.div
                  key={pengajuan.id_pengajuan}
                  initial={{ opacity: 0, translateY: 8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.36 }}
                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="p-5 relative">
                    {/* nomor */}
                    <div className="absolute top-3 right-4 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                      #{idx + 1}
                    </div>

                    {/* header mahasiswa */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={
                          pengajuan.Mahasiswa?.foto
                            ? `${imageUrl}${pengajuan.Mahasiswa.foto}`
                            : `https://ui-avatars.com/api/?name=${pengajuan.Mahasiswa?.nama_lengkap}`
                        }
                        alt="foto"
                        className="w-12 h-12 rounded-full object-cover border"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm">
                          {pengajuan.Mahasiswa?.nama_lengkap}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {pengajuan.Mahasiswa?.nim}
                        </p>
                        <p className="text-xs text-gray-400">
                          {pengajuan.Mahasiswa?.email_kampus}
                        </p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="mb-3">
                      {getRoleBadge(pengajuan)}
                    </div>

                    {/* judul */}
                    <p className="text-sm text-gray-600 mb-1">Judul Skripsi:</p>
                    <p className="font-medium text-gray-800 text-sm leading-snug line-clamp-2">
                      {pengajuan.title}
                    </p>

                    {/* progress */}
                    <div className="mt-4 space-y-2">
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <motion.div
                          className="h-2 bg-gray-800"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          {progress}% progres bimbingan
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {lastChapter > 0
                            ? `Sudah sampai Bab ${lastChapter}`
                            : "Belum ada bab diterima"}
                        </p>
                      </div>
                    </div>

                    {/* expand */}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-500">
                        Total Bab: {pengajuan.BabSubmissions?.length || 0}
                      </span>
                      <button
                        onClick={() =>
                          setExpandedCard(
                            expandedCard === pengajuan.id_pengajuan
                              ? null
                              : pengajuan.id_pengajuan
                          )
                        }
                        className="text-gray-600 hover:text-gray-800 transition"
                      >
                        {expandedCard === pengajuan.id_pengajuan ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>

                    {/* bab list (expand) */}
                    <AnimatePresence>
                      {expandedCard === pengajuan.id_pengajuan && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.28 }}
                          className="border-t border-gray-200 mt-4 pt-3 space-y-3"
                        >
                          {(pengajuan.BabSubmissions || []).map((bab) => (
                            <div
                              key={bab.id_bab}
                              className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow transition"
                            >
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-gray-800">
                                  Bab {bab.chapter_number}
                                </p>
                                <span
                                  className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(
                                    bab.status
                                  )}`}
                                >
                                  {bab.status?.toUpperCase()}
                                </span>
                              </div>

                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {bab.original_name}
                              </p>

                              {bab.notes && (
                                <div className="flex items-start gap-2 mt-2 bg-yellow-50 border border-yellow-200 p-2 rounded-lg">
                                  <StickyNote
                                    size={14}
                                    className="text-yellow-600 mt-[2px]"
                                  />
                                  <p className="text-xs text-yellow-800 leading-snug">
                                    <strong>Catatan Dosen:</strong> {bab.notes}
                                  </p>
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-2 text-xs">
                                <div className="flex items-center gap-1 text-gray-400">
                                  <Calendar size={12} />
                                  {bab.submittedAt
                                    ? new Date(bab.submittedAt).toLocaleDateString(
                                      "id-ID"
                                    )
                                    : "-"}
                                </div>

                                <div className="flex gap-3">
                                  <a
                                    href={`${imageUrl}uploads/bab/${bab.file_path}`}
                                    download={bab.file_path}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    <FileDown size={13} /> File
                                  </a>

                                  <button
                                    onClick={() =>
                                      handleOpenReview(pengajuan, bab)
                                    }
                                    className={`flex items-center gap-1 text-sm font-medium transition ${pengajuan.canApprove
                                      ? "text-gray-700 hover:text-gray-900"
                                      : "text-gray-400 cursor-not-allowed"
                                      }`}
                                    title={
                                      pengajuan.canApprove
                                        ? "Review Bab"
                                        : "Hanya pembimbing utama yang dapat mereview"
                                    }
                                  >
                                    <Edit3 size={13} /> Review
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Review (only shown when selectedBab is set AND canApprove is true) */}
      <AnimatePresence>
        {selectedBab && selectedPengajuan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Review Bab {selectedBab.chapter_number}
              </h2>
              <p className="text-xs text-gray-500 mb-4 truncate">
                {selectedBab.original_name}
              </p>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Status Bab
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Pilih Status</option>
                  <option value="diterima">Diterima</option>
                  <option value="revisi">Revisi</option>
                  <option value="menunggu">Menunggu</option>
                </select>

                {status === "revisi" && (
                  <>
                    <label className="block text-sm font-medium text-gray-700">
                      Catatan Revisi
                    </label>
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-200"
                      rows="3"
                      placeholder="Tuliskan catatan revisi..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedBab(null);
                    setSelectedPengajuan(null);
                  }}
                  className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleReview}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DosenLayout>
  );
};

export default ListBabMahasiswa;