import { io } from "socket.io-client";
import { socketUrl } from "../components/api/myAPI";

export let socket = null;

export const initSocket = (userId, pengajuanId = null) => {
    // Jika sudah terkoneksi, return instance yang ada
    if (socket?.connected) {
        console.log("🔄 Socket already connected, reusing...");

        // Join room jika belum
        if (userId) socket.emit("joinUserRoom", userId);
        if (pengajuanId) socket.emit("joinRoom", pengajuanId);

        return socket;
    }

    // Disconnect socket lama jika ada
    if (socket) {
        socket.disconnect();
    }

    console.log("🔌 Initializing new socket connection...");

    socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
        console.log("🟢 Socket connected:", socket.id);

        // Auto-join rooms setelah connect
        if (userId) {
            socket.emit("joinUserRoom", userId);
            console.log(`👤 Joined user room: ${userId}`);
        }
        if (pengajuanId) {
            socket.emit("joinRoom", pengajuanId);
            console.log(`🔥 Joined chat room: ${pengajuanId}`);
        }
    });

    socket.on("connect_error", (err) => {
        console.error("⚠️ Socket connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
        console.log("🔴 Socket disconnected:", reason);

        // Auto-reconnect jika server disconnect
        if (reason === "io server disconnect") {
            socket.connect();
        }
    });

    socket.on("reconnect", (attemptNumber) => {
        console.log("🔄 Socket reconnected after", attemptNumber, "attempts");

        // Re-join rooms setelah reconnect
        if (userId) socket.emit("joinUserRoom", userId);
        if (pengajuanId) socket.emit("joinRoom", pengajuanId);
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        console.warn("⚠️ Socket not initialized yet");
    }
    return socket;
};

export const joinChatRoom = (roomId) => {
    if (socket?.connected) {
        socket.emit("joinRoom", roomId);
        console.log(`🔥 Joined room: ${roomId}`);
    } else {
        console.warn("⚠️ Socket not connected, cannot join room");
    }
};

export const leaveChatRoom = (roomId) => {
    if (socket?.connected) {
        socket.emit("leaveRoom", roomId);
        console.log(`👋 Left room: ${roomId}`);
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log("🔌 Socket disconnected manually");
    }
};