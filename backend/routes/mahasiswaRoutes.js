import express from "express";
import { verifyMahasiswa, verifySession } from "../middleware/authMiddleware.js";
import {
    ajukanJudul,
    generateKartuBimbingan,
    getMahasiswaDashboard,
    uploadBab,
    uploadLaporanAkhir,
} from "../controllers/MahasiswaController.js";
import upload, { handleUploadError } from "../middleware/fileUploadMiddleware.js";
import { logActivity } from "../middleware/loggingMiddleware.js";
import {
    validatePengajuanJudul,
    validateUploadBab,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.use(verifySession);
router.use(verifyMahasiswa);

// Dashboard Mahasiswa
router.get("/dashboard", getMahasiswaDashboard);


// Pengajuan Judul
router.post(
    "/pengajuan-judul",
    upload("proposal"), // otomatis pakai folder /uploads/proposals
    handleUploadError,
    validatePengajuanJudul,
    logActivity("AJUKAN_JUDUL", (req) => `Mahasiswa mengajukan judul: ${req.body.title}`),
    ajukanJudul
);

// Upload Bab
router.post(
    "/upload-bab",
    upload("bab"), // otomatis pakai folder /uploads/bab
    handleUploadError,
    validateUploadBab,
    logActivity("UPLOAD_BAB", (req) => `Mahasiswa upload Bab ${req.body.chapter_number}`),
    uploadBab
);

// Generate Kartu Bimbingan
router.post(
    "/kartu-bimbingan",
    logActivity("GENERATE_KARTU", "Mahasiswa generate kartu bimbingan"),
    generateKartuBimbingan
);

// Laporan Akhir
router.post("/laporan-akhir",
    upload("laporan"), // otomatis handle multiple file field
    handleUploadError,
    logActivity("UPLOAD_LAPORAN", "Mahasiswa upload laporan akhir"),
    uploadLaporanAkhir
);

export default router;
