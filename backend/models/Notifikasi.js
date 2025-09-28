import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./User.js";

const { DataTypes } = Sequelize;

const Notifikasi = db.define("Notifikasi", {
    id_notif: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        type: DataTypes.STRING(50)
    },
    message: {
        type: DataTypes.STRING
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: "notifikasi"
});

User.hasMany(Notifikasi, { foreignKey: "id_user" });
Notifikasi.belongsTo(User, { foreignKey: "id_user" });

export default Notifikasi;
