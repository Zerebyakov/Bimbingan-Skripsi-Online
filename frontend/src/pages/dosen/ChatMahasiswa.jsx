import React, { useEffect, useState, useRef } from "react";
import DosenLayout from "./layout/DosenLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import {
  Send,
  Paperclip,
  ArrowLeft,
  Loader2,
  FileDown,
  FileText,
  Image,
  FileType,
  X,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { initSocket, leaveChatRoom } from "../../services/Socket";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import PageMeta from "../../components/PageMeta";

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

  const loggedInUserId = user?.id_user;

  // Fetch messages + bimbingan info
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

      const msgs = msgRes.data?.data?.messages || [];
      setMessages(msgs);

      const list = bimRes.data?.data?.mahasiswaBimbingan || [];
      const found = list.find((m) => Number(m.id_pengajuan) === Number(id_pengajuan));
      setBimbingan(found || null);

      // scroll after slight delay to ensure DOM updated
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (error) {
      console.error(" Error fetching chat data:", error);
      Swal.fire("Gagal", "Tidak dapat memuat percakapan.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loggedInUserId) return;

    const socket = initSocket(loggedInUserId, id_pengajuan);
    fetchMessages();

    const handleNewMessage = (msg) => {
      if (Number(msg.id_pengajuan) === Number(id_pengajuan)) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id_message === msg.id_message);
          if (exists) return prev;
          return [...prev, msg];
        });
      }
    };

    if (messageListenerRef.current) {
      socket.off("message:new", messageListenerRef.current);
    }
    messageListenerRef.current = handleNewMessage;
    socket.on("message:new", handleNewMessage);

    return () => {
      try {
        leaveChatRoom(id_pengajuan);
        socket.off("message:new", messageListenerRef.current);
      } catch (err) {
        /* ignore */
      }
      messageListenerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_pengajuan, loggedInUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // file icon helper
  const getFileIcon = (fileName) => {
    if (!fileName) return <FileType size={14} />;
    const ext = fileName.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return <Image size={14} />;
    if (["pdf"].includes(ext)) return <FileText size={14} />;
    return <FileDown size={14} />;
  };

  // clear selected file
  const clearAttachment = () => setAttachment(null);

  // send message (supports text + file)
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !attachment) || sending) return;

    const formData = new FormData();
    if (message.trim()) formData.append("content", message.trim());
    if (attachment) formData.append("file", attachment);

    // optimistic clear UI
    setMessage("");
    setAttachment(null);
    setSending(true);

    try {
      const res = await axios.post(
        `${baseUrl}chat/pengajuan/${id_pengajuan}/message`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const newMsg = res.data?.data;
      if (newMsg) {
        // append returned message (avoid duplicates)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id_message === newMsg.id_message);
          if (exists) return prev;
          return [...prev, newMsg];
        });
        // scroll
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch (error) {
      console.error(" Gagal kirim pesan:", error);
      Swal.fire("Gagal", "Gagal mengirim pesan. Silakan coba lagi.", "error");
      // restore text if it was cleared and message exists
    } finally {
      setSending(false);
    }
  };

  const handleDownload = (filePath) => {
    if (!filePath) {
      Swal.fire("Info", "File tidak tersedia atau belum diunggah oleh pengirim.", "info");
      return;
    }
    // Open in new tab — backend should handle content-disposition if needed
    window.open(`${baseUrl}${filePath}`, "_blank");
  };

  // filter revised babs (safe)
  const revisedBabs = (bimbingan?.BabSubmissions || []).filter(
    (bab) => bab.status === "revisi" && bab.notes
  );

  return (
    <DosenLayout>
      <PageMeta
        title="Chat Mahasiswa"
      />
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
                {bimbingan?.Mahasiswa?.nama_lengkap || "Mahasiswa Bimbingan"} - {bimbingan?.Mahasiswa?.nim || "NIM"}
              </h2>
              <p className="text-sm text-gray-500">{bimbingan?.title || "Mahasiswa Bimbingan"}</p>
            </div>
          </div>

        </div>

        {/* Notes Revisi */}
        {revisedBabs.length > 0 && (
          <div className="bg-yellow-50 border-y border-yellow-200 px-6 py-3 text-sm">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              🧾 Catatan Revisi Terbaru
            </h3>
            <div className="space-y-1">
              {revisedBabs.map((bab) => (
                <div key={bab.id_bab} className="bg-white border border-yellow-200 p-2 rounded-md shadow-sm">
                  <p className="font-medium text-gray-800 text-sm">Bab {bab.chapter_number}</p>
                  <p className="text-gray-600 text-xs mt-1">{bab.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat area */}
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
              const isSender = Number(msg.senderId) === Number(loggedInUserId);
              const senderName =
                msg.User?.role === "mahasiswa"
                  ? msg.User?.Mahasiswa?.nama_lengkap || "Mahasiswa"
                  : msg.User?.Dosens?.[0]?.nama || "Dosen";

              return (
                <div key={msg.id_message} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col max-w-[70%]">
                    <div className={`text-xs mb-1 ${isSender ? "text-right text-gray-400" : "text-gray-500"}`}>
                      {senderName}
                    </div>

                    {/* Bubble */}
                    <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${isSender ? "bg-gray-800 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}>
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                      {msg.attachmentPath && (
                        <div className="mt-2">
                          <button
                            onClick={() => handleDownload(msg.attachmentPath)}
                            className={`${isSender ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"} inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium`}
                          >
                            {getFileIcon(msg.attachmentName)}
                            <span className="max-w-[180px] truncate">{msg.attachmentName || "Lampiran File"}</span>
                            <FileDown size={12} />
                          </button>
                        </div>
                      )}

                      <p className={`text-[11px] mt-1 ${isSender ? "text-gray-300" : "text-gray-500"}`}>
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

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-3 p-4 border-t bg-white">
          <label className="relative cursor-pointer text-gray-500 hover:text-gray-700 transition">
            <Paperclip size={20} />
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.[0]) setAttachment(e.target.files[0]);
              }}
              disabled={sending}
            />
          </label>

          {/* attachment preview */}
          {attachment && (
            <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full">
              <div className="text-xs text-gray-700 max-w-[220px] truncate">{attachment.name}</div>
              <button type="button" onClick={clearAttachment} className="text-gray-500 hover:text-gray-700">
                <X size={14} />
              </button>
            </div>
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
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </DosenLayout>
  );
};

export default ChatMahasiswa;
