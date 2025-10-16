import React, { useEffect, useState } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import {
    RefreshCw,
    Users,
    MessageSquare,
    FileText,
    Calendar,
} from "lucide-react";
import { useNavigate } from "react-router";

const ListMahasiswaBimbingan = () => {
    const [bimbingan, setBimbingan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fadeIn, setFadeIn] = useState(false);
    const navigate = useNavigate();

    const fetchMahasiswaBimbingan = async () => {
        setLoading(true);
        setFadeIn(false);
        try {
            const res = await axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
                withCredentials: true,
            });
            setBimbingan(res.data.data || []);
            setTimeout(() => {
                setFadeIn(true);
                setLoading(false);
            }, 400);
        } catch (error) {
            console.error("Error fetching mahasiswa bimbingan:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMahasiswaBimbingan();
    }, []);

    return (
        <DosenLayout>
            <div
                className={`transition-all duration-500 ease-in-out ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}
            >
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800">
                                Mahasiswa Bimbingan
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Daftar mahasiswa yang sedang Anda bimbing beserta riwayat chat.
                            </p>
                        </div>

                        <button
                            onClick={fetchMahasiswaBimbingan}
                            className={`flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition ${loading ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                            disabled={loading}
                        >
                            <RefreshCw
                                size={16}
                                className={loading ? "animate-spin" : ""}
                            />
                            {loading ? "Menyegarkan..." : "Refresh"}
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Users size={18} className="text-gray-600" />
                                Daftar Mahasiswa
                            </h2>
                        </div>

                        {loading ? (
                            <div className="divide-y divide-gray-100">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="p-5 flex justify-between items-center animate-fade-slide"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <div className="w-40 h-4 shimmer rounded-md"></div>
                                            <div className="w-28 h-3 shimmer rounded-md"></div>
                                            <div className="w-full h-3 shimmer rounded-md"></div>
                                        </div>
                                        <div className="w-20 h-6 shimmer rounded-md"></div>
                                    </div>
                                ))}
                            </div>
                        ) : bimbingan.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {bimbingan.map((item) => {
                                    const lastMessage =
                                        item.Messages?.[item.Messages.length - 1]?.content ||
                                        "Belum ada pesan";
                                    const lastTime =
                                        item.Messages?.[item.Messages.length - 1]?.createdAt;

                                    return (
                                        <div
                                            key={item.id_pengajuan}
                                            className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50 transition-all duration-300 ease-in-out"
                                        >
                                            <div>
                                                <h3 className="text-base font-medium text-gray-800">
                                                    {item.Mahasiswa?.nama_lengkap}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {item.Mahasiswa?.nim} • Semester{" "}
                                                    {item.Mahasiswa?.semester}
                                                </p>
                                                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                                    <span className="font-medium text-gray-800">
                                                        Judul:
                                                    </span>{" "}
                                                    {item.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                    <MessageSquare size={12} />
                                                    {lastMessage.length > 70
                                                        ? lastMessage.slice(0, 70) + "..."
                                                        : lastMessage}
                                                    {lastTime && (
                                                        <span className="flex items-center gap-1 ml-2 text-gray-400">
                                                            <Calendar size={10} />{" "}
                                                            {new Date(lastTime).toLocaleDateString("id-ID")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button

                                                className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
                                                onClick={() => navigate(`/dosen/chat/${item.id_pengajuan}`)}

                                            >
                                                <MessageSquare size={16} /> Buka Chat
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 text-sm py-10">
                                Belum ada mahasiswa bimbingan.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </DosenLayout>
    );
};

export default ListMahasiswaBimbingan;
