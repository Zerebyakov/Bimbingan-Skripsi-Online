import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Mahasiswa from "./Mahasiswa.js";
import Dosen from "./Dosen.js";
import PeriodeSkripsi from "./PeriodeSkripsi.js";


const { DataTypes } = Sequelize;
const PengajuanJudul = db.define('PengajuanSkripsi', {
    id_pengajuan: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    bidang_topik: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    keywords: {
        type: DataTypes.TEXT
    },
    proposal_file: {
        type: DataTypes.STRING(255)
    },
    status: {
        type: DataTypes.ENUM([
            'draft',
            'diajukan',
            'diterima',
            'revisi',
            'ditolak'
        ]),
        defaultValue: 'draft'
    },
    rejection_reason: {
        type: DataTypes.TEXT
    },
    approvedAt: {
        type: DataTypes.DATE
    }

}, {
    freezeTableName: true,
    timestamps: true,
    tableName: 'pengajuan_judul'
})

Mahasiswa.hasMany(PengajuanJudul, { foreignKey: 'id_mahasiswa' });
PengajuanJudul.belongsTo(Mahasiswa, { foreignKey: 'id_mahasiswa' })

Dosen.hasMany(PengajuanJudul, { foreignKey: "dosenId1" });
PengajuanJudul.belongsTo(Dosen, { foreignKey: "dosenId1", as: "Pembimbing1" });

Dosen.hasMany(PengajuanJudul, { foreignKey: "dosenId2" });
PengajuanJudul.belongsTo(Dosen, { foreignKey: "dosenId2", as: "Pembimbing2" });

PeriodeSkripsi.hasMany(PengajuanJudul, { foreignKey: "id_periode" });
PengajuanJudul.belongsTo(PeriodeSkripsi, { foreignKey: "id_periode" });

export default PengajuanJudul;