import express from "express";
import { verifyAdmin, verifySession } from "../middleware/authMiddleware.js";
import excelUpload, {
    handleExcelUploadError,
} from "../middleware/excelUploadMiddleware.js";

import {
    downloadTemplateDosen,
    downloadTemplateMahasiswa,
    importDosenExcel,
    importMahasiswaExcel,
} from "../controllers/ImportUserController.js";

const router = express.Router();

router.use(verifySession);
router.use(verifyAdmin);

router.get("/template/dosen", downloadTemplateDosen);
router.get("/template/mahasiswa", downloadTemplateMahasiswa);

router.post(
    "/dosen",
    excelUpload.single("file"),
    handleExcelUploadError,
    importDosenExcel
);

router.post(
    "/mahasiswa",
    excelUpload.single("file"),
    handleExcelUploadError,
    importMahasiswaExcel
);

export default router;