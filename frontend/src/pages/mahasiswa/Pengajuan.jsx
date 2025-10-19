import React, { useState, useEffect } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { motion } from "framer-motion";
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  PencilLine,
  X,
} from "lucide-react";

const Pengajuan = () => {
  const [pengajuan, setPengajuan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    bidang_topik: "",
    keywords: "",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (pengajuan && pengajuan.status === "revisi") {
        await axios.put(
          `${baseUrl}mahasiswa/pengajuan-judul/${pengajuan.id_pengajuan}`,
          form,
          { withCredentials: true }
        );
        alert("Pengajuan berhasil diperbarui!");
      } else {
        await axios.post(`${baseUrl}mahasiswa/pengajuan-judul`, form, {
          withCredentials: true,
        });
        alert("Pengajuan judul berhasil dikirim!");
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan. Silakan coba lagi.");
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

        {/* ✅ Jika Sudah Ada Pengajuan */}
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

              {/* Tombol Revisi */}
              {pengajuan.status === "revisi" && (
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
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  <PencilLine size={16} />
                  Perbarui Judul
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

              <p
                className={`font-semibold mt-2 ${pengajuan.status === "diterima"
                    ? "text-green-600"
                    : pengajuan.status === "revisi"
                      ? "text-yellow-600"
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
            </div>

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
          </motion.div>
        ) : (
          // ✅ Form Pengajuan Baru atau Revisi
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded-xl border border-gray-100 p-6 max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {pengajuan ? "Perbarui Pengajuan Judul" : "Form Pengajuan Judul"}
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
              <div>
                <label className="block text-gray-700 text-sm mb-1">
                  Judul Skripsi
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">
                  Bidang Topik
                </label>
                <input
                  type="text"
                  name="bidang_topik"
                  value={form.bidang_topik}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1">
                  Kata Kunci
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={form.keywords}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
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
                    ? "Memperbarui..."
                    : "Mengirim..."
                  : pengajuan
                    ? "Perbarui Pengajuan"
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
