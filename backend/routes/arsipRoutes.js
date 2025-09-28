import express from 'express'
import { verifyAdmin, verifySession } from '../middleware/authMiddleware.js';
import { exportArsip, getAllArsip } from '../controllers/ArsipController.js';
import { validatePagination } from '../middleware/validationMiddleware.js';



const router = express.Router();

// Semua route arsip memerlukan session dan role admin
router.use(verifySession);
router.use(verifyAdmin);

// Get all arsip
router.get('/', validatePagination, getAllArsip);

// Export arsip
router.get('/export', exportArsip);

export default router;
