import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv';
import session from 'express-session';
import db from './config/Database.js';
import apiRoutes from './routes/allRoutes.js'
import path from 'path'






dotenv.config();


const app = express();
app.listen(process.env.PORT_APP, () => {
    console.log('Server up and running !!')
});


app.use(cors({
    credentials: true,
    origin: process.env.APP_ORIGIN
}));
app.use(express.json())
app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false
    },
    name: 'sessionId'
}))


const testDatebaseConnection = async () => {
    try {
        await db.authenticate();
        console.log('Database connection established succesfully')

        await db.sync({ force: false })
        console.log('Database synchronized succesfully')
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}
testDatebaseConnection();

app.use('/uploads', (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
}, express.static(path.join(process.cwd(), 'uploads')));
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