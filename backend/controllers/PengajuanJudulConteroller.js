import { Op } from "sequelize";
import BabSubmission from "../models/BabSubmission.js";
import Dosen from "../models/Dosen.js";
import KartuBimbingan from "../models/KartuBimbingan.js";
import LaporanAkhir from "../models/LaporanAkhir.js";
import LogAktivitas from "../models/LogAktivitas.js";
import Mahasiswa from "../models/Mahasiswa.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import ProgramStudi from "../models/ProgramStudi.js";

import PengajuanSimilarityCheck from "../models/PengajuanSimilarityCheck.js";
import PengajuanSimilarityResult from "../models/PengajuanSimilarityResult.js";
import { checkSimilarityOnly, runAndSaveSimilarityForPengajuan } from "../services/titleSimilarityWorkflow.js";


// Get all pengajuan judul (untuk admin/dosen)
export const getAllPengajuanJudul = async (req, res, next) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;

        const whereCondition = {};

        // Filter by status
        if (status) {
            whereCondition.status = status;
        }

        // Search functionality: satu Op.or gabungan (judul ATAU nama/nim mahasiswa).
        // Kolom relasi memakai sintaks $Model.kolom$; butuh subQuery: false agar bekerja dengan limit.
        if (search) {
            whereCondition[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { bidang_topik: { [Op.like]: `%${search}%` } },
                { '$Mahasiswa.nama_lengkap$': { [Op.like]: `%${search}%` } },
                { '$Mahasiswa.nim$': { [Op.like]: `%${search}%` } },
            ];
        }

        const pengajuan = await PengajuanJudul.findAndCountAll({
            where: whereCondition,
            subQuery: false,
            include: [
                {
                    model: Mahasiswa,
                    include: [{ model: ProgramStudi }]
                },
                {
                    model: Dosen,
                    as: 'Pembimbing1',
                    attributes: ['nama', 'gelar']
                },
                {
                    model: Dosen,
                    as: 'Pembimbing2',
                    attributes: ['nama', 'gelar']
                },
                {
                    model: PengajuanSimilarityCheck,
                    as: "SimilarityChecks",
                    separate: true, // query terpisah agar order berlaku; index [0] = pengecekan terbaru
                    order: [["checkedAt", "DESC"]],
                    include: [
                        {
                            model: PengajuanSimilarityResult,
                            as: "Results",
                            // hanya kolom yang dibutuhkan tampilan admin
                            attributes: [
                                'id_result', 'matched_title', 'similarity_score',
                                'is_similar', 'rank_position', 'source_table',
                                'source_author', 'source_year'
                            ],
                        },
                    ],
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            distinct: true // Penting untuk count yang akurat dengan include
        });

        res.status(200).json({
            success: true,
            data: {
                pengajuan: pengajuan.rows,
                pagination: {
                    total: pengajuan.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(pengajuan.count / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllPengajuanJudul:', error);
        next(error);
    }
};

// Get pengajuan judul by ID
export const getPengajuanJudulById = async (req, res, next) => {
    try {
        const { id_pengajuan } = req.params;

        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan, {
            include: [
                { model: Mahasiswa, include: [{ model: ProgramStudi }] },
                { model: Dosen, as: 'Pembimbing1' },
                { model: Dosen, as: 'Pembimbing2' },
                { model: BabSubmission },
                { model: KartuBimbingan },
                { model: LaporanAkhir },
                {
                    model: PengajuanSimilarityCheck,
                    as: "SimilarityChecks",
                    separate: true, // index [0] = pengecekan terbaru
                    order: [["checkedAt", "DESC"]],
                    include: [
                        {
                            model: PengajuanSimilarityResult,
                            as: "Results",
                        },
                    ],
                }
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
        console.error('Error in getPengajuanJudulById:', error);
        next(error);
    }
};

// Update pengajuan judul (untuk mahasiswa)
export const updatePengajuanJudul = async (req, res, next) => {
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

        // Verifikasi kepemilikan: pengajuan harus milik mahasiswa yang sedang login
        const mahasiswaData = await Mahasiswa.findOne({
            where: { id_user: req.session.userId },
        });

        if (!mahasiswaData || pengajuan.id_mahasiswa !== mahasiswaData.id_mahasiswa) {
            return res.status(403).json({
                success: false,
                message: "Anda tidak memiliki akses ke pengajuan ini"
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

        // Jalankan ulang cek kemiripan agar hasil lama tidak menempel pada judul baru.
        // Kegagalan ML service tidak boleh menggagalkan penyimpanan judul.
        try {
            await runAndSaveSimilarityForPengajuan({ pengajuan, title });
        } catch (similarityError) {
            console.error("Similarity check gagal:", similarityError.message);
        }

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
        console.error('Error in updatePengajuanJudul:', error);
        next(error);
    }
};


export const cekKemiripanJudul = async (req, res, next) => {
    try {
        const { title, topK = 10 } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Judul wajib diisi",
            });
        }

        const result = await checkSimilarityOnly({
            title,
            topK: Number(topK) || 10,
        });

        return res.status(200).json({
            success: true,
            message: "Pengecekan kemiripan judul berhasil",
            data: result,
        });
    } catch (error) {
        console.error("Error in cekKemiripanJudul:", error);
        next(error);
    }
};