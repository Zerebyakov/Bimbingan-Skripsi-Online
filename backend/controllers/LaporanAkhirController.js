import Arsip from "../models/Arsip.js";
import Dosen from "../models/Dosen.js";
import LaporanAkhir from "../models/LaporanAkhir.js";
import LogAktivitas from "../models/LogAktivitas.js";
import Mahasiswa from "../models/Mahasiswa.js";
import Notifikasi from "../models/Notifikasi.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import BabSubmission from "../models/BabSubmission.js";
import KartuBimbingan from "../models/KartuBimbingan.js";

// Helper function untuk mencegah error "Data too long for column 'message'"
const truncateMessage = (message, maxLength = 250) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength - 3) + '...' : message;
};

//  Helper function untuk create arsip otomatis
const createArsipIfComplete = async (pengajuan, laporan, userId = null) => {
    try {
        // Cek apakah arsip sudah ada
        const existingArsip = await Arsip.findOne({
            where: { id_pengajuan: pengajuan.id_pengajuan }
        });

        if (existingArsip) {
            console.log(`Arsip sudah ada untuk pengajuan ${pengajuan.id_pengajuan}`);
            return { alreadyExists: true, arsip: existingArsip };
        }

        // Cek semua bab sudah diterima
        const allBabs = await BabSubmission.findAll({
            where: { id_pengajuan: pengajuan.id_pengajuan }
        });

        const babDiterima = allBabs.filter(bab => bab.status === 'diterima').length;

        if (babDiterima < 5) {
            console.log(`Bab belum lengkap untuk pengajuan ${pengajuan.id_pengajuan}: ${babDiterima}/5`);
            return { incomplete: true, babDiterima, totalBab: 5 };
        }

        // Cek kartu bimbingan (opsional)
        const kartuBimbingan = await KartuBimbingan.findOne({
            where: { id_pengajuan: pengajuan.id_pengajuan }
        });

        if (!kartuBimbingan) {
            console.warn(`Kartu bimbingan belum ada untuk pengajuan ${pengajuan.id_pengajuan}`);
        }

        // Create arsip
        const arsip = await Arsip.create({
            id_pengajuan: pengajuan.id_pengajuan,
            tanggalSelesai: new Date(),
            status: 'SELESAI',
            fileFinal: laporan.finalFile || null,
            kartuBimbinganFile: kartuBimbingan?.nomorKartu || null
        });

        console.log(` Arsip berhasil dibuat: ID ${arsip.id_arsip} untuk pengajuan ${pengajuan.id_pengajuan}`);

        // Log aktivitas
        try {
            await LogAktivitas.create({
                id_user: userId,
                id_pengajuan: pengajuan.id_pengajuan,
                type: 'ARSIP_CREATED',
                description: truncateMessage(`Skripsi "${pengajuan.title}" selesai dan diarsipkan otomatis`, 500)
            });
        } catch (logError) {
            console.error('Error creating log:', logError);
        }

        // Notifikasi ke mahasiswa
        try {
            const mahasiswa = await Mahasiswa.findByPk(pengajuan.id_mahasiswa);
            if (mahasiswa) {
                await Notifikasi.create({
                    id_user: mahasiswa.id_user,
                    type: 'ARSIP_CREATED',
                    message: truncateMessage('🎉 Selamat! Skripsi Anda telah selesai dan masuk ke arsip', 250)
                });
            }
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
        }

        return { success: true, arsip };
    } catch (error) {
        console.error('Error creating arsip:', error);
        return { error: true, message: error.message };
    }
};

//  FIXED: Review laporan akhir dengan role-based access & auto-arsip
export const reviewLaporanAkhir = async (req, res) => {
    try {
        const { id_laporan } = req.params;
        const { status, notes } = req.body;

        const laporan = await LaporanAkhir.findByPk(id_laporan);

        if (!laporan) {
            return res.status(404).json({
                success: false,
                message: "Laporan akhir tidak ditemukan"
            });
        }

        const pengajuan = await PengajuanJudul.findByPk(laporan.id_pengajuan, {
            include: [{ model: Mahasiswa }]
        });

        if (!pengajuan || !pengajuan.Mahasiswa) {
            return res.status(404).json({
                success: false,
                message: "Data mahasiswa tidak ditemukan"
            });
        }

        //  CEK ROLE PEMBIMBING dari middleware
        const pembimbingRole = req.pembimbingRole;

        //  PEMBIMBING 2: Hanya bisa memberikan catatan/masukan
        if (pembimbingRole === 'pembimbing_2') {
            if (!notes) {
                return res.status(400).json({
                    success: false,
                    message: "Catatan tidak boleh kosong"
                });
            }

            try {
                await LogAktivitas.create({
                    id_user: req.session.userId,
                    id_pengajuan: laporan.id_pengajuan,
                    type: 'COMMENT_LAPORAN',
                    description: truncateMessage(`Pembimbing Pendamping memberikan catatan pada laporan akhir: ${notes}`, 500)
                });

                const notifMessage = truncateMessage(`Pembimbing Pendamping memberikan masukan pada laporan akhir`, 250);
                await Notifikasi.create({
                    id_user: pengajuan.Mahasiswa.id_user,
                    type: 'COMMENT_LAPORAN',
                    message: notifMessage
                });

                if (pengajuan.dosenId1) {
                    const pembimbing1 = await Dosen.findByPk(pengajuan.dosenId1);
                    if (pembimbing1) {
                        await Notifikasi.create({
                            id_user: pembimbing1.id_user,
                            type: 'COMMENT_LAPORAN',
                            message: 'Pembimbing Pendamping memberikan masukan pada laporan akhir'
                        });
                    }
                }
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
            }

            return res.status(200).json({
                success: true,
                message: "Catatan berhasil disimpan di log aktivitas. Keputusan final dilakukan oleh Pembimbing Utama",
                data: {
                    role: 'pembimbing_pendamping',
                    action: 'comment',
                    notes: notes
                }
            });
        }

        //  PEMBIMBING 1: Bisa ACC/Reject/revisi
        if (pembimbingRole === 'pembimbing_1') {
            const validStatuses = ['diterima', 'ditolak', 'revisi'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status tidak valid. Gunakan: diterima, ditolak, atau revisi"
                });
            }

            if ((status === 'ditolak' || status === 'revisi') && !notes) {
                return res.status(400).json({
                    success: false,
                    message: "Catatan/alasan harus diisi untuk status ditolak atau revisi"
                });
            }

            const updateData = { status };

            if (status === 'diterima') {
                updateData.verifiedAt = new Date();
                updateData.notes = notes || 'Laporan akhir diterima';
            } else if (status === 'ditolak' || status === 'revisi') {
                updateData.notes = notes;
                updateData.verifiedAt = null;
            }

            //  UPDATE DATABASE DULU (paling penting)
            await laporan.update(updateData);

            //  OTOMATIS CREATE ARSIP jika laporan diterima
            let arsipResult = null;
            if (status === 'diterima') {
                console.log(`🔄 Mencoba membuat arsip untuk pengajuan ${pengajuan.id_pengajuan}...`);
                arsipResult = await createArsipIfComplete(pengajuan, laporan, req.session.userId);
            }

            //  Notifikasi
            try {
                const notifMessage = truncateMessage(`Laporan akhir telah ${status.toLowerCase()} oleh Pembimbing Utama`, 250);
                await Notifikasi.create({
                    id_user: pengajuan.Mahasiswa.id_user,
                    type: 'REVIEW_LAPORAN',
                    message: notifMessage
                });

                if (pengajuan.dosenId2) {
                    const pembimbing2 = await Dosen.findByPk(pengajuan.dosenId2);
                    if (pembimbing2) {
                        const notifMessage2 = truncateMessage(`Pembimbing Utama telah ${status.toLowerCase()} laporan akhir`, 250);
                        await Notifikasi.create({
                            id_user: pembimbing2.id_user,
                            type: 'REVIEW_LAPORAN',
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
                    id_pengajuan: laporan.id_pengajuan,
                    type: 'REVIEW_LAPORAN',
                    description: truncateMessage(`Pembimbing Utama ${status.toLowerCase()} laporan akhir`, 500)
                });
            } catch (logError) {
                console.error('Error creating log:', logError);
            }

            // Prepare response
            const responseData = {
                id_laporan: laporan.id_laporan,
                status: laporan.status,
                notes: laporan.notes,
                verifiedAt: laporan.verifiedAt,
                role: 'pembimbing_utama',
                action: status.toLowerCase()
            };

            // Tambahkan info arsip jika berhasil dibuat
            if (arsipResult) {
                if (arsipResult.success) {
                    responseData.arsip = {
                        created: true,
                        id_arsip: arsipResult.arsip.id_arsip,
                        status: arsipResult.arsip.status,
                        tanggalSelesai: arsipResult.arsip.tanggalSelesai
                    };
                } else if (arsipResult.alreadyExists) {
                    responseData.arsip = {
                        created: false,
                        reason: 'Arsip sudah ada sebelumnya',
                        id_arsip: arsipResult.arsip.id_arsip
                    };
                } else if (arsipResult.incomplete) {
                    responseData.arsip = {
                        created: false,
                        reason: 'Bab belum lengkap',
                        detail: `${arsipResult.babDiterima}/${arsipResult.totalBab} bab diterima`
                    };
                } else if (arsipResult.error) {
                    responseData.arsip = {
                        created: false,
                        reason: 'Error saat membuat arsip',
                        error: arsipResult.message
                    };
                }
            }

            let successMessage = `Laporan akhir berhasil di-${status.toLowerCase()}`;
            if (arsipResult?.success) {
                successMessage += ' dan diarsipkan otomatis';
            } else if (arsipResult?.incomplete) {
                successMessage += '. Arsip akan dibuat otomatis setelah semua bab diterima';
            }

            return res.status(200).json({
                success: true,
                message: successMessage,
                data: responseData
            });
        }

        // Jika role tidak dikenali
        return res.status(403).json({
            success: false,
            message: "Role pembimbing tidak valid"
        });

    } catch (error) {
        console.error('Error in reviewLaporanAkhir:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get laporan akhir by pengajuan
export const getLaporanAkhir = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;

        const laporan = await LaporanAkhir.findOne({
            where: { id_pengajuan },
            include: [{
                model: PengajuanJudul,
                include: [
                    { model: Mahasiswa },
                    { model: Dosen, as: 'Pembimbing1', attributes: ['id_dosen', 'nama', 'gelar'] },
                    { model: Dosen, as: 'Pembimbing2', attributes: ['id_dosen', 'nama', 'gelar'] }
                ]
            }]
        });

        if (!laporan) {
            return res.status(404).json({
                success: false,
                message: "Laporan akhir tidak ditemukan"
            });
        }

        res.status(200).json({
            success: true,
            data: laporan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  Get laporan akhir by ID
export const getLaporanAkhirById = async (req, res) => {
    try {
        const { id_laporan } = req.params;

        const laporan = await LaporanAkhir.findByPk(id_laporan, {
            include: [
                {
                    model: PengajuanJudul,
                    include: [
                        { model: Mahasiswa },
                        { model: Dosen, as: 'Pembimbing1', attributes: ['id_dosen', 'nama', 'gelar'] },
                        { model: Dosen, as: 'Pembimbing2', attributes: ['id_dosen', 'nama', 'gelar'] }
                    ]
                }
            ]
        });

        if (!laporan) {
            return res.status(404).json({
                success: false,
                message: "Laporan akhir tidak ditemukan"
            });
        }

        res.status(200).json({
            success: true,
            data: laporan
        });
    } catch (error) {
        console.error('Error in getLaporanAkhirById:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//  Get all laporan akhir (untuk admin)
export const getAllLaporanAkhir = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const whereCondition = {};
        if (status) {
            whereCondition.status = status.toLowerCase();
        }

        const laporanList = await LaporanAkhir.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: PengajuanJudul,
                    include: [
                        { model: Mahasiswa },
                        { model: Dosen, as: 'Pembimbing1', attributes: ['nama', 'gelar'] },
                        { model: Dosen, as: 'Pembimbing2', attributes: ['nama', 'gelar'] }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        res.status(200).json({
            success: true,
            data: {
                laporanAkhir: laporanList.rows,
                pagination: {
                    total: laporanList.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(laporanList.count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllLaporanAkhir:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};