import BabSubmission from "../models/BabSubmission.js";
import Dosen from "../models/Dosen.js";
import LogAktivitas from "../models/LogAktivitas.js";
import Mahasiswa from "../models/Mahasiswa.js";
import Message from "../models/Message.js";
import Notifikasi from "../models/Notifikasi.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import { Op } from "sequelize";
import User from "../models/User.js";
import LaporanAkhir from "../models/LaporanAkhir.js";

//  Helper function untuk mencegah error "Data too long for column 'message'"
const truncateMessage = (message, maxLength = 250) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength - 3) + '...' : message;
};

//  IMPROVED: Dashboard dosen dengan detail informasi dosen
export const getDosenDashboard = async (req, res) => {
    try {
        const dosenData = await Dosen.findOne({
            where: { id_user: req.session.userId },
            include: [
                {
                    model: User,
                    attributes: ['email', 'role']
                }
            ]
        });

        if (!dosenData) {
            return res.status(404).json({
                success: false,
                message: "Data dosen tidak ditemukan"
            });
        }

        // Statistik bimbingan
        const totalBimbingan = await PengajuanJudul.count({
            where: {
                [Op.or]: [
                    { dosenId1: dosenData.id_dosen },
                    { dosenId2: dosenData.id_dosen }
                ]
            }
        });

        const bimbinganAktif = await PengajuanJudul.count({
            where: {
                status: 'diterima',
                [Op.or]: [
                    { dosenId1: dosenData.id_dosen },
                    { dosenId2: dosenData.id_dosen }
                ]
            }
        });

        // Statistik berdasarkan role
        const sebagaiPembimbing1 = await PengajuanJudul.count({
            where: { dosenId1: dosenData.id_dosen }
        });

        const sebagaiPembimbing2 = await PengajuanJudul.count({
            where: { dosenId2: dosenData.id_dosen }
        });

        //  NEW: Pengajuan yang menunggu review
        const menungguReview = await PengajuanJudul.count({
            where: {
                status: 'diajukan',
                dosenId1: dosenData.id_dosen // Hanya pembimbing 1 yang bisa review
            }
        });

        // Mahasiswa bimbingan dengan progress
        const mahasiswaBimbingan = await PengajuanJudul.findAll({
            where: {
                status: 'diterima',
                [Op.or]: [
                    { dosenId1: dosenData.id_dosen },
                    { dosenId2: dosenData.id_dosen }
                ]
            },
            include: [
                { model: Mahasiswa },
                { model: BabSubmission }
            ]
        });

        // Mahasiswa yang stagnan (tidak aktif >14 hari)
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const mahasiswaStagnan = await PengajuanJudul.findAll({
            where: {
                status: 'diterima',
                updatedAt: { [Op.lt]: fourteenDaysAgo },
                [Op.or]: [
                    { dosenId1: dosenData.id_dosen },
                    { dosenId2: dosenData.id_dosen }
                ]
            },
            include: [{ model: Mahasiswa }]
        });

        res.status(200).json({
            success: true,
            data: {
                //  NEW: Informasi dosen yang sedang login
                dosenInfo: {
                    id_dosen: dosenData.id_dosen,
                    nidn: dosenData.nidn,
                    nama: dosenData.nama,
                    gelar: dosenData.gelar,
                    bidang_keahlian: dosenData.bidang_keahlian,
                    jabatan_akademik: dosenData.jabatan_akademik,
                    email: dosenData.User?.email,
                    foto: dosenData.foto
                },
                statistics: {
                    totalBimbingan,
                    bimbinganAktif,
                    sebagaiPembimbing1,
                    sebagaiPembimbing2,
                    menungguReview // Baru
                },
                mahasiswaBimbingan,
                mahasiswaStagnan
            }
        });
    } catch (error) {
        console.error('Error in getDosenDashboard:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  IMPROVED: Review pengajuan judul dengan better error handling
export const reviewPengajuanJudul = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;
        const { status, rejection_reason, catatan } = req.body;

        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan, {
            include: [{ model: Mahasiswa }]
        });

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        const pembimbingRole = req.pembimbingRole;
        const dosenData = await Dosen.findOne({
            where: { id_user: req.session.userId }
        });

        //  Pembimbing 2 hanya bisa memberikan catatan
        if (pembimbingRole === 'pembimbing_2') {
            // Validasi: Pembimbing 2 tidak boleh ubah status
            if (status && status !== pengajuan.status) {
                return res.status(403).json({
                    success: false,
                    message: "Pembimbing Pendamping hanya dapat memberikan masukan. Keputusan ACC/Reject dilakukan oleh Pembimbing Utama."
                });
            }

            const komentar = catatan || rejection_reason;

            if (!komentar) {
                return res.status(400).json({
                    success: false,
                    message: "Catatan tidak boleh kosong"
                });
            }

            try {
                await LogAktivitas.create({
                    id_user: req.session.userId,
                    id_pengajuan,
                    type: 'COMMENT_JUDUL',
                    description: truncateMessage(`Pembimbing Pendamping memberikan catatan: ${komentar}`, 500)
                });

                // Notifikasi ke mahasiswa
                const notifMessage = truncateMessage(`Pembimbing Pendamping memberikan masukan pada judul "${pengajuan.title}"`, 250);
                await Notifikasi.create({
                    id_user: pengajuan.Mahasiswa.id_user,
                    type: 'COMMENT_JUDUL',
                    message: notifMessage
                });

                // Notifikasi ke pembimbing 1
                if (pengajuan.dosenId1) {
                    const pembimbing1 = await Dosen.findByPk(pengajuan.dosenId1);
                    if (pembimbing1) {
                        const notifMessage2 = truncateMessage(`Pembimbing Pendamping memberikan masukan pada "${pengajuan.title}"`, 250);
                        await Notifikasi.create({
                            id_user: pembimbing1.id_user,
                            type: 'COMMENT_JUDUL',
                            message: notifMessage2
                        });
                    }
                }
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
                // Continue - catatan tetap tersimpan
            }

            return res.status(200).json({
                success: true,
                message: "Catatan berhasil disimpan. Keputusan final dilakukan oleh Pembimbing Utama",
                data: {
                    role: 'pembimbing_pendamping',
                    action: 'comment',
                    catatan: komentar
                }
            });
        }

        //  Pembimbing 1 bisa ACC/Reject
        if (pembimbingRole === 'pembimbing_1') {
            // Validasi status
            const validStatuses = ['diterima', 'ditolak', 'revisi'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status tidak valid. Gunakan: diterima, ditolak, atau revisi"
                });
            }

            // Validasi rejection_reason untuk status ditolak/revisi
            if ((status === 'ditolak' || status === 'revisi') && !rejection_reason) {
                return res.status(400).json({
                    success: false,
                    message: "Alasan penolakan/revisi harus diisi"
                });
            }

            const updateData = { status };

            if (status === 'diterima') {
                updateData.approvedAt = new Date();
                updateData.rejection_reason = null;
            } else if (status === 'ditolak' || status === 'revisi') {
                updateData.rejection_reason = rejection_reason;
                updateData.approvedAt = null;
            }

            //  UPDATE DATABASE DULU
            await pengajuan.update(updateData);

            //  Buat notifikasi dengan error handling
            try {
                // Notifikasi ke mahasiswa
                const notifMessage = truncateMessage(`Judul "${pengajuan.title}" telah ${status} oleh Pembimbing Utama`, 250);
                await Notifikasi.create({
                    id_user: pengajuan.Mahasiswa.id_user,
                    type: 'REVIEW_JUDUL',
                    message: notifMessage
                });

                // Notifikasi ke pembimbing 2
                if (pengajuan.dosenId2) {
                    const pembimbing2 = await Dosen.findByPk(pengajuan.dosenId2);
                    if (pembimbing2) {
                        const notifMessage2 = truncateMessage(`Pembimbing Utama telah ${status} pengajuan "${pengajuan.title}"`, 250);
                        await Notifikasi.create({
                            id_user: pembimbing2.id_user,
                            type: 'REVIEW_JUDUL',
                            message: notifMessage2
                        });
                    }
                }
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
            }

            // Log aktivitas
            try {
                await LogAktivitas.create({
                    id_user: req.session.userId,
                    id_pengajuan,
                    type: 'REVIEW_JUDUL',
                    description: truncateMessage(`Pembimbing Utama ${status} pengajuan judul: ${pengajuan.title}`, 500)
                });
            } catch (logError) {
                console.error('Error creating log:', logError);
            }

            return res.status(200).json({
                success: true,
                message: `Pengajuan berhasil di-${status}`,
                data: {
                    id_pengajuan: pengajuan.id_pengajuan,
                    title: pengajuan.title,
                    status: pengajuan.status,
                    role: 'pembimbing_utama',
                    action: status,
                    rejection_reason: pengajuan.rejection_reason,
                    approvedAt: pengajuan.approvedAt
                }
            });
        }

        // Jika role tidak dikenali
        return res.status(403).json({
            success: false,
            message: "Role pembimbing tidak valid"
        });

    } catch (error) {
        console.error('Error in reviewPengajuanJudul:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  IMPROVED: Review submission bab dengan better error handling
export const reviewBabSubmission = async (req, res) => {
    try {
        const { id_bab } = req.params;
        const { status, notes } = req.body;

        const babSubmission = await BabSubmission.findByPk(id_bab);

        if (!babSubmission) {
            return res.status(404).json({
                success: false,
                message: "Submission bab tidak ditemukan"
            });
        }

        const pengajuanJudul = await PengajuanJudul.findByPk(babSubmission.id_pengajuan, {
            include: [{ model: Mahasiswa }]
        });

        if (!pengajuanJudul || !pengajuanJudul.Mahasiswa) {
            return res.status(404).json({
                success: false,
                message: "Data mahasiswa tidak ditemukan"
            });
        }

        const pembimbingRole = req.pembimbingRole;

        //  Pembimbing 2 hanya bisa memberikan catatan
        if (pembimbingRole === 'pembimbing_2') {
            try {
                await LogAktivitas.create({
                    id_user: req.session.userId,
                    id_pengajuan: babSubmission.id_pengajuan,
                    type: 'COMMENT_BAB',
                    description: truncateMessage(`Pembimbing Pendamping memberikan catatan pada Bab ${babSubmission.chapter_number}: ${notes}`, 500)
                });

                const notifMessage = truncateMessage(`Pembimbing Pendamping memberikan masukan pada Bab ${babSubmission.chapter_number}`, 250);
                await Notifikasi.create({
                    id_user: pengajuanJudul.Mahasiswa.id_user,
                    type: 'COMMENT_BAB',
                    message: notifMessage
                });

                // Notifikasi ke Pembimbing 1
                if (pengajuanJudul.dosenId1) {
                    const pembimbing1 = await Dosen.findByPk(pengajuanJudul.dosenId1);
                    if (pembimbing1) {
                        await Notifikasi.create({
                            id_user: pembimbing1.id_user,
                            type: 'COMMENT_BAB',
                            message: truncateMessage(`Pembimbing Pendamping memberi masukan pada Bab ${babSubmission.chapter_number}`, 250)
                        });
                    }
                }
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
            }

            return res.status(200).json({
                success: true,
                message: "Catatan berhasil disimpan. Keputusan final dilakukan oleh Pembimbing Utama",
                role: 'pembimbing_pendamping'
            });
        }

        //  Pembimbing 1 bisa ACC/Reject
        if (pembimbingRole === 'pembimbing_1') {
            // Update BAB DULU
            await babSubmission.update({ status, notes });

            try {
                const notifMessage = truncateMessage(`Bab ${babSubmission.chapter_number} telah di-${status} oleh Pembimbing Utama`, 250);
                await Notifikasi.create({
                    id_user: pengajuanJudul.Mahasiswa.id_user,
                    type: 'REVIEW_BAB',
                    message: notifMessage
                });

                // Notifikasi ke Pembimbing 2
                if (pengajuanJudul.dosenId2) {
                    const pembimbing2 = await Dosen.findByPk(pengajuanJudul.dosenId2);
                    if (pembimbing2) {
                        await Notifikasi.create({
                            id_user: pembimbing2.id_user,
                            type: 'REVIEW_BAB',
                            message: truncateMessage(`Pembimbing Utama telah ${status} Bab ${babSubmission.chapter_number}`, 250)
                        });
                    }
                }
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
            }

            try {
                await LogAktivitas.create({
                    id_user: req.session.userId,
                    id_pengajuan: babSubmission.id_pengajuan,
                    type: 'REVIEW_BAB',
                    description: truncateMessage(`Pembimbing Utama ${status} Bab ${babSubmission.chapter_number}`, 500)
                });
            } catch (logError) {
                console.error('Error creating log:', logError);
            }

            return res.status(200).json({
                success: true,
                message: `Bab berhasil di-${status}`,
                data: {
                    id_bab: babSubmission.id_bab,
                    chapter_number: babSubmission.chapter_number,
                    status: babSubmission.status,
                    notes: babSubmission.notes
                },
                role: 'pembimbing_utama'
            });
        }

    } catch (error) {
        console.error('Error in reviewBabSubmission:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  IMPROVED: Get list mahasiswa bimbingan dengan detail role pembimbing
export const getMahasiswaBimbingan = async (req, res) => {
    try {
        const dosenData = await Dosen.findOne({
            where: { id_user: req.session.userId },
            include: [
                {
                    model: User,
                    attributes: ['email', 'role']
                }
            ]
        });

        if (!dosenData) {
            return res.status(404).json({
                success: false,
                message: "Data dosen tidak ditemukan"
            });
        }

        const mahasiswaBimbingan = await PengajuanJudul.findAll({
            where: {
                [Op.or]: [
                    { dosenId1: dosenData.id_dosen },
                    { dosenId2: dosenData.id_dosen }
                ]
            },
            include: [
                { model: Mahasiswa },
                { model: BabSubmission },
                {
                    model: Message,
                    as: "Messages",
                    limit: 5,
                    order: [["createdAt", "DESC"]],
                    include: [
                        {
                            model: User,
                            as: "User",
                            attributes: ["email", "role"],
                            include: [
                                { model: Dosen, attributes: ["nama"] },
                                { model: Mahasiswa, attributes: ["nama_lengkap"] }
                            ]
                        }
                    ]
                },
                { model: LaporanAkhir },
                { model: Dosen, as: 'Pembimbing1', attributes: ['id_dosen', 'nama', 'gelar'] },
                { model: Dosen, as: 'Pembimbing2', attributes: ['id_dosen', 'nama', 'gelar'] }
            ]
        });

        //  NEW: Tambahkan informasi role pembimbing untuk setiap pengajuan
        const mahasiswaWithRole = mahasiswaBimbingan.map(pengajuan => {
            const isPembimbing1 = pengajuan.dosenId1 === dosenData.id_dosen;
            const isPembimbing2 = pengajuan.dosenId2 === dosenData.id_dosen;

            return {
                ...pengajuan.toJSON(),
                myRole: isPembimbing1 ? 'pembimbing_utama' : 'pembimbing_pendamping',
                canApprove: isPembimbing1, // Hanya pembimbing 1 bisa approve
                canComment: true
            };
        });

        res.status(200).json({
            success: true,
            data: {
                //  NEW: Informasi dosen yang sedang login
                dosenInfo: {
                    id_dosen: dosenData.id_dosen,
                    nidn: dosenData.nidn,
                    nama: dosenData.nama,
                    gelar: dosenData.gelar,
                    bidang_keahlian: dosenData.bidang_keahlian,
                    email: dosenData.User?.email
                },
                mahasiswaBimbingan: mahasiswaWithRole
            }
        });
    } catch (error) {
        console.error('Error in getMahasiswaBimbingan:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};