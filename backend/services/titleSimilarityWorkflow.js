import { Op } from "sequelize";
import PengajuanJudul from "../models/PengajuanJudul.js";
import Arsip from "../models/Arsip.js";
import Mahasiswa from "../models/Mahasiswa.js";
import PengajuanSimilarityCheck from "../models/PengajuanSimilarityCheck.js";
import PengajuanSimilarityResult from "../models/PengajuanSimilarityResult.js";
import { checkTitleSimilarity } from "./similarityService.js";

const normalizeKey = (text = "") => {
    return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

// Ambil tahun dari approvedAt (prioritas) atau createdAt
const extractYear = (pengajuan) => {
    const dateValue = pengajuan?.approvedAt || pengajuan?.createdAt;
    if (!dateValue) return null;
    const year = new Date(dateValue).getFullYear();
    return Number.isNaN(year) ? null : String(year);
};

export const buildCandidateTitles = async ({ excludePengajuanId = null } = {}) => {
    const candidatesMap = new Map();

    const acceptedPengajuan = await PengajuanJudul.findAll({
        where: {
            status: "diterima",
            ...(excludePengajuanId
                ? { id_pengajuan: { [Op.ne]: excludePengajuanId } }
                : {}),
        },
        attributes: ["id_pengajuan", "title", "status", "approvedAt", "createdAt"],
        include: [
            {
                model: Mahasiswa,
                attributes: ["nama_lengkap"],
            },
        ],
    });

    acceptedPengajuan.forEach((item) => {
        const raw = item.toJSON();
        const key = normalizeKey(raw.title);

        if (key) {
            candidatesMap.set(key, {
                id: String(raw.id_pengajuan),
                title: raw.title,
                source: "pengajuan_judul",
                // Metadata untuk pengayaan hasil (tidak dikirim ke ML service)
                author: raw.Mahasiswa?.nama_lengkap || null,
                year: extractYear(raw),
            });
        }
    });

    const arsipList = await Arsip.findAll({
        include: [
            {
                model: PengajuanJudul,
                attributes: ["id_pengajuan", "title", "status", "approvedAt", "createdAt"],
                required: true,
                include: [
                    {
                        model: Mahasiswa,
                        attributes: ["nama_lengkap"],
                    },
                ],
            },
        ],
    });

    arsipList.forEach((item) => {
        const raw = item.toJSON();

        const pengajuan =
            raw.PengajuanSkripsi ||
            raw.PengajuanJudul ||
            raw.Pengajuan;

        const title = pengajuan?.title;
        const key = normalizeKey(title);

        if (key) {
            candidatesMap.set(key, {
                id: String(raw.id_arsip),
                title,
                source: "arsip",
                author: pengajuan?.Mahasiswa?.nama_lengkap || null,
                year: extractYear(pengajuan),
            });
        }
    });

    return Array.from(candidatesMap.values()).filter(
        (item) => item.title && item.title.trim()
    );
};

export const checkSimilarityOnly = async ({ title, topK = 10, excludePengajuanId = null }) => {
    const candidates = await buildCandidateTitles({ excludePengajuanId });

    if (candidates.length === 0) {
        return {
            query_title: title,
            threshold: null,
            top_k: topK,
            total_candidates: 0,
            max_score: 0,
            status: "AMAN",
            results: [],
        };
    }

    // Peta metadata (author, year) berdasarkan source|id untuk pengayaan hasil.
    const metaMap = new Map(
        candidates.map((c) => [`${c.source}|${c.id}`, { author: c.author, year: c.year }])
    );

    // Kirim hanya field yang dikenal ML service (id, title, source).
    const similarityResult = await checkTitleSimilarity({
        queryTitle: title,
        candidates: candidates.map(({ id, title: t, source }) => ({ id, title: t, source })),
        topK,
    });

    // Perkaya setiap hasil dengan nama mahasiswa dan tahun dari peta metadata.
    const enrichedResults = (similarityResult.results || []).map((item) => {
        const meta = metaMap.get(`${item.source}|${item.id}`) || {};
        return {
            ...item,
            author: meta.author || null,
            year: meta.year || null,
        };
    });

    return {
        ...similarityResult,
        results: enrichedResults,
    };
};

export const saveSimilarityResult = async ({ id_pengajuan, title, similarityResult }) => {
    const oldChecks = await PengajuanSimilarityCheck.findAll({
        where: { id_pengajuan },
        attributes: ["id_check"],
    });

    const oldCheckIds = oldChecks.map((item) => item.id_check);

    if (oldCheckIds.length > 0) {
        await PengajuanSimilarityResult.destroy({
            where: {
                id_check: {
                    [Op.in]: oldCheckIds,
                },
            },
        });

        await PengajuanSimilarityCheck.destroy({
            where: { id_pengajuan },
        });
    }

    const check = await PengajuanSimilarityCheck.create({
        id_pengajuan,
        query_title: title,
        max_score: similarityResult.max_score || 0,
        threshold_value: similarityResult.threshold || 0,
        status_similarity: similarityResult.status || "AMAN",
        checkedAt: new Date(),
    });

    const resultRows = (similarityResult.results || []).map((item, index) => ({
        id_check: check.id_check,
        source_id: String(item.id),
        source_table: item.source || null,
        matched_title: item.title,
        source_author: item.author || null,
        source_year: item.year || null,
        similarity_score: item.similarity_score || 0,
        is_similar: Boolean(item.is_similar),
        rank_position: index + 1,
    }));

    if (resultRows.length > 0) {
        await PengajuanSimilarityResult.bulkCreate(resultRows);
    }

    return {
        check,
        results: resultRows,
    };
};

export const runAndSaveSimilarityForPengajuan = async ({ pengajuan, title }) => {
    const similarityResult = await checkSimilarityOnly({
        title,
        topK: 10,
        excludePengajuanId: pengajuan.id_pengajuan,
    });

    await saveSimilarityResult({
        id_pengajuan: pengajuan.id_pengajuan,
        title,
        similarityResult,
    });

    return similarityResult;
};