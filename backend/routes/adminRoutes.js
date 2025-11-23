import express from 'express'
import { assignDosenPembimbing, createUser, deleteUser, getAllDosen, getAllMahasiswa, getDashboardStats, getKonfigurasi, toggleUserStatus, updateKonfigurasi, updateUser } from '../controllers/AdminController.js';
import { logActivity } from '../middleware/loggingMiddleware.js';
import { verifyAdmin, verifySession } from '../middleware/authMiddleware.js';
import { validateAssignDosen, validateCreatePeriode, validateCreateUser, validatePagination, validateUpdatePeriode, validateUpdateUser } from '../middleware/validationMiddleware.js';
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
router.get('/users/dosen', getAllDosen);
router.get('/users/mahasiswa',getAllMahasiswa);

router.post('/users',
    validateCreateUser,
    logActivity('CREATE_USER', req => `Admin membuat user ${req.body.email}`),
    createUser
);
router.put('/users/:id_user',
    validateUpdateUser,
    logActivity('UPDATE_USER', req => `Admin update user ID: ${req.params.id_user}`),
    updateUser
)
// Toggle user status (aktif/nonaktif)
router.patch('/users/:id_user/toggle-status',
    logActivity('TOGGLE_USER_STATUS', req => `Admin toggle status user ID: ${req.params.id_user}`),
    toggleUserStatus
)
// Soft delete user
router.delete('/users/:id_user',
    logActivity('DELETE_USER', req => `Admin soft delete user ID: ${req.params.id_user}`),
    deleteUser
);

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
