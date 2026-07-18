import express from "express";
import { verifySession, verifyDosenOrMahasiswa } from "../middleware/authMiddleware.js";
import upload, { handleUploadError } from "../middleware/fileUploadMiddleware.js";
import { logActivity } from "../middleware/loggingMiddleware.js";
import {
    getMessages,
    sendMessage,
    exportChatHistory,
    updateMessage,
    deleteMessage,
} from "../controllers/ChatController.js";
import {
    validateSendMessage,
    validatePagination,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

// Semua route chat memerlukan session dan role dosen/mahasiswa
router.use(verifySession);
router.use(verifyDosenOrMahasiswa);

// Send message
router.post(
    "/pengajuan/:id_pengajuan/message",
    upload("chat"), // otomatis pakai folder uploads/chat
    handleUploadError,
    validateSendMessage,
    logActivity("SEND_MESSAGE", (req) => `User mengirim pesan pada pengajuan ${req.params.id_pengajuan}`),
    sendMessage
);

// Get messages
router.get(
    "/pengajuan/:id_pengajuan/messages",
    validatePagination,
    getMessages
);

// Edit & hapus pesan (hanya pengirim, divalidasi di controller)
router.put(
    "/message/:id_message",
    logActivity("EDIT_MESSAGE", (req) => `User mengedit pesan ${req.params.id_message}`),
    updateMessage
);

router.delete(
    "/message/:id_message",
    logActivity("DELETE_MESSAGE", (req) => `User menghapus pesan ${req.params.id_message}`),
    deleteMessage
);

// Export chat history

router.get(
    "/pengajuan/:id_pengajuan/export",
    exportChatHistory
);

export default router;
