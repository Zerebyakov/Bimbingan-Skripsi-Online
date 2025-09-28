import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./User.js";
import ProgramStudi from "./ProgramStudi.js";



const {DataTypes} = Sequelize;

const Dosen = db.define('Dosen',{
    id_dosen:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_user:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: User,
            key: 'id_user'
        }
    },
    nidn:{
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    nama:{
        type: DataTypes.STRING(100),
        allowNull:false
    },
    gelar:{
        type: DataTypes.STRING(50),
        allowNull: false
    },
    prodi_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model:ProgramStudi,
            key:"prodi_id"
        }
    },
    fakultas:{
        type: DataTypes.STRING(50),
        allowNull: true
    },
    bidang_keahlian:{
        type: DataTypes.STRING(50),
        allowNull: true
    },
    jabatan_akademik:{
        type: DataTypes.STRING(50),
        allowNull: true
    },
    status_dosen:{
        type: DataTypes.ENUM([
            'tetap',
            'luar biasa'
        ]),
        defaultValue:'tetap'
    },
    kontak:{
        type: DataTypes.STRING(50),
        allowNull: true
    },
    email_institusi:{
        type: DataTypes.STRING(50),
        allowNull: true
    },
    foto:{
        type: DataTypes.STRING(255),
        allowNull: true
    }
},{
    freezeTableName: true,
    timestamps: true,
    tableName:'dosens'
})

ProgramStudi.hasMany(Dosen, {foreignKey:'prodi_id'});
Dosen.belongsTo(ProgramStudi, {foreignKey:'prodi_id'})


User.hasMany(Dosen, {foreignKey:'id_user'});
Dosen.belongsTo(User, {foreignKey:'id_user'});

export default Dosen;