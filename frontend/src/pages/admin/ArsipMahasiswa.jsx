import React, { useEffect, useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import {
    Search,
    FileText,
    FolderOpen,
    Eye,
    RefreshCw,
    CheckCircle,
    Pencil,
    Download,
    User,
    ChevronLeft,
    ChevronRight,
    Edit3,
} from "lucide-react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import ExportToExcel from "./components/ExportToExcel";
import PageMeta from "../../components/PageMeta";

const ArsipMahasiswa = () => {
    const [arsip, setArsip] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedArsip, setSelectedArsip] = useState(null);
    const [updateData, setUpdateData] = useState({
        status: "",
        fileFinal: "",
        kartuBimbinganFile: "",
        tanggalSelesai: "",
    });

    const [showDetail, setShowDetail] = useState(false);
    const [showUpdate, setShowUpdate] = useState(false);

    // Filtering
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterProdi, setFilterProdi] = useState("");
    const [filterPembimbing1, setFilterPembimbing1] = useState("");
    const [filterPembimbing2, setFilterPembimbing2] = useState("");
    const [filterAngkatan, setFilterAngkatan] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const limit = 5;

    const formatArsipForExcel = (data) => {
        // Handle nested structure
        const arsipData = Array.isArray(data) ? data : (data.arsip || []);

        return arsipData.map((arsip, index) => ({
            No: index + 1,
            "Tanggal Selesai": new Date(arsip.tanggalSelesai).toLocaleDateString("id-ID"),
            Status: arsip.status,
            NIM: arsip.PengajuanSkripsi?.Mahasiswa?.nim || "-",
            "Nama Mahasiswa": arsip.PengajuanSkripsi?.Mahasiswa?.nama_lengkap || "-",
            "Program Studi": arsip.PengajuanSkripsi?.Mahasiswa?.Prodi?.program_studi || "-",
            Angkatan: arsip.PengajuanSkripsi?.Mahasiswa?.angkatan || "-",
            "Judul Skripsi": arsip.PengajuanSkripsi?.title || "-",
            "Bidang/Topik": arsip.PengajuanSkripsi?.bidang_topik || "-",
            "Pembimbing 1": arsip.PengajuanSkripsi?.Pembimbing1
                ? `${arsip.PengajuanSkripsi.Pembimbing1.nama}, ${arsip.PengajuanSkripsi.Pembimbing1.gelar}`
                : "-",
            "Pembimbing 2": arsip.PengajuanSkripsi?.Pembimbing2
                ? `${arsip.PengajuanSkripsi.Pembimbing2.nama}, ${arsip.PengajuanSkripsi.Pembimbing2.gelar}`
                : "-",
            "File Final": arsip.fileFinal || "Tidak ada",
            "Tanggal Dibuat": new Date(arsip.createdAt).toLocaleDateString("id-ID"),
        }));
    };

    const fetchArsip = async () => {
        try {
            const res = await axios.get(`${baseUrl}arsip`, {
                withCredentials: true,
            });
            setArsip(res.data.data.arsip || []);
        } catch (err) {
            console.error("Error fetching arsip:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArsip();
    }, []);



    const badgeColor = (status) => {
        if (!status) return "bg-gray-100 text-gray-700";
        switch (status) {
            case "SELESAI":
                return "bg-green-100 text-green-700";
            case "LULUS":
                return "bg-blue-100 text-blue-700";
            case "REVISI_ULANG":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    // FILTER LOGIC
    const filteredArsip = arsip.filter((a) => {
        const mhs = a.PengajuanSkripsi?.Mahasiswa;
        const pemb1 = a.PengajuanSkripsi?.Pembimbing1?.nama;
        const pemb2 = a.PengajuanSkripsi?.Pembimbing2?.nama;

        const matchesSearch =
            `${mhs?.nama_lengkap} ${mhs?.nim} ${a.PengajuanSkripsi?.title}`
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesStatus = filterStatus ? a.status === filterStatus : true;
        const matchesProdi = filterProdi ? mhs?.Prodis?.[0]?.program_studi === filterProdi : true;
        const matchesPemb1 = filterPembimbing1 ? pemb1 === filterPembimbing1 : true;
        const matchesPemb2 = filterPembimbing2 ? pemb2 === filterPembimbing2 : true;
        const matchesAngkatan = filterAngkatan ? mhs?.angkatan == filterAngkatan : true;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesProdi &&
            matchesPemb1 &&
            matchesPemb2 &&
            matchesAngkatan
        );
    });

    // PAGINATION
    const totalPages = Math.ceil(filteredArsip.length / limit);
    const paginatedArsip = filteredArsip.slice((page - 1) * limit, page * limit);


    const handleOpenDetail = (item) => {
        setSelectedArsip(item);
        setShowDetail(true);
    };

    const handleOpenUpdate = (item) => {
        setSelectedArsip(item);
        setUpdateData({
            status: item.status ?? "",
            fileFinal: "",
            kartuBimbinganFile: "",
            tanggalSelesai: item.tanggalSelesai?.split("T")[0] ?? "",
        });
        setShowUpdate(true);
    };

    const handleSubmitUpdate = async () => {
        try {
            Swal.fire({
                title: "Menyimpan...",
                text: "Mohon tunggu sebentar",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const payload = {
                status: updateData.status,
                fileFinal: updateData.fileFinal || selectedArsip.fileFinal,
                kartuBimbinganFile:
                    updateData.kartuBimbinganFile || selectedArsip.kartuBimbinganFile,
                tanggalSelesai: updateData.tanggalSelesai,
            };

            await axios.put(`${baseUrl}arsip/${selectedArsip.id_arsip}`, payload, {
                withCredentials: true,
            });

            Swal.fire({
                icon: "success",
                title: "Berhasil!",
                text: "Arsip berhasil diperbarui",
                timer: 1600,
                showConfirmButton: false,
            });

            setShowUpdate(false);
            fetchArsip();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Terjadi kesalahan saat menyimpan data",
            });
        }
    };



    if (loading) {
        return (
            <AdminLayout>
                <div className="flex flex-col justify-center items-center h-80 text-gray-600">
                    <RefreshCw className="animate-spin mb-2" size={22} />
                    <p className="text-sm text-gray-500">Memuat data arsip...</p>
                </div>
            </AdminLayout>
        );
    }


    return (
        <AdminLayout>
            <PageMeta
                title="Arsip"
            />
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Data Arsip Mahasiswa
                    </h1>
                    <p className="text-gray-500 text-sm">Kelola arsip laporan akhir mahasiswa.</p>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm w-full sm:w-1/2">
                        <Search size={18} className="text-gray-500" />
                        <input
                            className="flex-1 ml-2 text-sm focus:outline-none"
                            placeholder="Cari Nama / NIM / Judul..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* ADVANCED FILTERING */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <select
                            className="bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm text-sm"
                            value={filterProdi}
                            onChange={(e) => setFilterProdi(e.target.value)}
                        >
                            <option value="">Semua Prodi</option>
                            {[...new Set(arsip.map(a => a.PengajuanSkripsi?.Mahasiswa?.Prodis?.[0]?.program_studi))].map(
                                (p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                )
                            )}
                        </select>

                        <select
                            className="bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm text-sm"
                            value={filterPembimbing1}
                            onChange={(e) => setFilterPembimbing1(e.target.value)}
                        >
                            <option value="">Pembimbing 1</option>
                            {[...new Set(arsip.map(a => a.PengajuanSkripsi?.Pembimbing1?.nama))].map(
                                (p) =>
                                    p && (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    )
                            )}
                        </select>

                        <select
                            className="bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm text-sm"
                            value={filterPembimbing2}
                            onChange={(e) => setFilterPembimbing2(e.target.value)}
                        >
                            <option value="">Pembimbing 2</option>
                            {[...new Set(arsip.map(a => a.PengajuanSkripsi?.Pembimbing2?.nama))].map(
                                (p) =>
                                    p && (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    )
                            )}
                        </select>

                        <select
                            className="bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm text-sm"
                            value={filterAngkatan}
                            onChange={(e) => setFilterAngkatan(e.target.value)}
                        >
                            <option value="">Angkatan</option>
                            {[...new Set(arsip.map(a => a.PengajuanSkripsi?.Mahasiswa?.angkatan))].map(
                                (p) =>
                                    p && (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    )
                            )}
                        </select>
                        <select
                            className="bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm text-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Semua Status</option>
                            <option value="SELESAI">Selesai</option>
                            <option value="LULUS">Lulus</option>
                            <option value="REVISI_ULANG">Revisi Ulang</option>
                        </select>


                    </div>
                    <ExportToExcel
                        endpoint={`${baseUrl}arsip`}
                        filename="Data_Arsip"
                        dataFormatter={formatArsipForExcel}
                        buttonText="Export to Excel"
                    />

                </div>



                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm bg-white border border-gray-200 rounded-lg shadow">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-left">No</th>
                                <th className="px-4 py-2 text-left">Foto</th>
                                <th className="px-4 py-2 text-left">Mahasiswa</th>
                                <th className="px-4 py-2 text-left">Judul</th>
                                <th className="px-4 py-2 text-left">Status</th>
                                <th className="px-4 py-2 text-left">Tanggal</th>
                                {/* <th className="px-4 py-2 text-left">Kartu Bimbingan</th> */}
                                <th className="px-4 py-2 text-left">File Final</th>
                                <th className="px-4 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredArsip.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-6 text-gray-500 italic">
                                        Tidak ada arsip ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredArsip.map((item, index) => {
                                    const mhs = item.PengajuanSkripsi?.Mahasiswa;
                                    const foto =
                                        mhs?.foto && mhs?.foto !== "null"
                                            ? `${imageUrl}${mhs.foto}`
                                            : null;

                                    return (
                                        <tr key={item.id_arsip} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2">{index + 1}</td>

                                            {/* FOTO MAHASISWA */}
                                            <td className="px-4 py-2">
                                                {foto ? (
                                                    <img
                                                        src={foto}
                                                        className="w-10 h-10 rounded-full object-cover border"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <User size={18} className="text-gray-500" />
                                                    </div>
                                                )}
                                            </td>

                                            {/* NAMA */}
                                            <td className="px-4 py-2">
                                                <p className="font-medium">{mhs?.nama_lengkap}</p>
                                                <p className="text-xs text-gray-500">{mhs?.nim}</p>
                                            </td>

                                            {/* JUDUL */}
                                            <td className="px-4 py-2 max-w-xs truncate">
                                                {item.PengajuanSkripsi?.title}
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 text-xs rounded ${badgeColor(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            {/* TANGGAL */}
                                            <td className="px-4 py-2 text-gray-600">
                                                {new Date(item.tanggalSelesai).toLocaleDateString("id-ID")}
                                            </td>

                                            {/* KARTU BIMBINGAN */}
                                            {/* <td className="px-4 py-2">
                                                {item.kartuBimbinganFile}
                                            </td> */}

                                            {/* FILE FINAL */}
                                            <td className="px-4 py-2">
                                                {item.fileFinal ? (
                                                    <a
                                                        href={`${imageUrl}uploads/laporan/${item.fileFinal}`}
                                                        target={item.fileFinal}
                                                        download={item.fileFinal}
                                                        className="text-blue-600 hover:underline text-xs"
                                                    >
                                                        Lihat File
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Tidak ada</span>
                                                )}
                                            </td>

                                            {/* ACTION */}
                                            <td className="px-4 py-2 flex gap-2">
                                                <button
                                                    onClick={() => handleOpenDetail(item)}
                                                    className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-blue-700 transition"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenUpdate(item)}
                                                    className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {/* PAGINATION */}
                <div className="flex items-center justify-center mt-4 gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className={`px-3 py-1 rounded border ${page === 1
                            ? "bg-gray-100 text-gray-400"
                            : "bg-white hover:bg-gray-100 text-gray-700"
                            }`}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`px-3 py-1 rounded border text-sm ${page === i + 1
                                ? "bg-gray-800 text-white"
                                : "bg-white hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className={`px-3 py-1 rounded border ${page === totalPages
                            ? "bg-gray-100 text-gray-400"
                            : "bg-white hover:bg-gray-100 text-gray-700"
                            }`}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>


                {/* DETAIL MODAL */}
                <AnimatePresence>
                    {showDetail && selectedArsip && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 flex justify-center items-center z-40 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6 space-y-4"
                            >
                                <h2 className="text-lg font-semibold text-gray-800">Detail Arsip</h2>

                                <div className="space-y-2 text-sm">
                                    <p>
                                        <span className="font-medium">Mahasiswa:</span>{" "}
                                        {selectedArsip.PengajuanSkripsi?.Mahasiswa?.nama_lengkap} (
                                        {selectedArsip.PengajuanSkripsi?.Mahasiswa?.nim})
                                    </p>

                                    <p>
                                        <span className="font-medium">Judul:</span>{" "}
                                        {selectedArsip.PengajuanSkripsi?.title}
                                    </p>

                                    <p>
                                        <span className="font-medium">Status:</span>{" "}
                                        <span className={`px-2 py-1 text-xs rounded ${badgeColor(selectedArsip.status)}`}>
                                            {selectedArsip.status}
                                        </span>
                                    </p>

                                    <p>
                                        <span className="font-medium">Tanggal Selesai:</span>{" "}
                                        {selectedArsip.tanggalSelesai
                                            ? new Date(selectedArsip.tanggalSelesai).toLocaleDateString("id-ID")
                                            : "-"}
                                    </p>

                                    <div>
                                        <span className="font-medium">File Final:</span>{" "}
                                        {selectedArsip.fileFinal ? (
                                            <a
                                                href={`${baseUrl}uploads/${selectedArsip.fileFinal}`}
                                                target="_blank"
                                                className="text-blue-600 hover:underline text-xs"
                                            >
                                                Lihat File
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Tidak ada</span>
                                        )}
                                    </div>

                                    <div>
                                        <span className="font-medium">Kartu Bimbingan:</span>{" "}
                                        {selectedArsip.kartuBimbinganFile ? (
                                            <a
                                                href={`${baseUrl}uploads/${selectedArsip.kartuBimbinganFile}`}
                                                target="_blank"
                                                className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                            >
                                                <Download size={14} /> Download
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Tidak ada</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={() => setShowDetail(false)}
                                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* UPDATE MODAL */}
                <AnimatePresence>
                    {showUpdate && selectedArsip && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 flex justify-center items-center z-40 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 space-y-4"
                            >
                                <h2 className="text-lg font-semibold text-gray-800">Update Arsip</h2>

                                <div className="space-y-3 text-sm">
                                    <div>
                                        <label className="block font-medium mb-1">Status Arsip</label>
                                        <select
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                            value={updateData.status}
                                            onChange={(e) =>
                                                setUpdateData({ ...updateData, status: e.target.value })
                                            }
                                        >
                                            <option value="SELESAI">SELESAI</option>
                                            <option value="LULUS">LULUS</option>
                                            <option value="REVISI_ULANG">REVISI ULANG</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-medium mb-1">
                                            File Final (optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nama file final"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                            value={updateData.fileFinal}
                                            onChange={(e) =>
                                                setUpdateData({ ...updateData, fileFinal: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-medium mb-1">
                                            Kartu Bimbingan (optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nama file kartu"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                            value={updateData.kartuBimbinganFile}
                                            onChange={(e) =>
                                                setUpdateData({
                                                    ...updateData,
                                                    kartuBimbinganFile: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-medium mb-1">
                                            Tanggal Selesai
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                            value={updateData.tanggalSelesai}
                                            onChange={(e) =>
                                                setUpdateData({
                                                    ...updateData,
                                                    tanggalSelesai: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                                    <button
                                        onClick={() => setShowUpdate(false)}
                                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                                    >
                                        Batal
                                    </button>

                                    <button
                                        onClick={handleSubmitUpdate}
                                        className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
};

export default ArsipMahasiswa;
