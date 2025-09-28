import BabSubmission from "../models/BabSubmission.js";
import Message from "../models/Message.js";
import Notifikasi from "../models/Notifikasi.js";

// Dashboard dosen - statistik pribadi
export const getDosenDashboard = async (req, res) => {
    try {
        const dosenData = await Dosen.findOne({
            where: { id_user: req.session.userId }
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
                statistics: {
                    totalBimbingan,
                    bimbinganAktif
                },
                mahasiswaBimbingan,
                mahasiswaStagnan
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

// Review pengajuan judul
export const reviewPengajuanJudul = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;
        const { status, rejection_reason } = req.body;

        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan, {
            include: [{ model: Mahasiswa }]
        });

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        const updateData = { status };
        if (status === 'diterima') {
            updateData.approvedAt = new Date();
        } else if (status === 'ditolak' || status === 'revisi') {
            updateData.rejection_reason = rejection_reason;
        }

        await pengajuan.update(updateData);

        // Create notification untuk mahasiswa
        await Notifikasi.create({
            id_user: pengajuan.Mahasiswa.id_user,
            type: 'REVIEW_JUDUL',
            message: `Judul "${pengajuan.title}" telah di-${status} oleh dosen pembimbing`
        });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan,
            type: 'REVIEW_JUDUL',
            description: `Dosen ${status} pengajuan judul: ${pengajuan.title}`
        });

        res.status(200).json({
            success: true,
            message: `Pengajuan berhasil di-${status}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Review submission bab
export const reviewBabSubmission = async (req, res) => {
    try {
        const { id_bab } = req.params;
        const { status, notes } = req.body;

        const babSubmission = await BabSubmission.findByPk(id_bab, {
            include: [{
                model: PengajuanJudul,
                include: [{ model: Mahasiswa }]
            }]
        });

        if (!babSubmission) {
            return res.status(404).json({
                success: false,
                message: "Submission bab tidak ditemukan"
            });
        }

        await babSubmission.update({ status, notes });

        // Create notification untuk mahasiswa
        await Notifikasi.create({
            id_user: babSubmission.PengajuanJudul.Mahasiswa.id_user,
            type: 'REVIEW_BAB',
            message: `Bab ${babSubmission.chapter_number} telah di-${status} oleh dosen pembimbing`
        });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: babSubmission.id_pengajuan,
            type: 'REVIEW_BAB',
            description: `Dosen ${status} Bab ${babSubmission.chapter_number}`
        });

        res.status(200).json({
            success: true,
            message: `Bab berhasil di-${status}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get list mahasiswa bimbingan
export const getMahasiswaBimbingan = async (req, res) => {
    try {
        const dosenData = await Dosen.findOne({
            where: { id_user: req.session.userId }
        });

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
                { model: Message, limit: 5, order: [['createdAt', 'DESC']] }
            ]
        });

        res.status(200).json({
            success: true,
            data: mahasiswaBimbingan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};