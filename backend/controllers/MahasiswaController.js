import KartuBimbingan from "../models/KartuBimbingan.js";
import LaporanAkhir from "../models/LaporanAkhir.js";
import path from 'path'
import multer from "multer";
import Mahasiswa from "../models/Mahasiswa.js";
import Dosen from "../models/Dosen.js";
import BabSubmission from "../models/BabSubmission.js";
import Message from "../models/Message.js";
import Notifikasi from "../models/Notifikasi.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import LogAktivitas from "../models/LogAktivitas.js";

// Setup multer untuk upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Dashboard mahasiswa
export const getMahasiswaDashboard = async (req, res) => {
    try {
        const mahasiswaData = await Mahasiswa.findOne({
            where: { id_user: req.session.userId }
        });

        if (!mahasiswaData) {
            return res.status(404).json({
                success: false,
                message: "Data mahasiswa tidak ditemukan"
            });
        }

        // Get pengajuan judul mahasiswa
        const pengajuan = await PengajuanJudul.findOne({
            where: { id_mahasiswa: mahasiswaData.id_mahasiswa },
            include: [
                { model: Dosen, as: 'Pembimbing1' },
                { model: Dosen, as: 'Pembimbing2' },
                { model: BabSubmission },
                { model: Message, limit: 5, order: [['createdAt', 'DESC']] }
            ]
        });

        // Hitung progress
        let progress = 0;
        if (pengajuan && pengajuan.BabSubmissions) {
            const babDiterima = pengajuan.BabSubmissions.filter(bab => bab.status === 'diterima').length;
            progress = (babDiterima / 5) * 100; // Asumsi 5 bab
        }

        // Get notifikasi terbaru
        const notifikasi = await Notifikasi.findAll({
            where: { id_user: req.session.userId },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        res.status(200).json({
            success: true,
            data: {
                mahasiswa: mahasiswaData,
                pengajuan,
                progress,
                notifikasi
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

// Ajukan judul skripsi
export const ajukanJudul = async (req, res) => {
    try {
        const { title, description, bidang_topik, keywords } = req.body;
        const proposal_file = req.file ? req.file.filename : null;

        const mahasiswaData = await Mahasiswa.findOne({
            where: { id_user: req.session.userId }
        });

        // Cek apakah sudah ada pengajuan
        const existingPengajuan = await PengajuanJudul.findOne({
            where: { id_mahasiswa: mahasiswaData.id_mahasiswa }
        });

        if (existingPengajuan) {
            return res.status(400).json({
                success: false,
                message: "Anda sudah memiliki pengajuan judul"
            });
        }

        const pengajuan = await PengajuanJudul.create({
            id_mahasiswa: mahasiswaData.id_mahasiswa,
            title,
            description,
            bidang_topik,
            keywords,
            proposal_file,
            status: 'diajukan'
        });

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: pengajuan.id_pengajuan,
            type: 'AJUKAN_JUDUL',
            description: `Mahasiswa mengajukan judul: ${title}`
        });

        res.status(201).json({
            success: true,
            message: "Judul berhasil diajukan",
            data: pengajuan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Upload bab
export const uploadBab = async (req, res) => {
    try {
        const { chapter_number } = req.body;
        const file_path = req.file.filename;

        const mahasiswaData = await Mahasiswa.findOne({
            where: { id_user: req.session.userId }
        });

        const pengajuan = await PengajuanJudul.findOne({
            where: {
                id_mahasiswa: mahasiswaData.id_mahasiswa,
                status: 'diterima'
            }
        });

        if (!pengajuan) {
            return res.status(400).json({
                success: false,
                message: "Pengajuan judul belum diterima"
            });
        }

        // Cek apakah bab sebelumnya sudah diterima (untuk chapter > 1)
        if (chapter_number > 1) {
            const prevBab = await BabSubmission.findOne({
                where: {
                    id_pengajuan: pengajuan.id_pengajuan,
                    chapter_number: chapter_number - 1,
                    status: 'diterima'
                }
            });

            if (!prevBab) {
                return res.status(400).json({
                    success: false,
                    message: `Bab ${chapter_number - 1} harus diterima terlebih dahulu`
                });
            }
        }

        // Cek apakah bab sudah ada
        let babSubmission = await BabSubmission.findOne({
            where: {
                id_pengajuan: pengajuan.id_pengajuan,
                chapter_number
            }
        });

        if (babSubmission) {
            // Update existing submission
            await babSubmission.update({
                file_path,
                original_name: req.file.originalname,
                mimeType: req.file.mimetype,
                status: 'menunggu',
                submittedAt: new Date()
            });
        } else {
            // Create new submission
            babSubmission = await BabSubmission.create({
                id_pengajuan: pengajuan.id_pengajuan,
                chapter_number,
                file_path,
                original_name: req.file.originalname,
                mimeType: req.file.mimetype,
                status: 'menunggu',
                submittedAt: new Date()
            });
        }

        // Create notification untuk dosen
        const dosenIds = [pengajuan.dosenId1, pengajuan.dosenId2].filter(Boolean);
        for (const dosenId of dosenIds) {
            const dosen = await Dosen.findByPk(dosenId);
            await Notifikasi.create({
                id_user: dosen.id_user,
                type: 'UPLOAD_BAB',
                message: `${mahasiswaData.nama_lengkap} mengirim Bab ${chapter_number}`
            });
        }

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: pengajuan.id_pengajuan,
            type: 'UPLOAD_BAB',
            description: `Mahasiswa upload Bab ${chapter_number}`
        });

        res.status(201).json({
            success: true,
            message: `Bab ${chapter_number} berhasil diupload`,
            data: babSubmission
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Generate kartu bimbingan
export const generateKartuBimbingan = async (req, res) => {
    try {
        const mahasiswaData = await Mahasiswa.findOne({
            where: { id_user: req.session.userId }
        });

        const pengajuan = await PengajuanJudul.findOne({
            where: {
                id_mahasiswa: mahasiswaData.id_mahasiswa,
                status: 'diterima'
            },
            include: [{ model: BabSubmission }]
        });

        if (!pengajuan) {
            return res.status(400).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        // Cek apakah semua bab sudah diterima
        const babDiterima = pengajuan.BabSubmissions.filter(bab => bab.status === 'diterima').length;
        if (babDiterima < 5) {
            return res.status(400).json({
                success: false,
                message: "Semua bab harus diterima terlebih dahulu"
            });
        }

        // Cek apakah kartu sudah ada
        let kartuBimbingan = await KartuBimbingan.findOne({
            where: { id_pengajuan: pengajuan.id_pengajuan }
        });

        if (!kartuBimbingan) {
            // Generate nomor kartu
            const config = await KonfigurasiSistem.findOne();
            const nomorKartu = config.formatNomorKartu +
                mahasiswaData.nim +
                new Date().getFullYear();

            // Hitung total pertemuan dari message
            const totalPertemuan = await Message.count({
                where: { id_pengajuan: pengajuan.id_pengajuan }
            });

            kartuBimbingan = await KartuBimbingan.create({
                id_pengajuan: pengajuan.id_pengajuan,
                nomorKartu,
                totalPertemuan,
                totalBab: 5,
                selesaiAt: new Date()
            });
        }

        res.status(200).json({
            success: true,
            message: "Kartu bimbingan berhasil digenerate",
            data: kartuBimbingan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Upload laporan akhir
export const uploadLaporanAkhir = async (req, res) => {
    try {
        const files = req.files;
        const mahasiswaData = await Mahasiswa.findOne({
            where: { id_user: req.session.userId }
        });

        const pengajuan = await PengajuanJudul.findOne({
            where: {
                id_mahasiswa: mahasiswaData.id_mahasiswa,
                status: 'diterima'
            }
        });

        if (!pengajuan) {
            return res.status(400).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        let laporanAkhir = await LaporanAkhir.findOne({
            where: { id_pengajuan: pengajuan.id_pengajuan }
        });

        const fileData = {
            finalFile: files.finalFile ? files.finalFile[0].filename : null,
            abstrakFile: files.abstrakFile ? files.abstrakFile[0].filename : null,
            pengesahanFile: files.pengesahanFile ? files.pengesahanFile[0].filename : null,
            pernyataanFile: files.pernyataanFile ? files.pernyataanFile[0].filename : null,
            presentasiFile: files.presentasiFile ? files.presentasiFile[0].filename : null,
            status: 'MENUNGGU'
        };

        if (laporanAkhir) {
            await laporanAkhir.update(fileData);
        } else {
            laporanAkhir = await LaporanAkhir.create({
                id_pengajuan: pengajuan.id_pengajuan,
                ...fileData
            });
        }

        // Create notification untuk dosen
        const dosenIds = [pengajuan.dosenId1, pengajuan.dosenId2].filter(Boolean);
        for (const dosenId of dosenIds) {
            const dosen = await Dosen.findByPk(dosenId);
            await Notifikasi.create({
                id_user: dosen.id_user,
                type: 'UPLOAD_LAPORAN',
                message: `${mahasiswaData.nama_lengkap} mengirim laporan akhir`
            });
        }

        // Log aktivitas
        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: pengajuan.id_pengajuan,
            type: 'UPLOAD_LAPORAN',
            description: 'Mahasiswa upload laporan akhir'
        });

        res.status(201).json({
            success: true,
            message: "Laporan akhir berhasil diupload",
            data: laporanAkhir
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};