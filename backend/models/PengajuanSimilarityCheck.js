import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PengajuanJudul from "./PengajuanJudul.js";

const { DataTypes } = Sequelize;

const PengajuanSimilarityCheck = db.define("PengajuanSimilarityCheck", {
    id_check: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_pengajuan: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    query_title: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    max_score: {
        type: DataTypes.DECIMAL(8, 6),
        defaultValue: 0,
    },
    threshold_value: {
        type: DataTypes.DECIMAL(8, 6),
        defaultValue: 0,
    },
    status_similarity: {
        type: DataTypes.ENUM("AMAN", "PERLU_REVIEW", "MIRIP"),
        defaultValue: "AMAN",
    },
    checkedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: "pengajuan_similarity_checks",
});

PengajuanJudul.hasMany(PengajuanSimilarityCheck, {
    foreignKey: "id_pengajuan",
    as: "SimilarityChecks",
});

PengajuanSimilarityCheck.belongsTo(PengajuanJudul, {
    foreignKey: "id_pengajuan",
});

export default PengajuanSimilarityCheck;