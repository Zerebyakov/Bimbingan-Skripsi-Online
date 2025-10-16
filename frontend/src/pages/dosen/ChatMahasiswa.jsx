import React, { useEffect, useState, useRef } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import {
    Send,
    Paperclip,
    ArrowLeft,
    FileText,
    Loader2,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { socket } from "../../services/Socket";
import { useAuth } from "../../context/AuthContext";

const ChatMahasiswa = () => {
    const { id_pengajuan } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [mahasiswa, setMahasiswa] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // 🔹 Fetch messages awal
    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}chat/pengajuan/${id_pengajuan}/messages`, {
                withCredentials: true,
            });
            const msgs = res.data.data.messages || [];
            setMessages(msgs);
            if (msgs.length > 0) {
                const mahasiswaMsg = msgs.find((m) => m.User?.Mahasiswa)?.User.Mahasiswa;
                setMahasiswa(mahasiswaMsg);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Kirim pesan baru (Optimistic + Realtime)
    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const tempMsg = {
            id_message: Date.now(),
            content: message,
            senderId: user?.id_user,
            id_pengajuan: Number(id_pengajuan),
            createdAt: new Date().toISOString(),
            User: {
                role: "dosen",
                Dosens: [{ nama: user?.Dosens?.[0]?.nama || "Dosen" }],
            },
            isTemporary: true,
        };

        // langsung tampilkan di UI
        setMessages((prev) => [...prev, tempMsg]);
        setMessage("");

        try {
            const res = await axios.post(
                `${baseUrl}chat/pengajuan/${id_pengajuan}/message`,
                { content: message },
                { withCredentials: true }
            );

            const sentMsg = res.data.data;
            socket.emit("message:send", sentMsg); // broadcast realtime

            // replace pesan sementara dengan pesan dari server
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id_message === tempMsg.id_message ? sentMsg : msg
                )
            );
        } catch (error) {
            console.error("Error sending message:", error);
            // tandai error
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id_message === tempMsg.id_message
                        ? { ...msg, failed: true }
                        : msg
                )
            );
        }
    };

    // 🔹 Socket listener (realtime)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchMessages();
        },3000)

        socket.emit("joinRoom", id_pengajuan);

        socket.on("message:new", (msg) => {
            if (msg.id_pengajuan === Number(id_pengajuan)) {
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id_message === msg.id_message);
                    return exists ? prev : [...prev, msg];
                });
            }
        });

        return () => {
            socket.emit("leaveRoom", id_pengajuan);
            socket.off("message:new");
            clearInterval(interval);
        };
    }, [id_pengajuan]);

    // 🔹 Scroll otomatis
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <DosenLayout>
            <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                {mahasiswa?.nama_lengkap || "Mahasiswa Bimbingan"}
                            </h2>
                            <p className="text-sm text-gray-500">
                                ID Pengajuan #{id_pengajuan}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-5 overflow-y-auto bg-gray-50 space-y-4">
                    {loading ? (
                        <div className="text-gray-500 flex items-center justify-center h-full">
                            <Loader2 className="animate-spin mr-2" /> Memuat percakapan...
                        </div>
                    ) : messages.length > 0 ? (
                        messages.map((msg) => {
                            const isDosen =
                                msg.User?.role === "dosen" || msg.senderId === user?.id_user;
                            let senderName = "Pengguna";
                            if (msg.senderId === user?.id_user) {
                                // pesan dikirim oleh user aktif (dosen)
                                senderName = user?.Dosens?.[0]?.nama || user?.Mahasiswa?.nama_lengkap || user?.email || "Anda";
                            } else if (msg.User?.role === "dosen") {
                                senderName = msg.User?.Dosens?.[0]?.nama || msg.User?.email || "Dosen";
                            } else if (msg.User?.Mahasiswa?.nama_lengkap) {
                                senderName = msg.User.Mahasiswa.nama_lengkap;
                            } else if (msg.User?.email) {
                                senderName = msg.User.email;
                            }

                            return (
                                <div
                                    key={msg.id_message}
                                    className={`flex ${isDosen ? "justify-end" : "justify-start"
                                        } transition-all duration-300 ease-out`}
                                >

                                    <div className="flex flex-col max-w-[70%]">
                                        <div
                                            className={`text-xs mb-1 ${isDosen ? "text-right text-gray-400" : "text-gray-500"
                                                }`}
                                        >
                                            {senderName}
                                        </div>
                                        <div
                                            className={`rounded-2xl px-4 py-2 text-sm shadow-sm transition-opacity duration-300 ${isDosen
                                                ? "bg-gray-800 text-white rounded-br-none"
                                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                                } ${msg.isTemporary ? "opacity-50" : "opacity-100"} ${msg.failed
                                                    ? "border border-red-400 bg-red-50 text-red-700"
                                                    : ""
                                                }`}
                                        >
                                            {msg.content && (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            )}
                                            {msg.attachmentName && (
                                                <a
                                                    href={`${baseUrl}uploads/${msg.attachmentPath}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-blue-400 hover:underline text-xs mt-1"
                                                >
                                                    <FileText size={12} /> {msg.attachmentName}
                                                </a>
                                            )}
                                            <p
                                                className={`text-[11px] mt-1 ${isDosen ? "text-gray-300" : "text-gray-500"
                                                    }`}
                                            >
                                                {new Date(msg.createdAt).toLocaleString("id-ID", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    day: "2-digit",
                                                    month: "short",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 text-sm mt-10">
                            Belum ada pesan di percakapan ini.
                        </p>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-3 p-4 border-t bg-white"
                >
                    <label className="cursor-pointer text-gray-500 hover:text-gray-700">
                        <Paperclip size={20} />
                        <input
                            type="file"
                            className="hidden"
                            disabled
                            title="Fitur lampiran belum diaktifkan"
                        />
                    </label>
                    <input
                        type="text"
                        placeholder="Ketik pesan..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                    <button
                        type="submit"
                        className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </DosenLayout>
    );
};

export default ChatMahasiswa;
