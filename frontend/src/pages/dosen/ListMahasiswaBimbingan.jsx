import React, { useEffect, useState } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import {
    RefreshCw,
    MessageSquare,
    FileDown,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const ListMahasiswaBimbingan = () => {
    const [bimbingan, setBimbingan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPengajuan, setSelectedPengajuan] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [statusValue, setStatusValue] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const fetchMahasiswaBimbingan = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
                withCredentials: true,
            });
            setBimbingan(res.data.data || []);
        } catch (error) {
            console.error("Error fetching mahasiswa bimbingan:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMahasiswaBimbingan();
    }, []);

    const getProgressFromMessages = (messages = []) => {
        if (!messages.length) return 0;
        const babRegex = /bab\s*(\d+)/i;
        for (let i = messages.length - 1; i >= 0; i--) {
            const match = messages[i].content.match(babRegex);
            if (match) return parseInt(match[1], 10);
        }
        return 0;
    };

    const openModal = (item) => {
        setSelectedPengajuan(item);
        setStatusValue(item.status || "");
        setRejectionReason(item.rejection_reason || "");
        setModalOpen(true);
    };

    const handleSaveStatus = async () => {
        if (!statusValue) return;
        const confirm = await Swal.fire({
            title: "Konfirmasi Perubahan",
            text: `Yakin ingin mengubah status menjadi "${statusValue}"?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#1f2937",
            cancelButtonColor: "#d1d5db",
            confirmButtonText: "Ya, Simpan",
            cancelButtonText: "Batal",
        });
        if (!confirm.isConfirmed) return;

        setSaving(true);
        try {
            const payload =
                statusValue === "revisi" || statusValue === "ditolak"
                    ? { status: statusValue, rejection_reason: rejectionReason }
                    : { status: "diterima" };

            await axios.put(
                `${baseUrl}dosen/pengajuan/${selectedPengajuan.id_pengajuan}/review`,
                payload,
                { withCredentials: true }
            );

            Swal.fire({
                icon: "success",
                title: "Berhasil!",
                text: "Status pengajuan berhasil diperbarui.",
                timer: 1800,
                showConfirmButton: false,
            });
            setModalOpen(false);
            fetchMahasiswaBimbingan();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Terjadi kesalahan saat memperbarui status.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = (filePath) => {
        if (!filePath) return Swal.fire("File belum tersedia.", "", "info");
        window.open(`${baseUrl}${filePath}`, "_blank");
    };

    const renderStatusColor = (status) => {
        switch (status) {
            case "diterima":
                return "bg-green-600";
            case "revisi":
                return "bg-yellow-500";
            case "ditolak":
                return "bg-red-500";
            default:
                return "bg-gray-400";
        }
    };

    const renderStatusBadge = (status) => {
        const colorMap = {
            diterima: "bg-green-50 text-green-700 border-green-200",
            revisi: "bg-yellow-50 text-yellow-700 border-yellow-200",
            ditolak: "bg-red-50 text-red-700 border-red-200",
            default: "bg-gray-50 text-gray-700 border-gray-200",
        };
        return (
            <span
                className={`px-3 py-1 text-xs font-medium rounded-full border ${colorMap[status] || colorMap.default
                    }`}
            >
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    return (
        <DosenLayout>
            <div className="p-6">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
                >
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Mahasiswa Bimbingan
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Lihat daftar pengajuan mahasiswa dan kelola status bimbingan Anda.
                        </p>
                    </div>

                    <button
                        onClick={fetchMahasiswaBimbingan}
                        className={`flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition ${loading ? "opacity-60 cursor-not-allowed" : ""
                            }`}
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        {loading ? "Menyegarkan..." : "Refresh"}
                    </button>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center items-center py-20 text-gray-500">
                        <Loader2 className="animate-spin mr-2" /> Memuat data...
                    </div>
                ) : bimbingan.length === 0 ? (
                    <div className="text-center text-gray-500 py-16 bg-gray-50 border rounded-lg shadow-sm">
                        Tidak ada mahasiswa bimbingan ditemukan.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bimbingan.map((item, index) => {
                            const progress = getProgressFromMessages(item.Messages);
                            const progressPercent = Math.min(progress * 20, 100);
                            const isChatEnabled = item.status === "diterima";

                            return (
                                <motion.div
                                    key={item.id_pengajuan}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative flex flex-col sm:flex-row gap-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    {/* Strip status kiri */}
                                    <div
                                        className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${renderStatusColor(
                                            item.status
                                        )}`}
                                    ></div>

                                    {/* Penomoran */}
                                    <div className="absolute -left-3 -top-3 bg-gray-800 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start flex-wrap gap-2">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-800">
                                                    {item.Mahasiswa?.nama_lengkap}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {item.Mahasiswa?.nim} •{" "}
                                                    {item.Mahasiswa?.email_kampus}
                                                </p>
                                            </div>
                                            {renderStatusBadge(item.status)}
                                        </div>

                                        <p className="text-sm text-gray-700 mt-2">
                                            <span className="font-medium text-gray-800">Judul:</span>{" "}
                                            {item.title}
                                        </p>

                                        {(item.status === "revisi" ||
                                            item.status === "ditolak") && (
                                                <p
                                                    className={`mt-2 text-sm italic px-3 py-2 rounded-md border ${item.status === "revisi"
                                                            ? "text-yellow-700 bg-yellow-50 border-yellow-100"
                                                            : "text-red-700 bg-red-50 border-red-100"
                                                        }`}
                                                >
                                                    Alasan: {item.rejection_reason}
                                                </p>
                                            )}

                                        {/* Progress Bar */}
                                        <div className="mt-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    className={`h-2 rounded-full ${progressPercent === 100
                                                            ? "bg-green-600"
                                                            : "bg-gray-800"
                                                        }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    transition={{ duration: 0.6 }}
                                                ></motion.div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                BAB {progress || 0} ({progressPercent}% selesai)
                                            </p>
                                        </div>

                                        {/* Download Buttons */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <button
                                                onClick={() => handleDownload(item.proposal_file)}
                                                className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-md text-xs"
                                            >
                                                <FileDown size={12} /> Proposal
                                            </button>
                                            {item.BabSubmissions?.map((bab, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleDownload(bab.filePath)}
                                                    className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-md text-xs"
                                                >
                                                    <FileDown size={12} /> BAB {bab.babNumber}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tombol Aksi */}
                                    <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                                        <button
                                            onClick={() =>
                                                navigate(`/dosen/chat/${item.id_pengajuan}`)
                                            }
                                            disabled={!isChatEnabled}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium shadow-sm ${isChatEnabled
                                                    ? "bg-gray-800 text-white hover:bg-gray-700"
                                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                }`}
                                        >
                                            <MessageSquare size={16} /> Chat
                                        </button>
                                        <button
                                            onClick={() => openModal(item)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-800 border border-gray-300 hover:bg-gray-100 transition"
                                        >
                                            <CheckCircle2 size={16} /> Ubah Status
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Update Status */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                Ubah Status Pengajuan
                            </h2>

                            <div className="space-y-3">
                                <select
                                    value={statusValue}
                                    onChange={(e) => setStatusValue(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                                >
                                    <option value="">Pilih status</option>
                                    <option value="diterima">Diterima</option>
                                    <option value="revisi">Revisi</option>
                                    <option value="ditolak">Ditolak</option>
                                </select>

                                {(statusValue === "revisi" || statusValue === "ditolak") && (
                                    <textarea
                                        placeholder="Masukkan alasan..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-200"
                                        rows={3}
                                    />
                                )}
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSaveStatus}
                                    disabled={saving}
                                    className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700 flex items-center gap-2"
                                >
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    Simpan
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DosenLayout>
    );
};

export default ListMahasiswaBimbingan;
