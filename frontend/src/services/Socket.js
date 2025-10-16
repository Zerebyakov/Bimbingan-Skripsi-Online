// src/services/socket.js
import { io } from "socket.io-client";
import { socketUrl } from "../components/api/myAPI";

export const socket = io(socketUrl, {
    withCredentials: true,
    transports: ["websocket"],
});
