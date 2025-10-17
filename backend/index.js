import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv';
import session from 'express-session';
import db from './config/Database.js';
import apiRoutes from './routes/allRoutes.js'
import path from 'path'
import { Server } from 'socket.io';
import http from 'http'

dotenv.config();

const app = express();

const server = http.createServer(app);

// Setup Socket.IO 
export const io = new Server(server, {
    cors: {
        origin: process.env.APP_ORIGIN,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('🟢 Socket Connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
        socket.join(`room_${roomId}`);
        console.log(`🔥 User ${socket.id} joined room_${roomId}`);
    });

    socket.on("joinUserRoom", (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${socket.id} joined user_${userId}`);
    });

    socket.on("leaveRoom", (roomId) => {
        socket.leave(`room_${roomId}`);
        console.log(`👋 User ${socket.id} left room_${roomId}`);
    });

    socket.on("message:send", (data) => {
        console.log("💬 Broadcasting message to room:", data.id_pengajuan);
        // Emit ke room (termasuk pengirim)
        io.to(`room_${data.id_pengajuan}`).emit("message:new", data);
    });

    socket.on("disconnect", (reason) => {
        console.log("🔴 Socket disconnected:", socket.id, reason);
    });
});

app.use(cors({
    credentials: true,
    origin: process.env.APP_ORIGIN
}));

app.use(express.json());
app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false
    },
    name: 'sessionId'
}));

// Database connection
const testDatebaseConnection = async () => {
    try {
        await db.authenticate();
        console.log('✅ Database connection established successfully');

        await db.sync({ force: false });
        console.log('✅ Database synchronized successfully');
    } catch (error) {
        console.log('❌ Database error:', error.message);
        process.exit(1);
    }
}
testDatebaseConnection();

// Static files
app.use('/uploads', (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
}, express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/v1', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Bimbingan API",
        version: "1.0.0",
        endpoints: {
            auth: "/api/v1/auth",
            admin: "/api/v1/admin",
            dosen: "/api/v1/dosen",
            mahasiswa: "/api/v1/mahasiswa",
            chat: "/api/v1/chat",
            notifikasi: "/api/v1/notifikasi",
            pengajuan: "/api/v1/pengajuan",
            arsip: "/api/v1/arsip",
            prodi: "/api/v1/prodi",
        },
        documentation: "https://documenter.getpostman.com/your-collection"
    });
});

// Listen menggunakan server, bukan app
const PORT = process.env.PORT_APP;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 Socket.IO ready for connections`);
});