import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import DosenLayout from "./layout/DosenLayout";
import {
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Search,
    FileDown,
    Edit3,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
} from "lucide-react";
import Swal from "sweetalert2";
import PageMeta from "../../components/PageMeta";
import StatusBadge from "../../components/ui/StatusBadge";
import { SIMILARITY_STYLES } from "../../components/ui/SimilarityBadge";
import { formatScore } from "../../utils/format";

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
    const fadeTimeoutRef = React.useRef(null); // simpan ID timeout agar bisa dibersihkan

    const itemsPerPage = 6;

    const fetchPengajuan = async () => {
        setLoading(true);
        setFadeIn(false); // reset animasi

        try {
            const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
                withCredentials: true,
            });

            // Mahasiswa yang sudah selesai (diarsipkan) tidak ditampilkan di sini
            const list = (res.data?.data?.mahasiswaBimbingan || []).filter(
                (item) => !item.isSelesai
            );

            setPengajuanList(list);
            setFilteredList(list);

            // delay fade for smooth transition (dibersihkan saat unmount)
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
            fadeTimeoutRef.current = setTimeout(() => setFadeIn(true), 350);

        } catch (error) {
            Swal.fire("Gagal", "Tidak dapat memuat data pengajuan", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPengajuan();
        // Cleanup: cegah setState setelah komponen unmount
        return () => {
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        };
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
                    item.Mahasiswa?.nim?.toLowerCase().includes(q) ||
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

    // Jendela nomor halaman terbatas agar tidak meluber saat data banyak
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push("...", totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, "...");
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, "...");
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push("...", totalPages);
        }
        return pages;
    };

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

    /** ===== KEMIRIPAN JUDUL ===== */

    // Ambil pengecekan kemiripan TERBARU (backend mengurutkan checkedAt DESC)
    const getLatestCheck = (item) =>
        item.SimilarityChecks?.length > 0 ? item.SimilarityChecks[0] : null;

    // Ikon per status kemiripan; warna & label diambil dari SIMILARITY_STYLES bersama
    const similarityIcons = {
        MIRIP: ShieldX,
        PERLU_REVIEW: ShieldAlert,
        AMAN: ShieldCheck,
    };

    // Badge ringkas kemiripan pada muka kartu
    const renderSimilarityBadge = (item) => {
        const check = getLatestCheck(item);
        if (!check) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 italic">
                    Belum dicek
                </span>
            );
        }
        const cfg = SIMILARITY_STYLES[check.status_similarity] || SIMILARITY_STYLES.AMAN;
        const Icon = similarityIcons[check.status_similarity] || ShieldCheck;
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cfg.className}`}
                title={`Skor kemiripan tertinggi: ${formatScore(check.max_score)}`}
            >
                <Icon size={12} /> {cfg.label} · {formatScore(check.max_score, 2)}
            </span>
        );
    };

    // Blok detail kemiripan di bagian expanded kartu
    const renderSimilarityDetail = (item) => {
        const check = getLatestCheck(item);
        if (!check) return null;

        const results = [...(check.Results || [])].sort((a, b) => {
            if (a.rank_position != null && b.rank_position != null) {
                return a.rank_position - b.rank_position;
            }
            return Number(b.similarity_score) - Number(a.similarity_score);
        });

        return (
            <div className="border-t border-gray-200 pt-3 mt-1">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">
                        Hasil Cek Kemiripan Judul
                    </p>
                    <span className="text-[11px] text-gray-400">
                        Threshold: {formatScore(check.threshold_value, 2)}
                        {check.checkedAt &&
                            ` · ${new Date(check.checkedAt).toLocaleDateString("id-ID")}`}
                    </span>
                </div>

                {results.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">
                        Tidak ada judul terdahulu yang melewati ambang penyimpanan.
                    </p>
                ) : (
                    <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {results.map((r, idx) => (
                            <li
                                key={r.id_result}
                                className="flex items-start justify-between gap-2 text-xs bg-gray-50 border border-gray-100 rounded-md px-2.5 py-1.5"
                            >
                                <div className="text-gray-700 leading-snug">
                                    <span className="text-gray-400 mr-1">
                                        {r.rank_position ?? idx + 1}.
                                    </span>
                                    {r.matched_title}
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        {r.source_author || "—"}
                                        {r.source_year ? ` · ${r.source_year}` : ""}
                                        {r.source_table === "arsip" ? " · Arsip" : ""}
                                    </p>
                                </div>
                                <span
                                    className={`shrink-0 font-semibold ${r.is_similar ? "text-red-600" : "text-gray-500"
                                        }`}
                                    title={r.is_similar ? "Di atas threshold" : "Di bawah threshold"}
                                >
                                    {formatScore(r.similarity_score)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
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
                                <option value="diajukan">Diajukan</option>
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
                                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                item.Mahasiswa?.nama_lengkap || "Mahasiswa"
                                                            )}`
                                                    }
                                                    alt={`Foto ${item.Mahasiswa?.nama_lengkap || "mahasiswa"}`}
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
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <StatusBadge
                                                        status={item.status}
                                                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                                                    >
                                                        {item.status?.toUpperCase()}
                                                    </StatusBadge>

                                                    {/* BADGE KEMIRIPAN */}
                                                    {renderSimilarityBadge(item)}
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        setExpandedCard(
                                                            expandedCard === item.id_pengajuan
                                                                ? null
                                                                : item.id_pengajuan
                                                        )
                                                    }
                                                    aria-label={
                                                        expandedCard === item.id_pengajuan
                                                            ? "Tutup detail pengajuan"
                                                            : "Buka detail pengajuan"
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
                                                    ? "max-h-[1200px] opacity-100 mt-3"
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

                                                    {/* DETAIL KEMIRIPAN JUDUL */}
                                                    {renderSimilarityDetail(item)}

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

                            {/* PAGINATION: Prev/Next + jendela nomor terbatas */}
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    aria-label="Halaman sebelumnya"
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentPage === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    <ChevronLeft size={14} /> Prev
                                </button>

                                {getPageNumbers().map((page, idx) =>
                                    page === "..." ? (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="px-2 py-1.5 text-sm text-gray-500"
                                        >
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === page
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                } transition`}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    aria-label="Halaman berikutnya"
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentPage === totalPages
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    Next <ChevronRight size={14} />
                                </button>
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