import BabSubmission from "../models/BabSubmission.js";
import Dosen from "../models/Dosen.js";
import KartuBimbingan from "../models/KartuBimbingan.js";
import LaporanAkhir from "../models/LaporanAkhir.js";
import LogAktivitas from "../models/LogAktivitas.js";
import Mahasiswa from "../models/Mahasiswa.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import ProgramStudi from "../models/ProgramStudi.js";




// Get all pengajuan judul (untuk admin/dosen)
export const getAllPengajuanJudul = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const whereCondition = {};
        if (status) {
            whereCondition.status = status;
        }

        const pengajuan = await PengajuanJudul.findAndCountAll({
            where: whereCondition,
            include: [
                { model: Mahasiswa, include: [{ model: ProgramStudi }] },
                { model: Dosen, as: 'Pembimbing1', attributes: ['nama', 'gelar'] },
                { model: Dosen, as: 'Pembimbing2', attributes: ['nama', 'gelar'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        res.status(200).json({
            success: true,
            data: {
                pengajuan: pengajuan.rows,
                pagination: {
                    total: pengajuan.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(pengajuan.count / limit)
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

// Get pengajuan judul by ID
export const getPengajuanJudulById = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;

        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan, {
            include: [
                { model: Mahasiswa, include: [{ model: ProgramStudi }] },
                { model: Dosen, as: 'Pembimbing1' },
                { model: Dosen, as: 'Pembimbing2' },
                { model: BabSubmission },
                { model: KartuBimbingan },
                { model: LaporanAkhir }
            ]
        });

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        res.status(200).json({
            success: true,
            data: pengajuan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update pengajuan judul (untuk mahasiswa)
export const updatePengajuanJudul = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;
        const { title, description, bidang_topik, keywords } = req.body;

        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan);

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        // Hanya bisa update jika status draft atau revisi
        if (!['draft', 'revisi'].includes(pengajuan.status)) {
            return res.status(400).json({
                success: false,
                message: "Pengajuan tidak dapat diubah"
            });
        }

        await pengajuan.update({
            title,
            description,
            bidang_topik,
            keywords,
            status: 'diajukan'
        });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan,
            type: 'UPDATE_JUDUL',
            description: `Mahasiswa update pengajuan judul: ${title}`
        });

        res.status(200).json({
            success: true,
            message: "Pengajuan judul berhasil diperbarui",
            data: pengajuan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};