import express from 'express'
import { verifyDosenOrMahasiswa, verifySession } from '../middleware/authMiddleware.js';
import { handleUploadError, uploadChatAttachment } from '../middleware/fileUploadMiddleware.js';
import { logActivity } from '../middleware/loggingMiddleware.js';
import { exportChatHistory, getMessages, sendMessage } from '../controllers/ChatController.js';
import { validatePagination, validateSendMessage } from '../middleware/validationMiddleware.js';





const router = express.Router();

// Semua route chat memerlukan session dan role dosen/mahasiswa
router.use(verifySession);
router.use(verifyDosenOrMahasiswa);

// Send message
router.post('/pengajuan/:id_pengajuan/message',
    uploadChatAttachment,
    handleUploadError,
    validateSendMessage,
    logActivity('SEND_MESSAGE', 'User mengirim pesan'),
    sendMessage
);

// Get messages
router.get('/pengajuan/:id_pengajuan/messages',
    validatePagination,
    getMessages
);

// Export chat history
router.get('/pengajuan/:id_pengajuan/export',
    exportChatHistory
);

export default router;