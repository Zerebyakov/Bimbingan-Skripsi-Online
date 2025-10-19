import React, { useEffect, useState, useRef } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { initSocket, getSocket, leaveChatRoom } from "../../services/Socket";
import { useAuth } from "../../context/AuthContext";
import {
    Send,
    FileText,
    Loader2,
    BookOpen,
    ClipboardCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const Bimbingan = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [pengajuan, setPengajuan] = useState(null);
    const [progress, setProgress] = useState(0);
    const [lastBab, setLastBab] = useState(null);
    const [statusBab, setStatusBab] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // === Fetch dashboard untuk ambil pengajuan dan progress bab ===
    const fetchDashboard = async () => {
        try {
            const res = await axios.get(`${baseUrl}mahasiswa/dashboard`, {
                withCredentials: true,
            });
            const data = res.data.data;
            setPengajuan(data.pengajuan);

            const babCount = data.pengajuan?.BabSubmissions?.length || 0;
            const totalBab = 5; // anggap total bab = 5
            const percent = Math.min((babCount / totalBab) * 100, 100);
            setProgress(percent);

            if (babCount > 0) {
                const last = data.pengajuan.BabSubmissions[babCount - 1];
                setLastBab(last.chapter_number);
                setStatusBab(last.status || "Menunggu review");
            } else {
                setLastBab(0);
                setStatusBab("Belum ada bab diunggah");
            }
        } catch (error) {
            console.error("❌ Gagal mengambil dashboard:", error);
        }
    };

    // === Fetch pesan ===
    const fetchMessages = async (id_pengajuan) => {
        try {
            const res = await axios.get(
                `${baseUrl}chat/pengajuan/${id_pengajuan}/messages`,
                { withCredentials: true }
            );
            setMessages(res.data.data.messages || []);
        } catch (error) {
            console.error("❌ Gagal mengambil pesan:", error);
        } finally {
            setLoading(false);
        }
    };

    // === Kirim pesan ===
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const msgContent = message;
        setMessage("");
        setSending(true);

        try {
            const res = await axios.post(
                `${baseUrl}chat/pengajuan/${pengajuan.id_pengajuan}/message`,
                { content: msgContent },
                { withCredentials: true }
            );
            const sent = res.data.data;
            const socket = getSocket();
            socket?.emit("sendMessage", sent);
            setMessages((prev) => [...prev, sent]);
        } catch (error) {
            console.error("❌ Gagal mengirim pesan:", error);
        } finally {
            setSending(false);
        }
    };

    // === Inisialisasi socket ===
    useEffect(() => {
        const load = async () => await fetchDashboard();
        load();
    }, []);

    useEffect(() => {
        if (!pengajuan?.id_pengajuan || !user?.id_user) return;

        fetchMessages(pengajuan.id_pengajuan);
        const socket = initSocket(user.id_user, pengajuan.id_pengajuan);

        socket.on("newMessage", (msg) => {
            if (msg.id_pengajuan === pengajuan.id_pengajuan) {
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id_message === msg.id_message);
                    return exists ? prev : [...prev, msg];
                });
            }
        });

        return () => {
            leaveChatRoom(pengajuan.id_pengajuan);
            socket.off("newMessage");
        };
    }, [pengajuan, user]);

    // === Auto scroll ===
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <MahasiswaLayout>
            <div className="p-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white shadow-sm border border-gray-200 rounded-2xl flex flex-col h-[75vh]"
                >
                    {/* ====== Header ====== */}
                    <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                        <div>
                            <h1 className="font-semibold text-gray-800 text-lg">
                                {pengajuan?.Pembimbing1?.nama ||
                                    pengajuan?.Pembimbing2?.nama ||
                                    "Dosen Pembimbing"}
                            </h1>
                        </div>
                        <div className="flex flex-col items-end text-sm text-gray-600">
                            <p className="font-medium flex items-center gap-1">
                                <BookOpen size={16} /> Bab {lastBab || 0} dari 5
                            </p>
                            <div className="w-40 bg-gray-200 h-2 rounded-full mt-1">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs mt-1 text-gray-500">
                                {statusBab || "Menunggu progres..."}
                            </p>
                        </div>
                    </div>

                    {/* ====== Chat Area ====== */}
                    <div className="flex-1 p-5 overflow-y-auto bg-gray-50 space-y-3">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <Loader2 className="animate-spin mr-2" /> Memuat percakapan...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-400 mt-10">
                                <p>Belum ada pesan. Mulai percakapan dengan dosenmu.</p>
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
                                            className={`max-w-[70%] px-4 py-2 text-sm rounded-2xl shadow-sm ${isMe
                                                ? "bg-green-600 text-white rounded-br-none"
                                                : "bg-gray-100 text-gray-800 rounded-bl-none"
                                                }`}
                                        >
                                            <p className="font-medium text-xs mb-1 opacity-70">
                                                {senderName}
                                            </p>
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

                    {/* ====== Input Chat ====== */}
                    <form
                        onSubmit={sendMessage}
                        className="border-t border-gray-100 p-4 flex items-center gap-3 bg-white"
                    >
                        <input
                            type="text"
                            placeholder="Ketik pesan..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim() || sending}
                            className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </MahasiswaLayout>
    );
};

export default Bimbingan;
