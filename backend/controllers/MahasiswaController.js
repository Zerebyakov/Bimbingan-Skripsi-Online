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
import User from "../models/User.js";
import KonfigurasiSistem from "../models/KonfigurasiSistem.js";

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
                        },
                    ],
                },
                {
                    model: LaporanAkhir,
                    as: 'LaporanAkhir' 
                }
            ],
        });

        // Ambil data laporan akhir
        let laporan = null;
        if (pengajuan) {
            laporan = await LaporanAkhir.findOne({
                where: { id_pengajuan: pengajuan.id_pengajuan }
            });
        }

        // Hitung progress
        let progress = 0;
        if (pengajuan && pengajuan.BabSubmissions) {
            const babDiterima = pengajuan.BabSubmissions.filter(
                bab => bab.status === 'diterima'
            ).length;
            progress = (babDiterima / 5) * 100;
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
                laporan, 
                laporanAkhir: laporan,
                progress,
                notifikasi
            }
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
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
            where: { id_user: req.session.userId },
        });

        const existingPengajuan = await PengajuanJudul.findOne({
            where: { id_mahasiswa: mahasiswaData.id_mahasiswa },
        });

        if (existingPengajuan) {
            return res.status(400).json({
                success: false,
                message: "Anda sudah memiliki pengajuan judul",
            });
        }

        const pengajuan = await PengajuanJudul.create({
            id_mahasiswa: mahasiswaData.id_mahasiswa,
            title,
            description,
            bidang_topik,
            keywords,
            proposal_file,
            status: "diajukan",
        });

        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: pengajuan.id_pengajuan,
            type: "AJUKAN_JUDUL",
            description: `Mahasiswa mengajukan judul: ${title}`,
        });

        res.status(201).json({
            success: true,
            message: "Judul berhasil diajukan",
            data: pengajuan,
        });
    } catch (error) {
        console.error("Ajukan Judul Error:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message,
        });
    }
};

// Update / Revisi Pengajuan Judul
export const updatePengajuanJudul = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, bidang_topik, keywords } = req.body;
        const proposal_file = req.file ? req.file.filename : null;

        const mahasiswaData = await Mahasiswa.findOne({
            where: { id_user: req.session.userId },
        });

        if (!mahasiswaData) {
            return res.status(404).json({
                success: false,
                message: "Data mahasiswa tidak ditemukan",
            });
        }

        const pengajuan = await PengajuanJudul.findOne({
            where: {
                id_pengajuan: id,
                id_mahasiswa: mahasiswaData.id_mahasiswa,
            },
        });

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan",
            });
        }

        // Update data pengajuan
        pengajuan.title = title || pengajuan.title;
        pengajuan.description = description || pengajuan.description;
        pengajuan.bidang_topik = bidang_topik || pengajuan.bidang_topik;
        pengajuan.keywords = keywords || pengajuan.keywords;

        if (proposal_file) {
            pengajuan.proposal_file = proposal_file;
        }

        // Set status kembali ke "diajukan" setelah revisi
        pengajuan.status = "diajukan";
        await pengajuan.save();

        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: pengajuan.id_pengajuan,
            type: "REVISI_JUDUL",
            description: `Mahasiswa merevisi judul: ${title}`,
        });

        res.status(200).json({
            success: true,
            message: "Pengajuan judul berhasil diperbarui",
            data: pengajuan,
        });
    } catch (error) {
        console.error("Update Pengajuan Error:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message,
        });
    }
};


// Upload bab
export const uploadBab = async (req, res) => {
    try {
        const { chapter_number } = req.body;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Tidak ada file yang diupload",
            });
        }

        const mahasiswaData = await Mahasiswa.findOne({
            where: { id_user: req.session.userId },
        });

        const pengajuan = await PengajuanJudul.findOne({
            where: {
                id_mahasiswa: mahasiswaData.id_mahasiswa,
                status: "diterima",
            },
        });

        if (!pengajuan) {
            return res.status(400).json({
                success: false,
                message: "Pengajuan judul belum diterima",
            });
        }

        // Validasi Bab berurutan
        if (chapter_number > 1) {
            const prevBab = await BabSubmission.findOne({
                where: {
                    id_pengajuan: pengajuan.id_pengajuan,
                    chapter_number: chapter_number - 1,
                    status: "diterima",
                },
            });
            if (!prevBab) {
                return res.status(400).json({
                    success: false,
                    message: `Bab ${chapter_number - 1} harus diterima terlebih dahulu`,
                });
            }
        }

        // Simpan/Update data Bab
        let babSubmission = await BabSubmission.findOne({
            where: {
                id_pengajuan: pengajuan.id_pengajuan,
                chapter_number,
            },
        });

        if (babSubmission) {
            await babSubmission.update({
                file_path: req.file.filename,
                original_name: req.file.originalname,
                mimeType: req.file.mimetype,
                status: "menunggu",
                submittedAt: new Date(),
            });
        } else {
            babSubmission = await BabSubmission.create({
                id_pengajuan: pengajuan.id_pengajuan,
                chapter_number,
                file_path: req.file.filename,
                original_name: req.file.originalname,
                mimeType: req.file.mimetype,
                status: "menunggu",
                submittedAt: new Date(),
            });
        }

        // Kirim notifikasi ke dosen pembimbing
        const dosenIds = [pengajuan.dosenId1, pengajuan.dosenId2, pengajuan.dosenId3].filter(Boolean);
        for (const dosenId of dosenIds) {
            const dosen = await Dosen.findByPk(dosenId);
            if (dosen) {
                await Notifikasi.create({
                    id_user: dosen.id_user,
                    type: "UPLOAD_BAB",
                    message: `${mahasiswaData.nama_lengkap} mengirim Bab ${chapter_number}`,
                });
            }
        }

        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: pengajuan.id_pengajuan,
            type: "UPLOAD_BAB",
            description: `Mahasiswa upload Bab ${chapter_number}`,
        });

        res.status(201).json({
            success: true,
            message: `Bab ${chapter_number} berhasil diupload`,
            data: babSubmission,
        });
    } catch (error) {
        console.error("Upload Bab Error:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

// Generate kartu bimbingan
export const generateKartuBimbingan = async (req, res) => {
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
                message: "Pengajuan tidak ditemukan atau belum diterima"
            });
        }

        // Cek laporan akhir sudah diterima
        const laporanAkhir = await LaporanAkhir.findOne({
            where: {
                id_pengajuan: pengajuan.id_pengajuan,
                status: 'diterima' // atau 'approved'
            }
        });

        if (!laporanAkhir) {
            return res.status(400).json({
                success: false,
                message: "Laporan akhir belum diterima oleh dosen pembimbing"
            });
        }

        // Cek apakah semua bab sudah diterima
        const babDiterima = pengajuan.BabSubmissions.filter(
            bab => bab.status === 'diterima'
        ).length;

        if (babDiterima < 5) {
            return res.status(400).json({
                success: false,
                message: `Semua bab harus diterima terlebih dahulu (${babDiterima}/5 bab diterima)`
            });
        }

        // Cek apakah kartu sudah ada
        let kartuBimbingan = await KartuBimbingan.findOne({
            where: { id_pengajuan: pengajuan.id_pengajuan }
        });

        if (kartuBimbingan) {
            return res.status(200).json({
                success: true,
                message: "Kartu bimbingan sudah pernah dibuat",
                data: kartuBimbingan
            });
        }

        // Generate nomor kartu
        const config = await KonfigurasiSistem.findOne();
        const tahun = new Date().getFullYear();
        const nomorKartu = `${config?.formatNomorKartu || 'KB'}/${mahasiswaData.nim}/${tahun}`;

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

        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: pengajuan.id_pengajuan,
            type: "GENERATE_KARTU",
            description: "Mahasiswa generate kartu bimbingan"
        });

        res.status(200).json({
            success: true,
            message: "Kartu bimbingan berhasil digenerate",
            data: kartuBimbingan
        });
    } catch (error) {
        console.error("Generate Kartu Error:", error);
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
        const files = req.files || {};

        console.log("Files received:", files);

        const mahasiswaData = await Mahasiswa.findOne({
            where: { id_user: req.session.userId },
        });

        if (!mahasiswaData) {
            return res.status(404).json({
                success: false,
                message: "Data mahasiswa tidak ditemukan",
            });
        }

        const pengajuan = await PengajuanJudul.findOne({
            where: {
                id_mahasiswa: mahasiswaData.id_mahasiswa,
                status: "diterima",
            },
        });

        if (!pengajuan) {
            return res.status(400).json({
                success: false,
                message: "Pengajuan tidak ditemukan atau belum diterima",
            });
        }

        // Cari laporan yang sudah ada
        let laporanAkhir = await LaporanAkhir.findOne({
            where: { id_pengajuan: pengajuan.id_pengajuan },
        });

        //data untuk update/create
        const fileData = {};

        // Update hanya field yang ada filenya
        if (files.finalFile?.[0]) {
            fileData.finalFile = files.finalFile[0].filename;
        } else if (laporanAkhir?.finalFile) {
            fileData.finalFile = laporanAkhir.finalFile; // Keep existing
        }

        if (files.abstrakFile?.[0]) {
            fileData.abstrakFile = files.abstrakFile[0].filename;
        } else if (laporanAkhir?.abstrakFile) {
            fileData.abstrakFile = laporanAkhir.abstrakFile;
        }

        if (files.pengesahanFile?.[0]) {
            fileData.pengesahanFile = files.pengesahanFile[0].filename;
        } else if (laporanAkhir?.pengesahanFile) {
            fileData.pengesahanFile = laporanAkhir.pengesahanFile;
        }

        if (files.pernyataanFile?.[0]) {
            fileData.pernyataanFile = files.pernyataanFile[0].filename;
        } else if (laporanAkhir?.pernyataanFile) {
            fileData.pernyataanFile = laporanAkhir.pernyataanFile;
        }

        if (files.presentasiFile?.[0]) {
            fileData.presentasiFile = files.presentasiFile[0].filename;
        } else if (laporanAkhir?.presentasiFile) {
            fileData.presentasiFile = laporanAkhir.presentasiFile;
        }

        // Set status hanya jika ada file baru yang diupload
        if (Object.keys(files).length > 0) {
            fileData.status = "menunggu";
            fileData.uploadedAt = new Date();
        }

        if (laporanAkhir) {
            // Update laporan yang sudah ada
            await laporanAkhir.update(fileData);
        } else {
            // Create laporan baru
            laporanAkhir = await LaporanAkhir.create({
                id_pengajuan: pengajuan.id_pengajuan,
                ...fileData,
                status: "menunggu",
            });
        }

        // Kirim notifikasi ke dosen
        const dosenIds = [
            pengajuan.dosenId1,
            pengajuan.dosenId2,
            pengajuan.dosenId3
        ].filter(Boolean);

        for (const dosenId of dosenIds) {
            const dosen = await Dosen.findByPk(dosenId);
            if (dosen) {
                await Notifikasi.create({
                    id_user: dosen.id_user,
                    type: "UPLOAD_LAPORAN",
                    message: `${mahasiswaData.nama_lengkap} mengirim laporan akhir`,
                });
            }
        }

        await LogAktivitas.create({
            id_user: req.session.userId,
            id_pengajuan: pengajuan.id_pengajuan,
            type: "UPLOAD_LAPORAN",
            description: "Mahasiswa upload laporan akhir",
        });

        // Reload data untuk return yang lengkap
        await laporanAkhir.reload();

        res.status(201).json({
            success: true,
            message: "Laporan akhir berhasil diupload",
            data: laporanAkhir,
        });
    } catch (error) {
        console.error("Upload Laporan Error:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};