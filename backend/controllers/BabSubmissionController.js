import BabSubmission from "../models/BabSubmission.js";
import Mahasiswa from "../models/Mahasiswa.js";
import PengajuanJudul from "../models/PengajuanJudul.js";




// Get bab submissions by pengajuan
export const getBabSubmissions = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;

        const submissions = await BabSubmission.findAll({
            where: { id_pengajuan },
            order: [['chapter_number', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: submissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get specific bab submission
export const getBabSubmissionById = async (req, res) => {
    try {
        const { id_bab } = req.params;

        const submission = await BabSubmission.findByPk(id_bab, {
            include: [{
                model: PengajuanJudul,
                include: [{ model: Mahasiswa }]
            }]
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission tidak ditemukan"
            });
        }

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Download file bab
export const downloadBabFile = async (req, res) => {
    try {
        const { id_bab } = req.params;

        const submission = await BabSubmission.findByPk(id_bab);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission tidak ditemukan"
            });
        }

        const filePath = path.join('uploads', submission.file_path);

        res.download(filePath, submission.original_name, (err) => {
            if (err) {
                res.status(404).json({
                    success: false,
                    message: "File tidak ditemukan"
                });
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
