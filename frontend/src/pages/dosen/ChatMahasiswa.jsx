import React, { useEffect, useState, useRef } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import {
    Send,
    Paperclip,
    ArrowLeft,
    Loader2,
    FileDown,
    FileText,
    Image,
    FileType,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { initSocket, getSocket, leaveChatRoom } from "../../services/Socket";
import { useAuth } from "../../context/AuthContext";

const ChatMahasiswa = () => {
    const { id_pengajuan } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [bimbingan, setBimbingan] = useState(null);
    const [message, setMessage] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const messageListenerRef = useRef(null);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const [msgRes, bimRes] = await Promise.all([
                axios.get(`${baseUrl}chat/pengajuan/${id_pengajuan}/messages`, {
                    withCredentials: true,
                }),
                axios.get(`${baseUrl}dosen/mahasiswa-bimbingan`, {
                    withCredentials: true,
                }),
            ]);

            const msgs = msgRes.data.data.messages || [];
            setMessages(msgs);

            const found = bimRes.data.data.find(
                (m) => m.id_pengajuan === Number(id_pengajuan)
            );
            setBimbingan(found || null);
        } catch (error) {
            console.error("❌ Error fetching chat data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!message.trim() && !attachment) || sending) return;

        const formData = new FormData();
        if (message.trim()) formData.append("content", message.trim());
        if (attachment) formData.append("file", attachment);

        setMessage("");
        setAttachment(null);
        setSending(true);

        try {
            await axios.post(
                `${baseUrl}chat/pengajuan/${id_pengajuan}/message`,
                formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
            );
        } catch (error) {
            console.error("❌ Gagal kirim pesan:", error);
            alert("Gagal mengirim pesan. Silakan coba lagi.");
        } finally {
            setSending(false);
        }
    };

    const handleDownload = (filePath) => {
        if (!filePath)
            return alert("File tidak tersedia atau belum diunggah oleh pengirim.");
        window.open(`${baseUrl}${filePath}`, "_blank");
    };

    useEffect(() => {
        if (!user?.id_user) return;
        const socket = initSocket(user.id_user, id_pengajuan);
        fetchMessages();

        const handleNewMessage = (msg) => {
            if (msg.id_pengajuan === Number(id_pengajuan)) {
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id_message === msg.id_message);
                    if (exists) return prev;
                    return [...prev, msg];
                });
            }
        };

        if (messageListenerRef.current) socket.off("message:new", messageListenerRef.current);
        messageListenerRef.current = handleNewMessage;
        socket.on("message:new", handleNewMessage);

        return () => {
            leaveChatRoom(id_pengajuan);
            socket.off("message:new", messageListenerRef.current);
            messageListenerRef.current = null;
        };
    }, [id_pengajuan, user?.id_user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getFileIcon = (fileName) => {
        if (!fileName) return <FileType size={14} />;
        const ext = fileName.split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif"].includes(ext)) return <Image size={14} />;
        if (["pdf"].includes(ext)) return <FileText size={14} />;
        return <FileDown size={14} />;
    };

    // Filter BAB yang direvisi
    const revisedBabs = bimbingan?.BabSubmissions?.filter(
        (bab) => bab.status === "revisi" && bab.notes
    );

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
                                {bimbingan?.Mahasiswa?.nama_lengkap || "Mahasiswa Bimbingan"}
                            </h2>
                            <p className="text-sm text-gray-500">
                                ID Pengajuan #{id_pengajuan}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">Online</span>
                    </div>
                </div>

                {/* Notes Revisi Section */}
                {revisedBabs && revisedBabs.length > 0 && (
                    <div className="bg-yellow-50 border-y border-yellow-200 px-6 py-3 text-sm">
                        <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                            🧾 Catatan Revisi Terbaru
                        </h3>
                        <div className="space-y-1">
                            {revisedBabs.map((bab) => (
                                <div
                                    key={bab.id_bab}
                                    className="bg-white border border-yellow-200 p-2 rounded-md shadow-sm"
                                >
                                    <p className="font-medium text-gray-800 text-sm">
                                        Bab {bab.chapter_number}
                                    </p>
                                    <p className="text-gray-600 text-xs mt-1">{bab.notes}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Messages */}
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

                                        {/* Chat Bubble */}
                                        <div
                                            className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${isSender
                                                    ? "bg-gray-800 text-white rounded-br-none"
                                                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                                }`}
                                        >
                                            {msg.content && (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            )}

                                            {/* File Attachment */}
                                            {msg.attachmentPath && (
                                                <button
                                                    onClick={() => handleDownload(msg.attachmentPath)}
                                                    className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-md text-xs font-medium ${isSender
                                                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                                                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                                        }`}
                                                >
                                                    {getFileIcon(msg.attachmentName)}
                                                    {msg.attachmentName || "Lampiran File"}
                                                </button>
                                            )}

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

                {/* Input Section */}
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-3 p-4 border-t bg-white"
                >
                    <label className="cursor-pointer text-gray-500 hover:text-gray-700 transition">
                        <Paperclip size={20} />
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setAttachment(e.target.files[0])}
                            disabled={sending}
                        />
                    </label>
                    {attachment && (
                        <span className="text-xs text-gray-600 truncate max-w-[200px]">
                            {attachment.name}
                        </span>
                    )}
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
                        disabled={(!message.trim() && !attachment) || sending}
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
