import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./User.js";

const { DataTypes } = Sequelize;

// Langganan Web Push per perangkat/browser milik user
const PushSubscription = db.define("PushSubscription", {
    id_subscription: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    endpoint: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
    },
    p256dh: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    auth: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
}, {
    freezeTableName: true,
    timestamps: true,
    tableName: "push_subscriptions",
});

User.hasMany(PushSubscription, { foreignKey: "id_user" });
PushSubscription.belongsTo(User, { foreignKey: "id_user" });

export default PushSubscription;
