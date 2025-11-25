import React, { useEffect, useState, useRef } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { useAuth } from "../../context/AuthContext";
import { initSocket, leaveChatRoom } from "../../services/Socket";
import { Send, Paperclip, Loader2, ArrowLeft, BookOpen, X, FileText, Upload as UploadIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import PageMeta from "../../components/PageMeta";

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

    // State untuk upload file
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedBab, setSelectedBab] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [babList, setBabList] = useState([]);

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const fileInputRef = useRef(null);

    // === Ambil data dashboard mahasiswa ===
    const fetchDashboard = async () => {
        try {
            const res = await axios.get(`${baseUrl}mahasiswa/dashboard`, {
                withCredentials: true,
            });
            const data = res.data.data;
            setPengajuan(data.pengajuan);

            const submissions = data.pengajuan?.BabSubmissions || [];
            setBabList(submissions);

            const babCount = submissions.length;
            const totalBab = 5;
            const percent = Math.min((babCount / totalBab) * 100, 100);
            setProgress(percent);

            if (babCount > 0) {
                const last = submissions[babCount - 1];
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

    // === Handle file selection ===
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== "application/pdf") {
                Swal.fire({
                    icon: "warning",
                    title: "Format File Salah",
                    text: "Hanya file PDF yang diperbolehkan.",
                    confirmButtonColor: "#f59e0b",
                });
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB
                Swal.fire({
                    icon: "warning",
                    title: "File Terlalu Besar",
                    text: "Ukuran file maksimal 10MB.",
                    confirmButtonColor: "#f59e0b",
                });
                return;
            }
            setSelectedFile(file);
            setShowUploadModal(true);
        }
    };

    // === Upload Bab via Chat ===
    // === Upload Bab via Chat ===
    const handleUploadBab = async () => {
        if (!selectedFile || !selectedBab) {
            Swal.fire({
                icon: "warning",
                title: "Perhatian!",
                text: "Pilih nomor Bab terlebih dahulu.",
                confirmButtonColor: "#f59e0b",
            });
            return;
        }

        const existingBab = babList.find(
            (b) => b.chapter_number === parseInt(selectedBab)
        );

        if (existingBab && existingBab.status !== "revisi") {
            Swal.fire({
                icon: "warning",
                title: "Bab Sudah Ada",
                text: `Bab ${selectedBab} sudah diupload dan statusnya ${existingBab.status}. Hanya bab dengan status revisi yang dapat diupload ulang.`,
                confirmButtonColor: "#f59e0b",
            });
            return;
        }

        const confirm = await Swal.fire({
            title: `Upload Bab ${selectedBab}?`,
            text: existingBab
                ? "File lama akan diganti dengan yang baru."
                : "File akan dikirim ke dosen pembimbing untuk direview.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Ya, Upload",
            cancelButtonText: "Batal",
        });

        if (!confirm.isConfirmed) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append("chapter_number", selectedBab);

            // ✅ Gunakan field name yang sesuai middleware baru
            formData.append("bab", selectedFile);

            const url = existingBab
                ? `${baseUrl}mahasiswa/upload-bab/${existingBab.id}`
                : `${baseUrl}mahasiswa/upload-bab`;

            const res = await axios.post(url, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percent);
                },
            });

            if (res.data.success) {
                const notifMessage = existingBab
                    ? `📄 Bab ${selectedBab} telah di-reupload (${selectedFile.name})`
                    : `📄 Bab ${selectedBab} telah diupload (${selectedFile.name})`;

                await axios.post(
                    `${baseUrl}chat/pengajuan/${pengajuan.id_pengajuan}/message`,
                    { content: notifMessage },
                    { withCredentials: true }
                );

                Swal.fire({
                    icon: "success",
                    title: "Upload Berhasil!",
                    text: `Bab ${selectedBab} berhasil diupload dan notifikasi dikirim ke dosen.`,
                    confirmButtonColor: "#16a34a",
                    timer: 2000,
                });

                await fetchDashboard();
                setShowUploadModal(false);
                setSelectedFile(null);
                setSelectedBab("");
            }
        } catch (err) {
            console.error("Upload Bab gagal:", err);
            Swal.fire({
                icon: "error",
                title: "Gagal Upload",
                text:
                    err.response?.data?.message ||
                    "Upload gagal. Coba lagi.",
                confirmButtonColor: "#dc2626",
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
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

    // Get available bab numbers for upload
    const getAvailableBabNumbers = () => {
        const uploaded = babList
            .filter(b => b.status !== "revisi")
            .map(b => b.chapter_number);
        return [1, 2, 3, 4, 5].filter(num => !uploaded.includes(num));
    };

    const availableBabs = getAvailableBabNumbers();
    const revisiBabs = babList.filter(b => b.status === "revisi");

    return (
        <MahasiswaLayout>
            <PageMeta
                title="Bimbingan"
            />
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
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={chatDisabled}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer text-gray-500 hover:text-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={chatDisabled}
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder={
                            chatDisabled
                                ? "Bimbingan telah selesai – chat ditutup"
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

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => !uploading && setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Upload Bab Skripsi</h2>
                                {!uploading && (
                                    <button
                                        onClick={() => setShowUploadModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={24} />
                                    </button>
                                )}
                            </div>

                            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-green-600" size={24} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                            {selectedFile?.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(selectedFile?.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pilih Nomor Bab
                                </label>
                                <select
                                    value={selectedBab}
                                    onChange={(e) => setSelectedBab(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    disabled={uploading}
                                >
                                    <option value="">-- Pilih Bab --</option>
                                    {availableBabs.map(num => (
                                        <option key={num} value={num}>
                                            Bab {num} (Baru)
                                        </option>
                                    ))}
                                    {revisiBabs.map(bab => (
                                        <option key={bab.id} value={bab.chapter_number}>
                                            Bab {bab.chapter_number} (Revisi)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {uploading && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="font-medium text-green-600">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                            className="bg-green-600 h-2"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploading}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleUploadBab}
                                    disabled={!selectedBab || uploading}
                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <UploadIcon size={18} />
                                            Upload
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MahasiswaLayout>
    );
};

export default Bimbingan;