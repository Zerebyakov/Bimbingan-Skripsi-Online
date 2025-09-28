import { Sequelize } from "sequelize";
import db from "../config/Database.js";


const {DataTypes} =Sequelize;
const PeriodeSkripsi = db.define('PeriodeSkripsi',{
    id_periode:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    tahun_akademik:{
        type: DataTypes.STRING(20),
        allowNull: false
    },
    semester:{
        type: DataTypes.ENUM([
            'genap',
            'ganjil'
        ])
    },
    isActive:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
},{
    freezeTableName: true,
    timestamps: true,
    tableName: 'periode_skripsi'
})

export default PeriodeSkripsi;