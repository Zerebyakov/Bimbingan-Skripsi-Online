import multer from "multer";
import path from 'path'
import fs from 'fs'



const createUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const proposalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/proposals/';
        createUploadDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'proposal-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration untuk bab
const babStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/bab/';
        createUploadDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bab-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration untuk laporan akhir
const laporanStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/laporan/';
        createUploadDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage configuration untuk chat attachments
const chatStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/chat/';
        createUploadDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter untuk dokumen
const documentFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('File harus berformat PDF, DOC, atau DOCX'), false);
    }
};

// File filter untuk chat (lebih fleksibel)
const chatFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('File tidak didukung'), false);
    }
};

// Multer instances
export const uploadProposal = multer({
    storage: proposalStorage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
}).single('proposal_file');

export const uploadBab = multer({
    storage: babStorage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB
    }
}).single('bab_file');

export const uploadLaporan = multer({
    storage: laporanStorage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB
    }
}).fields([
    { name: 'finalFile', maxCount: 1 },
    { name: 'abstrakFile', maxCount: 1 },
    { name: 'pengesahanFile', maxCount: 1 },
    { name: 'pernyataanFile', maxCount: 1 },
    { name: 'presentasiFile', maxCount: 1 }
]);

export const uploadChatAttachment = multer({
    storage: chatStorage,
    fileFilter: chatFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('attachment');

// Error handling middleware untuk multer
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File terlalu besar'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    next();
};
