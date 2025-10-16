import KonfigurasiSistem from "../models/KonfigurasiSistem.js";
import LogAktivitas from "../models/LogAktivitas.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import Arsip from "../models/Arsip.js";
import { Op } from "sequelize";
import Mahasiswa from "../models/Mahasiswa.js";
import Dosen from "../models/Dosen.js";
import BabSubmission from "../models/BabSubmission.js";
import User from "../models/User.js";
import ProgramStudi from "../models/ProgramStudi.js";
import argon2 from 'argon2'


// Dashboard admin - statistik global
export const getDashboardStats = async (req, res) => {
    try {
        // Statistik pengajuan judul
        const totalPengajuan = await PengajuanJudul.count();
        const pengajuanDiterima = await PengajuanJudul.count({ where: { status: 'diterima' } });
        const pengajuanRevisi = await PengajuanJudul.count({ where: { status: 'revisi' } });
        const pengajuanMenunggu = await PengajuanJudul.count({ where: { status: 'diajukan' } });

        // Statistik mahasiswa
        const totalMahasiswa = await Mahasiswa.count();
        const mahasiswaAktif = await Mahasiswa.count({ where: { status_akademik: 'aktif' } });

        // Statistik dosen
        const totalDosen = await Dosen.count();
        const dosenAktif = await Dosen.count({ where: { status_dosen: 'tetap' } });

        // Statistik arsip
        const totalArsip = await Arsip.count();

        // Progress bimbingan (berdasarkan bab yang diterima)
        const progressData = await PengajuanJudul.findAll({
            where: { status: 'diterima' },
            include: [{
                model: BabSubmission,
                where: { status: 'diterima' },
                required: false
            }]
        });

        // Log aktivitas terbaru
        const recentLogs = await LogAktivitas.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, attributes: ['email', 'role'] }]
        });

        res.status(200).json({
            success: true,
            data: {
                statistics: {
                    totalPengajuan,
                    pengajuanDiterima,
                    pengajuanRevisi,
                    pengajuanMenunggu,
                    totalMahasiswa,
                    mahasiswaAktif,
                    totalDosen,
                    dosenAktif,
                    totalArsip
                },
                progressData,
                recentLogs
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

// Kelola konfigurasi sistem
export const getKonfigurasi = async (req, res) => {
    try {
        const config = await KonfigurasiSistem.findOne();
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const updateKonfigurasi = async (req, res) => {
    try {
        const { tahunAkademikAktif, semesterAktif, kuotaPerDosen, formatNomorKartu } = req.body;

        let config = await KonfigurasiSistem.findOne();

        if (!config) {
            config = await KonfigurasiSistem.create({
                tahunAkademikAktif,
                semesterAktif,
                kuotaPerDosen,
                formatNomorKartu
            });
        } else {
            await config.update({
                tahunAkademikAktif,
                semesterAktif,
                kuotaPerDosen,
                formatNomorKartu
            });
        }

        res.status(200).json({
            success: true,
            message: "Konfigurasi berhasil diperbarui",
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Kelola user (CRUD)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id_user', 'email', 'role', 'status', 'createdAt'],
            include: [
                { model: Dosen, include: [{ model: ProgramStudi }] },
                { model: Mahasiswa, include: [{ model: ProgramStudi }] }
            ]
        });

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const createUser = async (req, res) => {
    try {
        const { email, password, role, profileData } = req.body;

        // Hash password
        const hashPassword = await argon2.hash(password);

        // Create user
        const user = await User.create({
            email,
            password: hashPassword,
            role
        });

        // Create profile based on role
        if (role === 'dosen') {
            await Dosen.create({
                id_user: user.id_user,
                ...profileData
            });
        } else if (role === 'mahasiswa') {
            await Mahasiswa.create({
                id_user: user.id_user,
                ...profileData
            });
        }

        res.status(201).json({
            success: true,
            message: "User berhasil dibuat",
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Assign dosen pembimbing
export const assignDosenPembimbing = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;
        const { dosenId1, dosenId2,dosenId3 } = req.body;

        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan);
        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        await pengajuan.update({
            dosenId1,
            dosenId2: dosenId2 || null,
            dosenId3: dosenId3 || null,
        });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan,
            type: 'ASSIGN_DOSEN',
            description: `Admin assign dosen pembimbing untuk pengajuan ${pengajuan.title}`
        });

        res.status(200).json({
            success: true,
            message: "Dosen pembimbing berhasil ditugaskan"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// Ambil Semua Data Dosen
export const getAllDosen = async (req, res) => {
    try {
        const dosens = await User.findAll({
            attributes: ['id_user', 'email', 'role', 'status', 'createdAt'],
            include: {
                model: Dosen,
                include: [{
                    model: ProgramStudi
                }]
            }
        });
        res.status(200).json({
            success: true,
            data: dosens
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }

}