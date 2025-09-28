import express from 'express'
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import dosenRoutes from './dosenRoutes.js';
import mahasiswaRoutes from './mahasiswaRoutes.js';
import chatRoutes from './chatRoutes.js';
import notifikasiRoutes from './notifikasiRoutes.js';
import pengajuanRoutes from './pengajuanRoutes.js';
import arsipRoutes from './arsipRoutes.js';
import prodiRoutes from './prodiRoutes.js';



const router = express.Router();

// API Prefix
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/dosen', dosenRoutes);
router.use('/mahasiswa', mahasiswaRoutes);
router.use('/chat', chatRoutes);
router.use('/notifikasi', notifikasiRoutes);
router.use('/pengajuan', pengajuanRoutes);
router.use('/arsip', arsipRoutes);
router.use('/prodi', prodiRoutes);

router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

export default router;