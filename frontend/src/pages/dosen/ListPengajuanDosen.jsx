import React, { useEffect, useState } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { MessageCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";

const ListPengajuanDosen = () => {
    const [bimbingan, setBimbingan] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Ambil data dari endpoint
    const fetchBimbingan = async () => {
        try {
            const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
                withCredentials: true,
            });
            setBimbingan(res.data.data || []);
        } catch (err) {
            console.error("Error fetching bimbingan:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBimbingan();
    }, []);

    // Estimasi progress berdasarkan chat terakhir yang menyebutkan BAB
    const getProgressFromMessages = (messages = []) => {
        if (!messages.length) return 0;
        const babRegex = /bab\s*(\d+)/i;
        for (let i = messages.length - 1; i >= 0; i--) {
            const match = messages[i].content.match(babRegex);
            if (match) return parseInt(match[1], 10);
        }
        return 0;
    };

    // Render status tampilan
    const renderStatus = (status) => {
        const colorMap = {
            diterima: "text-green-600 bg-green-50",
            revisi: "text-yellow-600 bg-yellow-50",
            ditolak: "text-red-600 bg-red-50",
            default: "text-gray-600 bg-gray-50",
        };
        return (
            <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${colorMap[status] || colorMap.default
                    }`}
            >
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    return (
        <DosenLayout>
            <div className="p-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                    Daftar Pengajuan Mahasiswa Bimbingan
                </h1>

                {loading ? (
                    <div className="flex justify-center items-center py-20 text-gray-500">
                        <Loader2 className="animate-spin mr-2" /> Memuat data...
                    </div>
                ) : bimbingan.length === 0 ? (
                    <div className="text-center text-gray-500 border rounded-lg py-16 bg-gray-50">
                        Tidak ada mahasiswa bimbingan.
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full text-sm text-left text-gray-700">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th scope="col" className="px-6 py-3">
                                        Mahasiswa
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        Judul
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        Bidang
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center">
                                        Progress Bimbingan
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {bimbingan.map((item) => {
                                    const progress = getProgressFromMessages(item.Messages);
                                    const progressPercent = Math.min(progress * 20, 100); // asumsi 5 BAB
                                    const isChatEnabled = item.status === "diterima";

                                    return (
                                        <tr
                                            key={item.id_pengajuan}
                                            className="border-t hover:bg-gray-50 transition-colors"
                                        >
                                            {/* Mahasiswa */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-800">
                                                        {item.Mahasiswa?.nama_lengkap}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {item.Mahasiswa?.nim}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Judul */}
                                            <td className="px-6 py-4 max-w-md">
                                                <p className="text-gray-800 font-medium">{item.title}</p>
                                                <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            </td>

                                            {/* Bidang */}
                                            <td className="px-6 py-4">{item.bidang_topik}</td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-center">
                                                {renderStatus(item.status)}
                                            </td>

                                            {/* Progress */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="w-32 bg-gray-200 rounded-full h-3 mx-auto overflow-hidden">
                                                    <div
                                                        className={`h-3 rounded-full ${progressPercent === 100
                                                                ? "bg-green-600"
                                                                : "bg-gray-800"
                                                            }`}
                                                        style={{ width: `${progressPercent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    BAB {progress || 0}
                                                </span>
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    disabled={!isChatEnabled}
                                                    onClick={() =>
                                                        navigate(`/dosen/chat/${item.id_pengajuan}`)
                                                    }
                                                    className={`flex items-center gap-1 mx-auto px-3 py-1.5 rounded-full text-xs transition ${isChatEnabled
                                                            ? "bg-gray-800 text-white hover:bg-gray-700"
                                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                >
                                                    <MessageCircle size={14} /> Buka Chat
                                                </button>
                                                {!isChatEnabled && item.rejection_reason && (
                                                    <p className="text-xs text-gray-400 italic mt-1">
                                                        {item.rejection_reason}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DosenLayout>
    );
};

export default ListPengajuanDosen;
