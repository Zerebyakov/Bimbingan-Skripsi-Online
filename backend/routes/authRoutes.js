import express from 'express'
import { verifySession } from '../middleware/authMiddleware.js';
import { getProfile, login, logout, updatePassword, updateProfile } from '../controllers/UserController.js';
import { validateLogin, validateUpdatePassword, validateUpdateProfile } from '../middleware/validationMiddleware.js';
import upload, { handleUploadError } from '../middleware/fileUploadMiddleware.js';



const router = express.Router();
const profilePhotoUpload = (req, res, next) => {
    const userRole = req.session?.role;

    let uploadMiddleware;
    if (userRole === "dosen") {
        uploadMiddleware = upload("fotoDosen");
    } else if (userRole === "mahasiswa") {
        uploadMiddleware = upload("fotoMahasiswa");
    } else {
        // Admin tidak mengupload foto
        return next();
    }

    // Jalankan middleware upload
    uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error("Upload error:", err.message);
            return handleUploadError(err, req, res, next);
        }
        next();
    });
};
// Auth routes
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.get('/profile', verifySession, getProfile);
router.put('/profile', verifySession, profilePhotoUpload, updateProfile);
router.put('/password', verifySession, validateUpdatePassword, updatePassword);

export default router;