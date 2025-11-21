import express from "express"

// import { deletePeriode, getAllPeriode, getPeriodeAktif, getPeriodeById, getPeriodeStatistics, togglePeriodeStatus, updatePeriode } from "../controllers/PeriodeSkripsiController";
import { verifyAdmin, verifySession } from "../middleware/authMiddleware";
// import { logActivity } from "../middleware/loggingMiddleware";
import { getAllPeriode } from "../controllers/PeriodeSkripsiController";
import { logActivity } from "../middleware/loggingMiddleware";






const router = express.Router();


router.use(verifySession);
router.use(verifyAdmin);

// Public routes (bisa diakses mahasiswa dan dosen)
router.get('/', validatePagination, getAllPeriode);
router.get('/aktif', getPeriodeAktif);
router.get('/statistics', getPeriodeStatistics);
router.get('/:id_periode', getPeriodeById);



router.post('/',
    validateCreatePeriode,
    logActivity('CREATE_PERIODE', req => `Admin membuat periode ${req.body.tahun_akademik} semester ${req.body.semester}`),
    createPeriode
);

router.put('/:id_periode',
    validateUpdatePeriode,
    logActivity('UPDATE_PERIODE', req => `Admin update periode ID: ${req.params.id_periode}`),
    updatePeriode
);

router.patch('/:id_periode/toggle-status',
    logActivity('TOGGLE_PERIODE_STATUS', req => `Admin toggle status periode ID: ${req.params.id_periode}`),
    togglePeriodeStatus
);

router.delete('/:id_periode',
    logActivity('DELETE_PERIODE', req => `Admin menghapus periode ID: ${req.params.id_periode}`),
    deletePeriode
);

export default router;