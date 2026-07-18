import { Op } from "sequelize";
import PeriodeSkripsi from "../models/PeriodeSkripsi.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import Arsip from "../models/Arsip.js";
import Mahasiswa from "../models/Mahasiswa.js";
import Notifikasi from "../models/Notifikasi.js";

// Hari-H pengingat sebelum akhir periode bimbingan
const REMIND_DAYS = [30, 14, 7, 3, 1];

// Kirim notifikasi pengingat deadline ke mahasiswa yang masih bimbingan aktif.
// Dedup per hari: satu mahasiswa hanya menerima satu pengingat per hari.
export const checkDeadlineReminders = async (io) => {
    try {
        const periode = await PeriodeSkripsi.findOne({ where: { isActive: true } });
        if (!periode?.tanggalSelesaiBimbingan) return;

        const daysLeft = Math.ceil(
            (new Date(periode.tanggalSelesaiBimbingan).getTime() - Date.now()) / 86400000
        );
        if (!REMIND_DAYS.includes(daysLeft)) return;

        const aktif = await PengajuanJudul.findAll({
            where: { status: "diterima" },
            include: [{ model: Mahasiswa }, { model: Arsip }],
        });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        for (const pengajuan of aktif) {
            // Yang sudah selesai (diarsipkan) tidak perlu diingatkan
            if (pengajuan.Arsip || !pengajuan.Mahasiswa) continue;

            const sudahDikirim = await Notifikasi.findOne({
                where: {
                    id_user: pengajuan.Mahasiswa.id_user,
                    type: "DEADLINE_REMINDER",
                    createdAt: { [Op.gte]: startOfDay },
                },
            });
            if (sudahDikirim) continue;

            const notif = await Notifikasi.create({
                id_user: pengajuan.Mahasiswa.id_user,
                type: "DEADLINE_REMINDER",
                message: `⏰ Sisa ${daysLeft} hari menuju akhir periode bimbingan ${periode.tahun_akademik} semester ${periode.semester}. Segera selesaikan tahapan skripsimu.`,
            });

            io?.to(`user_${pengajuan.Mahasiswa.id_user}`).emit("notification:new", notif);
        }

        console.log(`⏰ Deadline reminder terkirim (H-${daysLeft}).`);
    } catch (error) {
        console.error("Deadline reminder error:", error.message);
    }
};

// Jalankan sekali saat server start (delay agar DB siap), lalu tiap 12 jam.
export const startDeadlineReminder = (io) => {
    setTimeout(() => checkDeadlineReminders(io), 15 * 1000);
    setInterval(() => checkDeadlineReminders(io), 12 * 60 * 60 * 1000);
};
