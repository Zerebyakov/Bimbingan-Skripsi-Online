import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./User.js";
import ProgramStudi from "./ProgramStudi.js";


const {DataTypes}  =Sequelize;

const Mahasiswa = db.define('Mahasiswa',{
    id_mahasiswa:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_user:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        references:{
            model: User,
            key:'id_user'
        }
    },
    nim:{
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
    },
    nama_lengkap:{
        type: DataTypes.STRING(100),
        allowNull: false
    },
    prodi_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model:ProgramStudi,
            key:'prodi_id'
        }
    },
    angkatan:{
        type: DataTypes.INTEGER
    },
    semester:{
        type: DataTypes.INTEGER
    },
    kontak:{
        type: DataTypes.STRING(50),
        allowNull: false
    },
    email_kampus:{
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    foto:{
        type:DataTypes.STRING(255),
        allowNull: true
    },
    status_akademik:{
        type: DataTypes.ENUM([
            'aktif',
            'cuti',
            'lulus'
        ]),
        defaultValue: 'aktif'
    }
},{
    freezeTableName:true,
    timestamps: true,
    tableName:'mahasiswas'
})

Mahasiswa.hasMany(ProgramStudi, {foreignKey: 'prodi_id'})
ProgramStudi.belongsTo(Mahasiswa, {foreignKey:'prodi_id'})


User.hasOne(Mahasiswa, { foreignKey: "id_user" });
Mahasiswa.belongsTo(User, { foreignKey: "id_user" });

export default Mahasiswa;