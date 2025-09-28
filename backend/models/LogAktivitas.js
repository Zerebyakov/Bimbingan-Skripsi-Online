import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./User.js";
import PengajuanJudul from "./PengajuanJudul.js";


const { DataTypes } = Sequelize;

const LogAktivitas = db.define('LogAktivitas', {
    id_log: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        type: DataTypes.STRING(50)
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: 'log_aktivitas'
})

User.hasMany(LogAktivitas, { foreignKey: "id_user" });
LogAktivitas.belongsTo(User, { foreignKey: "id_user" });


PengajuanJudul.hasMany(LogAktivitas, { foreignKey: "id_pengajuan" });
LogAktivitas.belongsTo(PengajuanJudul, { foreignKey: "id_pengajuan" });

export default LogAktivitas;