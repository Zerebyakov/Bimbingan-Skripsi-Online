import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const allowedExtensions = [".xlsx", ".xls"];

const excelUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            return cb(new Error("File harus berformat .xlsx atau .xls"));
        }

        cb(null, true);
    },
});

export const handleExcelUploadError = (err, req, res, next) => {
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "Gagal upload file Excel",
        });
    }

    next();
};

export default excelUpload;