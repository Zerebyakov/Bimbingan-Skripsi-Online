import PeriodeSkripsi from "../models/PeriodeSkripsi.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import LogAktivitas from "../models/LogAktivitas.js";
import { Op } from "sequelize";
import db from "../config/Database.js";

// Get all periode skripsi dengan filter dan pagination
export const getAllPeriode = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            tahun_akademik,
            semester,
            isActive
        } = req.query;

        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause = {};
        if (tahun_akademik) whereClause.tahun_akademik = tahun_akademik;
        if (semester) whereClause.semester = semester;
        if (isActive !== undefined) whereClause.isActive = isActive === 'true';

        const { count, rows } = await PeriodeSkripsi.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['tahun_akademik', 'DESC'], ['semester', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: {
                periode: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
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

// Get periode aktif
export const getPeriodeAktif = async (req, res) => {
    try {
        const periodeAktif = await PeriodeSkripsi.findOne({
            where: { isActive: true }
        });

        if (!periodeAktif) {
            return res.status(404).json({
                success: false,
                message: "Tidak ada periode aktif saat ini"
            });
        }

        // Get statistik periode aktif
        const totalPengajuan = await PengajuanJudul.count({
            where: { id_periode: periodeAktif.id_periode }
        });

        res.status(200).json({
            success: true,
            data: {
                periode: periodeAktif,
                statistik: {
                    totalPengajuan
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

// Get periode by ID dengan statistik
export const getPeriodeById = async (req, res) => {
    try {
        const { id_periode } = req.params;

        const periode = await PeriodeSkripsi.findByPk(id_periode);

        if (!periode) {
            return res.status(404).json({
                success: false,
                message: "Periode tidak ditemukan"
            });
        }

        // Get statistik periode
        const pengajuanStats = await PengajuanJudul.findAll({
            where: { id_periode },
            attributes: [
                'status',
                [db.fn('COUNT', db.col('id_pengajuan')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const totalPengajuan = await PengajuanJudul.count({
            where: { id_periode }
        });

        res.status(200).json({
            success: true,
            data: {
                periode,
                statistik: {
                    totalPengajuan,
                    byStatus: pengajuanStats
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

// Create periode baru
export const createPeriode = async (req, res) => {
    const transaction = await db.transaction();

    try {
        const {
            tahun_akademik,
            semester,
            isActive,
            kuotaPerDosen,
            formatNomorKartu,
            tanggalMulaiBimbingan,
            tanggalSelesaiBimbingan
        } = req.body;

        // Validasi
        if (!tahun_akademik || !semester) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Tahun akademik dan semester wajib diisi"
            });
        }

        // Cek apakah periode dengan tahun dan semester yang sama sudah ada
        const existingPeriode = await PeriodeSkripsi.findOne({
            where: { tahun_akademik, semester }
        });

        if (existingPeriode) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Periode ${tahun_akademik} semester ${semester} sudah ada`
            });
        }

        // Jika isActive = true, nonaktifkan periode lain
        if (isActive) {
            await PeriodeSkripsi.update(
                { isActive: false },
                { where: { isActive: true }, transaction }
            );
        }

        // Create periode baru dengan konfigurasi
        const newPeriode = await PeriodeSkripsi.create({
            tahun_akademik,
            semester,
            isActive: isActive || false,
            kuotaPerDosen: kuotaPerDosen || 10,
            formatNomorKartu: formatNomorKartu || 'KB-',
            tanggalMulaiBimbingan,
            tanggalSelesaiBimbingan
        }, { transaction });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            type: 'CREATE_PERIODE',
            description: `Membuat periode baru: ${tahun_akademik} semester ${semester}`
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: "Periode skripsi berhasil dibuat",
            data: newPeriode
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update periode
export const updatePeriode = async (req, res) => {
    const transaction = await db.transaction();

    try {
        const { id_periode } = req.params;
        const { tahun_akademik, semester, isActive } = req.body;

        const periode = await PeriodeSkripsi.findByPk(id_periode);

        if (!periode) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Periode tidak ditemukan"
            });
        }

        // Cek duplikasi jika tahun_akademik atau semester diubah
        if (tahun_akademik || semester) {
            const duplicatePeriode = await PeriodeSkripsi.findOne({
                where: {
                    id_periode: { [Op.ne]: id_periode },
                    tahun_akademik: tahun_akademik || periode.tahun_akademik,
                    semester: semester || periode.semester
                }
            });

            if (duplicatePeriode) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Periode dengan tahun akademik dan semester tersebut sudah ada"
                });
            }
        }

        // Jika isActive = true, nonaktifkan periode lain
        if (isActive === true) {
            await PeriodeSkripsi.update(
                { isActive: false },
                {
                    where: {
                        isActive: true,
                        id_periode: { [Op.ne]: id_periode }
                    },
                    transaction
                }
            );
        }

        // Update periode
        await periode.update({
            tahun_akademik: tahun_akademik || periode.tahun_akademik,
            semester: semester || periode.semester,
            isActive: isActive !== undefined ? isActive : periode.isActive
        }, { transaction });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            type: 'UPDATE_PERIODE',
            description: `Update periode: ${periode.tahun_akademik} semester ${periode.semester}`
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: "Periode berhasil diperbarui",
            data: periode
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Activate/Deactivate periode
export const togglePeriodeStatus = async (req, res) => {
    const transaction = await db.transaction();

    try {
        const { id_periode } = req.params;

        const periode = await PeriodeSkripsi.findByPk(id_periode);

        if (!periode) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Periode tidak ditemukan"
            });
        }

        // Jika akan diaktifkan, nonaktifkan periode lain
        if (!periode.isActive) {
            await PeriodeSkripsi.update(
                { isActive: false },
                {
                    where: {
                        isActive: true,
                        id_periode: { [Op.ne]: id_periode }
                    },
                    transaction
                }
            );
        }

        // Toggle status
        await periode.update({
            isActive: !periode.isActive
        }, { transaction });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            type: periode.isActive ? 'ACTIVATE_PERIODE' : 'DEACTIVATE_PERIODE',
            description: `${periode.isActive ? 'Mengaktifkan' : 'Menonaktifkan'} periode: ${periode.tahun_akademik} semester ${periode.semester}`
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: `Periode berhasil ${periode.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
            data: periode
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete periode
export const deletePeriode = async (req, res) => {
    const transaction = await db.transaction();

    try {
        const { id_periode } = req.params;

        const periode = await PeriodeSkripsi.findByPk(id_periode);

        if (!periode) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Periode tidak ditemukan"
            });
        }

        // Cek apakah ada pengajuan yang terkait
        const jumlahPengajuan = await PengajuanJudul.count({
            where: { id_periode }
        });

        if (jumlahPengajuan > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Tidak dapat menghapus periode. Terdapat ${jumlahPengajuan} pengajuan yang terkait dengan periode ini`
            });
        }

        // Log aktivitas sebelum delete
        await LogAktivitas.create({
            id_user: req.session.userId,
            type: 'DELETE_PERIODE',
            description: `Menghapus periode: ${periode.tahun_akademik} semester ${periode.semester}`
        }, { transaction });

        // Delete periode
        await periode.destroy({ transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: "Periode berhasil dihapus"
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get statistik semua periode
export const getPeriodeStatistics = async (req, res) => {
    try {
        const allPeriode = await PeriodeSkripsi.findAll({
            order: [['tahun_akademik', 'DESC'], ['semester', 'DESC']]
        });

        const statistics = await Promise.all(
            allPeriode.map(async (periode) => {
                const totalPengajuan = await PengajuanJudul.count({
                    where: { id_periode: periode.id_periode }
                });

                const pengajuanDiterima = await PengajuanJudul.count({
                    where: {
                        id_periode: periode.id_periode,
                        status: 'diterima'
                    }
                });

                const pengajuanDitolak = await PengajuanJudul.count({
                    where: {
                        id_periode: periode.id_periode,
                        status: 'ditolak'
                    }
                });

                const pengajuanMenunggu = await PengajuanJudul.count({
                    where: {
                        id_periode: periode.id_periode,
                        status: 'diajukan'
                    }
                });

                return {
                    id_periode: periode.id_periode,
                    tahun_akademik: periode.tahun_akademik,
                    semester: periode.semester,
                    isActive: periode.isActive,
                    totalPengajuan,
                    pengajuanDiterima,
                    pengajuanDitolak,
                    pengajuanMenunggu
                };
            })
        );

        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};