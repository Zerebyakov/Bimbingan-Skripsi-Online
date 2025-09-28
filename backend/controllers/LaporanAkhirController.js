import Arsip from "../models/Arsip.js";
import LaporanAkhir from "../models/LaporanAkhir.js";
import LogAktivitas from "../models/LogAktivitas.js";
import Mahasiswa from "../models/Mahasiswa.js";
import Notifikasi from "../models/Notifikasi.js";
import PengajuanJudul from "../models/PengajuanJudul.js";






// Review laporan akhir (untuk dosen)
export const reviewLaporanAkhir = async (req, res) => {
    try {
        const { id_laporan } = req.params;
        const { status, notes } = req.body;

        const laporan = await LaporanAkhir.findByPk(id_laporan, {
            include: [{
                model: PengajuanJudul,
                include: [{ model: Mahasiswa }]
            }]
        });

        if (!laporan) {
            return res.status(404).json({
                success: false,
                message: "Laporan tidak ditemukan"
            });
        }

        const updateData = { status, notes };
        if (status === 'DITERIMA') {
            updateData.verifiedAt = new Date();
        }

        await laporan.update(updateData);

        // Create notification untuk mahasiswa
        await Notifikasi.create({
            id_user: laporan.PengajuanJudul.Mahasiswa.id_user,
            type: 'REVIEW_LAPORAN',
            message: `Laporan akhir telah ${status.toLowerCase()} oleh dosen pembimbing`
        });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: laporan.id_pengajuan,
            type: 'REVIEW_LAPORAN',
            description: `Dosen ${status.toLowerCase()} laporan akhir`
        });

        // Jika diterima, create arsip
        if (status === 'DITERIMA') {
            await Arsip.create({
                id_pengajuan: laporan.id_pengajuan,
                tanggalSelesai: new Date(),
                status: 'SELESAI',
                fileFinal: laporan.finalFile
            });
        }

        res.status(200).json({
            success: true,
            message: `Laporan berhasil ${status.toLowerCase()}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
