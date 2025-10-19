import argon2 from 'argon2'
import User from '../models/User.js';
import Dosen from '../models/Dosen.js';
import Mahasiswa from '../models/Mahasiswa.js';
import ProgramStudi from '../models/ProgramStudi.js';





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

        res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: {
                id_user: user.id_user,
                email: user.email,
                role: user.role,
                profile: user.role === 'dosen' ? user.Dosens[0] : user.role === 'mahasiswa' ? user.Mahasiswa : null
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
        const user = await User.findByPk(req.session.userId, {
            attributes: ['id_user', 'email', 'role', 'status'],
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
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        res.status(200).json({
            success: true,
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
        const userRole = req.session.role;

        // Cari user berdasarkan ID
        const user = await User.findByPk(userId, {
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
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        // Update berdasarkan role
        if (userRole === 'admin') {
            // Admin hanya bisa update email di tabel User
            const { email } = req.body;

            if (email && email !== user.email) {
                // Cek apakah email sudah digunakan
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser && existingUser.id_user !== userId) {
                    return res.status(400).json({
                        success: false,
                        message: "Email sudah digunakan"
                    });
                }
                await user.update({ email });
            }

            const updatedUser = await User.findByPk(userId, {
                attributes: ['id_user', 'email', 'role', 'status']
            });

            return res.status(200).json({
                success: true,
                message: "Profil berhasil diperbarui",
                data: updatedUser
            });

        } else if (userRole === 'dosen') {
            // Dosen bisa update email dan data profil dosen
            const {
                email,
                nama,
                gelar,
                bidang_keahlian,
                jabatan_akademik,
                kontak,
                email_institusi,
                foto
            } = req.body;

            // Update email di tabel User jika ada perubahan
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser && existingUser.id_user !== userId) {
                    return res.status(400).json({
                        success: false,
                        message: "Email sudah digunakan"
                    });
                }
                await user.update({ email });
            }

            // Update data dosen
            const dosen = user.Dosens[0];
            if (dosen) {
                const updateData = {};
                if (nama) updateData.nama = nama;
                if (gelar) updateData.gelar = gelar;
                if (bidang_keahlian) updateData.bidang_keahlian = bidang_keahlian;
                if (jabatan_akademik) updateData.jabatan_akademik = jabatan_akademik;
                if (kontak) updateData.kontak = kontak;
                if (email_institusi) updateData.email_institusi = email_institusi;
                if (foto !== undefined) updateData.foto = foto;

                await dosen.update(updateData);
            }

            const updatedUser = await User.findByPk(userId, {
                attributes: ['id_user', 'email', 'role', 'status'],
                include: [
                    {
                        model: Dosen,
                        include: [{ model: ProgramStudi }]
                    }
                ]
            });

            return res.status(200).json({
                success: true,
                message: "Profil berhasil diperbarui",
                data: updatedUser
            });

        } else if (userRole === 'mahasiswa') {
            // Mahasiswa bisa update email dan data profil mahasiswa
            const {
                email,
                nama_lengkap,
                kontak,
                email_kampus,
                foto
            } = req.body;

            // Update email di tabel User jika ada perubahan
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser && existingUser.id_user !== userId) {
                    return res.status(400).json({
                        success: false,
                        message: "Email sudah digunakan"
                    });
                }
                await user.update({ email });
            }

            // Update data mahasiswa
            const mahasiswa = user.Mahasiswa;
            if (mahasiswa) {
                const updateData = {};
                if (nama_lengkap) updateData.nama_lengkap = nama_lengkap;
                if (kontak) updateData.kontak = kontak;
                if (email_kampus) updateData.email_kampus = email_kampus;
                if (foto !== undefined) updateData.foto = foto;

                await mahasiswa.update(updateData);
            }

            const updatedUser = await User.findByPk(userId, {
                attributes: ['id_user', 'email', 'role', 'status'],
                include: [
                    {
                        model: Mahasiswa,
                        include: [{ model: ProgramStudi }]
                    }
                ]
            });

            return res.status(200).json({
                success: true,
                message: "Profil berhasil diperbarui",
                data: updatedUser
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
