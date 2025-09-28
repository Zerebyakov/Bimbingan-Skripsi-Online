import { Sequelize } from "sequelize";
import db from "../config/Database.js";


const { DataTypes } = Sequelize;
const User = db.define('User', {
    id_user: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM("admin", "dosen", "mahasiswa"),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("aktif", "nonaktif"),
        defaultValue: "aktif"
    }
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: 'users'
})


export default User