import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/Database.js";

import Mahasiswa from "../models/Mahasiswa.js";
import PengajuanJudul from "../models/PengajuanJudul.js";
import Dosen from "../models/Dosen.js";

import Arsip from "../models/Arsip.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_PATH = path.join(
  __dirname,
  "../data/dataset_skripsi_dengan_metadata.xlsx"
);

const normalizeText = (text = "") => {
  return String(text)
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const readExcelRows = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });
};

const buildDescription = (row) => {
  if (row.deskripsi && String(row.deskripsi).trim()) {
    return String(row.deskripsi).trim();
  }

  return `Penelitian ini membahas topik "${row.judul_skripsi}" pada bidang ${row.bidang_topik || "Informatika"}.`;
};

const seedPengajuanFromExcel = async () => {
  const transaction = await db.transaction();

  try {
    await db.authenticate();
    console.log("✅ Database connected");

    const rows = readExcelRows(EXCEL_PATH);
    console.log(`📄 Total rows Excel: ${rows.length}`);

    const allMahasiswa = await Mahasiswa.findAll();
    const mahasiswaMap = new Map();

    allMahasiswa.forEach((mhs) => {
      const key = normalizeText(mhs.nama_lengkap);
      mahasiswaMap.set(key, mhs);
    });

    const allDosen = await Dosen.findAll({
      limit: 2,
      order: [["id_dosen", "ASC"]],
    });

    const defaultDosen1 = allDosen[0]?.id_dosen || null;
    const defaultDosen2 = allDosen[1]?.id_dosen || null;

    let created = 0;
    let skipped = 0;
    let failed = 0;

    const failedRows = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const row = rows[i];

      const namaMahasiswa = String(row.nama_mahasiswa || "").trim();
      const title = String(row.judul_skripsi || "").trim();
      const bidangTopik = String(row.bidang_topik || "Informatika").trim();
      const keywords = String(row.keywords || "").trim();
      const description = buildDescription(row);

      if (!namaMahasiswa || !title) {
        failed++;
        failedRows.push({
          row: rowNumber,
          nama_mahasiswa: namaMahasiswa,
          reason: "nama_mahasiswa atau judul_skripsi kosong",
        });
        continue;
      }

      const mahasiswaKey = normalizeText(namaMahasiswa);
      const mahasiswa = mahasiswaMap.get(mahasiswaKey);

      if (!mahasiswa) {
        failed++;
        failedRows.push({
          row: rowNumber,
          nama_mahasiswa: namaMahasiswa,
          reason: "Mahasiswa tidak ditemukan di database",
        });
        continue;
      }

      const existingPengajuan = await PengajuanJudul.findOne({
        where: {
          id_mahasiswa: mahasiswa.id_mahasiswa,
          title,
        },
        transaction,
      });

      if (existingPengajuan) {
        skipped++;
        continue;
      }

      await PengajuanJudul.create(
        {
          id_mahasiswa: mahasiswa.id_mahasiswa,
          title,
          description,
          bidang_topik: bidangTopik,
          keywords,
          status: "diterima",
          dosenId1: defaultDosen1,
          dosenId2: defaultDosen2,
          approvedAt: new Date(),
        },
        { transaction }
      );

      created++;
    }

    await transaction.commit();

    console.log("\n🎉 Seed pengajuan judul selesai");
    console.log(`✅ Created : ${created}`);
    console.log(`⏭️ Skipped : ${skipped}`);
    console.log(`❌ Failed  : ${failed}`);

    if (failedRows.length > 0) {
      console.log("\n❌ Data gagal:");
      console.table(failedRows.slice(0, 30));

      if (failedRows.length > 30) {
        console.log(`... dan ${failedRows.length - 30} data gagal lainnya`);
      }
    }

    process.exit(0);
  } catch (error) {
    await transaction.rollback();

    console.error("❌ Seed pengajuan judul gagal:", error);
    process.exit(1);
  }
};

seedPengajuanFromExcel();