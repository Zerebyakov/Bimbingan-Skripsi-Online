import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PengajuanSimilarityCheck from "./PengajuanSimilarityCheck.js";

const { DataTypes } = Sequelize;

const PengajuanSimilarityResult = db.define("PengajuanSimilarityResult", {
    id_result: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_check: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    source_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    source_table: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    matched_title: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    similarity_score: {
        type: DataTypes.DECIMAL(8, 6),
        defaultValue: 0,
    },
    is_similar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    rank_position: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: "pengajuan_similarity_results",
});

PengajuanSimilarityCheck.hasMany(PengajuanSimilarityResult, {
    foreignKey: "id_check",
    as: "Results",
});

PengajuanSimilarityResult.belongsTo(PengajuanSimilarityCheck, {
    foreignKey: "id_check",
});

export default PengajuanSimilarityResult;