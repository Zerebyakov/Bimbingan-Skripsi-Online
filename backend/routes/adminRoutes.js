import express from 'express'
import { assignDosenPembimbing, createUser, getAllDosen, getAllUsers, getDashboardStats, getKonfigurasi, updateKonfigurasi } from '../controllers/AdminController.js';
import { logActivity } from '../middleware/loggingMiddleware.js';
import { verifyAdmin, verifySession } from '../middleware/authMiddleware.js';
import { validateAssignDosen, validateCreateUser, validateKonfigurasi, validatePagination } from '../middleware/validationMiddleware.js';
import { getAllArsip } from '../controllers/ArsipController.js';





const router = express.Router();

// Semua route admin memerlukan session dan role admin
router.use(verifySession);
router.use(verifyAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Konfigurasi routes
router.get('/konfigurasi', getKonfigurasi);
router.put('/konfigurasi',
    validateKonfigurasi,
    logActivity('UPDATE_CONFIG', 'Admin update konfigurasi sistem'),
    updateKonfigurasi
);

// User management routes
router.get('/users', validatePagination, getAllUsers);
router.post('/users',
    validateCreateUser,
    logActivity('CREATE_USER', req => `Admin membuat user ${req.body.email}`),
    createUser
);

router.get('/dosen', getAllDosen);

// Assign dosen pembimbing
router.put('/pengajuan/:id_pengajuan/assign-dosen',
    validateAssignDosen,
    logActivity('ASSIGN_DOSEN', 'Admin assign dosen pembimbing'),
    assignDosenPembimbing
);

export default router;
