import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PengajuanJudul from "./PengajuanJudul.js";

const { DataTypes } = Sequelize;

const LaporanAkhir = db.define("LaporanAkhir", {
  id_laporan: {
    type: DataTypes.INTEGER,
    autoIncrement: true, 
    primaryKey: true,
  },
  finalFile: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  abstrakFile: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  pengesahanFile: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  pernyataanFile: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  presentasiFile: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("menunggu", "revisi", "diterima", "ditolak"),
    allowNull: false,
    defaultValue: "menunggu"
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  verifiedAt: {
    type: DataTypes.DATE,
  }
}, {
  freezeTableName: true,
  timestamps: true,
  tableName: "laporan_akhir",
});

PengajuanJudul.hasOne(LaporanAkhir, { foreignKey: "id_pengajuan" });
LaporanAkhir.belongsTo(PengajuanJudul, { foreignKey: "id_pengajuan" });

export default LaporanAkhir;
