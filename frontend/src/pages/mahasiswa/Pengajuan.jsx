import React, { useState, useEffect } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  PencilLine,
  X,
} from "lucide-react";
import PageMeta from "../../components/PageMeta";

const Pengajuan = () => {
  const [pengajuan, setPengajuan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [checkingSimilarity, setCheckingSimilarity] = useState(false);
  const [similarityResult, setSimilarityResult] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    bidang_topik: "",
    keywords: "",
  });
  const [file, setFile] = useState(null);

  // ✅ Ambil data pengajuan dari dashboard
  useEffect(() => {
    const fetchPengajuan = async () => {
      try {
        const res = await axios.get(`${baseUrl}mahasiswa/dashboard`, {
          withCredentials: true,
        });
        setPengajuan(res.data.data.pengajuan);
      } catch (err) {
        console.error("Gagal memuat data pengajuan:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPengajuan();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Validasi dan preview file
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validExtensions = ["application/pdf"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validExtensions.includes(selectedFile.type)) {
      Swal.fire({
        icon: "warning",
        title: "Format tidak valid!",
        text: "Hanya file PDF yang diperbolehkan.",
        confirmButtonColor: "#f59e0b",
      });
      e.target.value = "";
      return;
    }

    if (selectedFile.size > maxSize) {
      Swal.fire({
        icon: "warning",
        title: "File terlalu besar!",
        text: "Ukuran maksimal file adalah 10MB.",
        confirmButtonColor: "#f59e0b",
      });
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleCekKemiripan = async () => {
    if (!form.title || !form.title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Judul belum diisi",
        text: "Masukkan judul terlebih dahulu sebelum mengecek kemiripan.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    setCheckingSimilarity(true);
    setSimilarityResult(null);

    try {
      const res = await axios.post(
        `${baseUrl}pengajuan/cek-kemiripan`,
        {
          title: form.title,
          topK: 10,
        },
        {
          withCredentials: true,
        }
      );

      setSimilarityResult(res.data.data);

      const status = res.data.data.status;

      if (status === "MIRIP") {
        Swal.fire({
          icon: "warning",
          title: "Judul Sangat Mirip",
          text: "Judul memiliki kemiripan tinggi dengan judul yang sudah ada. Silakan tinjau kembali.",
          confirmButtonColor: "#f59e0b",
        });
      } else if (status === "PERLU_REVIEW") {
        Swal.fire({
          icon: "info",
          title: "Perlu Review",
          text: "Judul memiliki beberapa kemiripan dan perlu ditinjau lebih lanjut.",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Aman",
          text: "Tidak ditemukan kemiripan tinggi berdasarkan threshold sistem.",
          confirmButtonColor: "#10b981",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengecek Kemiripan",
        text: err.response?.data?.message || "Terjadi kesalahan saat mengecek kemiripan judul.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setCheckingSimilarity(false);
    }
  };


  // ✅ Kirim pengajuan atau revisi
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("bidang_topik", form.bidang_topik);
    formData.append("keywords", form.keywords);
    if (file) formData.append("proposal", file);

    setIsSubmitting(true);

    try {
      let res;

      // ✅ Semua status (revisi atau ditolak) pakai PUT
      if (pengajuan && ["revisi", "ditolak"].includes(pengajuan.status)) {
        const confirm = await Swal.fire({
          icon: "question",
          title: pengajuan.status === "ditolak" ? "Ajukan Ulang Judul?" : "Kirim Revisi?",
          text:
            pengajuan.status === "ditolak"
              ? "Pengajuan ini akan diperbarui dengan judul baru."
              : "Revisi akan menggantikan pengajuan sebelumnya.",
          showCancelButton: true,
          confirmButtonText: "Ya, kirim",
          cancelButtonText: "Batal",
          confirmButtonColor: "#10b981",
          cancelButtonColor: "#d33",
        });

        if (!confirm.isConfirmed) {
          setIsSubmitting(false);
          return;
        }

        res = await axios.put(
          `${baseUrl}mahasiswa/pengajuan-judul/${pengajuan.id_pengajuan}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        // ✅ Pengajuan baru
        res = await axios.post(`${baseUrl}mahasiswa/pengajuan-judul`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: res.data.message || "Pengajuan berhasil dikirim.",
        confirmButtonColor: "#10b981",
      }).then(() => window.location.reload());
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: err.response?.data?.message || "Terjadi kesalahan server.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
    }
  };


  if (loading) {
    return (
      <MahasiswaLayout>
        <div className="flex justify-center items-center h-80 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Memuat data pengajuan...
        </div>
      </MahasiswaLayout>
    );
  }

  return (
    <MahasiswaLayout>
      <PageMeta
        title="Pengajuan"
      />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
        <h1 className="text-2xl font-semibold text-gray-800 mb-3">
          Pengajuan Judul Skripsi
        </h1>
        <p className="text-gray-500 mb-6 text-sm">
          Ajukan atau revisi judul skripsi Anda. Pastikan informasi lengkap dan
          sesuai dengan ketentuan jurusan.
        </p>

        {/* ✅ Jika sudah ada pengajuan */}
        {pengajuan && !isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow-md rounded-xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-700">
                  Status Pengajuan
                </h2>
              </div>

              {/* Tombol Revisi / Ganti Judul */}
              {(pengajuan.status === "revisi" ||
                pengajuan.status === "ditolak") && (
                  <button
                    onClick={() => {
                      setForm({
                        title: pengajuan.title,
                        description: pengajuan.description,
                        bidang_topik: pengajuan.bidang_topik,
                        keywords: pengajuan.keywords,
                      });
                      setIsEditing(true);
                    }}
                    className={`flex items-center gap-2 text-sm font-medium transition ${pengajuan.status === "revisi"
                      ? "text-yellow-600 hover:text-yellow-700"
                      : "text-red-600 hover:text-red-700"
                      }`}
                  >
                    <PencilLine size={16} />
                    {pengajuan.status === "revisi"
                      ? "Revisi Pengajuan"
                      : "Ganti Judul / Ajukan Ulang"}
                  </button>
                )}
            </div>

            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-medium">Judul:</span> {pengajuan.title}
              </p>
              <p>
                <span className="font-medium">Bidang Topik:</span>{" "}
                {pengajuan.bidang_topik}
              </p>
              <p>
                <span className="font-medium">Kata Kunci:</span>{" "}
                {pengajuan.keywords}
              </p>
              <p>
                <span className="font-medium">Deskripsi:</span>{" "}
                {pengajuan.description}
              </p>

              {pengajuan.proposal_file && (
                <p>
                  <span className="font-medium">File Proposal:</span>{" "}
                  <a
                    href={`${imageUrl}uploads/proposals/${pengajuan.proposal_file}`}
                    download={pengajuan.proposal_file}
                    className="text-emerald-600 underline hover:text-emerald-700"
                  >
                    Lihat File
                  </a>

                </p>
              )}

              {/* Status */}
              <p
                className={`font-semibold mt-2 ${pengajuan.status === "diterima"
                  ? "text-green-600"
                  : pengajuan.status === "revisi"
                    ? "text-yellow-600"
                    : pengajuan.status === "ditolak"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
              >
                Status: {pengajuan.status.toUpperCase()}
              </p>

              {pengajuan.rejection_reason && (
                <p className="text-red-500 text-sm italic mt-1">
                  Catatan Dosen: {pengajuan.rejection_reason}
                </p>
              )}

              {pengajuan.SimilarityChecks?.length > 0 && (
                <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Hasil Deteksi Kemiripan
                  </h3>

                  <p>
                    Status:{" "}
                    <span className="font-semibold">
                      {pengajuan.SimilarityChecks[0].status_similarity}
                    </span>
                  </p>

                  <p>
                    Skor tertinggi:{" "}
                    <span className="font-semibold">
                      {Number(pengajuan.SimilarityChecks[0].max_score || 0).toFixed(4)}
                    </span>
                  </p>

                  <p>
                    Threshold:{" "}
                    <span className="font-semibold">
                      {Number(pengajuan.SimilarityChecks[0].threshold_value || 0).toFixed(4)}
                    </span>
                  </p>

                  {pengajuan.SimilarityChecks[0].Results?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {pengajuan.SimilarityChecks[0].Results.map((item) => (
                        <div key={item.id_result} className="border rounded-md p-3 bg-white">
                          <p className="font-medium text-gray-800">
                            {item.rank_position}. {item.matched_title}
                          </p>
                          <p className="text-sm text-gray-600">
                            Skor: {Number(item.similarity_score || 0).toFixed(4)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status Info */}
              {pengajuan.status === "diajukan" && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="animate-spin" size={16} />
                  Menunggu persetujuan dosen pembimbing...
                </div>
              )}

              {pengajuan.status === "diterima" && (
                <div className="mt-4 flex items-center gap-2 text-green-600">
                  <CheckCircle size={18} />
                  Pengajuan diterima — Anda sudah bisa mulai bimbingan.
                </div>
              )}

              {pengajuan.status === "revisi" && (
                <div className="mt-4 flex items-center gap-2 text-yellow-600">
                  <XCircle size={18} />
                  Judul memerlukan revisi sebelum dapat diterima.
                </div>
              )}

              {pengajuan.status === "ditolak" && (
                <div className="mt-4 flex items-center gap-2 text-red-600">
                  <XCircle size={18} />
                  Pengajuan ditolak — silakan ubah atau revisi judul sesuai saran dosen.
                </div>
              )}

              {pengajuan.status === "batal" && (
                <div className="mt-4 flex items-center gap-2 text-gray-400">
                  <XCircle size={18} />
                  Pengajuan dibatalkan — Anda telah mengajukan judul baru.
                </div>
              )}

            </div>
          </motion.div>
        ) : (
          // ✅ Form pengajuan / revisi / ajukan ulang
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded-xl border border-gray-100 p-6 max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            encType="multipart/form-data"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {pengajuan
                  ? pengajuan.status === "ditolak"
                    ? "Ajukan Ulang Judul"
                    : "Revisi Pengajuan Judul"
                  : "Form Pengajuan Judul"}
              </h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {["title", "bidang_topik", "keywords"].map((key) => (
                <div key={key}>
                  <label className="block text-gray-700 text-sm mb-1 capitalize">
                    {key.replace("_", " ")}
                  </label>
                  <input
                    type="text"
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleCekKemiripan}
                disabled={checkingSimilarity || !form.title}
                className={`w-full py-2.5 rounded-lg text-white font-medium transition ${checkingSimilarity || !form.title
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {checkingSimilarity ? "Mengecek Kemiripan..." : "Cek Kemiripan Judul"}
              </button>

              {similarityResult && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">
                      Hasil Cek Kemiripan Judul
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${similarityResult.status === "MIRIP"
                        ? "bg-red-100 text-red-700"
                        : similarityResult.status === "PERLU_REVIEW"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                        }`}
                    >
                      {similarityResult.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700">
                    <p>
                      Skor tertinggi:{" "}
                      <span className="font-semibold">
                        {Number(similarityResult.max_score || 0).toFixed(4)}
                      </span>
                    </p>
                    <p>
                      Threshold:{" "}
                      <span className="font-semibold">
                        {similarityResult.threshold !== null
                          ? Number(similarityResult.threshold).toFixed(4)
                          : "-"}
                      </span>
                    </p>
                    <p>
                      Total judul pembanding:{" "}
                      <span className="font-semibold">
                        {similarityResult.total_candidates || 0}
                      </span>
                    </p>
                  </div>

                  {similarityResult.results?.length > 0 ? (
                    <div className="space-y-2">
                      {similarityResult.results.map((item, index) => (
                        <div
                          key={`${item.source}-${item.id}-${index}`}
                          className="border rounded-md p-3 bg-white"
                        >
                          <p className="font-medium text-gray-800">
                            {index + 1}. {item.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            Skor: {Number(item.similarity_score).toFixed(4)}
                          </p>
                          <p
                            className={`text-sm font-medium ${item.is_similar ? "text-red-600" : "text-green-600"
                              }`}
                          >
                            {item.is_similar ? "Mirip" : "Tidak Mirip"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Tidak ada judul pembanding.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-sm mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">
                  Upload File Proposal (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {file && (
                  <p className="text-gray-500 text-xs mt-1 italic">
                    File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                    MB)
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-lg text-white font-medium transition ${isSubmitting
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
              >
                {isSubmitting
                  ? pengajuan
                    ? "Mengirim..."
                    : "Mengajukan..."
                  : pengajuan
                    ? pengajuan.status === "ditolak"
                      ? "Ajukan Ulang"
                      : "Kirim Revisi"
                    : "Kirim Pengajuan"}
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </MahasiswaLayout>
  );
};

export default Pengajuan;
