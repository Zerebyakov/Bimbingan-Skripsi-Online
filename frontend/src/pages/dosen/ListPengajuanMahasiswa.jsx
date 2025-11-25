import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import DosenLayout from "./layout/DosenLayout";
import {
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Search,
    FileDown,
    Edit3,
} from "lucide-react";
import Swal from "sweetalert2";
import PageMeta from "../../components/PageMeta";

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

    // ANIMASI
    const [fadeIn, setFadeIn] = useState(false);

    const itemsPerPage = 6;

    const fetchPengajuan = async () => {
        setLoading(true);
        setFadeIn(false); // reset animasi

        try {
            const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
                withCredentials: true,
            });

            const list = res.data?.data?.mahasiswaBimbingan || [];

            setPengajuanList(list);
            setFilteredList(list);

            // delay fade for smooth transition
            setTimeout(() => setFadeIn(true), 350);

        } catch (error) {
            Swal.fire("Gagal", "Tidak dapat memuat data pengajuan", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPengajuan();
    }, []);

    useEffect(() => {
        let filtered = [...pengajuanList];

        if (filterStatus) {
            filtered = filtered.filter(
                (item) =>
                    item.status &&
                    item.status.toLowerCase() === filterStatus.toLowerCase()
            );
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.Mahasiswa?.nama_lengkap?.toLowerCase().includes(q) ||
                    item.title?.toLowerCase().includes(q)
            );
        }

        setFilteredList(filtered);
        setCurrentPage(1);
    }, [filterStatus, searchQuery, pengajuanList]);

    /** PAGINATION */
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filteredList.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);

    /** REVIEW STATUS */
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

            Swal.fire("Berhasil", "Status pengajuan diperbarui", "success");
            setShowModal(false);
            fetchPengajuan();

        } catch (error) {
            Swal.fire("Gagal", "Terjadi kesalahan saat memperbarui status", "error");
        }
    };

    /** STATUS COLOR */
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
            <PageMeta
                title="Kelola Pengajuan Mahasiswa"
            />
            <div
                className={`transition-all duration-500 ease-in-out px-6 py-6 ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}
            >
                <div className="space-y-8">

                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800">
                                Daftar Pengajuan Mahasiswa
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Kelola dan review pengajuan judul mahasiswa bimbingan.
                            </p>
                        </div>

                        <button
                            onClick={fetchPengajuan}
                            className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
                        >
                            <RefreshCw size={16} /> Refresh
                        </button>
                    </div>

                    {/* FILTER SECTION */}
                    <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                        {/* Search */}
                        <div className="relative w-full md:w-1/2">
                            <input
                                type="text"
                                placeholder="Cari nama mahasiswa atau judul..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                            />
                            <Search
                                size={18}
                                className="absolute top-2.5 left-3 text-gray-400"
                            />
                        </div>

                        {/* Filter status */}
                        <div className="flex gap-3">
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

                    {/* LIST CARD */}
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">
                            <RefreshCw className="animate-spin inline-block mr-2" />
                            Memuat data...
                        </div>
                    ) : currentItems.length === 0 ? (
                        <p className="text-gray-500 text-center py-10 italic">
                            Tidak ada pengajuan ditemukan.
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-slide">

                                {currentItems.map((item, index) => (
                                    <div
                                        key={item.id_pengajuan}
                                        className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                                    >
                                        <div className="p-5 relative">

                                            {/* NOMOR */}
                                            <div className="absolute top-3 right-4 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                                                #{(currentPage - 1) * itemsPerPage + index + 1}
                                            </div>

                                            {/* HEADER MAHASISWA */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <img
                                                    src={
                                                        item.Mahasiswa?.foto
                                                            ? `${imageUrl}${item.Mahasiswa.foto}`
                                                            : `https://ui-avatars.com/api/?name=${item.Mahasiswa?.nama_lengkap}`
                                                    }
                                                    className="w-12 h-12 rounded-full object-cover border"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">
                                                        {item.Mahasiswa?.nama_lengkap}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{item.Mahasiswa?.nim}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {item.Mahasiswa?.email_kampus}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* JUDUL */}
                                            <p className="text-sm text-gray-600 mb-1">Judul:</p>
                                            <p className="font-medium text-gray-800 text-sm line-clamp-2">
                                                {item.title}
                                            </p>

                                            {/* STATUS */}
                                            <div className="flex justify-between items-center mt-3">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                        item.status
                                                    )}`}
                                                >
                                                    {item.status?.toUpperCase()}
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

                                            {/* EXPANDED */}
                                            <div
                                                className={`transition-all duration-300 overflow-hidden ${expandedCard === item.id_pengajuan
                                                    ? "max-h-[600px] opacity-100 mt-3"
                                                    : "max-h-0 opacity-0"
                                                    }`}
                                            >
                                                <div className="border-t border-gray-200 pt-3 mt-3 space-y-2 text-sm text-gray-700">

                                                    <p>
                                                        <b>Deskripsi:</b> {item.description}
                                                    </p>
                                                    <p>
                                                        <b>Bidang:</b> {item.bidang_topik}
                                                    </p>
                                                    <p>
                                                        <b>Keyword:</b> {item.keywords}
                                                    </p>

                                                    {/* File proposal */}
                                                    {item.proposal_file && (
                                                        <a
                                                            href={`${imageUrl}uploads/proposals/${item.proposal_file}`}
                                                            download={item.proposal_file}
                                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 pt-1"
                                                        >
                                                            <FileDown size={14} /> Download File Pengajuan
                                                        </a>
                                                    )}

                                                    {/* ROLE BADGE */}
                                                    <div className="mt-3">
                                                        {item.myRole === "pembimbing_utama" ? (
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">
                                                                Pembimbing Utama
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
                                                                Pembimbing Pendamping (akses terbatas)
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* TOMBOL UBAH STATUS */}
                                                    <div className="flex justify-end pt-3">
                                                        {item.canApprove ? (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPengajuan(item);
                                                                    setStatus(item.status || "");
                                                                    setReason(item.rejection_reason || "");
                                                                    setShowModal(true);
                                                                }}
                                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                            >
                                                                <Edit3 size={14} /> Ubah Status
                                                            </button>
                                                        ) : (
                                                            <div className="relative group">
                                                                <button
                                                                    disabled
                                                                    className="flex items-center gap-1 text-gray-400 text-sm cursor-not-allowed"
                                                                >
                                                                    <Edit3 size={14} /> Ubah Status
                                                                </button>

                                                                <div className="absolute right-0 mt-1 w-52 bg-gray-900 text-gray-100 text-xs p-2 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                                    Hanya pembimbing utama yang dapat mengubah status judul.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ))}

                            </div>

                            {/* PAGINATION */}
                            <div className="flex justify-center gap-2 mt-8">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
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



                </div>
            </div>
            {/* MODAL REVIEW */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4
                            transition-all duration-300 ease-in-out opacity-100"
                >
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-slide">

                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Ubah Status Pengajuan
                        </h2>

                        {/* Select */}
                        <label className="block text-sm text-gray-700 mb-1">
                            Pilih Status
                        </label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">-- Pilih Status --</option>
                            <option value="diterima">Diterima</option>
                            <option value="revisi">Revisi</option>
                            <option value="ditolak">Ditolak</option>
                        </select>

                        {(status === "revisi" || status === "ditolak") && (
                            <>
                                <label className="block text-sm text-gray-700 mb-1">
                                    Alasan
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:ring-2 focus:ring-blue-400 outline-none"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </>
                        )}

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReview}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DosenLayout>
    );
};

export default ListPengajuanMahasiswa;
