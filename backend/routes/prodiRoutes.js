import express, { Router } from 'express'
import {  verifyAdmin, verifyAllRoles, verifySession } from '../middleware/authMiddleware.js';
import { createProgramStudi, deleteProgramStudi, getAllProgramStudi } from '../controllers/ProgramStudiController.js';
import { logActivity } from '../middleware/loggingMiddleware.js';
import { validateProgramStudi } from '../middleware/validationMiddleware.js';



const router = express.Router();

router.use(verifySession);
router.use(verifyAdmin)

// Get all program studi (semua role bisa akses)
router.get('/', verifyAllRoles, getAllProgramStudi);

// Create program studi (admin only)
router.post('/',
    validateProgramStudi,
    logActivity('CREATE_PRODI', req => `Admin membuat program studi: ${req.body.program_studi}`),
    createProgramStudi
);

router.delete('/:prodi_id',
    deleteProgramStudi
)

export default router;