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
  Pencil,
  Trash2,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { initSocket, leaveChatRoom } from "../../services/Socket";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import PageMeta from "../../components/PageMeta";
import LinkifiedText from "../../components/ui/LinkifiedText";

// Pesan dianggap pernah diedit jika updatedAt terpaut > 5 detik dari createdAt
const isMessageEdited = (msg) =>
  msg?.updatedAt &&
  new Date(msg.updatedAt).getTime() - new Date(msg.createdAt).getTime() > 5000;

// URL lampiran chat: path polos disajikan dari uploads/chat,
// path dengan "/" (mis. "bab/xxx.pdf") disajikan dari uploads langsung
const chatFileUrl = (filePath) =>
  filePath.includes("/")
    ? `${imageUrl}uploads/${filePath}`
    : `${imageUrl}uploads/chat/${filePath}`;

// Lampiran bertipe gambar ditampilkan sebagai preview
const isImageAttachment = (name = "") =>
  ["jpg", "jpeg", "png", "gif", "webp"].includes(
    String(name).split(".").pop().toLowerCase()
  );

// Escape teks untuk halaman export
const escapeHtml = (text = "") =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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

    const handleUpdatedMessage = (msg) => {
      if (Number(msg.id_pengajuan) === Number(id_pengajuan)) {
        setMessages((prev) =>
          prev.map((m) => (m.id_message === msg.id_message ? msg : m))
        );
      }
    };

    const handleDeletedMessage = (payload) => {
      if (Number(payload.id_pengajuan) === Number(id_pengajuan)) {
        setMessages((prev) => prev.filter((m) => m.id_message !== payload.id_message));
      }
    };

    if (messageListenerRef.current) {
      socket.off("message:new", messageListenerRef.current);
    }
    messageListenerRef.current = handleNewMessage;
    socket.on("message:new", handleNewMessage);
    socket.on("message:updated", handleUpdatedMessage);
    socket.on("message:deleted", handleDeletedMessage);

    return () => {
      try {
        leaveChatRoom(id_pengajuan);
        socket.off("message:new", messageListenerRef.current);
        socket.off("message:updated", handleUpdatedMessage);
        socket.off("message:deleted", handleDeletedMessage);
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

  // Tandai chat ini sudah dibaca (dipakai badge unread di daftar bimbingan)
  useEffect(() => {
    localStorage.setItem(`chat_last_seen_${id_pengajuan}`, String(Date.now()));
  }, [id_pengajuan, messages]);

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
    window.open(chatFileUrl(filePath), "_blank");
  };

  // Export riwayat chat ke halaman cetak (bisa disimpan sebagai PDF)
  const handleExportChat = async () => {
    // Buka window dulu (sinkron) agar tidak diblokir popup blocker
    const win = window.open("", "_blank");
    try {
      const res = await axios.get(
        `${baseUrl}chat/pengajuan/${id_pengajuan}/export`,
        { withCredentials: true }
      );
      const data = res.data?.data;
      const history = data?.chatHistory || [];

      const rows = history
        .map(
          (m) => `
            <tr>
              <td class="time">${new Date(m.timestamp).toLocaleString("id-ID", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}</td>
              <td class="sender">${escapeHtml(m.sender)}<br/><small>${escapeHtml(m.role || "")}</small></td>
              <td>${escapeHtml(m.content || "")}${m.attachment
              ? `<div class="attachment">📎 ${escapeHtml(m.attachment)}</div>`
              : ""
            }</td>
            </tr>`
        )
        .join("");

      win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Riwayat Bimbingan - ${escapeHtml(data?.pengajuan?.mahasiswa || "")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p.meta { font-size: 13px; color: #6b7280; margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    td.time { white-space: nowrap; width: 130px; }
    td.sender { width: 160px; }
    td.sender small { color: #6b7280; text-transform: capitalize; }
    .attachment { margin-top: 4px; font-style: italic; color: #374151; }
    .no-print { margin-top: 20px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>Riwayat Percakapan Bimbingan Skripsi</h1>
  <p class="meta"><b>Mahasiswa:</b> ${escapeHtml(data?.pengajuan?.mahasiswa || "-")}</p>
  <p class="meta"><b>Judul:</b> ${escapeHtml(data?.pengajuan?.title || "-")}</p>
  <p class="meta"><b>Dicetak:</b> ${new Date().toLocaleString("id-ID")}</p>
  <table>
    <thead><tr><th>Waktu</th><th>Pengirim</th><th>Pesan</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="3">Belum ada pesan.</td></tr>`}</tbody>
  </table>
  <div class="no-print">
    <button onclick="window.print()">Cetak / Simpan sebagai PDF</button>
  </div>
</body>
</html>`);
      win.document.close();
      setTimeout(() => win.print(), 400);
    } catch (error) {
      console.error("Gagal export chat:", error);
      if (win) win.close();
      Swal.fire("Gagal", "Tidak dapat mengekspor riwayat chat.", "error");
    }
  };

  // Edit pesan sendiri (hanya teks)
  const handleEditMessage = async (msg) => {
    const { value: newContent } = await Swal.fire({
      title: "Edit Pesan",
      input: "textarea",
      inputValue: msg.content || "",
      inputAttributes: { "aria-label": "Isi pesan" },
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#1f2937",
      inputValidator: (value) => (!value || !value.trim() ? "Isi pesan tidak boleh kosong" : null),
    });

    if (newContent === undefined || newContent.trim() === (msg.content || "")) return;

    try {
      const res = await axios.put(
        `${baseUrl}chat/message/${msg.id_message}`,
        { content: newContent.trim() },
        { withCredentials: true }
      );
      const updated = res.data?.data;
      if (updated) {
        setMessages((prev) =>
          prev.map((m) => (m.id_message === updated.id_message ? updated : m))
        );
      }
    } catch (error) {
      console.error("Gagal edit pesan:", error);
      Swal.fire("Gagal", error.response?.data?.message || "Gagal mengedit pesan.", "error");
    }
  };

  // Hapus pesan sendiri
  const handleDeleteMessage = async (msg) => {
    const confirm = await Swal.fire({
      title: "Hapus Pesan?",
      text: "Pesan yang dihapus tidak dapat dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${baseUrl}chat/message/${msg.id_message}`, {
        withCredentials: true,
      });
      setMessages((prev) => prev.filter((m) => m.id_message !== msg.id_message));
    } catch (error) {
      console.error("Gagal hapus pesan:", error);
      Swal.fire("Gagal", error.response?.data?.message || "Gagal menghapus pesan.", "error");
    }
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

          {/* Export riwayat chat (cetak / simpan PDF) */}
          <button
            onClick={handleExportChat}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-md transition shrink-0"
            title="Ekspor riwayat percakapan"
          >
            <FileDown size={14} /> Export
          </button>
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
              // Asosiasi User-Dosen adalah hasOne → properti "Dosen" (tunggal)
              const senderName =
                msg.User?.role === "mahasiswa"
                  ? msg.User?.Mahasiswa?.nama_lengkap || "Mahasiswa"
                  : msg.User?.Dosen?.nama || msg.User?.Dosens?.[0]?.nama || "Dosen";

              return (
                <div key={msg.id_message} className={`group flex ${isSender ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col max-w-[70%]">
                    <div className={`text-xs mb-1 ${isSender ? "text-right text-gray-400" : "text-gray-500"}`}>
                      {senderName}
                    </div>

                    <div className={`flex items-end gap-1 ${isSender ? "flex-row-reverse" : ""}`}>
                      {/* Bubble */}
                      <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${isSender ? "bg-gray-800 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}>
                        {msg.content && <LinkifiedText text={msg.content} />}

                        {msg.attachmentPath && (
                          <div className="mt-2">
                            {isImageAttachment(msg.attachmentName || msg.attachmentPath) ? (
                              <img
                                src={chatFileUrl(msg.attachmentPath)}
                                alt={msg.attachmentName || "Lampiran gambar"}
                                onClick={() => handleDownload(msg.attachmentPath)}
                                className="max-w-[220px] max-h-60 rounded-lg cursor-pointer border border-gray-200 object-cover"
                              />
                            ) : (
                              <button
                                onClick={() => handleDownload(msg.attachmentPath)}
                                className={`${isSender ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"} inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium`}
                              >
                                {getFileIcon(msg.attachmentName)}
                                <span className="max-w-[180px] truncate">{msg.attachmentName || "Lampiran File"}</span>
                                <FileDown size={12} />
                              </button>
                            )}
                          </div>
                        )}

                        <p className={`text-[11px] mt-1 ${isSender ? "text-gray-300" : "text-gray-500"}`}>
                          {new Date(msg.createdAt).toLocaleString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "short",
                          })}
                          {isMessageEdited(msg) && <span className="italic"> · diedit</span>}
                        </p>
                      </div>

                      {/* Aksi edit/hapus untuk pesan sendiri (muncul saat hover) */}
                      {isSender && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition pb-1">
                          {msg.content && (
                            <button
                              onClick={() => handleEditMessage(msg)}
                              aria-label="Edit pesan"
                              className="text-gray-400 hover:text-gray-700 p-1"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg)}
                            aria-label="Hapus pesan"
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
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
