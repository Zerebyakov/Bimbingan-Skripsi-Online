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

        // Ambil data laporan akhir terlebih dahulu
        const laporan = await LaporanAkhir.findByPk(id_laporan);

        if (!laporan) {
            return res.status(404).json({
                success: false,
                message: "Laporan tidak ditemukan"
            });
        }

        // Ambil data pengajuan judul beserta mahasiswa secara terpisah
        const pengajuanJudul = await PengajuanJudul.findByPk(laporan.id_pengajuan, {
            include: [{ model: Mahasiswa }]
        });

        if (!pengajuanJudul || !pengajuanJudul.Mahasiswa) {
            return res.status(404).json({
                success: false,
                message: "Data mahasiswa tidak ditemukan"
            });
        }

        // Normalisasi status ke uppercase untuk konsistensi
        const normalizedStatus = status.toUpperCase();

        // Prepare update data
        const updateData = {
            status: normalizedStatus,
            notes
        };

        if (normalizedStatus === 'DITERIMA') {
            updateData.verifiedAt = new Date();
        }

        // Update laporan
        await laporan.update(updateData);

        // Create notification untuk mahasiswa
        await Notifikasi.create({
            id_user: pengajuanJudul.Mahasiswa.id_user,
            type: 'REVIEW_LAPORAN',
            message: `Laporan akhir telah ${normalizedStatus.toLowerCase()} oleh dosen pembimbing${notes ? ': ' + notes : ''}`
        });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: laporan.id_pengajuan,
            type: 'REVIEW_LAPORAN',
            description: `Dosen ${normalizedStatus.toLowerCase()} laporan akhir`
        });

        // Jika diterima, create arsip
        if (normalizedStatus === 'DITERIMA') {
            await Arsip.create({
                id_pengajuan: laporan.id_pengajuan,
                tanggalSelesai: new Date(),
                status: 'SELESAI',
                fileFinal: laporan.finalFile
            });
        }

        res.status(200).json({
            success: true,
            message: `Laporan berhasil ${normalizedStatus.toLowerCase()}`,
            data: {
                id_laporan: laporan.id_laporan,
                status: laporan.status,
                notes: laporan.notes,
                verifiedAt: laporan.verifiedAt
            }
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