import express from 'express'
import { verifyAllRoles, verifySession } from '../middleware/authMiddleware.js';
import { getNotifikasi, getPushPublicKey, getUnreadCount, markAllAsRead, markAsRead, subscribePush, unsubscribePush } from '../controllers/NotifikasiController.js';
import { validatePagination } from '../middleware/validationMiddleware.js';




const router = express.Router();

// Semua route notifikasi memerlukan session
router.use(verifySession);
router.use(verifyAllRoles);

// Get notifikasi
router.get('/', validatePagination, getNotifikasi);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark as read
router.put('/:id_notif/read', markAsRead);

// Mark all as read
router.put('/read-all', markAllAsRead);

// Web Push
router.get('/push/public-key', getPushPublicKey);
router.post('/push/subscribe', subscribePush);
router.post('/push/unsubscribe', unsubscribePush);

export default router;