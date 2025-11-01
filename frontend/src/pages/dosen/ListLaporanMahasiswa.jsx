import React, { useEffect, useState } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import { FileText, RefreshCw, Loader2, FileDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const ListLaporanMahasiswa = () => {
  const [bimbingan, setBimbingan] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchMahasiswaBimbingan = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
        withCredentials: true,
      });
      setBimbingan(res.data.data || []);
    } catch (error) {
      Swal.fire("Gagal", "Tidak dapat memuat data mahasiswa.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMahasiswaBimbingan();
  }, []);

  const handleOpenReview = (laporan) => {
    setSelected(laporan);
    setStatus(laporan.status?.toLowerCase() || "menunggu");
    setNotes(laporan.notes || "");
  };

  const handleSubmitReview = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await axios.put(
        `${baseUrl}dosen/laporan/${selected.id_laporan}/review`,
        { status, notes },
        { withCredentials: true }
      );
      Swal.fire("Berhasil", "Review laporan berhasil diperbarui", "success");
      setSelected(null);
      fetchMahasiswaBimbingan();
    } catch (error) {
      Swal.fire("Gagal", "Terjadi kesalahan saat mengirim review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (filePath, label) => {
    if (!filePath)
      return Swal.fire("Info", `${label} belum diunggah oleh mahasiswa.`, "info");
    window.open(`${imageUrl}uploads/laporan/${filePath}`, "_blank");
  };

  const renderStatusBadge = (status) => {
    const map = {
      diterima: "bg-green-100 text-green-700 border-green-200",
      revisi: "bg-yellow-100 text-yellow-700 border-yellow-200",
      ditolak: "bg-red-100 text-red-700 border-red-200",
      menunggu: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full border ${map[status?.toLowerCase()] || map.menunggu
          }`}
      >
        {status?.toUpperCase()}
      </span>
    );
  };

  const getFileStatusColor = (filePath) =>
    filePath
      ? "bg-green-100 text-green-700 hover:bg-green-200"
      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";

  const getAvailableFileCount = (laporan) => {
    if (!laporan) return 0;
    const files = [
      laporan.finalFile,
      laporan.abstrakFile,
      laporan.pengesahanFile,
      laporan.pernyataanFile,
      laporan.presentasiFile,
    ];
    return files.filter((f) => f).length;
  };

  return (
    <DosenLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Review Laporan Akhir Mahasiswa
            </h1>
            <p className="text-gray-500 text-sm">
              Lihat, unduh, dan berikan review terhadap laporan akhir mahasiswa.
            </p>
          </div>
          <button
            onClick={fetchMahasiswaBimbingan}
            disabled={loading}
            className={`flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 transition ${loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Menyegarkan..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Memuat data laporan...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bimbingan
              .filter((m) => m.LaporanAkhir)
              .map((item, i) => {
                const laporan = item.LaporanAkhir;
                const availableCount = getAvailableFileCount(laporan);
                return (
                  <motion.div
                    key={item.id_pengajuan}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    {/* Mahasiswa Info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">
                          {item.Mahasiswa?.nama_lengkap}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.Mahasiswa?.nim} • {item.Mahasiswa?.email_kampus}
                        </p>
                      </div>
                      {renderStatusBadge(laporan?.status)}
                    </div>

                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-medium">Judul:</span> {item.title}
                    </p>

                    {/* Notes */}
                    {laporan?.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-md mt-3 text-xs text-yellow-800">
                        <strong>Catatan:</strong> {laporan.notes}
                      </div>
                    )}

                    {/* File Download Buttons */}
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Unduh Dokumen:
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            handleDownload(laporan?.finalFile, "Laporan Final")
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs ${getFileStatusColor(
                            laporan?.finalFile
                          )}`}
                        >
                          <FileDown size={12} /> Laporan Final
                        </button>

                        <button
                          onClick={() =>
                            handleDownload(laporan?.abstrakFile, "Abstrak")
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs ${getFileStatusColor(
                            laporan?.abstrakFile
                          )}`}
                        >
                          <FileDown size={12} /> Abstrak
                        </button>

                        <button
                          onClick={() =>
                            handleDownload(
                              laporan?.pengesahanFile,
                              "Lembar Pengesahan"
                            )
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs ${getFileStatusColor(
                            laporan?.pengesahanFile
                          )}`}
                        >
                          <FileDown size={12} /> Pengesahan
                        </button>

                        <button
                          onClick={() =>
                            handleDownload(
                              laporan?.pernyataanFile,
                              "Surat Pernyataan"
                            )
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs ${getFileStatusColor(
                            laporan?.pernyataanFile
                          )}`}
                        >
                          <FileDown size={12} /> Pernyataan
                        </button>

                        <button
                          onClick={() =>
                            handleDownload(
                              laporan?.presentasiFile,
                              "File Presentasi"
                            )
                          }
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs ${getFileStatusColor(
                            laporan?.presentasiFile
                          )}`}
                        >
                          <FileDown size={12} /> Presentasi
                        </button>
                      </div>

                      {/* Penanda Jumlah File */}
                      <p
                        className={`mt-2 text-xs font-medium ${availableCount === 5
                            ? "text-green-700"
                            : availableCount >= 3
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                      >
                        {availableCount} dari 5 file tersedia
                      </p>
                    </div>

                    {/* Tombol Review */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleOpenReview(laporan)}
                        className="flex items-center gap-2 text-sm bg-gray-800 text-white px-3 py-1.5 rounded-md hover:bg-gray-700"
                      >
                        <FileText size={14} /> Review Laporan
                      </button>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}

        {/* Modal Review */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Review Laporan Akhir
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-gray-700 focus:outline-none"
                    >
                      <option value="menunggu">Menunggu</option>
                      <option value="revisi">Revisi</option>
                      <option value="diterima">Diterima</option>
                      <option value="ditolak">Ditolak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catatan
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="3"
                      placeholder="Tambahkan catatan jika perlu..."
                      className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-gray-700 focus:outline-none resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <button
                    onClick={() => setSelected(null)}
                    className="px-3 py-2 rounded-md text-sm border border-gray-300 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="px-4 py-2 rounded-md text-sm bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Review"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DosenLayout>
  );
};

export default ListLaporanMahasiswa;
