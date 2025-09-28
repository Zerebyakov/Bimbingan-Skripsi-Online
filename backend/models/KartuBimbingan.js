import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PengajuanJudul from "./PengajuanJudul.js";


const { DataTypes } = Sequelize;

const KartuBimbingan = db.define("KartuBimbingan", {
    id_kartu: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nomorKartu: {
        type: DataTypes.STRING,

    },
    totalPertemuan: {
        type: DataTypes.INTEGER
    },
    totalBab: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    selesaiAt: {
        type: DataTypes.DATE
    },
    filePath: {
        type: DataTypes.STRING
    }
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: "kartu_bimbingan"
});

PengajuanJudul.hasOne(KartuBimbingan, { foreignKey: "id_pengajuan" });
KartuBimbingan.belongsTo(PengajuanJudul, { foreignKey: "id_pengajuan" });

export default KartuBimbingan;
