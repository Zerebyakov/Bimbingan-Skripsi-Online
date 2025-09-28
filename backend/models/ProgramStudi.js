import { Sequelize } from "sequelize";
import db from "../config/Database.js";



const {DataTypes} = Sequelize;

const ProgramStudi = db.define('Prodi',{
    prodi_id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    kode_prodi:{
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    },
    program_studi:{
        type: DataTypes.STRING(50),
        allowNull: false
    }
},{
    freezeTableName: true,
    timestamps: true,
    tableName:'prodis'
})


export default ProgramStudi;