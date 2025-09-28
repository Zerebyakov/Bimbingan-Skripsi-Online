import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const KonfigurasiSistem = db.define("KonfigurasiSistem", {
  id_konfig: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tahunAkademikAktif: {
    type: DataTypes.STRING(20),
  },
  semesterAktif: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  kuotaPerDosen: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  formatNomorKartu: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tanggalMulaiBimbingan: {
    type: DataTypes.DATE,
    allowNull: true, // Tanggal mulai bimbingan bisa kosong jika tidak diatur
  },
  tanggalSelesaiBimbingan: {
    type: DataTypes.DATE,
  }
}, {
  freezeTableName: true,
  timestamps: true,
  tableName: "konfigurasi_sistem",
});

export default KonfigurasiSistem;
