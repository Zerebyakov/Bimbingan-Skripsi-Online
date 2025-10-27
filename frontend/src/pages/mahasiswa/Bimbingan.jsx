import React, { useEffect, useState, useRef } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { useAuth } from "../../context/AuthContext";
import { initSocket, leaveChatRoom } from "../../services/Socket";
import { Send, Paperclip, Loader2, ArrowLeft, BookOpen } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const Bimbingan = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [pengajuan, setPengajuan] = useState(null);
    const [progress, setProgress] = useState(0);
    const [lastBab, setLastBab] = useState(0);
    const [statusBab, setStatusBab] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chatDisabled, setChatDisabled] = useState(false);

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    // === Ambil data dashboard mahasiswa ===
    const fetchDashboard = async () => {
        try {
            const res = await axios.get(`${baseUrl}mahasiswa/dashboard`, {
                withCredentials: true,
            });
            const data = res.data.data;
            setPengajuan(data.pengajuan);

            const babCount = data.pengajuan?.BabSubmissions?.length || 0;
            const totalBab = 5;
            const percent = Math.min((babCount / totalBab) * 100, 100);
            setProgress(percent);

            if (babCount > 0) {
                const last = data.pengajuan.BabSubmissions[babCount - 1];
                setLastBab(last.chapter_number);
                setStatusBab(last.status || "Menunggu review dosen");
                if (last.chapter_number === 5 && last.status === "DITERIMA") {
                    setChatDisabled(true);
                }
            } else {
                setLastBab(0);
                setStatusBab("Belum ada bab diunggah");
            }
        } catch (error) {
            console.error("❌ Gagal memuat dashboard:", error);
        }
    };

    // === Ambil pesan ===
    const fetchMessages = async (id_pengajuan) => {
        try {
            const res = await axios.get(`${baseUrl}chat/pengajuan/${id_pengajuan}/messages`, {
                withCredentials: true,
            });
            setMessages(res.data.data.messages || []);
        } catch (error) {
            console.error("❌ Gagal ambil pesan:", error);
        } finally {
            setLoading(false);
        }
    };

    // === Kirim pesan ===
    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || sending || chatDisabled) return;

        const msgContent = message.trim();
        setMessage("");
        setSending(true);

        try {
            await axios.post(
                `${baseUrl}chat/pengajuan/${pengajuan.id_pengajuan}/message`,
                { content: msgContent },
                { withCredentials: true }
            );
        } catch (error) {
            console.error("❌ Gagal mengirim pesan:", error);
            Swal.fire({
                icon: "error",
                title: "Gagal mengirim pesan",
                text: "Silakan coba lagi.",
                confirmButtonColor: "#dc2626",
            });
        } finally {
            setSending(false);
        }
    };

    // === Socket Realtime ===
    useEffect(() => {
        const loadData = async () => {
            await fetchDashboard();
        };
        loadData();
    }, []);

    useEffect(() => {
        if (!pengajuan?.id_pengajuan || !user?.id_user) return;
        fetchMessages(pengajuan.id_pengajuan);

        const socket = initSocket(user.id_user, pengajuan.id_pengajuan);
        socketRef.current = socket;

        socket.on("message:new", (msg) => {
            if (msg.id_pengajuan === pengajuan.id_pengajuan) {
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id_message === msg.id_message);
                    return exists ? prev : [...prev, msg];
                });
            }
        });

        return () => {
            leaveChatRoom(pengajuan.id_pengajuan);
            socket.off("message:new");
        };
    }, [pengajuan, user]);

    // === Auto scroll ===
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <MahasiswaLayout>
            <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
                {/* Header */}
                <div className="flex items-center justify-between bg-white border-b px-4 py-3 md:px-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h1 className="font-semibold text-gray-800 text-base sm:text-lg">
                                {pengajuan?.Pembimbing1?.nama ||
                                    pengajuan?.Pembimbing2?.nama ||
                                    "Dosen Pembimbing"}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[220px] md:max-w-xs">
                                {pengajuan?.title || "Judul belum tersedia"}
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1 justify-end text-sm text-gray-600">
                            <BookOpen size={16} /> Bab {lastBab || 0}/5
                        </div>
                        <div className="w-32 bg-gray-200 h-2 rounded-full mt-1 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8 }}
                                className={`h-2 ${progress === 100 ? "bg-green-600" : "bg-green-500"}`}
                            />
                        </div>
                        <p
                            className={`text-xs mt-1 ${statusBab?.toLowerCase().includes("revisi")
                                    ? "text-yellow-600"
                                    : statusBab?.toLowerCase().includes("diterima")
                                        ? "text-green-600"
                                        : "text-gray-500"
                                }`}
                        >
                            {statusBab}
                        </p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-gray-400">
                            <Loader2 className="animate-spin mr-2" /> Memuat percakapan...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            Belum ada pesan. Mulai percakapan dengan dosenmu!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.User?.role === "mahasiswa";
                            const senderName =
                                msg.User?.role === "dosen"
                                    ? msg.User?.Dosens?.[0]?.nama
                                    : msg.User?.Mahasiswa?.nama_lengkap;

                            return (
                                <motion.div
                                    key={msg.id_message}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] sm:max-w-[70%] px-4 py-2 text-sm rounded-2xl shadow-sm ${isMe
                                                ? "bg-green-600 text-white rounded-br-none"
                                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                            }`}
                                    >
                                        <p className="text-xs mb-1 opacity-70 font-medium">{senderName}</p>
                                        <p>{msg.content}</p>
                                        <p
                                            className={`text-[10px] mt-1 ${isMe ? "text-green-200" : "text-gray-400"
                                                }`}
                                        >
                                            {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                {/* Input Area */}
                <form
                    onSubmit={handleSend}
                    className={`border-t bg-white p-3 sm:p-4 flex items-center gap-3 ${chatDisabled ? "opacity-60 pointer-events-none" : ""
                        }`}
                >
                    <label className="cursor-pointer text-gray-500 hover:text-gray-700 transition">
                        <Paperclip size={20} />
                        <input type="file" className="hidden" disabled />
                    </label>
                    <input
                        type="text"
                        placeholder={
                            chatDisabled
                                ? "Bimbingan telah selesai — chat ditutup"
                                : "Ketik pesan..."
                        }
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-green-500 outline-none"
                        disabled={chatDisabled}
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || sending || chatDisabled}
                        className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition disabled:bg-green-400"
                    >
                        {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </MahasiswaLayout>
    );
};

export default Bimbingan;
