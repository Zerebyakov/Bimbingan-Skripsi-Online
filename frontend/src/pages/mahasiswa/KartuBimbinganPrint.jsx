import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { baseUrl } from "../../components/api/myAPI";
import { Printer, Download } from "lucide-react";
import Swal from "sweetalert2";
import html2pdf from "html2pdf.js";
import LogoUPB from "../../assets/PERADABAN.png"
import PageMeta from "../../components/PageMeta";

const KartuBimbinganPrint = () => {
  const { id } = useParams();
  const [kartu, setKartu] = useState(null);
  const [mahasiswa, setMahasiswa] = useState(null);
  const [dosen, setDosen] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    const fetchKartu = async () => {
      try {
        const res = await axios.get(`${baseUrl}mahasiswa/kartu-bimbingan`, {
          withCredentials: true,
        });
        if (res.data.success) {
          setKartu(res.data.data);
          const dashboardRes = await axios.get(`${baseUrl}mahasiswa/dashboard`, {
            withCredentials: true,
          });
          setMahasiswa(dashboardRes.data.data.mahasiswa);
          setDosen(dashboardRes.data.data.pengajuan?.Pembimbing1);
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text: "Terjadi kesalahan saat memuat kartu bimbingan.",
        });
      }
    };
    fetchKartu();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = printRef.current;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `Kartu_Bimbingan_${mahasiswa?.nim || "mahasiswa"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!kartu || !mahasiswa) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Memuat data kartu bimbingan...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <PageMeta
        title="Kartu Bimbingan"
      />
      {/* Tombol Aksi */}
      <div className="no-print mb-6 flex justify-end gap-3 w-full max-w-3xl">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition"
        >
          <Printer size={18} /> Cetak
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition"
        >
          <Download size={18} /> Download PDF
        </button>
      </div>

      {/* AREA KARTU */}
      <div
        ref={printRef}
        className="print-area bg-white w-full max-w-3xl shadow-md rounded-md p-8 border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={LogoUPB}
              alt="Logo Universitas"
              className="w-14 h-14 object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold text-gray-800 uppercase">
                Kartu Bimbingan Skripsi
              </h1>
              <p className="text-sm text-gray-600">Universitas Peradaban</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Nomor: {kartu.nomorKartu.toUpperCase()}</p>
        </div>

        {/* Info Mahasiswa */}
        <div className="mb-6">
          <h2 className="text-gray-800 font-semibold mb-2 border-b border-gray-200 pb-1">
            Data Mahasiswa
          </h2>
          <table className="text-sm text-gray-700 w-full">
            <tbody>
              <tr>
                <td className="w-40 py-1">Nama</td>
                <td>: {mahasiswa.nama_lengkap}</td>
              </tr>
              <tr>
                <td className="py-1">NIM</td>
                <td>: {mahasiswa.nim}</td>
              </tr>
              <tr>
                <td className="py-1">Program Studi</td>
                <td>: {mahasiswa.Prodi.kode_prodi}-{mahasiswa.Prodi.program_studi}</td>
              </tr>
              <tr>
                <td className="py-1">Angkatan</td>
                <td>: {mahasiswa.angkatan}</td>
              </tr>
              <tr>
                <td className="py-1">Email</td>
                <td>: {mahasiswa.email_kampus}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Info Bimbingan */}
        <div className="mb-6">
          <h2 className="text-gray-800 font-semibold mb-2 border-b border-gray-200 pb-1">
            Data Bimbingan
          </h2>
          <table className="text-sm text-gray-700 w-full">
            <tbody>
              <tr>
                <td className="w-40 py-1">Dosen Pembimbing</td>
                <td>: {dosen?.nama || "Belum Ditentukan"} {dosen.gelar}</td>
              </tr>
              <tr>
                <td className="py-1">Total Pertemuan</td>
                <td>: {kartu.totalPertemuan}</td>
              </tr>
              <tr>
                <td className="py-1">Total Bab</td>
                <td>: {kartu.totalBab}</td>
              </tr>
              <tr>
                <td className="py-1">Tanggal Selesai</td>
                <td>: {new Date(kartu.selesaiAt).toLocaleDateString("id-ID")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tanda tangan */}
        <div className="mt-10 flex justify-between text-sm text-gray-700">
          <div className="flex flex-col items-center">
            <p>Mahasiswa</p>
            <div className="h-16"></div>
            <p className="font-semibold border-t border-gray-400 px-4">
              {mahasiswa.nama_lengkap}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <p>Dosen Pembimbing</p>
            <div className="h-16"></div>
            <p className="font-semibold border-t border-gray-400 px-4">
              {dosen?.nama || "................................"} {dosen.gelar}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-4 no-print">
        © 2025 Sistem Bimbingan Skripsi — Universitas Peradaban
      </p>

      <style>
        {`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
            .print-area {
              box-shadow: none !important;
              border: none !important;
              margin: 0;
              padding: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default KartuBimbinganPrint;
