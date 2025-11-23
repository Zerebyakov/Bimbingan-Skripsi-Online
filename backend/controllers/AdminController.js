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
import PeriodeSkripsi from "../models/PeriodeSkripsi.js";


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
        const periodeAktif = await PeriodeSkripsi.findOne({
            where: { isActive: true }
        });

        if (!periodeAktif) {
            return res.status(404).json({
                success: false,
                message: "Tidak ada periode aktif. Silakan buat periode baru."
            });
        }

        res.status(200).json({
            success: true,
            data: periodeAktif
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
        const { id_periode } = req.params; // Atau bisa auto-detect periode aktif
        const {
            tahun_akademik,
            kuotaPerDosen,
            formatNomorKartu,
            tanggalMulaiBimbingan,
            tanggalSelesaiBimbingan
        } = req.body;

        let periode = await PeriodeSkripsi.findOne({
            where: { isActive: true }
        });

        if (!periode) {
            return res.status(404).json({
                success: false,
                message: "Tidak ada periode aktif"
            });
        }

        await periode.update({
            tahun_akademik,
            kuotaPerDosen,
            formatNomorKartu,
            tanggalMulaiBimbingan,
            tanggalSelesaiBimbingan
        });

        res.status(200).json({
            success: true,
            message: "Konfigurasi periode berhasil diperbarui",
            data: periode
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

//Update User
export const updateUser = async (req, res) => {
    try {
        const { id_user } = req.params;
        const { email, password, status, profileData } = req.body;

        // Cari user
        const user = await User.findByPk(id_user);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Cek apakah user sedang login (tidak boleh ubah role atau hapus diri sendiri)
        if (user.id_user === req.session.userId && user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: "Tidak dapat mengubah data admin yang sedang login"
            });
        }

        // Validasi email jika diubah
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({
                where: {
                    email: email.trim(),
                    id_user: { [Op.ne]: id_user }
                },
                paranoid: false // Cek termasuk yang sudah dihapus
            });

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Email sudah digunakan oleh user lain"
                });
            }
        }

        // Prepare data untuk update User
        const updateData = {};
        if (email) updateData.email = email.trim();
        if (status && ['aktif', 'nonaktif'].includes(status)) {
            updateData.status = status;
        }
        if (password) {
            updateData.password = await argon2.hash(password);
        }

        // Update user
        await user.update(updateData);

        // Update profile berdasarkan role
        if (profileData) {
            if (user.role === 'dosen') {
                const dosen = await Dosen.findOne({ where: { id_user } });
                if (dosen) {
                    // Validasi NIDN jika diubah
                    if (profileData.nidn && profileData.nidn !== dosen.nidn) {
                        const existingNidn = await Dosen.findOne({
                            where: {
                                nidn: profileData.nidn,
                                id_dosen: { [Op.ne]: dosen.id_dosen }
                            }
                        });
                        if (existingNidn) {
                            return res.status(400).json({
                                success: false,
                                message: "NIDN sudah digunakan dosen lain"
                            });
                        }
                    }
                    await dosen.update(profileData);
                }
            } else if (user.role === 'mahasiswa') {
                const mahasiswa = await Mahasiswa.findOne({ where: { id_user } });
                if (mahasiswa) {
                    // Validasi NIM jika diubah
                    if (profileData.nim && profileData.nim !== mahasiswa.nim) {
                        const existingNim = await Mahasiswa.findOne({
                            where: {
                                nim: profileData.nim,
                                id_mahasiswa: { [Op.ne]: mahasiswa.id_mahasiswa }
                            }
                        });
                        if (existingNim) {
                            return res.status(400).json({
                                success: false,
                                message: "NIM sudah digunakan mahasiswa lain"
                            });
                        }
                    }
                    await mahasiswa.update(profileData);
                }
            }
        }

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            type: 'UPDATE_USER',
            description: `Admin update user ${user.email}`
        });

        // Get updated user dengan relasi lengkap
        const updatedUser = await User.findByPk(id_user, {
            include: [
                {
                    model: Dosen,
                    include: [{ model: ProgramStudi }]
                },
                {
                    model: Mahasiswa,
                    include: [{ model: ProgramStudi }]
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: "User berhasil diperbarui",
            data: updatedUser
        });
    } catch (error) {
        console.error('Error in updateUser:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id_user } = req.params;

        const user = await User.findByPk(id_user, {
            include: [
                { model: Dosen, required: false },
                { model: Mahasiswa, required: false }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Tidak boleh hapus admin yang sedang login
        if (user.role === 'admin' && user.id_user === req.session.userId) {
            return res.status(400).json({
                success: false,
                message: "Tidak dapat menghapus akun admin yang sedang login"
            });
        }

        // Simpan data untuk log sebelum dihapus
        const userEmail = user.email;
        const userRole = user.role;

        // Hapus profile terlebih dahulu (karena foreign key constraint)
        if (user.role === 'dosen' && user.Dosen) {
            await user.Dosen.destroy();
        } else if (user.role === 'mahasiswa' && user.Mahasiswa) {
            await user.Mahasiswa.destroy();
        }

        // Hard delete user
        await user.destroy();

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            type: 'DELETE_USER',
            description: `Admin menghapus user ${userEmail} (${userRole})`
        });

        res.status(200).json({
            success: true,
            message: "User berhasil dihapus"
        });
    } catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


export const toggleUserStatus = async (req, res) => {
    try {
        const { id_user } = req.params;

        const user = await User.findByPk(id_user, {
            include: [
                { model: Dosen, required: false },
                { model: Mahasiswa, required: false }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Tidak boleh toggle status admin yang sedang login
        if (user.role === 'admin' && user.id_user === req.session.userId) {
            return res.status(400).json({
                success: false,
                message: "Tidak dapat mengubah status admin yang sedang login"
            });
        }

        // Toggle status
        const newStatus = user.status === 'aktif' ? 'nonaktif' : 'aktif';
        await user.update({ status: newStatus });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            type: 'TOGGLE_USER_STATUS',
            description: `Admin ubah status user ${user.email} menjadi ${newStatus}`
        });

        res.status(200).json({
            success: true,
            message: `Status user berhasil diubah menjadi ${newStatus}`,
            data: {
                id_user: user.id_user,
                email: user.email,
                role: user.role,
                status: newStatus
            }
        });
    } catch (error) {
        console.error('Error in toggleUserStatus:', error);
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
        const { dosenId1, dosenId2 } = req.body;

        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan);
        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        await pengajuan.update({
            dosenId1,
            dosenId2: dosenId2 || null
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


// Get All Dosen with Pagination
export const getAllDosen = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            status_dosen = '',
            prodi_id = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const offset = (pageNumber - 1) * limitNumber;

        // Build where clause untuk Dosen
        const dosenWhere = {};

        // Filter search (nama atau NIDN)
        if (search && search.trim() !== '') {
            dosenWhere[Op.or] = [
                { nama: { [Op.like]: `%${search.trim()}%` } },
                { nidn: { [Op.like]: `%${search.trim()}%` } }
            ];
        }

        // Filter status dosen
        if (status_dosen && ['tetap', 'luar biasa'].includes(status_dosen)) {
            dosenWhere.status_dosen = status_dosen;
        }

        // Filter prodi
        if (prodi_id && !isNaN(prodi_id)) {
            dosenWhere.prodi_id = parseInt(prodi_id);
        }

        // Build where clause untuk User
        const userWhere = { role: 'dosen' };

        // Filter status user
        if (status && ['aktif', 'nonaktif'].includes(status)) {
            userWhere.status = status;
        }

        // Query utama
        const { count, rows } = await Dosen.findAndCountAll({
            where: dosenWhere,
            include: [
                {
                    model: User,
                    attributes: ['id_user', 'email', 'role', 'status', 'createdAt'],
                    where: userWhere,
                    required: true
                },
                {
                    model: ProgramStudi,
                    attributes: ['prodi_id', 'kode_prodi', 'program_studi'],
                    required: false
                }
            ],
            limit: limitNumber,
            offset: offset,
            order: [[sortBy, sortOrder]],
            distinct: true
        });

        const totalPages = Math.ceil(count / limitNumber);

        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        });
    } catch (error) {
        console.error('Error in getAllDosen:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get All Mahasiswa with Pagination
export const getAllMahasiswa = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            status_akademik = '',
            prodi_id = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const offset = (pageNumber - 1) * limitNumber;

        // Build where clause untuk Mahasiswa
        const mahasiswaWhere = {};

        // Filter search (nama atau NIM)
        if (search && search.trim() !== '') {
            mahasiswaWhere[Op.or] = [
                { nama_lengkap: { [Op.like]: `%${search.trim()}%` } },
                { nim: { [Op.like]: `%${search.trim()}%` } }
            ];
        }

        // Filter status akademik
        if (status_akademik && ['aktif', 'cuti', 'lulus'].includes(status_akademik)) {
            mahasiswaWhere.status_akademik = status_akademik;
        }

        // Filter prodi
        if (prodi_id && !isNaN(prodi_id)) {
            mahasiswaWhere.prodi_id = parseInt(prodi_id);
        }

        // Build where clause untuk User
        const userWhere = { role: 'mahasiswa' };

        // Filter status user
        if (status && ['aktif', 'nonaktif'].includes(status)) {
            userWhere.status = status;
        }

        // Query utama
        const { count, rows } = await Mahasiswa.findAndCountAll({
            where: mahasiswaWhere,
            include: [
                {
                    model: User,
                    attributes: ['id_user', 'email', 'role', 'status', 'createdAt'],
                    where: userWhere,
                    required: true
                },
                {
                    model: ProgramStudi,
                    attributes: ['prodi_id', 'kode_prodi', 'program_studi'],
                    required: false
                }
            ],
            limit: limitNumber,
            offset: offset,
            order: [[sortBy, sortOrder]],
            distinct: true
        });

        const totalPages = Math.ceil(count / limitNumber);

        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        });
    } catch (error) {
        console.error('Error in getAllMahasiswa:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};