import React, { useEffect, useState } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import { RefreshCw, MessageSquare, FileDown, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import PageMeta from "../../components/PageMeta";

const ListMahasiswaBimbingan = () => {
    const [bimbingan, setBimbingan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const navigate = useNavigate();
    const { user } = useAuth();

    // Pesan belum dibaca: pesan lawan bicara yang lebih baru dari kunjungan
    // terakhir ke halaman chat (dicatat via localStorage oleh halaman chat).
    // API mengirim maksimal 5 pesan terakhir, jadi 5 berarti "5 atau lebih".
    const getUnreadCount = (item) => {
        const lastSeen = Number(
            localStorage.getItem(`chat_last_seen_${item.id_pengajuan}`) || 0
        );
        return (item.Messages || []).filter(
            (m) =>
                Number(m.senderId) !== Number(user?.id_user) &&
                new Date(m.createdAt).getTime() > lastSeen
        ).length;
    };

    const fetchMahasiswaBimbingan = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
                withCredentials: true,
            });

            // FIX ERROR: ambil mahasiswaBimbingan
            // Mahasiswa yang sudah selesai (diarsipkan) ada di halaman Mahasiswa Selesai
            setBimbingan(
                (res.data?.data?.mahasiswaBimbingan || []).filter(
                    (item) => !item.isSelesai
                )
            );

        } catch (error) {
            Swal.fire("Gagal", "Tidak dapat memuat data mahasiswa bimbingan", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMahasiswaBimbingan();
    }, []);

    // Progress
    const getProgressData = (babSubmissions = []) => {
        if (!babSubmissions.length) return { progress: 0, lastBab: 0 };
        const accepted = babSubmissions.filter((b) => b.status === "diterima");
        const lastBab = accepted.length
            ? Math.max(...accepted.map((b) => b.chapter_number))
            : 0;
        const progress = (accepted.length / 5) * 100;
        return { progress, lastBab };
    };

    const handleDownload = (filePath) => {
        if (!filePath)
            return Swal.fire("Info", "File belum tersedia untuk diunduh.", "info");
        window.open(`${imageUrl}uploads/${filePath}`, "_blank");
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
                className={`px-3 py-1 text-xs font-medium rounded-full border ${colorMap[status] || colorMap.default}`}
            >
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    // Filter pencarian (nama / NIM / judul) dan status
    const filteredBimbingan = bimbingan.filter((item) => {
        if (filterStatus && item.status !== filterStatus) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.Mahasiswa?.nama_lengkap?.toLowerCase().includes(q) ||
            item.Mahasiswa?.nim?.toLowerCase().includes(q) ||
            item.title?.toLowerCase().includes(q)
        );
    });

    // ROLE LABEL - gunakan myRole dari API response
    const getRoleLabel = (item) => {
        if (item.myRole === "pembimbing_utama") {
            return (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md border border-green-200">
                    Pembimbing Utama
                </span>
            );
        }

        if (item.myRole === "pembimbing_pendamping") {
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
                title="Bimbingan Mahasiswa"
            />
            <div className="p-6">
                {/* Header */}
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
                            Lihat daftar mahasiswa dan progres bimbingan.
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

                {/* Pencarian & Filter */}
                <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 justify-between mb-6">
                    <div className="relative w-full md:w-1/2">
                        <input
                            type="text"
                            placeholder="Cari nama, NIM, atau judul..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none text-sm"
                        />
                        <Search size={18} className="absolute top-2.5 left-3 text-gray-400" />
                    </div>

                    <div className="flex gap-3">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-300 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-400 outline-none"
                        >
                            <option value="">Semua Status</option>
                            <option value="diajukan">Diajukan</option>
                            <option value="diterima">Diterima</option>
                            <option value="revisi">Revisi</option>
                            <option value="ditolak">Ditolak</option>
                        </select>

                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setFilterStatus("");
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg text-gray-700 transition"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="flex justify-center items-center py-20 text-gray-500">
                        <Loader2 className="animate-spin mr-2" /> Memuat data...
                    </div>
                ) : filteredBimbingan.length === 0 ? (
                    <div className="text-center text-gray-500 py-16 bg-gray-50 border rounded-lg shadow-sm">
                        Tidak ada mahasiswa bimbingan ditemukan.
                    </div>
                ) : (
                    <div className="space-y-4 relative">
                        {filteredBimbingan.map((item, index) => {
                            const { progress, lastBab } = getProgressData(item.BabSubmissions);
                            const progressPercent = Math.round(progress);

                            // API mengurutkan Messages terbaru dulu (DESC), jadi index 0 = terbaru
                            const lastMessage = item.Messages?.length ? item.Messages[0] : null;
                            const unreadCount = getUnreadCount(item);

                            return (
                                <motion.div
                                    key={item.id_pengajuan}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative flex flex-col sm:flex-row gap-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    {/* Status Bar Kiri */}
                                    <div
                                        className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${renderStatusColor(
                                            item.status
                                        )}`}
                                    ></div>

                                    {/* Numbering */}
                                    <div className="absolute -left-3 -top-3">
                                        <div className="bg-gray-800 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md">
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start flex-wrap gap-2">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-800">
                                                    {item.Mahasiswa?.nama_lengkap}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {item.Mahasiswa?.nim} • {item.Mahasiswa?.email_kampus}
                                                </p>
                                            </div>

                                            {/* Role label - menggunakan myRole dari API */}
                                            {getRoleLabel(item)}

                                            {renderStatusBadge(item.status)}
                                        </div>

                                        {/* Judul */}
                                        <p className="text-sm text-gray-700 mt-2">
                                            <span className="font-medium text-gray-800">Judul:</span>{" "}
                                            {item.title}
                                        </p>

                                        {/* Last message */}
                                        {lastMessage ? (
                                            <div className="mt-2 bg-gray-50 border border-gray-100 p-2 rounded-md text-xs text-gray-600">
                                                <p className="italic line-clamp-1">
                                                    "{lastMessage.content}"
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-1">
                                                    {new Date(lastMessage.createdAt).toLocaleString(
                                                        "id-ID",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-xs italic text-gray-400 mt-2">
                                                Belum ada pesan.
                                            </p>
                                        )}

                                        {/* Progress */}
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
                                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                                                <p>{progressPercent}% progres bimbingan</p>
                                                <p className="font-semibold text-gray-700">
                                                    {lastBab > 0
                                                        ? `Sudah Bab ${lastBab}`
                                                        : "Belum ada Bab diterima"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Files */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {item.proposal_file && (
                                                <button
                                                    onClick={() => handleDownload(`proposals/${item.proposal_file}`)}
                                                    className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-md text-xs"
                                                >
                                                    <FileDown size={12} /> Proposal
                                                </button>
                                            )}
                                            {item.BabSubmissions?.map((bab, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleDownload(`bab/${bab.file_path}`)}
                                                    className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-md text-xs"
                                                >
                                                    <FileDown size={12} /> BAB {bab.chapter_number}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Chat button + badge belum dibaca */}
                                    <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                                        <div className="relative">
                                            <button
                                                onClick={() =>
                                                    navigate(`/dosen/chat/${item.id_pengajuan}`)
                                                }
                                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium shadow-sm bg-gray-800 text-white hover:bg-gray-700 transition"
                                            >
                                                <MessageSquare size={16} /> Chat
                                            </button>
                                            {unreadCount > 0 && (
                                                <span
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow"
                                                    title={`${unreadCount >= 5 ? "5 atau lebih" : unreadCount} pesan belum dibaca`}
                                                >
                                                    {unreadCount >= 5 ? "5+" : unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DosenLayout>
    );
};

export default ListMahasiswaBimbingan;