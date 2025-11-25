import React, { useState, useEffect } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
    Upload,
    CheckCircle,
    FileText,
    Loader2,
    AlertCircle,
    Trash2,
    RefreshCcw,
    Info,
} from "lucide-react";
import PageMeta from "../../components/PageMeta";

const UploadBab = () => {
    const [babList, setBabList] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedBab, setSelectedBab] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const totalBab = 5;

    // === Ambil data Bab ===
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${baseUrl}mahasiswa/dashboard`, {
                    withCredentials: true,
                });
                const data = res.data.data.pengajuan?.BabSubmissions || [];
                setBabList(data);
            } catch (err) {
                console.error("Gagal memuat data Bab:", err);
                Swal.fire({
                    icon: "error",
                    title: "Gagal Memuat Data",
                    text: "Terjadi kesalahan saat memuat data Bab. Silakan coba lagi.",
                    confirmButtonColor: "#16a34a",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // === Handle file change ===
    const handleFileChange = (e, babNumber) => {
        setSelectedFile(e.target.files[0]);
        setSelectedBab(babNumber);
    };

    // === Upload / Re-upload file ===
    const handleUpload = async (e, reupload = false, existingId = null, fileToUpload = null, babNumber = null) => {
        e.preventDefault();

        // Gunakan parameter fileToUpload dan babNumber jika ada (untuk re-upload)
        const file = fileToUpload || selectedFile;
        const bab = babNumber || selectedBab;

        if (!file || !bab) {
            Swal.fire({
                icon: "warning",
                title: "Perhatian!",
                text: "Pilih Bab dan file terlebih dahulu sebelum mengupload.",
                confirmButtonColor: "#f59e0b",
            });
            return;
        }

        const confirm = await Swal.fire({
            title: `${reupload ? "Re-upload" : "Upload"} Bab ${bab}?`,
            text: reupload
                ? "File lama akan diganti dengan yang baru."
                : "Pastikan file yang diupload sudah benar dan final.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#6b7280",
            confirmButtonText: reupload ? "Ya, ganti file" : "Upload sekarang",
            cancelButtonText: "Batal",
            background: "#f9fafb",
        });

        if (!confirm.isConfirmed) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append("chapter_number", bab);
            formData.append("bab", file);

            const url = `${baseUrl}mahasiswa/upload-bab${reupload && existingId ? `/${existingId}` : ""
                }`;

            const res = await axios.post(url, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percent);
                },
            });

            if (res.data.success) {
                Swal.fire({
                    icon: "success",
                    title: reupload ? "File Diperbarui!" : "Upload Berhasil!",
                    text: `Bab ${bab} ${reupload ? "berhasil diganti." : "berhasil diupload."
                        }`,
                    confirmButtonColor: "#16a34a",
                    background: "#f9fafb",
                    timer: 2000,
                });

                if (reupload) {
                    setBabList((prev) =>
                        prev.map((b) =>
                            b.id === existingId ? { ...b, ...res.data.data } : b
                        )
                    );
                } else {
                    setBabList((prev) => [...prev, res.data.data]);
                }

                setSelectedFile(null);
                setSelectedBab("");
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Upload Gagal",
                    text: "Terjadi kesalahan saat upload. Coba lagi.",
                    confirmButtonColor: "#dc2626",
                });
            }
        } catch (err) {
            console.error("Upload Bab gagal:", err);
            Swal.fire({
                icon: "error",
                title: "Gagal Upload",
                text:
                    err.response?.data?.message ||
                    "Upload gagal. Pastikan koneksi stabil dan format file benar.",
                confirmButtonColor: "#dc2626",
            });
        } finally {
            setUploading(false);
        }
    };

    // === Handle Re-upload dengan SweetAlert2 ===
    const handleReupload = async (babUploaded, babNumber) => {
        const result = await Swal.fire({
            title: "Re-upload File?",
            text: "Pilih file baru untuk menggantikan yang lama.",
            input: "file",
            inputAttributes: {
                accept: ".pdf",
            },
            showCancelButton: true,
            confirmButtonText: "Upload",
            cancelButtonText: "Batal",
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#6b7280",
            background: "#f9fafb",
        });

        if (result.isConfirmed && result.value) {
            // Langsung panggil handleUpload dengan file dan babNumber yang sudah ada
            await handleUpload(
                { preventDefault: () => { } },
                true,
                babUploaded.id,
                result.value,
                babNumber
            );
        }
    };

    // === Hapus file Bab ===
    const handleDelete = async (bab) => {
        const confirm = await Swal.fire({
            title: `Hapus Bab ${bab.chapter_number}?`,
            text: "File akan dihapus permanen dari sistem.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Ya, hapus",
            cancelButtonText: "Batal",
            background: "#f9fafb",
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(`${baseUrl}mahasiswa/delete-bab/${bab.id}`, {
                withCredentials: true,
            });

            Swal.fire({
                icon: "success",
                title: "Berhasil Dihapus!",
                text: `Bab ${bab.chapter_number} telah dihapus.`,
                confirmButtonColor: "#16a34a",
                timer: 1500,
            });

            setBabList((prev) => prev.filter((b) => b.id !== bab.id));
        } catch (err) {
            console.error("Gagal hapus Bab:", err);
            Swal.fire({
                icon: "error",
                title: "Gagal Menghapus",
                text: "Terjadi kesalahan saat menghapus Bab.",
                confirmButtonColor: "#dc2626",
            });
        }
    };

    if (loading) {
        return (
            <MahasiswaLayout>
                <div className="flex justify-center items-center h-80 text-gray-500">
                    <Loader2 className="animate-spin mr-2" /> Memuat data Bab...
                </div>
            </MahasiswaLayout>
        );
    }

    const progress = Math.round((babList.length / totalBab) * 100);

    return (
        <MahasiswaLayout>
            <PageMeta
                title="Upload Bab"
            />
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="p-6"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
                            Upload Bab Skripsi
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Unggah Bab 1–5 sesuai arahan dosen pembimbing.
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8 }}
                        className="bg-green-600 h-3 rounded-full"
                    />
                </div>
                <p className="text-gray-600 text-sm mb-8">
                    Progress:{" "}
                    <span className="font-semibold text-green-700">{progress}%</span>
                </p>

                {/* Daftar Bab */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(totalBab)].map((_, index) => {
                        const babNumber = index + 1;
                        const babUploaded = babList.find(
                            (b) => b.chapter_number === babNumber
                        );

                        return (
                            <motion.div
                                key={babNumber}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 flex flex-col justify-between relative"
                            >
                                {/* Badge Revisi */}
                                {babUploaded?.status === "revisi" && (
                                    <span className="absolute top-3 right-3 text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg">
                                        Direvisi
                                    </span>
                                )}

                                <div className="flex items-center gap-3 mb-3">
                                    <FileText className="text-gray-500" />
                                    <h2 className="text-lg font-medium text-gray-700">
                                        Bab {babNumber}
                                    </h2>
                                </div>

                                {babUploaded ? (
                                    <div>
                                        <div
                                            className={`flex items-center gap-2 mb-2 ${babUploaded.status === "diterima"
                                                ? "text-green-600"
                                                : babUploaded.status === "revisi"
                                                    ? "text-yellow-600"
                                                    : "text-gray-500"
                                                }`}
                                        >
                                            <CheckCircle size={18} />
                                            <span className="text-sm font-medium capitalize">
                                                {babUploaded.status || "Menunggu Review"}
                                            </span>
                                        </div>
                                        <a
                                            href={`${imageUrl}uploads/bab/${babUploaded.file_path}`}
                                            download={babUploaded.file_path}
                                            className="text-xs text-green-600 hover:underline"
                                        >
                                            Lihat File ({babUploaded.original_name})
                                        </a>

                                        {/* Notes Dosen jika revisi */}
                                        {babUploaded.status === "revisi" && babUploaded.notes && (
                                            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800 flex items-start gap-2">
                                                <Info size={14} className="mt-0.5 text-yellow-600" />
                                                <span>{babUploaded.notes}</span>
                                            </div>
                                        )}

                                        {/* Tombol hanya muncul jika revisi */}
                                        {babUploaded.status === "revisi" && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleReupload(babUploaded, babNumber)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                >
                                                    <RefreshCcw size={14} /> Re-upload
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(babUploaded)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                >
                                                    <Trash2 size={14} /> Hapus
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpload} className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => handleFileChange(e, babNumber)}
                                            className="text-sm text-gray-600"
                                        />
                                        <button
                                            type="submit"
                                            disabled={uploading && selectedBab === babNumber}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium transition ${uploading && selectedBab === babNumber
                                                ? "bg-green-400 cursor-not-allowed"
                                                : "bg-green-600 hover:bg-green-700"
                                                }`}
                                        >
                                            {uploading && selectedBab === babNumber ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    {uploadProgress < 100
                                                        ? `Mengupload ${uploadProgress}%`
                                                        : "Memproses..."}
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={16} />
                                                    Upload Bab {babNumber}
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                <div className="flex items-start mt-10 bg-green-50 border border-green-100 p-4 rounded-xl">
                    <AlertCircle className="text-green-600 mt-0.5" size={18} />
                    <p className="text-sm text-green-700 ml-2">
                        Bab yang telah <strong>diterima</strong> tidak dapat diubah lagi.
                        Jika Bab <strong>revisi</strong>, dosen akan memberikan catatan untuk
                        perbaikan.
                    </p>
                </div>
            </motion.div>
        </MahasiswaLayout>
    );
};

export default UploadBab;