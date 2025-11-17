import BabSubmission from "../models/BabSubmission.js";
import Dosen from "../models/Dosen.js";
import LaporanAkhir from "../models/LaporanAkhir.js";
import PengajuanJudul from "../models/PengajuanJudul.js";

// Middleware untuk validasi session dan autentikasi
export const verifySession = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Session not found"
        });
    }
    next();
};

// Middleware untuk validasi role
export const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.session.role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Role not found"
            });
        }

        if (!allowedRoles.includes(req.session.role)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden - Insufficient permissions"
            });
        }

        next();
    };
};



//  BARU: Middleware untuk cek apakah dosen adalah pembimbing dari pengajuan
//  IMPROVED: verifyPembimbing dengan better error handling
export const verifyPembimbing = async (req, res, next) => {
    try {
        const { id_pengajuan, id_bab, id_laporan } = req.params;

        let pengajuanId = id_pengajuan;

        // Jika dari route bab
        if (id_bab) {
            const bab = await BabSubmission.findByPk(id_bab);
            if (!bab) {
                return res.status(404).json({
                    success: false,
                    message: "Bab tidak ditemukan"
                });
            }
            pengajuanId = bab.id_pengajuan;
        }

        // Jika dari route laporan
        if (id_laporan) {
            const laporan = await LaporanAkhir.findByPk(id_laporan);
            if (!laporan) {
                return res.status(404).json({
                    success: false,
                    message: "Laporan tidak ditemukan"
                });
            }
            pengajuanId = laporan.id_pengajuan;
        }

        // Validasi pengajuanId
        if (!pengajuanId) {
            return res.status(400).json({
                success: false,
                message: "ID pengajuan tidak valid"
            });
        }

        // Cari data dosen
        const dosen = await Dosen.findOne({
            where: { id_user: req.session.userId }
        });

        if (!dosen) {
            return res.status(404).json({
                success: false,
                message: "Data dosen tidak ditemukan"
            });
        }

        // Cari pengajuan
        const pengajuan = await PengajuanJudul.findByPk(pengajuanId);

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        // Cek apakah dosen adalah pembimbing
        const isPembimbing1 = pengajuan.dosenId1 === dosen.id_dosen;
        const isPembimbing2 = pengajuan.dosenId2 === dosen.id_dosen;

        if (!isPembimbing1 && !isPembimbing2) {
            return res.status(403).json({
                success: false,
                message: "Anda tidak memiliki akses ke pengajuan ini"
            });
        }

        // Set pembimbing info
        req.pembimbingRole = isPembimbing1 ? 'pembimbing_1' : 'pembimbing_2';
        req.dosenId = dosen.id_dosen;
        req.pengajuanId = pengajuanId;

        next();
    } catch (error) {
        console.error('Error in verifyPembimbing:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  BARU: Middleware untuk memastikan hanya Pembimbing 1 yang bisa ACC
export const verifyPembimbing1Only = async (req, res, next) => {
    try {
        // Pastikan sudah melalui verifyPembimbing dulu
        if (!req.pembimbingRole) {
            return res.status(403).json({
                success: false,
                message: "Role pembimbing tidak terdeteksi"
            });
        }

        if (req.pembimbingRole !== 'pembimbing_1') {
            return res.status(403).json({
                success: false,
                message: "Hanya Pembimbing Utama yang dapat melakukan ACC/Reject"
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const verifyAdmin = verifyRole(['admin']);
export const verifyDosen = verifyRole(['dosen']);
export const verifyMahasiswa = verifyRole(['mahasiswa']);
export const verifyAdminOrDosen = verifyRole(['admin', 'dosen']);
export const verifyDosenOrMahasiswa = verifyRole(['dosen', 'mahasiswa']);
export const verifyAllRoles = verifyRole(['admin', 'dosen', 'mahasiswa']);
