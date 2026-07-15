import { Op } from "sequelize";
import PengajuanJudul from "../models/PengajuanJudul.js";
import Arsip from "../models/Arsip.js";
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

export const buildCandidateTitles = async ({ excludePengajuanId = null } = {}) => {
    const candidatesMap = new Map();

    const acceptedPengajuan = await PengajuanJudul.findAll({
        where: {
            status: "diterima",
            ...(excludePengajuanId
                ? { id_pengajuan: { [Op.ne]: excludePengajuanId } }
                : {}),
        },
        attributes: ["id_pengajuan", "title", "status"],
    });

    acceptedPengajuan.forEach((item) => {
        const raw = item.toJSON();
        const key = normalizeKey(raw.title);

        if (key) {
            candidatesMap.set(key, {
                id: String(raw.id_pengajuan),
                title: raw.title,
                source: "pengajuan_judul",
            });
        }
    });

    const arsipList = await Arsip.findAll({
        include: [
            {
                model: PengajuanJudul,
                attributes: ["id_pengajuan", "title", "status"],
                required: true,
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

    return await checkTitleSimilarity({
        queryTitle: title,
        candidates,
        topK,
    });
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