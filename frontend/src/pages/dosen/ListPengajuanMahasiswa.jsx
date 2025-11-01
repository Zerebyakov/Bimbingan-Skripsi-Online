import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import DosenLayout from "./layout/DosenLayout";
import {
    ChevronDown,
    ChevronUp,
    Download,
    Edit3,
    RefreshCw,
    Search,
    FileDown,
} from "lucide-react";
import Swal from "sweetalert2";

const ListPengajuanMahasiswa = () => {
    const [pengajuanList, setPengajuanList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCard, setExpandedCard] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedPengajuan, setSelectedPengajuan] = useState(null);
    const [status, setStatus] = useState("");
    const [reason, setReason] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Ambil data pengajuan
    const fetchPengajuan = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
                withCredentials: true,
            });
            const data = res.data.data || [];
            setPengajuanList(data);
            setFilteredList(data);
        } catch (error) {
            Swal.fire("Gagal", "Tidak dapat memuat data pengajuan", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPengajuan();
    }, []);

    // Filter dan pencarian
    useEffect(() => {
        let filtered = pengajuanList;

        // Filter status
        if (filterStatus) {
            filtered = filtered.filter(
                (item) => item.status && item.status.toLowerCase() === filterStatus
            );
        }

        // Pencarian nama/judul
        if (searchQuery.trim()) {
            filtered = filtered.filter(
                (item) =>
                    item.Mahasiswa?.nama_lengkap
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredList(filtered);
        setCurrentPage(1); // reset ke halaman 1 setiap kali filter berubah
    }, [searchQuery, filterStatus, pengajuanList]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);

    const handlePageChange = (page) => setCurrentPage(page);

    // Ubah status pengajuan
    const handleReview = async () => {
        if (!status) {
            Swal.fire("Peringatan", "Pilih status terlebih dahulu", "warning");
            return;
        }

        if ((status === "revisi" || status === "ditolak") && !reason.trim()) {
            Swal.fire("Peringatan", "Masukkan alasan revisi/penolakan", "warning");
            return;
        }

        try {
            await axios.put(
                `${baseUrl}dosen/pengajuan/${selectedPengajuan.id_pengajuan}/review`,
                {
                    status,
                    rejection_reason:
                        status === "revisi" || status === "ditolak" ? reason : null,
                },
                { withCredentials: true }
            );

            Swal.fire("Berhasil", "Status pengajuan berhasil diperbarui", "success");
            setShowModal(false);
            fetchPengajuan();
        } catch (error) {
            Swal.fire("Gagal", "Terjadi kesalahan saat memperbarui status", "error");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "diterima":
                return "bg-green-100 text-green-700";
            case "revisi":
                return "bg-yellow-100 text-yellow-700";
            case "ditolak":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <DosenLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Daftar Pengajuan Mahasiswa
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Lihat dan kelola pengajuan judul mahasiswa bimbingan Anda.
                        </p>
                    </div>

                    <button
                        onClick={fetchPengajuan}
                        className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>

                {/* Filter & Search */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
                    {/* Search */}
                    <div className="relative w-full md:w-1/2">
                        <input
                            type="text"
                            placeholder="Cari nama mahasiswa atau judul..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm"
                        />
                        <Search
                            size={18}
                            className="absolute top-2.5 left-3 text-gray-400"
                        />
                    </div>

                    {/* Filter status */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-300 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                            <option value="">Semua Status</option>
                            <option value="diterima">Diterima</option>
                            <option value="revisi">Revisi</option>
                            <option value="ditolak">Ditolak</option>
                        </select>
                        <button
                            onClick={() => {
                                setFilterStatus("");
                                setSearchQuery("");
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg text-gray-700 transition"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* List Card */}
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-gray-600">
                        <RefreshCw className="animate-spin mr-2" /> Memuat data...
                    </div>
                ) : currentItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-10 italic">
                        Tidak ada data pengajuan ditemukan.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {currentItems.map((item, index) => (
                                <div
                                    key={item.id_pengajuan}
                                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                                >
                                    <div className="p-5 relative">
                                        {/* Nomor urut */}
                                        <div className="absolute top-3 right-4 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                                            #{(currentPage - 1) * itemsPerPage + index + 1}
                                        </div>

                                        {/* Header Mahasiswa */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <img
                                                src={
                                                    item.Mahasiswa?.foto
                                                        ? `${imageUrl}${item.Mahasiswa.foto}`
                                                        : `https://ui-avatars.com/api/?name=${item.Mahasiswa?.nama_lengkap}`
                                                }
                                                alt="foto"
                                                className="w-12 h-12 rounded-full object-cover border"
                                            />
                                            <div>
                                                <h3 className="font-semibold text-gray-800 text-sm">
                                                    {item.Mahasiswa?.nama_lengkap}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {item.Mahasiswa?.nim}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {item.Mahasiswa?.email_kampus}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Judul */}
                                        <p className="text-sm text-gray-600 mb-1">Judul:</p>
                                        <p className="font-medium text-gray-800 text-sm leading-snug line-clamp-2">
                                            {item.title}
                                        </p>

                                        {/* Status */}
                                        <div className="flex justify-between items-center mt-3">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                    item.status
                                                )}`}
                                            >
                                                {item.status?.toUpperCase() || "MENUNGGU"}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setExpandedCard(
                                                        expandedCard === item.id_pengajuan
                                                            ? null
                                                            : item.id_pengajuan
                                                    )
                                                }
                                                className="text-gray-600 hover:text-gray-800 transition"
                                            >
                                                {expandedCard === item.id_pengajuan ? (
                                                    <ChevronUp size={18} />
                                                ) : (
                                                    <ChevronDown size={18} />
                                                )}
                                            </button>
                                        </div>

                                        {/* Expanded Detail */}
                                        <div
                                            className={`transition-all duration-300 overflow-hidden ${expandedCard === item.id_pengajuan
                                                    ? "max-h-[600px] opacity-100 mt-3"
                                                    : "max-h-0 opacity-0"
                                                }`}
                                        >
                                            <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold">Deskripsi:</span>{" "}
                                                    {item.description || "-"}
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold">Bidang Topik:</span>{" "}
                                                    {item.bidang_topik || "-"}
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold">Keyword:</span>{" "}
                                                    {item.keywords || "-"}
                                                </p>

                                                {/* Download file pengajuan */}
                                                {item.proposal_file && (
                                                    <a
                                                        href={`${baseUrl}${item.proposal_file}`}
                                                        download
                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm pt-1"
                                                    >
                                                        <FileDown size={14} /> Download File Pengajuan
                                                    </a>
                                                )}

                                                {item.rejection_reason && (
                                                    <div className="bg-red-50 text-red-700 p-2 rounded text-sm">
                                                        <b>Catatan:</b> {item.rejection_reason}
                                                    </div>
                                                )}

                                                {/* Tombol Ubah Status */}
                                                <div className="flex justify-end pt-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPengajuan(item);
                                                            setStatus(item.status || "");
                                                            setReason(item.rejection_reason || "");
                                                            setShowModal(true);
                                                        }}
                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition"
                                                    >
                                                        <Edit3 size={14} /> Ubah Status
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center items-center gap-2 mt-8">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === i + 1
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        } transition`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Modal Ubah Status */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                Ubah Status Pengajuan
                            </h2>

                            <label className="block text-gray-700 mb-2 text-sm font-medium">
                                Pilih Status
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-400 outline-none"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">-- Pilih Status --</option>
                                <option value="diterima">Diterima</option>
                                <option value="revisi">Revisi</option>
                                <option value="ditolak">Ditolak</option>
                            </select>

                            {(status === "revisi" || status === "ditolak") && (
                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm font-medium">
                                        Alasan {status === "revisi" ? "Revisi" : "Penolakan"}
                                    </label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                                        rows="3"
                                        placeholder={`Masukkan alasan ${status === "revisi" ? "revisi" : "penolakan"
                                            }...`}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    ></textarea>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleReview}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DosenLayout>
    );
};

export default ListPengajuanMahasiswa;
