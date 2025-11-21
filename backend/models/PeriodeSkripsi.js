import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const PeriodeSkripsi = db.define('PeriodeSkripsi', {
    id_periode: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    tahun_akademik: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    semester: {
        type: DataTypes.ENUM('genap', 'ganjil'),
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    kuotaPerDosen: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10 // Sesuaikan dengan kebutuhan
    },
    formatNomorKartu: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'KB' // Contoh format
    },
    tanggalMulaiBimbingan: {
        type: DataTypes.DATE,
        allowNull: true
    },
    tanggalSelesaiBimbingan: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: 'periode_skripsi',
    indexes: [
        {
            unique: true,
            fields: ['tahun_akademik', 'semester']
        }
    ]
});

export default PeriodeSkripsi;