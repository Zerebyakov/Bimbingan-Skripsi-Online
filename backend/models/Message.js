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
  },
  senderId: { 
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_pengajuan: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: true,
  tableName: 'messages'
});

// Relasi antar model (dengan alias yang eksplisit)
PengajuanJudul.hasMany(Message, { foreignKey: "id_pengajuan", as: "Messages" });
Message.belongsTo(PengajuanJudul, { foreignKey: "id_pengajuan", as: "Pengajuan" });

User.hasMany(Message, { foreignKey: "senderId", as: "Messages" });
Message.belongsTo(User, { foreignKey: "senderId", as: "User" }); // tambahkan alias

export default Message;
