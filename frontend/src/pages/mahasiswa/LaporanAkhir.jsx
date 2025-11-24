import React, { useEffect, useState } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import Swal from "sweetalert2";
import {
  Upload,
  Loader2,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";
import { Link } from "react-router";


const LaporanAkhir = () => {
  const [files, setFiles] = useState({
    finalFile: null,
    abstrakFile: null,
    pengesahanFile: null,
    pernyataanFile: null,
    presentasiFile: null,
  });

  const [laporan, setLaporan] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [kartu, setKartu] = useState(null);

  // === FETCH LAPORAN SAAT REFRESH ===
  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const res = await axios.get(`${baseUrl}mahasiswa/dashboard`, {
          withCredentials: true,
        });
        const data = res.data?.data?.laporan || res.data?.data?.laporanAkhir;
        if (data) setLaporan(data);
      } catch (err) {
        console.error("Gagal memuat laporan:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    setFiles((prev) => ({
      ...prev,
      [key]: file,
    }));
  };

  // Fungsi untuk menghapus file yang sudah dipilih
  const handleRemoveFile = (key) => {
    setFiles((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const uploadLaporan = async (e) => {
    e.preventDefault();

    if (laporan?.status?.toLowerCase() === "diterima") {
      Swal.fire({
        icon: "info",
        title: "Upload Tidak Diizinkan",
        text: "Laporan sudah diterima. Tidak dapat mengupload ulang.",
        confirmButtonColor: "#6b7280",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    if (![...formData.keys()].length) {
      Swal.fire({
        icon: "warning",
        title: "Tidak ada file dipilih",
        text: "Pilih minimal satu file laporan untuk diupload.",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const response = await axios.post(
        `${baseUrl}mahasiswa/laporan-akhir`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              setProgress(percent);
            }
          },
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Upload Berhasil",
          text: response.data.message,
          confirmButtonColor: "#16a34a",
        });
        setLaporan(response.data.data);
        // Reset files setelah upload berhasil
        setFiles({
          finalFile: null,
          abstrakFile: null,
          pengesahanFile: null,
          pernyataanFile: null,
          presentasiFile: null,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Upload Gagal",
          text: response.data.message || "Terjadi kesalahan saat upload.",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Upload",
        text:
          err.response?.data?.message ||
          "Terjadi kesalahan server. Pastikan format file sesuai.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const generateKartu = async () => {
    if (
      !laporan?.status ||
      !["diterima", "approved", "verified"].includes(
        laporan.status.toLowerCase()
      )
    ) {
      Swal.fire({
        icon: "info",
        title: "Laporan belum disetujui",
        text: "Kartu bimbingan hanya dapat digenerate setelah laporan diterima.",
        confirmButtonColor: "#6b7280",
      });
      return;
    }

    setGenerating(true);
    try {
      const res = await axios.get(`${baseUrl}mahasiswa/kartu-bimbingan`, {
        withCredentials: true,
      });

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Kartu Bimbingan Berhasil Dibuat",
          text: res.data.message,
          confirmButtonColor: "#16a34a",
        });
        setKartu(res.data.data);
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: res.data.message || "Tidak dapat membuat kartu.",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text:
          err.response?.data?.message ||
          "Gagal membuat kartu bimbingan. Coba lagi nanti.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setGenerating(false);
    }
  };

  // === STATUS UI ===
  const getStatusDisplay = (status) => {
    if (!status)
      return {
        color: "text-gray-600 bg-gray-100",
        icon: <Clock className="text-gray-400" />,
        label: "Belum diupload",
      };

    const s = status.toLowerCase();
    if (s.includes("menunggu"))
      return {
        color: "text-yellow-700 bg-yellow-50",
        icon: <Clock className="text-yellow-600" />,
        label: "Menunggu Verifikasi",
      };
    if (s.includes("revisi"))
      return {
        color: "text-orange-700 bg-orange-50",
        icon: <AlertCircle className="text-orange-600" />,
        label: "Perlu Revisi",
      };
    if (s.includes("diterima"))
      return {
        color: "text-green-700 bg-green-50",
        icon: <CheckCircle className="text-green-600" />,
        label: "Diterima",
      };
    if (s.includes("ditolak"))
      return {
        color: "text-red-700 bg-red-50",
        icon: <XCircle className="text-red-600" />,
        label: "Ditolak",
      };
    return {
      color: "text-gray-700 bg-gray-100",
      icon: <Clock className="text-gray-500" />,
      label: status,
    };
  };

  const downloadFile = (fileName) => {
    if (!fileName) {
      Swal.fire({
        icon: "info",
        title: "File belum tersedia",
        text: "Laporan ini belum diupload atau diverifikasi.",
        confirmButtonColor: "#6b7280",
      });
      return;
    }
    const url = `${imageUrl}uploads/laporan/${fileName}`;
    window.open(url, "_blank");
  };

  const isDisabled = laporan?.status?.toLowerCase() === "diterima";

  return (
    <MahasiswaLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Laporan Akhir & Kartu Bimbingan
        </h1>
        <p className="text-gray-500 mb-6 text-sm">
          Unggah laporan akhirmu. Setelah disetujui dosen, kamu dapat membuat
          kartu bimbingan akhir.
        </p>

        {/* STATUS */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            {getStatusDisplay(laporan?.status).icon}
            <div>
              <p
                className={`text-sm font-semibold ${getStatusDisplay(laporan?.status).color
                  }`}
              >
                {getStatusDisplay(laporan?.status).label}
              </p>
              {laporan?.notes && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  Catatan Dosen: {laporan.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={uploadLaporan}
          className="space-y-6 bg-white border border-gray-100 rounded-xl p-6 shadow-sm"
        >
          {[
            { key: "finalFile", label: "Laporan Final" },
            { key: "abstrakFile", label: "Abstrak" },
            { key: "pengesahanFile", label: "Lembar Pengesahan" },
            { key: "pernyataanFile", label: "Surat Pernyataan" },
            { key: "presentasiFile", label: "File Presentasi" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3"
            >
              <div className="flex items-center gap-3">
                <FileText className="text-gray-500" />
                <div>
                  <p className="font-medium text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">PDF / DOC / DOCX</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row sm:items-center gap-2">
                <label
                  className={`cursor-pointer ${isDisabled
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600"
                    } px-4 py-2 rounded-md text-sm transition`}
                >
                  Pilih File
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    disabled={isDisabled}
                    onChange={(e) => handleFileChange(e, item.key)}
                  />
                </label>

                {/* Tampilkan file yang baru dipilih */}
                {files[item.key] && (
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-md">
                    <p className="text-xs text-blue-700 font-medium">
                      {files[item.key].name}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.key)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Tampilkan file yang sudah diupload sebelumnya */}
                {!files[item.key] && laporan?.[item.key] && (
                  <button
                    type="button"
                    onClick={() => downloadFile(laporan[item.key])}
                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <Download size={14} /> {laporan[item.key]}
                  </button>
                )}

                {/* Jika tidak ada file dipilih dan belum ada yang diupload */}
                {!files[item.key] && !laporan?.[item.key] && (
                  <p className="text-xs text-gray-400">Belum diupload</p>
                )}
              </div>
            </div>
          ))}

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-2 transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || isDisabled}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-white font-medium transition ${isDisabled
                ? "bg-gray-300 cursor-not-allowed"
                : uploading
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
                }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Mengupload...
                </>
              ) : (
                <>
                  <Upload size={18} /> Upload Laporan
                </>
              )}
            </button>
          </div>
        </form>

        {/* === KARTU BIMBINGAN === */}
        <div className="mt-8 bg-white shadow-sm border border-gray-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Kartu Bimbingan
            </h2>
            {kartu ? (
              <Link
                to={`/mahasiswa/kartu-bimbingan/${kartu.id_kartu}`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Lihat & Cetak Kartu
              </Link>
            ) : (
              <button
                onClick={generateKartu}
                disabled={
                  generating ||
                  !laporan?.status ||
                  laporan.status.toLowerCase() !== "diterima"
                }
                className={`px-4 py-2 rounded-md font-medium transition ${generating
                  ? "bg-indigo-400 text-white cursor-not-allowed"
                  : !laporan?.status ||
                    laporan.status.toLowerCase() !== "diterima"
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
              >
                {generating ? "Membuat..." : "Generate Kartu"}
              </button>
            )}
          </div>

          {kartu ? (
            <div className="border-t pt-4 text-sm text-gray-700">
              <p>
                <span className="font-medium">Nomor Kartu:</span>{" "}
                {kartu.nomorKartu}
              </p>
              <p>
                <span className="font-medium">Total Pertemuan:</span>{" "}
                {kartu.totalPertemuan}
              </p>
              <p>
                <span className="font-medium">Total Bab:</span> {kartu.totalBab}
              </p>
              <p>
                <span className="font-medium">Tanggal Selesai:</span>{" "}
                {new Date(kartu.selesaiAt).toLocaleString("id-ID")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Belum ada kartu yang digenerate.
            </p>
          )}
        </div>
      </div>
    </MahasiswaLayout>
  );
};

export default LaporanAkhir;