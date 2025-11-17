import express from 'express'
import { verifyAdmin, verifySession } from '../middleware/authMiddleware.js';
import { createArsip, deleteArsip, exportArsip, getAllArsip, getArsipById, getArsipStatistics, updateArsip } from '../controllers/ArsipController.js';
import { validatePagination } from '../middleware/validationMiddleware.js';



const router = express.Router();

// Semua route arsip memerlukan session dan role admin
router.use(verifySession);
router.use(verifyAdmin);

//  Statistics (untuk dashboard admin)
router.get('/statistics', verifyAdmin, getArsipStatistics);

//  Export arsip (admin only)
router.get('/export', verifyAdmin, exportArsip);

//  Get all arsip dengan filter dan pagination
router.get('/', verifyAdmin, validatePagination, getAllArsip);

//  Get arsip by ID
router.get('/:id_arsip', verifyAdmin, getArsipById);

// Create arsip (admin only atau auto-trigger)
router.post('/', verifyAdmin, createArsip);

// Update arsip (admin only)
router.put('/:id_arsip', verifyAdmin, updateArsip);

// Delete arsip (admin only)
router.delete('/:id_arsip', verifyAdmin, deleteArsip);


export default router;
