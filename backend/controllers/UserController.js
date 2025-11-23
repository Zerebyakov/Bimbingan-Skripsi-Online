import argon2 from 'argon2'
import User from '../models/User.js';
import Dosen from '../models/Dosen.js';
import Mahasiswa from '../models/Mahasiswa.js';
import ProgramStudi from '../models/ProgramStudi.js';
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL

// Helper hapus file lama
const deleteOldFile = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
        console.error("Gagal hapus file lama:", err.message);
    }
};

// Helper ubah path file ke URL publik
const fileToUrl = (filePath) => {
    if (!filePath) return null;
    return `${BASE_URL}/${filePath.replace(/\\/g, "/")}`;
};


const formatUserData = (user, role) => {
    const data = user.toJSON();
    if (role === "mahasiswa" && data.Mahasiswa) {
        data.Mahasiswa.foto = fileToUrl(data.Mahasiswa.foto);
    }
    // ✅ FIXED: Ubah Dosens[0] → Dosen (singular)
    if (role === "dosen" && data.Dosen) {
        data.Dosen.foto = fileToUrl(data.Dosen.foto);
    }
    return data;
};

// Login user (Admin, Dosen, Mahasiswa)
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email },
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

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah"
            });
        }

        const validPassword = await argon2.verify(user.password, password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Email atau password salah"
            });
        }

        if (user.status !== 'aktif') {
            return res.status(401).json({
                success: false,
                message: "Akun tidak aktif"
            });
        }

        // Set session
        req.session.userId = user.id_user;
        req.session.email = user.email;
        req.session.role = user.role;

        // ✅ FIXED: Ubah Dosens[0] → Dosen (singular)
        res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: {
                id_user: user.id_user,
                email: user.email,
                role: user.role,
                profile: user.role === 'dosen' ? user.Dosen : user.role === 'mahasiswa' ? user.Mahasiswa : null
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

// Logout user
export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Gagal logout"
            });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({
            success: true,
            message: "Logout berhasil"
        });
    });
};

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const role = req.session.role;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Silakan login terlebih dahulu" });
        }

        const user = await User.findByPk(userId, {
            attributes: ["id_user", "email", "role", "status"],
            include: [
                { model: Dosen, include: [{ model: ProgramStudi }] },
                { model: Mahasiswa, include: [{ model: ProgramStudi }] },
            ],
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        const formattedData = formatUserData(user, role);

        res.status(200).json({
            success: true,
            data: formattedData,
        });
    } catch (error) {
        console.error("getProfile error:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data profil",
            error: error.message,
        });
    }
};

// Update password
export const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const user = await User.findByPk(req.session.userId);

        const validPassword = await argon2.verify(user.password, oldPassword);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: "Password lama salah"
            });
        }

        const hashPassword = await argon2.hash(newPassword);
        await user.update({ password: hashPassword });

        res.status(200).json({
            success: true,
            message: "Password berhasil diubah"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const role = req.session.role;

        const user = await User.findByPk(userId, {
            include: [
                { model: Dosen, include: [{ model: ProgramStudi }] },
                { model: Mahasiswa, include: [{ model: ProgramStudi }] },
            ],
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        const uploadedFile = req.file ? req.file.path.replace(/\\/g, "/") : null;
        const { email } = req.body;

        // Cegah email duplikat
        if (email && email !== user.email) {
            const existing = await User.findOne({ where: { email } });
            if (existing && existing.id_user !== userId) {
                return res.status(400).json({ success: false, message: "Email sudah digunakan" });
            }
            await user.update({ email });
        }

        // ==================== ADMIN ====================
        if (role === "admin") {
            return res.status(200).json({
                success: true,
                message: "Profil admin berhasil diperbarui",
                data: formatUserData(user, role),
            });
        }

        // ==================== DOSEN ====================
        if (role === "dosen") {
            const {
                nama,
                gelar,
                bidang_keahlian,
                jabatan_akademik,
                kontak,
                email_institusi,
            } = req.body;
            // ✅ FIXED: Ubah Dosens[0] → Dosen (singular)
            const dosen = user.Dosen;

            if (dosen) {
                const updateData = { nama, gelar, bidang_keahlian, jabatan_akademik, kontak, email_institusi };
                if (uploadedFile) {
                    if (dosen.foto) deleteOldFile(dosen.foto);
                    updateData.foto = uploadedFile;
                }
                await dosen.update(updateData);
            }
        }

        // ==================== MAHASISWA ====================
        if (role === "mahasiswa") {
            const { nama_lengkap, kontak, email_kampus } = req.body;
            const mahasiswa = user.Mahasiswa;

            if (mahasiswa) {
                const updateData = { nama_lengkap, kontak, email_kampus };
                if (uploadedFile) {
                    if (mahasiswa.foto) deleteOldFile(mahasiswa.foto);
                    updateData.foto = uploadedFile;
                }
                await mahasiswa.update(updateData);
            }
        }

        // Ambil data terbaru
        const updated = await User.findByPk(userId, {
            attributes: ["id_user", "email", "role", "status"],
            include: [
                { model: Dosen, include: [{ model: ProgramStudi }] },
                { model: Mahasiswa, include: [{ model: ProgramStudi }] },
            ],
        });

        res.status(200).json({
            success: true,
            message: "Profil berhasil diperbarui",
            data: formatUserData(updated, role),
        });
    } catch (error) {
        if (req.file) deleteOldFile(req.file.path);
        console.error("updateProfile error:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat memperbarui profil",
            error: error.message,
        });
    }
};