import React, { useEffect, useState } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileDown,
  Edit3,
  Loader2,
  StickyNote,
} from "lucide-react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

const ListLaporanMahasiswa = () => {
  const [bimbingan, setBimbingan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  // modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // filter: all | diterima | revisi | ditolak | belum_upload
  const [filter, setFilter] = useState("all");

  // FILE order (default agreed): final, abstrak, pengesahan, pernyataan, presentasi
  const FILE_FIELDS = [
    { key: "finalFile", label: "Laporan Final" },
    { key: "abstrakFile", label: "Abstrak" },
    { key: "pengesahanFile", label: "Pengesahan" },
    { key: "pernyataanFile", label: "Pernyataan" },
    { key: "presentasiFile", label: "Presentasi" },
  ];

  const fetchData = async () => {
    setLoading(true);
    setFadeIn(false);
    try {
      const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
        withCredentials: true,
      });
      const list = res.data?.data?.mahasiswaBimbingan || [];
      setBimbingan(list);
      setTimeout(() => setFadeIn(true), 220);
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Tidak dapat memuat data laporan akhir.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const statusColor = (s) => {
    switch ((s || "").toLowerCase()) {
      case "diterima":
        return "bg-green-100 text-green-700 border-green-200";
      case "revisi":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "ditolak":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // count available files (fields from FILE_FIELDS or fallback file_path)
  const countAvailableFiles = (laporan = {}) => {
    if (!laporan) return 0;
    const values = FILE_FIELDS.map((f) => laporan[f.key]).concat(
      laporan.file_path ? [laporan.file_path] : []
    );
    return values.filter(Boolean).length;
  };

  const isFileComplete = (laporan = {}) => countAvailableFiles(laporan) >= 5;

  const getFileUrl = (file) => (file ? `${imageUrl}uploads/laporan/${file}` : null);

  const handleDownload = (filePath, label) => {
    if (!filePath) {
      Swal.fire("Info", `${label} belum tersedia.`, "info");
      return;
    }
    const url = getFileUrl(filePath);
    if (!url) {
      Swal.fire("Info", "File tidak ditemukan.", "info");
      return;
    }
    window.open(url, "_blank");
  };

  // Filtering logic based on `filter`
  const filteredList = bimbingan.filter((item) => {
    const laporan = item.LaporanAkhir;
    if (filter === "all") return true;
    if (filter === "belum_upload") {
      if (!laporan) return true;
      return !isFileComplete(laporan);
    }
    if (!laporan) return false;
    return (laporan.status || "").toLowerCase() === filter;
  });

  const openReview = (item) => {
    const laporan = item.LaporanAkhir;
    if (!laporan) {
      Swal.fire("Info", "Mahasiswa belum mengunggah laporan akhir.", "info");
      return;
    }

    // Gunakan canApprove dari API response
    if (!item.canApprove) {
      Swal.fire({
        icon: "info",
        title: "Akses Terbatas",
        text: "Anda adalah pembimbing pendamping. Hanya pembimbing utama yang dapat mengubah status laporan akhir.",
        confirmButtonText: "Mengerti",
      });
      return;
    }

    setSelectedItem(item);
    setStatus(laporan.status || "");
    setNotes(laporan.notes || "");
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) return;

    if (!status) {
      Swal.fire("Peringatan", "Pilih status terlebih dahulu.", "warning");
      return;
    }
    if ((status === "revisi" || status === "ditolak") && !notes.trim()) {
      Swal.fire("Peringatan", "Catatan wajib diisi untuk status revisi / ditolak.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const laporanId = selectedItem?.LaporanAkhir?.id_laporan;
      if (!laporanId) throw new Error("ID laporan tidak ditemukan");

      const payload = { status };
      if (notes.trim()) payload.notes = notes.trim();

      const res = await axios.put(
        `${baseUrl}dosen/laporan/${laporanId}/review`,
        payload,
        { withCredentials: true }
      );

      const serverMsg = res.data?.message || "Review berhasil";
      const result = res.data?.data || {};

      Swal.fire("Berhasil", serverMsg, "success");

      // Update single item in state without refetch
      setBimbingan((prev) =>
        prev.map((it) =>
          it.id_pengajuan === selectedItem.id_pengajuan
            ? {
              ...it,
              LaporanAkhir: {
                ...(it.LaporanAkhir || {}),
                status: result.status ?? it.LaporanAkhir?.status,
                notes: result.notes ?? it.LaporanAkhir?.notes,
                verifiedAt: result.verifiedAt ?? it.LaporanAkhir?.verifiedAt,
              },
            }
            : it
        )
      );

      setSelectedItem(null);
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan review.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper untuk menampilkan role badge
  const getRoleBadge = (item) => {
    if (item.myRole === "pembimbing_utama") {
      return (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md border border-green-200 whitespace-nowrap">
          Pembimbing Utama
        </span>
      );
    } else if (item.myRole === "pembimbing_pendamping") {
      return (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200 whitespace-nowrap">
          Pembimbing Pendamping
        </span>
      );
    }
    return null;
  };

  return (
    <DosenLayout>
      <div
        className={`transition-all duration-500 px-4 sm:px-6 lg:px-8 py-6 ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-800 truncate">
              Laporan Akhir Mahasiswa
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Review & unduh dokumen laporan akhir mahasiswa bimbingan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Filter */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm w-full sm:w-auto">
              <label className="text-xs text-gray-500 whitespace-nowrap">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm outline-none ml-2 bg-transparent"
              >
                <option value="all">Semua Status</option>
                <option value="diterima">Diterima</option>
                <option value="revisi">Revisi</option>
                <option value="ditolak">Ditolak</option>
                <option value="belum_upload">Belum Upload / File belum lengkap</option>
              </select>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className={`flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition w-full sm:w-auto ${loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Memuat laporan...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-gray-50 border rounded-lg">
            Tidak ada laporan sesuai filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredList.map((item, idx) => {
              const laporan = item.LaporanAkhir;
              const availableCount = countAvailableFiles(laporan);
              const complete = isFileComplete(laporan);

              return (
                <motion.div
                  key={item.id_pengajuan}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.36 }}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4 sm:p-5"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-800 leading-tight break-words">
                        {item.Mahasiswa?.nama_lengkap}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {item.Mahasiswa?.nim} • {item.Mahasiswa?.email_kampus}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {getRoleBadge(item)}

                      <div className="text-xs">
                        {complete ? (
                          <span className="px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-100 whitespace-nowrap">
                            ✓ File lengkap
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-100 whitespace-nowrap">
                            ⚠ File belum lengkap ({availableCount}/5)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mt-3 line-clamp-3 break-words">
                    <span className="font-medium">Judul:</span> {item.title}
                  </p>

                  {/* expand toggle */}
                  <button
                    onClick={() =>
                      setExpandedCard(
                        expandedCard === item.id_pengajuan ? null : item.id_pengajuan
                      )
                    }
                    className="mt-3 w-full text-left text-gray-600 hover:text-gray-800 flex items-center gap-2 text-sm"
                    aria-expanded={expandedCard === item.id_pengajuan}
                  >
                    Detail Laporan
                    <span className="ml-auto">
                      {expandedCard === item.id_pengajuan ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  </button>

                  {/* expandable content */}
                  <AnimatePresence>
                    {expandedCard === item.id_pengajuan && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28 }}
                        className="mt-3 pt-3 border-t border-gray-100 space-y-3"
                      >
                        {!laporan ? (
                          <p className="text-sm text-gray-500 italic">
                            Belum ada laporan akhir.
                          </p>
                        ) : (
                          <>
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span
                                  className={`px-3 py-1 text-xs rounded-full border font-medium ${statusColor(
                                    laporan.status
                                  )}`}
                                >
                                  {(laporan.status || "MENUNGGU")
                                    .toString()
                                    .toUpperCase()}
                                </span>
                              </div>

                              {/* notes */}
                              {laporan.notes && (
                                <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-md text-xs text-yellow-800">
                                  <StickyNote size={14} className="inline mr-1" />
                                  {laporan.notes}
                                </div>
                              )}

                              {/* file pills - auto-wrap */}
                              <div className="flex flex-wrap gap-2">
                                {FILE_FIELDS.map((f) => {
                                  const fileValue = laporan?.[f.key] || null;
                                  const has = Boolean(fileValue);
                                  return (
                                    <button
                                      key={f.key}
                                      onClick={() => has && handleDownload(fileValue, f.label)}
                                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition ${has
                                          ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                                          : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                        }`}
                                      style={{ whiteSpace: "nowrap" }}
                                    >
                                      <FileDown size={12} />
                                      <span className="max-w-[10rem] truncate">{f.label}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* actions */}
                              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2">
                                <button
                                  onClick={() => openReview(item)}
                                  className={`flex items-center gap-2 text-sm font-medium transition ${item.canApprove
                                      ? "text-gray-700 hover:text-black"
                                      : "text-gray-400 cursor-not-allowed"
                                    }`}
                                  title={
                                    item.canApprove
                                      ? "Review Laporan"
                                      : "Hanya pembimbing utama yang dapat mereview"
                                  }
                                >
                                  <Edit3 size={14} /> Review Laporan
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-md p-4 sm:p-6 shadow-xl max-h-[90svh] overflow-auto"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                Review Laporan Akhir
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                {selectedItem?.Mahasiswa?.nama_lengkap}
              </p>

              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border mt-1 mb-4 px-3 py-2 rounded-lg text-sm"
              >
                <option value="">-- Pilih Status --</option>
                <option value="diterima">Diterima</option>
                <option value="revisi">Revisi</option>
                <option value="ditolak">Ditolak</option>
              </select>

              {(status === "revisi" || status === "ditolak" || status === "diterima") && (
                <>
                  <label className="block text-sm font-medium text-gray-700">
                    Catatan{" "}
                    {status === "diterima"
                      ? "(opsional)"
                      : "(wajib untuk revisi/ditolak)"}
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg text-sm mb-3"
                    placeholder={
                      status === "diterima" ? "Catatan opsional..." : "Catatan wajib..."
                    }
                  />
                </>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  disabled={submitting}
                  onClick={handleSubmitReview}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DosenLayout>
  );
};

export default ListLaporanMahasiswa;