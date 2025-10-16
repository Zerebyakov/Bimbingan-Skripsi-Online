import { body, param, query, validationResult } from 'express-validator';


// Middleware untuk handle validation errors
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: errors.array()
        });
    }
    next();
};

// Validation untuk login
export const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Email harus valid')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password minimal 6 karakter'),
    handleValidationErrors
];

// Validation untuk pengajuan judul
export const validatePengajuanJudul = [
    body('title')
        .notEmpty()
        .withMessage('Judul tidak boleh kosong')
        .isLength({ min: 10, max: 255 })
        .withMessage('Judul harus 10-255 karakter'),
    body('description')
        .notEmpty()
        .withMessage('Deskripsi tidak boleh kosong')
        .isLength({ min: 50 })
        .withMessage('Deskripsi minimal 50 karakter'),
    body('bidang_topik')
        .notEmpty()
        .withMessage('Bidang topik tidak boleh kosong'),
    body('keywords')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Keywords maksimal 500 karakter'),
    handleValidationErrors
];

// Validation untuk upload bab
export const validateUploadBab = [
    body('chapter_number')
        .isInt({ min: 1, max: 5 })
        .withMessage('Nomor bab harus 1-5'),
    handleValidationErrors
];

// Validation untuk review
export const validateReview = [
    body('status')
        .isIn(['diterima', 'revisi', 'ditolak'])
        .withMessage('Status harus: diterima, revisi, atau ditolak'),
    body('rejection_reason')
        .if(body('status').isIn(['revisi', 'ditolak']))
        .notEmpty()
        .withMessage('Alasan revisi/penolakan harus diisi'),
    handleValidationErrors
];

// Validation untuk review bab
export const validateReviewBab = [
    body('status')
        .isIn(['menunggu', 'revisi', 'diterima'])
        .withMessage('Status harus: menunggu, revisi, atau diterima'),
    body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Catatan maksimal 1000 karakter'),
    handleValidationErrors
];

// Validation untuk send message
export const validateSendMessage = [
    param('id_pengajuan')
        .isInt()
        .withMessage('ID pengajuan harus berupa angka'),
    body('content')
        .optional()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Pesan maksimal 1000 karakter'),
    handleValidationErrors
];

// Validation untuk create user
export const validateCreateUser = [
    body('email')
        .isEmail()
        .withMessage('Email harus valid')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password minimal 6 karakter'),
    body('role')
        .isIn(['admin', 'dosen', 'mahasiswa'])
        .withMessage('Role harus: admin, dosen, atau mahasiswa'),
    handleValidationErrors
];

// Validation untuk assign dosen
export const validateAssignDosen = [
    param('id_pengajuan')
        .isInt()
        .withMessage('ID pengajuan harus berupa angka'),
    body('dosenId1')
        .isInt()
        .withMessage('ID dosen pembimbing 1 harus berupa angka'),
    body('dosenId2')
        .optional()
        .isInt()
        .withMessage('ID dosen pembimbing 2 harus berupa angka'),
    body('dosenId3')
        .optional()
        .isInt()
        .withMessage('ID dosen pembimbing 2 harus berupa angka'),
    handleValidationErrors
];

// Validation untuk konfigurasi sistem
export const validateKonfigurasi = [
    body('tahunAkademikAktif')
        .notEmpty()
        .withMessage('Tahun akademik tidak boleh kosong')
        .matches(/^\d{4}\/\d{4}$/)
        .withMessage('Format tahun akademik: YYYY/YYYY'),
    body('semesterAktif')
        .isIn(['Ganjil', 'Genap'])
        .withMessage('Semester harus: Ganjil atau Genap'),
    body('kuotaPerDosen')
        .isInt({ min: 1, max: 50 })
        .withMessage('Kuota per dosen harus 1-50'),
    body('formatNomorKartu')
        .notEmpty()
        .withMessage('Format nomor kartu tidak boleh kosong'),
    handleValidationErrors
];

// Validation untuk update password
export const validateUpdatePassword = [
    body('oldPassword')
        .notEmpty()
        .withMessage('Password lama tidak boleh kosong'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Password baru minimal 6 karakter'),
    handleValidationErrors
];

// Validation untuk program studi
export const validateProgramStudi = [
    body('kode_prodi')
        .notEmpty()
        .withMessage('Kode program studi tidak boleh kosong')
        .isLength({ min: 2, max: 10 })
        .withMessage('Kode program studi harus 2-10 karakter'),
    body('program_studi')
        .notEmpty()
        .withMessage('Nama program studi tidak boleh kosong')
        .isLength({ min: 5, max: 50 })
        .withMessage('Nama program studi harus 5-50 karakter'),
    handleValidationErrors
];

// Validation untuk pagination
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page harus berupa angka positif'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit harus 1-100'),
    handleValidationErrors
];