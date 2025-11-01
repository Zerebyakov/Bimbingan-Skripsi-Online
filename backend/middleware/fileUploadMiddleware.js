import multer from "multer";
import path from "path";
import fs from "fs";

// === Helper untuk pastikan folder upload ada ===
const createUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// === Konfigurasi Storage Dinamis ===
const storageConfig = {
    proposal: {
        folder: "uploads/proposals/",
        prefix: "proposal-",
        limit: 10 * 1024 * 1024, // 10MB
        filter: [".pdf", ".doc", ".docx"],
    },
    bab: {
        folder: "uploads/bab/",
        prefix: "bab-",
        limit: 15 * 1024 * 1024, // 15MB
        filter: [".pdf", ".doc", ".docx"],
    },
    laporan: {
        folder: "uploads/laporan/",
        prefix: "laporan-",
        limit: 20 * 1024 * 1024, // 20MB
        filter: [".pdf", ".doc", ".docx"],
    },
    chat: {
        folder: "uploads/chat/",
        prefix: "chat-",
        limit: 5 * 1024 * 1024, // 5MB
        filter: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt"],
    },
    fotoDosen: {
        folder: "uploads/users/dosen/",
        prefix: "dosen-",
        limit: 2 * 1024 * 1024, // 2MB
        filter: [".jpg", ".jpeg", ".png"],
    },
    fotoMahasiswa: {
        folder: "uploads/users/mahasiswa/",
        prefix: "mahasiswa-",
        limit: 2 * 1024 * 1024, // 2MB
        filter: [".jpg", ".jpeg", ".png"],
    },
};

// === Fungsi utama upload dinamis ===
const upload = (type = "bab") => {
    const config = storageConfig[type] || storageConfig["bab"];

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            createUploadDir(config.folder);
            cb(null, config.folder);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, config.prefix + uniqueSuffix + path.extname(file.originalname));
        },
    });

    const fileFilter = (req, file, cb) => {
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (config.filter.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error(`File tidak didukung (${config.filter.join(", ")})`), false);
        }
    };

    const multerInstance = multer({
        storage,
        fileFilter,
        limits: { fileSize: config.limit },
    });

    // Untuk laporan akhir yang memiliki beberapa file
    if (type === "laporan") {
        return multerInstance.fields([
            { name: "finalFile", maxCount: 1 },
            { name: "abstrakFile", maxCount: 1 },
            { name: "pengesahanFile", maxCount: 1 },
            { name: "pernyataanFile", maxCount: 1 },
            { name: "presentasiFile", maxCount: 1 },
        ]);
    }

    // Default: single file
    // === Khusus untuk foto user (dosen & mahasiswa)
    if (type === "fotoDosen" || type === "fotoMahasiswa") {
        return multerInstance.single("foto"); // field sesuai FormData di frontend
    }

    // === Default: single file umum
    return multerInstance.single(type);
};

// === Error handling bawaan ===
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "Ukuran file terlalu besar.",
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    next();
};

// === Helper untuk hapus file lama ===
export const deleteOldFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error("Error deleting old file:", error);
        }
    }
};

export default upload;