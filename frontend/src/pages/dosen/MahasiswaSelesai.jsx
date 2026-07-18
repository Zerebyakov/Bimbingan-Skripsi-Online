import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import DosenLayout from "./layout/DosenLayout";
import {
    RefreshCw,
    Search,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import PageMeta from "../../components/PageMeta";

// Badge status arsip
const arsipBadge = {
    SELESAI: "bg-green-100 text-green-700",
    LULUS: "bg-blue-100 text-blue-700",
    REVISI_ULANG: "bg-yellow-100 text-yellow-700",
};

const MahasiswaSelesai = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
                withCredentials: true,
            });
            const all = res.data?.data?.mahasiswaBimbingan || [];
            // Hanya mahasiswa yang sudah selesai (memiliki arsip)
            setList(all.filter((item) => item.isSelesai || item.Arsip));
        } catch (error) {
            Swal.fire("Gagal", "Tidak dapat memuat data mahasiswa selesai", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filtered = list.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.Mahasiswa?.nama_lengkap?.toLowerCase().includes(q) ||
            item.Mahasiswa?.nim?.toLowerCase().includes(q) ||
            item.title?.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.max(Math.ceil(filtered.length / itemsPerPage), 1);
    const safePage = Math.min(currentPage, totalPages);
    const currentItems = filtered.slice(
        (safePage - 1) * itemsPerPage,
        safePage * itemsPerPage
    );

    return (
        <DosenLayout>
            <PageMeta title="Mahasiswa Selesai" />
            <div className="px-6 py-6 space-y-6">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                            <GraduationCap size={24} className="text-gray-600" />
                            Mahasiswa Selesai Bimbingan
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Daftar mahasiswa bimbingan yang telah menyelesaikan skripsi
                            (sudah diarsipkan).
                        </p>
                    </div>

                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* SEARCH */}
                <div className="relative w-full md:w-1/2">
                    <input
                        type="text"
                        placeholder="Cari nama, NIM, atau judul..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                    />
                    <Search size={18} className="absolute top-2.5 left-3 text-gray-400" />
                </div>

                {/* TABLE */}
                {loading ? (
                    <div className="text-center py-16 text-gray-500">
                        <RefreshCw className="animate-spin inline-block mr-2" />
                        Memuat data...
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="text-center text-gray-500 border rounded-lg py-16 bg-gray-50">
                        Belum ada mahasiswa yang menyelesaikan bimbingan.
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-700">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">No</th>
                                    <th className="px-6 py-3">Mahasiswa</th>
                                    <th className="px-6 py-3">Judul Skripsi</th>
                                    <th className="px-6 py-3 text-center">Tanggal Selesai</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-center">Peran Saya</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item, index) => (
                                    <tr
                                        key={item.id_pengajuan}
                                        className="border-t hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-gray-500">
                                            {(safePage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={
                                                        item.Mahasiswa?.foto
                                                            ? `${imageUrl}${item.Mahasiswa.foto}`
                                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                item.Mahasiswa?.nama_lengkap || "Mahasiswa"
                                                            )}`
                                                    }
                                                    alt={`Foto ${item.Mahasiswa?.nama_lengkap || "mahasiswa"}`}
                                                    className="w-10 h-10 rounded-full object-cover border"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-800">
                                                        {item.Mahasiswa?.nama_lengkap}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {item.Mahasiswa?.nim}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="text-gray-800">{item.title}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">
                                            {item.Arsip?.tanggalSelesai
                                                ? new Date(item.Arsip.tanggalSelesai).toLocaleDateString(
                                                    "id-ID",
                                                    { day: "2-digit", month: "long", year: "numeric" }
                                                )
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`px-3 py-1 text-xs font-semibold rounded-full ${arsipBadge[item.Arsip?.status] ||
                                                    "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {item.Arsip?.status || "SELESAI"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.myRole === "pembimbing_utama" ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium whitespace-nowrap">
                                                    Pembimbing Utama
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium whitespace-nowrap">
                                                    Pembimbing Pendamping
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && filtered.length > itemsPerPage && (
                    <div className="flex justify-center items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(safePage - 1)}
                            disabled={safePage === 1}
                            aria-label="Halaman sebelumnya"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${safePage === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <span className="text-sm text-gray-600">
                            Halaman <b>{safePage}</b> dari <b>{totalPages}</b>
                        </span>
                        <button
                            onClick={() => setCurrentPage(safePage + 1)}
                            disabled={safePage === totalPages}
                            aria-label="Halaman berikutnya"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${safePage === totalPages
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </DosenLayout>
    );
};

export default MahasiswaSelesai;
