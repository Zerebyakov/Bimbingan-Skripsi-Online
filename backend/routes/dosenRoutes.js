import express from 'express'
import { verifyDosen, verifySession } from '../middleware/authMiddleware.js';
import { getDosenDashboard, getMahasiswaBimbingan, reviewBabSubmission, reviewPengajuanJudul } from '../controllers/DosenController.js';
import { logActivity } from '../middleware/loggingMiddleware.js';
import { reviewLaporanAkhir } from '../controllers/LaporanAkhirController.js';
import { validatePagination, validateReview, validateReviewBab } from '../middleware/validationMiddleware.js';





const router = express.Router();

// Semua route dosen memerlukan session dan role dosen
router.use(verifySession);
router.use(verifyDosen);

// Dashboard routes
router.get('/dashboard', getDosenDashboard);

// Mahasiswa bimbingan
router.get('/mahasiswa-bimbingan', validatePagination, getMahasiswaBimbingan);

// Review pengajuan judul
router.put('/pengajuan/:id_pengajuan/review',
    validateReview,
    logActivity('REVIEW_JUDUL', req => `Dosen ${req.body.status} pengajuan judul`),
    reviewPengajuanJudul
);

// Review bab submission
router.put('/bab/:id_bab/review',
    validateReviewBab,
    logActivity('REVIEW_BAB', req => `Dosen ${req.body.status} submission bab`),
    reviewBabSubmission
);

// Review laporan akhir
router.put('/laporan/:id_laporan/review',
    validateReview,
    logActivity('REVIEW_LAPORAN', req => `Dosen ${req.body.status} laporan akhir`),
    reviewLaporanAkhir
);

export default router;