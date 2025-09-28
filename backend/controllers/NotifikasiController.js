import Notifikasi from "../models/Notifikasi.js";




export const getNotifikasi = async (req, res) => {
    try {
        const { page = 1, limit = 10, unreadOnly = false } = req.query;
        
        const whereCondition = { id_user: req.session.userId };
        if (unreadOnly === 'true') {
            whereCondition.isRead = false;
        }

        const notifikasi = await Notifikasi.findAndCountAll({
            where: whereCondition,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        res.status(200).json({
            success: true,
            data: {
                notifikasi: notifikasi.rows,
                pagination: {
                    total: notifikasi.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(notifikasi.count / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Mark notifikasi as read
export const markAsRead = async (req, res) => {
    try {
        const { id_notif } = req.params;

        const notifikasi = await Notifikasi.findOne({
            where: { 
                id_notif,
                id_user: req.session.userId 
            }
        });

        if (!notifikasi) {
            return res.status(404).json({
                success: false,
                message: "Notifikasi tidak ditemukan"
            });
        }

        await notifikasi.update({ isRead: true });

        res.status(200).json({
            success: true,
            message: "Notifikasi ditandai telah dibaca"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Mark all notifikasi as read
export const markAllAsRead = async (req, res) => {
    try {
        await Notifikasi.update(
            { isRead: true },
            { where: { id_user: req.session.userId, isRead: false } }
        );

        res.status(200).json({
            success: true,
            message: "Semua notifikasi ditandai telah dibaca"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notifikasi.count({
            where: { 
                id_user: req.session.userId,
                isRead: false 
            }
        });

        res.status(200).json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
