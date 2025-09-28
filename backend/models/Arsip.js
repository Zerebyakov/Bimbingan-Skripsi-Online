import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PengajuanJudul from "./PengajuanJudul.js";


const { DataTypes } = Sequelize;

const Arsip = db.define("Arsip", {
    id_arsip: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    tanggalSelesai: {
        type: DataTypes.DATE,
    },
    status: {
        type: DataTypes.ENUM("SELESAI", "LULUS", "REVISI_ULANG"),
        allowNull: false,
        defaultValue: "SELESAI", // Menetapkan default value untuk status
    },
    fileFinal: {
        type: DataTypes.STRING,
    },
    kartuBimbinganFile: {
        type: DataTypes.STRING,
        allowNull: true, // Kartu bimbingan bisa null jika belum ada
    }
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: "arsip",
});

PengajuanJudul.hasOne(Arsip, { foreignKey: "id_pengajuan" });
Arsip.belongsTo(PengajuanJudul, { foreignKey: "id_pengajuan" });

export default Arsip;
