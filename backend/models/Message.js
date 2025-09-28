import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import PengajuanJudul from "./PengajuanJudul.js";
import User from "./User.js";

const { DataTypes } = Sequelize;
const Message = db.define('Message', {
    id_message: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT
    },
    attachmentPath: {
        type: DataTypes.STRING
    },
    attachmentName: {
        type: DataTypes.STRING
    }
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: 'messages'
});

PengajuanJudul.hasMany(Message, { foreignKey: "id_pengajuan" });
Message.belongsTo(PengajuanJudul, { foreignKey: "id_pengajuan" });

User.hasMany(Message, { foreignKey: "senderId" });
Message.belongsTo(User, { foreignKey: "senderId" });

export default Message