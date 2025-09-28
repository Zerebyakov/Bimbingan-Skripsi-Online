import Dosen from "../models/Dosen.js";
import Mahasiswa from "../models/Mahasiswa.js";
import Message from "../models/Message.js";
import Notifikasi from "../models/Notifikasi.js";
import PengajuanJudul from "../models/PengajuanJudul.js";



// Send message dalam bimbingan
export const sendMessage = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;
        const { content } = req.body;
        const attachmentPath = req.file ? req.file.filename : null;
        const attachmentName = req.file ? req.file.originalname : null;

        // Validasi pengajuan
        const pengajuan = await PengajuanJudul.findByPk(id_pengajuan, {
            include: [{ model: Mahasiswa }]
        });

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        // Cek authorization - hanya mahasiswa pemilik atau dosen pembimbing yang bisa kirim message
        const userRole = req.session.role;
        const userId = req.session.userId;

        if (userRole === 'mahasiswa') {
            const mahasiswa = await Mahasiswa.findOne({ where: { id_user: userId } });
            if (pengajuan.id_mahasiswa !== mahasiswa.id_mahasiswa) {
                return res.status(403).json({
                    success: false,
                    message: "Tidak memiliki akses"
                });
            }
        } else if (userRole === 'dosen') {
            const dosen = await Dosen.findOne({ where: { id_user: userId } });
            if (pengajuan.dosenId1 !== dosen.id_dosen && pengajuan.dosenId2 !== dosen.id_dosen) {
                return res.status(403).json({
                    success: false,
                    message: "Tidak memiliki akses"
                });
            }
        }

        const message = await Message.create({
            id_pengajuan,
            senderId: userId,
            content,
            attachmentPath,
            attachmentName
        });

        // Create notification untuk pihak lain
        if (userRole === 'mahasiswa') {
            // Notify dosen
            const dosenIds = [pengajuan.dosenId1, pengajuan.dosenId2].filter(Boolean);
            for (const dosenId of dosenIds) {
                const dosen = await Dosen.findByPk(dosenId);
                await Notifikasi.create({
                    id_user: dosen.id_user,
                    type: 'NEW_MESSAGE',
                    message: `Pesan baru dari ${pengajuan.Mahasiswa.nama_lengkap}`
                });
            }
        } else if (userRole === 'dosen') {
            // Notify mahasiswa
            await Notifikasi.create({
                id_user: pengajuan.Mahasiswa.id_user,
                type: 'NEW_MESSAGE',
                message: 'Pesan baru dari dosen pembimbing'
            });
        }

        // Log aktivitas
        await LogAktivitas.create({
            id_user: userId,
            id_pengajuan,
            type: 'SEND_MESSAGE',
            description: userRole === 'mahasiswa' ? 'Mahasiswa mengirim pesan' : 'Dosen mengirim pesan'
        });

        res.status(201).json({
            success: true,
            message: "Pesan berhasil dikirim",
            data: message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get messages dalam pengajuan
export const getMessages = async (req, res) => {
    try {
        const { id_pengajuan } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const messages = await Message.findAndCountAll({
            where: { id_pengajuan },
            include: [{
                model: User,
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
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
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
                    include: [{
                        model: User,
                        include: [
                            { model: Dosen, attributes: ['nama'] },
                            { model: Mahasiswa, attributes: ['nama_lengkap'] }
                        ]
                    }]
                }
            ]
        });

        if (!pengajuan) {
            return res.status(404).json({
                success: false,
                message: "Pengajuan tidak ditemukan"
            });
        }

        // Generate formatted chat history
        const chatHistory = pengajuan.Messages.map(msg => ({
            timestamp: msg.createdAt,
            sender: msg.User.role === 'dosen' ? 
                (msg.User.Dosens[0]?.nama || 'Dosen') : 
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
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};