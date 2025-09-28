import Arsip from "../models/Arsip.js";
import Dosen from "../models/Dosen.js";
import Mahasiswa from "../models/Mahasiswa.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import ProgramStudi from "../models/ProgramStudi.js";





// Get all arsip (untuk admin)
export const getAllArsip = async (req, res) => {
    try {
        const { tahun, status, page = 1, limit = 10 } = req.query;

        const whereCondition = {};
        if (tahun) {
            whereCondition.tanggalSelesai = {
                [Op.between]: [new Date(`${tahun}-01-01`), new Date(`${tahun}-12-31`)]
            };
        }
        if (status) {
            whereCondition.status = status;
        }

        const arsip = await Arsip.findAndCountAll({
            where: whereCondition,
            include: [{
                model: PengajuanJudul,
                include: [
                    { model: Mahasiswa, include: [{ model: ProgramStudi }] },
                    { model: Dosen, as: 'Pembimbing1' },
                    { model: Dosen, as: 'Pembimbing2' }
                ]
            }],
            order: [['tanggalSelesai', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        res.status(200).json({
            success: true,
            data: {
                arsip: arsip.rows,
                pagination: {
                    total: arsip.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(arsip.count / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Export arsip data
export const exportArsip = async (req, res) => {
    try {
        const { format = 'json', tahun } = req.query;

        const whereCondition = {};
        if (tahun) {
            whereCondition.tanggalSelesai = {
                [Op.between]: [new Date(`${tahun}-01-01`), new Date(`${tahun}-12-31`)]
            };
        }

        const arsip = await Arsip.findAll({
            where: whereCondition,
            include: [{
                model: [PengajuanJudul],
                include: [
                    { model: Mahasiswa, include: [{ model: ProgramStudi }] },
                    { model: Dosen, as: 'Pembimbing1' },
                    { model: Dosen, as: 'Pembimbing2' }
                ]
            }],
            order: [['tanggalSelesai', 'DESC']]
        });

        if (format === 'excel') {
            // Implementation for Excel export would go here
            // You'd need to use a library like 'exceljs' or 'xlsx'
            res.status(200).json({
                success: true,
                message: "Excel export feature coming soon"
            });
        } else {
            res.status(200).json({
                success: true,
                data: arsip
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};