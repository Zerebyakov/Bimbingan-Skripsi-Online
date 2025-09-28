import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PengajuanJudul from "./PengajuanJudul.js";


const { DataTypes } = Sequelize;

const BabSubmission = db.define('BabSubmission', {
    id_bab: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    chapter_number: {
        type: DataTypes.INTEGER
    },
    file_path: {
        type: DataTypes.STRING(255)
    },
    original_name: {
        type: DataTypes.STRING
    },
    mimeType: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM([
            'menunggu',
            'revisi',
            'diterima'
        ]),
        defaultValue: 'menunggu'
    },
    notes: {
        type: DataTypes.TEXT
    },
    submittedAt: {
        type: DataTypes.DATE
    }
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: 'bab_submission'
})

PengajuanJudul.hasMany(BabSubmission, { foreignKey: "id_pengajuan" });
BabSubmission.belongsTo(PengajuanJudul, { foreignKey: "id_pengajuan" });

export default BabSubmission;