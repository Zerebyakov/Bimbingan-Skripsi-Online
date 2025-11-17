import { Op } from "sequelize";
import Arsip from "../models/Arsip.js";
import Dosen from "../models/Dosen.js";
import Mahasiswa from "../models/Mahasiswa.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import ProgramStudi from "../models/ProgramStudi.js";
import BabSubmission from "../models/BabSubmission.js";
import LaporanAkhir from "../models/LaporanAkhir.js";
import KartuBimbingan from "../models/KartuBimbingan.js";
import LogAktivitas from "../models/LogAktivitas.js";
import Notifikasi from "../models/Notifikasi.js";

//  Helper: Truncate message untuk notifikasi
const truncateMessage = (message, maxLength = 250) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength - 3) + '...' : message;
};

//  CREATE ARSIP - Manual atau otomatis
export const createArsip = async (req, res) => {
    try {
        const { id_pengajuan } = req.body;

        if (!id_pengajuan) {
            return res.status(400).json({
                success: false,
                message: "id_pengajuan harus diisi"
            });
        }

        // Cek pengajuan exists
        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan, {
            include: [
                { model: Mahasiswa, include: [{ model: ProgramStudi }] },
                { model: Dosen, as: 'Pembimbing1' },
                { model: Dosen, as: 'Pembimbing2' }
            ]
        });

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        // Cek apakah arsip sudah ada
        const existingArsip = await Arsip.findOne({
            where: { id_pengajuan }
        });

        if (existingArsip) {
            return res.status(400).json({
                success: false,
                message: "Arsip untuk pengajuan ini sudah ada",
                data: existingArsip
            });
        }

        // Validasi: Cek semua bab sudah diterima
        const allBabs = await BabSubmission.findAll({
            where: { id_pengajuan }
        });

        const babDiterima = allBabs.filter(bab => bab.status === 'diterima');

        if (babDiterima.length < 5) {
            return res.status(400).json({
                success: false,
                message: `Semua bab harus diterima terlebih dahulu (${babDiterima.length}/5 bab diterima)`,
                detail: {
                    totalBab: allBabs.length,
                    babDiterima: babDiterima.length,
                    babPending: allBabs.filter(b => b.status === 'menunggu').length,
                    babRevisi: allBabs.filter(b => b.status === 'revisi').length
                }
            });
        }

        // Validasi: Cek laporan akhir sudah diterima
        const laporanAkhir = await LaporanAkhir.findOne({
            where: {
                id_pengajuan,
                status: 'diterima'
            }
        });

        if (!laporanAkhir) {
            return res.status(400).json({
                success: false,
                message: "Laporan akhir belum diterima oleh dosen pembimbing"
            });
        }

        // Ambil data kartu bimbingan (opsional)
        const kartuBimbingan = await KartuBimbingan.findOne({
            where: { id_pengajuan }
        });

        if (!kartuBimbingan) {
            console.warn(`Kartu bimbingan tidak ditemukan untuk pengajuan ${id_pengajuan}`);
        }

        // Create arsip
        const arsip = await Arsip.create({
            id_pengajuan,
            tanggalSelesai: new Date(),
            status: 'SELESAI',
            fileFinal: laporanAkhir.finalFile || null,
            kartuBimbinganFile: kartuBimbingan?.nomorKartu || null
        });

        // Log aktivitas
        try {
            await LogAktivitas.create({
                id_user: req.session?.userId || null,
                id_pengajuan,
                type: 'ARSIP_CREATED',
                description: truncateMessage(`Skripsi dengan judul "${pengajuan.title}" berhasil diarsipkan`, 500)
            });
        } catch (logError) {
            console.error('Error creating log:', logError);
        }

        // Notifikasi ke mahasiswa
        try {
            if (pengajuan.Mahasiswa) {
                await Notifikasi.create({
                    id_user: pengajuan.Mahasiswa.id_user,
                    type: 'ARSIP_CREATED',
                    message: truncateMessage('Selamat! Skripsi Anda telah selesai dan masuk ke arsip', 250)
                });
            }
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
        }

        // Reload dengan relasi lengkap
        await arsip.reload({
            include: [{
                model: PengajuanJudul,
                include: [
                    { model: Mahasiswa, include: [{ model: ProgramStudi }] },
                    { model: Dosen, as: 'Pembimbing1' },
                    { model: Dosen, as: 'Pembimbing2' }
                ]
            }]
        });

        res.status(201).json({
            success: true,
            message: "Arsip berhasil dibuat",
            data: arsip
        });

    } catch (error) {
        console.error('Error in createArsip:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  GET ALL ARSIP - dengan filter dan pagination
export const getAllArsip = async (req, res) => {
    try {
        const { tahun, status, prodi, page = 1, limit = 10 } = req.query;

        const whereCondition = {};

        // Filter berdasarkan tahun
        if (tahun) {
            whereCondition.tanggalSelesai = {
                [Op.between]: [
                    new Date(`${tahun}-01-01`),
                    new Date(`${tahun}-12-31 23:59:59`)
                ]
            };
        }

        // Filter berdasarkan status
        if (status) {
            whereCondition.status = status.toUpperCase();
        }

        // Filter berdasarkan program studi
        const pengajuanWhere = {};
        if (prodi) {
            // Akan difilter di include
        }

        const arsip = await Arsip.findAndCountAll({
            where: whereCondition,
            include: [{
                model: PengajuanJudul,
                where: pengajuanWhere,
                include: [
                    {
                        model: Mahasiswa,
                        include: [{
                            model: ProgramStudi,
                            ...(prodi && { where: { id_prodi: prodi } })
                        }]
                    },
                    {
                        model: Dosen,
                        as: 'Pembimbing1',
                        attributes: ['id_dosen', 'nama', 'gelar', 'nidn']
                    },
                    {
                        model: Dosen,
                        as: 'Pembimbing2',
                        attributes: ['id_dosen', 'nama', 'gelar', 'nidn']
                    }
                ]
            }],
            order: [['tanggalSelesai', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            distinct: true
        });

        res.status(200).json({
            success: true,
            message: "Data arsip berhasil diambil",
            data: {
                arsip: arsip.rows,
                pagination: {
                    total: arsip.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(arsip.count / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllArsip:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  GET ARSIP BY ID
export const getArsipById = async (req, res) => {
    try {
        const { id_arsip } = req.params;

        const arsip = await Arsip.findByPk(id_arsip, {
            include: [{
                model: PengajuanJudul,
                include: [
                    {
                        model: Mahasiswa,
                        include: [{ model: ProgramStudi }]
                    },
                    {
                        model: Dosen,
                        as: 'Pembimbing1',
                        attributes: ['id_dosen', 'nama', 'gelar', 'nidn']
                    },
                    {
                        model: Dosen,
                        as: 'Pembimbing2',
                        attributes: ['id_dosen', 'nama', 'gelar', 'nidn']
                    },
                    {
                        model: BabSubmission,
                        order: [['chapter_number', 'ASC']]
                    }
                ]
            }]
        });

        if (!arsip) {
            return res.status(404).json({
                success: false,
                message: "Arsip tidak ditemukan"
            });
        }

        res.status(200).json({
            success: true,
            message: "Data arsip berhasil diambil",
            data: arsip
        });
    } catch (error) {
        console.error('Error in getArsipById:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  UPDATE ARSIP - untuk admin
export const updateArsip = async (req, res) => {
    try {
        const { id_arsip } = req.params;
        const { status, fileFinal, kartuBimbinganFile, tanggalSelesai } = req.body;

        const arsip = await Arsip.findByPk(id_arsip);

        if (!arsip) {
            return res.status(404).json({
                success: false,
                message: "Arsip tidak ditemukan"
            });
        }

        // Validasi status jika diubah
        const validStatuses = ['SELESAI', 'LULUS', 'REVISI_ULANG'];
        if (status && !validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: "Status tidak valid. Gunakan: SELESAI, LULUS, atau REVISI_ULANG"
            });
        }

        // Update data
        const updateData = {};
        if (status) updateData.status = status.toUpperCase();
        if (fileFinal) updateData.fileFinal = fileFinal;
        if (kartuBimbinganFile) updateData.kartuBimbinganFile = kartuBimbinganFile;
        if (tanggalSelesai) updateData.tanggalSelesai = new Date(tanggalSelesai);

        await arsip.update(updateData);

        // Log aktivitas
        try {
            await LogAktivitas.create({
                id_user: req.session?.userId || null,
                id_pengajuan: arsip.id_pengajuan,
                type: 'ARSIP_UPDATED',
                description: truncateMessage(`Admin mengupdate arsip dengan status: ${status || 'data lainnya'}`, 500)
            });
        } catch (logError) {
            console.error('Error creating log:', logError);
        }

        // Reload dengan relasi
        await arsip.reload({
            include: [{
                model: PengajuanJudul,
                include: [
                    { model: Mahasiswa, include: [{ model: ProgramStudi }] },
                    { model: Dosen, as: 'Pembimbing1' },
                    { model: Dosen, as: 'Pembimbing2' }
                ]
            }]
        });

        res.status(200).json({
            success: true,
            message: "Arsip berhasil diupdate",
            data: arsip
        });
    } catch (error) {
        console.error('Error in updateArsip:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  DELETE ARSIP
export const deleteArsip = async (req, res) => {
    try {
        const { id_arsip } = req.params;

        const arsip = await Arsip.findByPk(id_arsip, {
            include: [{
                model: PengajuanJudul,
                include: [{ model: Mahasiswa }]
            }]
        });

        if (!arsip) {
            return res.status(404).json({
                success: false,
                message: "Arsip tidak ditemukan"
            });
        }

        // Simpan info untuk log sebelum dihapus
        const pengajuanId = arsip.id_pengajuan;
        const judulSkripsi = arsip.PengajuanJudul?.title || 'Unknown';

        await arsip.destroy();

        // Log aktivitas
        try {
            await LogAktivitas.create({
                id_user: req.session?.userId || null,
                id_pengajuan: pengajuanId,
                type: 'ARSIP_DELETED',
                description: truncateMessage(`Admin menghapus arsip: ${judulSkripsi}`, 500)
            });
        } catch (logError) {
            console.error('Error creating log:', logError);
        }

        res.status(200).json({
            success: true,
            message: "Arsip berhasil dihapus",
            data: {
                id_arsip,
                judul: judulSkripsi
            }
        });
    } catch (error) {
        console.error('Error in deleteArsip:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  EXPORT ARSIP - JSON atau Excel
export const exportArsip = async (req, res) => {
    try {
        const { format = 'json', tahun, status } = req.query;

        const whereCondition = {};

        if (tahun) {
            whereCondition.tanggalSelesai = {
                [Op.between]: [
                    new Date(`${tahun}-01-01`),
                    new Date(`${tahun}-12-31 23:59:59`)
                ]
            };
        }

        if (status) {
            whereCondition.status = status.toUpperCase();
        }

        const arsip = await Arsip.findAll({
            where: whereCondition,
            include: [{
                model: PengajuanJudul,
                include: [
                    {
                        model: Mahasiswa,
                        include: [{ model: ProgramStudi }]
                    },
                    {
                        model: Dosen,
                        as: 'Pembimbing1',
                        attributes: ['nama', 'gelar', 'nidn']
                    },
                    {
                        model: Dosen,
                        as: 'Pembimbing2',
                        attributes: ['nama', 'gelar', 'nidn']
                    }
                ]
            }],
            order: [['tanggalSelesai', 'DESC']]
        });

        if (format === 'excel') {
            // TODO: Implementation for Excel export
            // Gunakan library seperti 'exceljs' atau 'xlsx'
            return res.status(200).json({
                success: true,
                message: "Excel export feature coming soon",
                data: {
                    totalRecords: arsip.length,
                    format: 'excel'
                }
            });
        }

        // Default: JSON format
        res.status(200).json({
            success: true,
            message: "Export berhasil",
            data: {
                totalRecords: arsip.length,
                exportDate: new Date(),
                filters: { tahun, status },
                arsip: arsip
            }
        });
    } catch (error) {
        console.error('Error in exportArsip:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  GET STATISTICS - Dashboard admin
export const getArsipStatistics = async (req, res) => {
    try {
        const { tahun } = req.query;
        const currentYear = new Date().getFullYear();
        const filterYear = tahun || currentYear;

        // Total arsip per status
        const totalSelesai = await Arsip.count({
            where: { status: 'SELESAI' }
        });

        const totalLulus = await Arsip.count({
            where: { status: 'LULUS' }
        });

        const totalRevisi = await Arsip.count({
            where: { status: 'REVISI_ULANG' }
        });

        // Total arsip per tahun
        const arsipPerTahun = await Arsip.count({
            where: {
                tanggalSelesai: {
                    [Op.between]: [
                        new Date(`${filterYear}-01-01`),
                        new Date(`${filterYear}-12-31 23:59:59`)
                    ]
                }
            }
        });

        // Arsip per bulan (tahun tertentu)
        const arsipPerBulan = [];
        for (let month = 1; month <= 12; month++) {
            const count = await Arsip.count({
                where: {
                    tanggalSelesai: {
                        [Op.between]: [
                            new Date(`${filterYear}-${month.toString().padStart(2, '0')}-01`),
                            new Date(`${filterYear}-${month.toString().padStart(2, '0')}-31 23:59:59`)
                        ]
                    }
                }
            });
            arsipPerBulan.push({
                month,
                monthName: new Date(filterYear, month - 1).toLocaleString('id-ID', { month: 'long' }),
                count
            });
        }

        res.status(200).json({
            success: true,
            message: "Statistik arsip berhasil diambil",
            data: {
                year: filterYear,
                totalAll: totalSelesai + totalLulus + totalRevisi,
                byStatus: {
                    selesai: totalSelesai,
                    lulus: totalLulus,
                    revisiUlang: totalRevisi
                },
                byYear: arsipPerTahun,
                byMonth: arsipPerBulan
            }
        });
    } catch (error) {
        console.error('Error in getArsipStatistics:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};