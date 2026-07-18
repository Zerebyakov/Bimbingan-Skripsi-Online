import axios from "axios";
import { baseUrl } from "../components/api/myAPI";

// Konversi VAPID public key (base64url) ke Uint8Array untuk PushManager
const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

// Daftarkan perangkat ini untuk menerima push notification.
// Berjalan diam-diam: jika browser tidak mendukung / user menolak izin,
// aplikasi tetap berfungsi normal (notifikasi in-app tetap ada).
export const initPushNotifications = async () => {
    try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        if (Notification.permission === "denied") return;

        // SW hanya terdaftar di build produksi
        const registration = await navigator.serviceWorker.ready;

        if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;
        }

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            const res = await axios.get(`${baseUrl}notifikasi/push/public-key`, {
                withCredentials: true,
            });
            const publicKey = res.data?.data?.publicKey;
            if (!publicKey) return; // VAPID belum dikonfigurasi di server

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
        }

        // Simpan/refresh langganan di server (terikat ke user yang sedang login)
        await axios.post(
            `${baseUrl}notifikasi/push/subscribe`,
            subscription.toJSON(),
            { withCredentials: true }
        );
    } catch (error) {
        console.warn("Push notification tidak aktif:", error.message);
    }
};
