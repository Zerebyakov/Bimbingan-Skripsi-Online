import express from 'express'
import { verifyAdminOrDosen, verifyAllRoles, verifySession } from '../middleware/authMiddleware.js';
import { getAllPengajuanJudul, getPengajuanJudulById, updatePengajuanJudul } from '../controllers/PengajuanJudulConteroller.js';
import { logActivity } from '../middleware/loggingMiddleware.js';
import { downloadBabFile, getBabSubmissionById, getBabSubmissions } from '../controllers/BabSubmissionController.js';
import { validatePagination, validatePengajuanJudul } from '../middleware/validationMiddleware.js';



const router = express.Router();

// Semua route pengajuan memerlukan session
router.use(verifySession);

// Get all pengajuan (admin/dosen only)
router.get('/', verifyAdminOrDosen, validatePagination, getAllPengajuanJudul);

// Get pengajuan by ID
router.get('/:id_pengajuan', verifyAllRoles, getPengajuanJudulById);

// Update pengajuan (mahasiswa only)
router.put('/:id_pengajuan',
    validatePengajuanJudul,
    logActivity('UPDATE_JUDUL', req => `User update pengajuan judul: ${req.body.title}`),
    updatePengajuanJudul
);

// Bab submission routes
router.get('/:id_pengajuan/bab', verifyAllRoles, getBabSubmissions);
router.get('/bab/:id_bab', verifyAllRoles, getBabSubmissionById);
router.get('/bab/:id_bab/download', verifyAllRoles, downloadBabFile);

export default router;