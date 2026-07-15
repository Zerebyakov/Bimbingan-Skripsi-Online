import XLSX from "xlsx";
import argon2 from "argon2";
import { Op } from "sequelize";

import db from "../config/Database.js";
import User from "../models/User.js";
import Dosen from "../models/Dosen.js";
import Mahasiswa from "../models/Mahasiswa.js";
import ProgramStudi from "../models/ProgramStudi.js";
import LogAktivitas from "../models/LogAktivitas.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readExcelRows = (buffer) => {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
    });
};

const normalizeRow = (row) => {
    const normalized = {};

    Object.keys(row).forEach((key) => {
        const cleanKey = String(key).trim();
        const value = row[key];

        normalized[cleanKey] =
            typeof value === "string" ? value.trim() : value;
    });

    return normalized;
};

const isEmpty = (value) => {
    return value === undefined || value === null || String(value).trim() === "";
};

const validateRequiredFields = (row, requiredFields) => {
    const missing = [];

    requiredFields.forEach((field) => {
        if (isEmpty(row[field])) {
            missing.push(field);
        }
    });

    return missing;
};

const createTemplateBuffer = (headers, sampleRows = []) => {
    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    return XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
    });
};

export const downloadTemplateDosen = async (req, res) => {
    const headers = [
        "email",
        "password",
        "nidn",
        "nama",
        "gelar",
        "prodi_id",
        "fakultas",
        "bidang_keahlian",
        "jabatan_akademik",
        "status_dosen",
        "kontak",
        "email_institusi",
    ];

    const sampleRows = [
        {
            email: "dosen1@kampus.ac.id",
            password: "password123",
            nidn: "0601019001",
            nama: "Nama Dosen",
            gelar: "M.Kom",
            prodi_id: 1,
            fakultas: "Sains dan Teknologi",
            bidang_keahlian: "Artificial Intelligence",
            jabatan_akademik: "Asisten Ahli",
            status_dosen: "tetap",
            kontak: "081234567890",
            email_institusi: "dosen1@kampus.ac.id",
        },
    ];

    const buffer = createTemplateBuffer(headers, sampleRows);

    res.setHeader(
        "Content-Disposition",
        "attachment; filename=template_import_dosen.xlsx"
    );
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
};

export const downloadTemplateMahasiswa = async (req, res) => {
    const headers = [
        "email",
        "password",
        "nim",
        "nama_lengkap",
        "prodi_id",
        "angkatan",
        "semester",
        "kontak",
        "email_kampus",
    ];

    const sampleRows = [
        {
            email: "mahasiswa1@student.ac.id",
            password: "password123",
            nim: "42422001",
            nama_lengkap: "Nama Mahasiswa",
            prodi_id: 1,
            angkatan: 2022,
            semester: 7,
            kontak: "081234567890",
            email_kampus: "mahasiswa1@student.ac.id",
        },
    ];

    const buffer = createTemplateBuffer(headers, sampleRows);

    res.setHeader(
        "Content-Disposition",
        "attachment; filename=template_import_mahasiswa.xlsx"
    );
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
};

export const importDosenExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File Excel wajib diupload",
            });
        }

        const rows = readExcelRows(req.file.buffer).map(normalizeRow);

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "File Excel kosong",
            });
        }

        const requiredFields = [
            "email",
            "password",
            "nidn",
            "nama",
            "gelar",
            "prodi_id",
        ];

        const successRows = [];
        const failedRows = [];

        for (let index = 0; index < rows.length; index++) {
            const rowNumber = index + 2;
            const row = rows[index];

            const missing = validateRequiredFields(row, requiredFields);

            if (missing.length > 0) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email || "-",
                    reason: `Field wajib kosong: ${missing.join(", ")}`,
                });
                continue;
            }

            if (!emailRegex.test(row.email)) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "Format email tidak valid",
                });
                continue;
            }

            const prodiId = Number(row.prodi_id);

            if (!Number.isInteger(prodiId)) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "prodi_id harus berupa angka",
                });
                continue;
            }

            const existingUser = await User.findOne({
                where: { email: row.email },
            });

            if (existingUser) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "Email sudah terdaftar",
                });
                continue;
            }

            const existingDosen = await Dosen.findOne({
                where: { nidn: row.nidn },
            });

            if (existingDosen) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "NIDN sudah terdaftar",
                });
                continue;
            }

            const prodi = await ProgramStudi.findByPk(prodiId);

            if (!prodi) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: `Program studi dengan prodi_id ${prodiId} tidak ditemukan`,
                });
                continue;
            }

            const transaction = await db.transaction();

            try {
                const hashedPassword = await argon2.hash(String(row.password));

                const user = await User.create(
                    {
                        email: row.email,
                        password: hashedPassword,
                        role: "dosen",
                        status: "aktif",
                    },
                    { transaction }
                );

                const dosen = await Dosen.create(
                    {
                        id_user: user.id_user,
                        nidn: row.nidn,
                        nama: row.nama,
                        gelar: row.gelar,
                        prodi_id: prodiId,
                        fakultas: row.fakultas || null,
                        bidang_keahlian: row.bidang_keahlian || null,
                        jabatan_akademik: row.jabatan_akademik || null,
                        status_dosen: row.status_dosen || "tetap",
                        kontak: row.kontak || null,
                        email_institusi: row.email_institusi || row.email,
                    },
                    { transaction }
                );

                await LogAktivitas.create(
                    {
                        id_user: req.session.userId,
                        type: "IMPORT_DOSEN",
                        description: `Import dosen via Excel: ${row.nama} (${row.nidn})`,
                    },
                    { transaction }
                );

                await transaction.commit();

                successRows.push({
                    row: rowNumber,
                    id_user: user.id_user,
                    id_dosen: dosen.id_dosen,
                    email: row.email,
                    nidn: row.nidn,
                    nama: row.nama,
                });
            } catch (error) {
                await transaction.rollback();

                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: error.message,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Import dosen selesai",
            summary: {
                total: rows.length,
                success: successRows.length,
                failed: failedRows.length,
            },
            data: {
                successRows,
                failedRows,
            },
        });
    } catch (error) {
        console.error("Import dosen error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat import dosen",
            error: error.message,
        });
    }
};

export const importMahasiswaExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File Excel wajib diupload",
            });
        }

        const rows = readExcelRows(req.file.buffer).map(normalizeRow);

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "File Excel kosong",
            });
        }

        const requiredFields = [
            "email",
            "password",
            "nim",
            "nama_lengkap",
            "prodi_id",
            "angkatan",
            "semester",
            "kontak",
        ];

        const successRows = [];
        const failedRows = [];

        for (let index = 0; index < rows.length; index++) {
            const rowNumber = index + 2;
            const row = rows[index];

            const missing = validateRequiredFields(row, requiredFields);

            if (missing.length > 0) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email || "-",
                    reason: `Field wajib kosong: ${missing.join(", ")}`,
                });
                continue;
            }

            if (!emailRegex.test(row.email)) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "Format email tidak valid",
                });
                continue;
            }

            const prodiId = Number(row.prodi_id);
            const angkatan = Number(row.angkatan);
            const semester = Number(row.semester);

            if (!Number.isInteger(prodiId)) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "prodi_id harus berupa angka",
                });
                continue;
            }

            if (!Number.isInteger(angkatan)) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "angkatan harus berupa angka",
                });
                continue;
            }

            if (!Number.isInteger(semester)) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "semester harus berupa angka",
                });
                continue;
            }

            const existingUser = await User.findOne({
                where: { email: row.email },
            });

            if (existingUser) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "Email sudah terdaftar",
                });
                continue;
            }

            const existingMahasiswa = await Mahasiswa.findOne({
                where: { nim: row.nim },
            });

            if (existingMahasiswa) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: "NIM sudah terdaftar",
                });
                continue;
            }

            const prodi = await ProgramStudi.findByPk(prodiId);

            if (!prodi) {
                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: `Program studi dengan prodi_id ${prodiId} tidak ditemukan`,
                });
                continue;
            }

            const transaction = await db.transaction();

            try {
                const hashedPassword = await argon2.hash(String(row.password));

                const user = await User.create(
                    {
                        email: row.email,
                        password: hashedPassword,
                        role: "mahasiswa",
                        status: "aktif",
                    },
                    { transaction }
                );

                const mahasiswa = await Mahasiswa.create(
                    {
                        id_user: user.id_user,
                        nim: row.nim,
                        nama_lengkap: row.nama_lengkap,
                        prodi_id: prodiId,
                        angkatan,
                        semester,
                        kontak: row.kontak,
                        email_kampus: row.email_kampus || row.email,
                    },
                    { transaction }
                );

                await LogAktivitas.create(
                    {
                        id_user: req.session.userId,
                        type: "IMPORT_MAHASISWA",
                        description: `Import mahasiswa via Excel: ${row.nama_lengkap} (${row.nim})`,
                    },
                    { transaction }
                );

                await transaction.commit();

                successRows.push({
                    row: rowNumber,
                    id_user: user.id_user,
                    id_mahasiswa: mahasiswa.id_mahasiswa,
                    email: row.email,
                    nim: row.nim,
                    nama_lengkap: row.nama_lengkap,
                });
            } catch (error) {
                await transaction.rollback();

                failedRows.push({
                    row: rowNumber,
                    email: row.email,
                    reason: error.message,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Import mahasiswa selesai",
            summary: {
                total: rows.length,
                success: successRows.length,
                failed: failedRows.length,
            },
            data: {
                successRows,
                failedRows,
            },
        });
    } catch (error) {
        console.error("Import mahasiswa error:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat import mahasiswa",
            error: error.message,
        });
    }
};