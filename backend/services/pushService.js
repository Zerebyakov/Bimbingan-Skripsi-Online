import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";
import Notifikasi from "../models/Notifikasi.js";

let pushEnabled = false;

// Kirim push ke seluruh perangkat milik satu user.
// Langganan yang sudah mati (410/404) otomatis dihapus.
export const sendPushToUser = async (id_user, payload) => {
    if (!pushEnabled) return;
    try {
        const subscriptions = await PushSubscription.findAll({ where: { id_user } });
        const body = JSON.stringify(payload);

        await Promise.all(subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, body);
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await sub.destroy(); // langganan kedaluwarsa
                } else {
                    console.error("Push gagal:", err.statusCode || err.message);
                }
            }
        }));
    } catch (error) {
        console.error("sendPushToUser error:", error.message);
    }
};

// Inisialisasi VAPID + hook: SETIAP Notifikasi.create di mana pun
// otomatis ikut dikirim sebagai push notification.
export const initPushService = () => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

    if (!publicKey || !privateKey) {
        console.warn("🔕 Web Push nonaktif: VAPID keys belum diset di .env");
        return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    pushEnabled = true;

    Notifikasi.afterCreate((notif) => {
        // Jangan blokir alur utama; kirim di background
        sendPushToUser(notif.id_user, {
            title: "Bimbingan Skripsi Online",
            body: notif.message,
            url: "/",
        });
    });

    console.log("🔔 Web Push aktif (VAPID terkonfigurasi)");
};
