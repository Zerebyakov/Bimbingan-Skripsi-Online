import ProgramStudi from "../models/ProgramStudi.js";





// Get all program studi
export const getAllProgramStudi = async (req, res) => {
    try {
        const prodi = await ProgramStudi.findAll({
            order: [['program_studi', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: prodi
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Create program studi (untuk admin)
export const createProgramStudi = async (req, res) => {
    try {
        const { kode_prodi, program_studi } = req.body;

        const prodi = await ProgramStudi.create({
            kode_prodi,
            program_studi
        });

        res.status(201).json({
            success: true,
            message: "Program studi berhasil dibuat",
            data: prodi
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};