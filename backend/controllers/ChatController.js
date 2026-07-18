import { io } from "../index.js";
import Dosen from "../models/Dosen.js";
import LogAktivitas from "../models/LogAktivitas.js";
import Mahasiswa from "../models/Mahasiswa.js";
import Message from "../models/Message.js";
import Notifikasi from "../models/Notifikasi.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import User from "../models/User.js";
import { deleteOldFile } from "../middleware/fileUploadMiddleware.js";

// Include standar untuk pesan: pengirim beserta nama dosen/mahasiswa
const messageInclude = [
    {
        model: User,
        as: "User",
        attributes: ["email", "role"],
        include: [
            { model: Dosen, attributes: ["nama"] },
            { model: Mahasiswa, attributes: ["nama_lengkap"] },
        ],
    },
];

export const sendMessage = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;
        const { content } = req.body;
        const attachmentPath = req.file ? req.file.filename : null;
        const attachmentName = req.file ? req.file.originalname : null;

        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan, {
            include: [{ model: Mahasiswa }],
        });
        if (!pengajuan) {
            return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });
        }

        const userRole = req.session.role;
        const userId = req.session.userId;
        if (!userRole || !userId) {
            return res.status(401).json({ success: false, message: "Sesi pengguna tidak ditemukan" });
        }

        //  UPDATE: Validasi hak akses (hapus pembimbing 3)
        if (userRole === "mahasiswa") {
            const mhs = await Mahasiswa.findOne({ where: { id_user: userId } });
            if (pengajuan.id_mahasiswa !== mhs.id_mahasiswa)
                return res.status(403).json({ success: false, message: "Tidak memiliki akses" });
        } else if (userRole === "dosen") {
            const dosen = await Dosen.findOne({ where: { id_user: userId } });
            //  Cek hanya pembimbing 1 dan 2
            if (![pengajuan.dosenId1, pengajuan.dosenId2].includes(dosen.id_dosen))
                return res.status(403).json({ success: false, message: "Tidak memiliki akses" });
        }

        // 💬 Simpan pesan
        const newMsg = await Message.create({
            id_pengajuan,
            senderId: userId,
            content,
            attachmentPath,
            attachmentName,
        });

        // Ambil pesan lengkap dengan relasi
        const fullMsg = await Message.findByPk(newMsg.id_message, {
            include: messageInclude,
        });

        //  Emit ke room
        console.log(" Emitting message to room:", id_pengajuan);
        io.to(`room_${id_pengajuan}`).emit("message:new", fullMsg);

        //  UPDATE: Kirim notifikasi (hapus dosenId3)
        if (userRole === "mahasiswa") {
            const dosenIds = [pengajuan.dosenId1, pengajuan.dosenId2].filter(Boolean);
            for (const id of dosenIds) {
                const dosen = await Dosen.findByPk(id);
                if (dosen) {
                    const notif = await Notifikasi.create({
                        id_user: dosen.id_user,
                        type: "NEW_MESSAGE",
                        message: `Pesan baru dari ${pengajuan.Mahasiswa.nama_lengkap}`,
                    });
                    io.to(`user_${dosen.id_user}`).emit("notification:new", notif);
                }
            }
        } else if (userRole === "dosen") {
            const notif = await Notifikasi.create({
                id_user: pengajuan.Mahasiswa.id_user,
                type: "NEW_MESSAGE",
                message: "Pesan baru dari dosen pembimbing",
            });
            io.to(`user_${pengajuan.Mahasiswa.id_user}`).emit("notification:new", notif);
        }

        // 🧾 Log aktivitas
        await LogAktivitas.create({
            id_user: userId,
            id_pengajuan,
            type: "SEND_MESSAGE",
            description: `${userRole} mengirim pesan`,
        });

        res.status(201).json({ success: true, message: "Pesan berhasil dikirim", data: fullMsg });
    } catch (error) {
        console.error(" Send message error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get messages dalam pengajuan
export const getMessages = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const messages = await Message.findAndCountAll({
            where: { id_pengajuan },
            include: [{
                model: User,
                as: 'User',
                attributes: ['email', 'role'],
                include: [
                    { model: Dosen, attributes: ['nama'] },
                    { model: Mahasiswa, attributes: ['nama_lengkap'] }
                ]
            }],
            order: [['createdAt', 'ASC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        res.status(200).json({
            success: true,
            data: {
                messages: messages.rows,
                pagination: {
                    total: messages.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(messages.count / limit)
                }
            }
        });
    } catch (error) {
        console.error(" Get messages error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Export chat history
export const exportChatHistory = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;

        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan, {
            include: [
                { model: Mahasiswa },
                {
                    model: Message,
                    as: "Messages",
                    include: [{
                        model: User,
                        as: "User",
                        include: [
                            { model: Dosen, attributes: ['nama'] },
                            { model: Mahasiswa, attributes: ['nama_lengkap'] }
                        ]
                    }]
                }
            ],
            order: [[{ model: Message, as: "Messages" }, 'createdAt', 'ASC']]
        });

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        // Generate formatted chat history
        // Catatan: asosiasi User-Dosen adalah hasOne, jadi propertinya "Dosen" (tunggal)
        const chatHistory = pengajuan.Messages.map(msg => ({
            timestamp: msg.createdAt,
            sender: msg.User.role === 'dosen' ?
                (msg.User.Dosen?.nama || 'Dosen') :
                (msg.User.Mahasiswa?.nama_lengkap || 'Mahasiswa'),
            role: msg.User.role,
            content: msg.content,
            attachment: msg.attachmentName
        }));

        res.status(200).json({
            success: true,
            data: {
                pengajuan: {
                    title: pengajuan.title,
                    mahasiswa: pengajuan.Mahasiswa.nama_lengkap
                },
                chatHistory
            }
        });
    } catch (error) {
        console.error(" Export chat error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Edit pesan (hanya pengirim, hanya isi teks)
export const updateMessage = async (req, res) => {
    try {
        const { id_message } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Isi pesan tidak boleh kosong",
            });
        }

        const message = await Message.findByPk(id_message);
        if (!message) {
            return res.status(404).json({ success: false, message: "Pesan tidak ditemukan" });
        }

        if (Number(message.senderId) !== Number(req.session.userId)) {
            return res.status(403).json({
                success: false,
                message: "Anda hanya dapat mengedit pesan Anda sendiri",
            });
        }

        await message.update({ content: content.trim() });

        const fullMsg = await Message.findByPk(id_message, { include: messageInclude });
        io.to(`room_${message.id_pengajuan}`).emit("message:updated", fullMsg);

        res.status(200).json({
            success: true,
            message: "Pesan berhasil diperbarui",
            data: fullMsg,
        });
    } catch (error) {
        console.error(" Update message error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Hapus pesan (hanya pengirim; lampiran ikut dihapus)
export const deleteMessage = async (req, res) => {
    try {
        const { id_message } = req.params;

        const message = await Message.findByPk(id_message);
        if (!message) {
            return res.status(404).json({ success: false, message: "Pesan tidak ditemukan" });
        }

        if (Number(message.senderId) !== Number(req.session.userId)) {
            return res.status(403).json({
                success: false,
                message: "Anda hanya dapat menghapus pesan Anda sendiri",
            });
        }

        // Hanya hapus file yang memang milik folder chat.
        // attachmentPath yang mengandung "/" (mis. "bab/xxx.pdf") menunjuk file
        // fitur lain (upload bab) dan tidak boleh ikut terhapus.
        if (message.attachmentPath && !message.attachmentPath.includes("/")) {
            deleteOldFile(`uploads/chat/${message.attachmentPath}`);
        }

        const payload = {
            id_message: message.id_message,
            id_pengajuan: message.id_pengajuan,
        };

        await message.destroy();
        io.to(`room_${payload.id_pengajuan}`).emit("message:deleted", payload);

        res.status(200).json({
            success: true,
            message: "Pesan berhasil dihapus",
            data: payload,
        });
    } catch (error) {
        console.error(" Delete message error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};