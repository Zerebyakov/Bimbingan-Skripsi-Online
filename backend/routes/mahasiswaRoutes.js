import express from 'express'
import { verifyMahasiswa, verifySession } from '../middleware/authMiddleware.js';
import { 
    ajukanJudul, 
    generateKartuBimbingan, 
    getMahasiswaDashboard, 
    uploadBab, 
    uploadBab as uploadBabFile,
    uploadLaporanAkhir

} from '../controllers/MahasiswaController.js';
import { handleUploadError, uploadLaporan, uploadProposal } from '../middleware/fileUploadMiddleware.js';
import { logActivity } from '../middleware/loggingMiddleware.js';
import { validatePengajuanJudul, validateUploadBab } from '../middleware/validationMiddleware.js';




const router = express.Router();

// Semua route mahasiswa memerlukan session dan role mahasiswa
router.use(verifySession);
router.use(verifyMahasiswa);

// Dashboard routes
router.get('/dashboard', getMahasiswaDashboard);

// Pengajuan judul
router.post('/pengajuan-judul',
    uploadProposal,
    handleUploadError,
    validatePengajuanJudul,
    logActivity('AJUKAN_JUDUL', req => `Mahasiswa mengajukan judul: ${req.body.title}`),
    ajukanJudul
);

// Upload bab
router.post('/upload-bab',
    uploadBabFile,
    handleUploadError,
    validateUploadBab,
    logActivity('UPLOAD_BAB', req => `Mahasiswa upload Bab ${req.body.chapter_number}`),
    uploadBab
);

// Generate kartu bimbingan
router.post('/kartu-bimbingan',
    logActivity('GENERATE_KARTU', 'Mahasiswa generate kartu bimbingan'),
    generateKartuBimbingan
);

// Upload laporan akhir
router.post('/laporan-akhir',
    uploadLaporan,
    handleUploadError,
    logActivity('UPLOAD_LAPORAN', 'Mahasiswa upload laporan akhir'),
    uploadLaporanAkhir
);

export default router;