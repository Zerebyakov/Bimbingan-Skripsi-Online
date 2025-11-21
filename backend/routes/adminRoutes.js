import express from 'express'
import { assignDosenPembimbing, createUser, getAllDosen, getAllUsers, getDashboardStats, getKonfigurasi, updateKonfigurasi } from '../controllers/AdminController.js';
import { logActivity } from '../middleware/loggingMiddleware.js';
import { verifyAdmin, verifySession } from '../middleware/authMiddleware.js';
import { validateAssignDosen, validateCreatePeriode, validateCreateUser, validateKonfigurasi, validatePagination, validateUpdatePeriode } from '../middleware/validationMiddleware.js';
import { getAllArsip } from '../controllers/ArsipController.js';
import { createPeriode, deletePeriode, getAllPeriode, getPeriodeAktif, getPeriodeById, getPeriodeStatistics, togglePeriodeStatus, updatePeriode } from '../controllers/PeriodeSkripsiController.js';





const router = express.Router();

// Semua route admin memerlukan session dan role admin
router.use(verifySession);
router.use(verifyAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Konfigurasi routes
router.get('/konfigurasi', getKonfigurasi);
router.put('/konfigurasi',
    validateUpdatePeriode,
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


// Public routes (bisa diakses mahasiswa dan dosen)
router.get('/periode', validatePagination, getAllPeriode);
router.get('/periode/aktif', getPeriodeAktif);
router.get('/periode/statistics', getPeriodeStatistics);
router.get('/periode/:id_periode', getPeriodeById);



router.post('/periode',
    validateCreatePeriode,
    logActivity('CREATE_PERIODE', req => `Admin membuat periode ${req.body.tahun_akademik} semester ${req.body.semester}`),
    createPeriode
);

router.put('/periode/:id_periode',
    validateUpdatePeriode,
    logActivity('UPDATE_PERIODE', req => `Admin update periode ID: ${req.params.id_periode}`),
    updatePeriode
);

router.patch('/periode/:id_periode/toggle-status',
    logActivity('TOGGLE_PERIODE_STATUS', req => `Admin toggle status periode ID: ${req.params.id_periode}`),
    togglePeriodeStatus
);

router.delete('/periode/:id_periode',
    logActivity('DELETE_PERIODE', req => `Admin menghapus periode ID: ${req.params.id_periode}`),
    deletePeriode
);

export default router;
