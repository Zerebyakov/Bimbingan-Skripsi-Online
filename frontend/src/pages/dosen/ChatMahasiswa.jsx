import React, { useEffect, useState, useRef } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import {
    Send,
    Paperclip,
    ArrowLeft,
    Loader2,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { initSocket, getSocket, leaveChatRoom } from "../../services/Socket";
import { useAuth } from "../../context/AuthContext";

const ChatMahasiswa = () => {
    const { id_pengajuan } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [mahasiswa, setMahasiswa] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const messageListenerRef = useRef(null);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}chat/pengajuan/${id_pengajuan}/messages`, {
                withCredentials: true,
            });
            const msgs = res.data.data.messages || [];
            setMessages(msgs);
            if (msgs.length > 0) {
                setMahasiswa(msgs[0].User?.Mahasiswa || null);
            }
        } catch (error) {
            console.error("❌ Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    console.log(mahasiswa)
    
    
    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || sending) return;

        const messageContent = message.trim();
        setMessage(""); // Clear input immediately
        setSending(true);

        try {
            const res = await axios.post(
                `${baseUrl}chat/pengajuan/${id_pengajuan}/message`,
                { content: messageContent },
                { withCredentials: true }
            );

            // Server akan emit via socket, jadi kita tidak perlu update state manual
            console.log("✅ Message sent successfully");
        } catch (error) {
            console.error("❌ Error sending message:", error);
            // Restore message jika gagal
            setMessage(messageContent);
            alert("Gagal mengirim pesan. Silakan coba lagi.");
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        if (!user?.id_user) return;

        // Inisialisasi socket
        const socket = initSocket(user.id_user, id_pengajuan);

        // Fetch messages pertama kali
        fetchMessages();

        // Setup message listener
        const handleNewMessage = (msg) => {
            console.log("📩 Received new message:", msg);

            // Pastikan message untuk pengajuan yang benar
            if (msg.id_pengajuan === Number(id_pengajuan)) {
                setMessages((prev) => {
                    // Cek duplikasi berdasarkan id_message
                    const exists = prev.some((m) => m.id_message === msg.id_message);
                    if (exists) {
                        console.log("⚠️ Message already exists, skipping");
                        return prev;
                    }
                    console.log("✅ Adding new message to list");
                    return [...prev, msg];
                });
            }
        };

        // Remove listener lama jika ada
        if (messageListenerRef.current) {
            socket.off("message:new", messageListenerRef.current);
        }

        // Setup listener baru
        messageListenerRef.current = handleNewMessage;
        socket.on("message:new", handleNewMessage);

        // Cleanup function
        return () => {
            console.log("🧹 Cleaning up chat component");
            if (socket) {
                leaveChatRoom(id_pengajuan);
                socket.off("message:new", messageListenerRef.current);
            }
            messageListenerRef.current = null;
        };
    }, [id_pengajuan, user?.id_user]);

    // Auto scroll to bottom ketika ada message baru
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
                            className="text-gray-600 hover:text-gray-800 transition"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                {mahasiswa?.nama_lengkap || "Mahasiswa Bimbingan"}
                            </h2>
                            <p className="text-sm text-gray-500">ID Pengajuan #{id_pengajuan}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">Online</span>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-5 overflow-y-auto bg-gray-50 space-y-4">
                    {loading ? (
                        <div className="text-gray-500 flex items-center justify-center h-full">
                            <Loader2 className="animate-spin mr-2" size={20} />
                            Memuat percakapan...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            <p>Belum ada pesan. Mulai percakapan sekarang!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isSender = msg.senderId === user?.id_user;
                            const senderName =
                                msg.User?.role === "mahasiswa"
                                    ? msg.User.Mahasiswa?.nama_lengkap
                                    : msg.User?.Dosens?.[0]?.nama || "Dosen";

                            return (
                                <div
                                    key={msg.id_message}
                                    className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                                >
                                    <div className="flex flex-col max-w-[70%]">
                                        <div
                                            className={`text-xs mb-1 ${isSender ? "text-right text-gray-400" : "text-gray-500"
                                                }`}
                                        >
                                            {senderName}
                                        </div>
                                        <div
                                            className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${isSender
                                                    ? "bg-gray-800 text-white rounded-br-none"
                                                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                                }`}
                                        >
                                            {msg.content}
                                            <p
                                                className={`text-[11px] mt-1 ${isSender ? "text-gray-300" : "text-gray-500"
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
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                {/* Input Form */}
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-3 p-4 border-t bg-white"
                >
                    <label className="cursor-pointer text-gray-500 hover:text-gray-700 transition">
                        <Paperclip size={20} />
                        <input type="file" className="hidden" disabled />
                    </label>
                    <input
                        type="text"
                        placeholder="Ketik pesan..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={sending}
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || sending}
                        className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </form>
            </div>
        </DosenLayout>
    );
};

export default ChatMahasiswa;