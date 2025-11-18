import React, { useEffect, useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import {
  RefreshCw,
  Search,
  Users,
  FileDown,
  Download,
} from "lucide-react";
import { motion } from "framer-motion"; 


const ListPengajuan = () => {
  const [pengajuan, setPengajuan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [dosens, setDosens] = useState([]);
  const [form, setForm] = useState({
    dosenId1: "",
    dosenId2: ""
  });
  const [message, setMessage] = useState(null);

  // Fetch pengajuan
  const fetchPengajuan = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}pengajuan`, {
        withCredentials: true,
      });
      setPengajuan(res.data.data.pengajuan || []);
    } catch (error) {
      console.error("Error fetching pengajuan:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dosen
  const fetchDosens = async () => {
    try {
      const res = await axios.get(`${baseUrl}admin/users`, {
        withCredentials: true,
      });
      const onlyDosen = (res.data.data || []).filter(
        (u) => u.role === "dosen"
      );
      setDosens(onlyDosen);
    } catch (error) {
      console.error("Error fetching dosen:", error);
    }
  };

  useEffect(() => {
    fetchPengajuan();
    fetchDosens();
  }, []);

  // Filter pengajuan
  const filteredData = pengajuan.filter((item) => {
    const matchesStatus =
      filterStatus === "semua" || item.status === filterStatus;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Mahasiswa?.nama_lengkap
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Open modal assign pembimbing
  const handleOpenModal = (item, isUpdate = false) => {
    setSelectedPengajuan(item);
    setIsModalOpen(true);
    setMessage(null);

    if (isUpdate) {
      setForm({
        dosenId1: item.dosenId1 || item.Pembimbing1?.id_dosen || "",
        dosenId2: item.dosenId2 || item.Pembimbing2?.id_dosen || ""
      });
    } else {
      setForm({ dosenId1: "", dosenId2: "" });
    }
  };


  // Submit assign pembimbing
  const handleAssignDosen = async (e) => {
    e.preventDefault();
    if (!selectedPengajuan) return;

    try {
      const res = await axios.put(
        `${baseUrl}admin/pengajuan/${selectedPengajuan.id_pengajuan}/assign-dosen`,
        {
          dosenId1: form.dosenId1 ? Number(form.dosenId1) : null,
          dosenId2: form.dosenId2 ? Number(form.dosenId2) : null
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.data.success) {
        setMessage({
          type: "success",
          text: "Dosen pembimbing berhasil diatur!",
        });
        fetchPengajuan();
        setTimeout(() => setIsModalOpen(false), 1200);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Gagal mengatur pembimbing. Silakan coba lagi.",
      });
    }
  };

  // Unduh file proposal
  const handleDownloadBab = (proposal_file) => {
    if (!proposal_file) {
      alert("File belum tersedia.");
      return;
    }

    const url = `${imageUrl}uploads/proposals/${proposal_file}`;

    const a = document.createElement("a");
    a.href = url;
    a.download = proposal_file; // sama seperti <a download="namafile">
    document.body.appendChild(a);
    a.click();
    a.remove();
  };


  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-10"
      >
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Daftar Pengajuan Judul
              </h1>
              <p className="text-gray-500 text-sm">
                Kelola dan pantau pengajuan judul mahasiswa.
              </p>
            </div>

            <button
              onClick={fetchPengajuan}
              className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cari judul atau nama mahasiswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-400 focus:outline-none"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-400 focus:outline-none"
            >
              <option value="semua">Semua Status</option>
              <option value="diajukan">Diajukan</option>
              <option value="diterima">Diterima</option>
              <option value="revisi">Revisi</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            {loading ? (
              <div className="flex justify-center items-center h-64 text-gray-600">
                <RefreshCw className="animate-spin mr-2" /> Memuat data...
              </div>
            ) : filteredData.length === 0 ? (
              <p className="text-gray-500 text-center py-10 text-sm italic">
                Tidak ada data pengajuan ditemukan.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">No</th>
                    <th className="px-4 py-3 text-left">Judul</th>
                    <th className="px-4 py-3 text-left">Mahasiswa</th>
                    <th className="px-4 py-3 text-left">Program Studi</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Pembimbing</th>
                    <th className="px-4 py-3 text-left">File Proposal</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr
                      key={item.id_pengajuan}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.Mahasiswa?.nama_lengkap || "-"} <br />
                        <span className="text-xs text-gray-500">
                          {item.Mahasiswa?.nim}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.Mahasiswa?.Prodis?.[0]?.program_studi || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium capitalize ${item.status === "diterima"
                            ? "bg-green-100 text-green-700"
                            : item.status === "revisi"
                              ? "bg-yellow-100 text-yellow-700"
                              : item.status === "diajukan"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Pembimbing */}
                      <td className="px-4 py-3 text-gray-700">
                        {item.Pembimbing1?.nama || item.Pembimbing2?.nama || item.Pembimbing3?.nama ? (
                          <div className="flex flex-col gap-1">
                            {item.Pembimbing1?.nama && (
                              <p className="text-sm font-medium text-gray-800">
                                {item.Pembimbing1?.nama}
                              </p>
                            )}
                            {item.Pembimbing2?.nama && (
                              <p className="text-xs text-gray-600">• {item.Pembimbing2?.nama}</p>
                            )}
                            {item.Pembimbing3?.nama && (
                              <p className="text-xs text-gray-600">• {item.Pembimbing3?.nama}</p>
                            )}

                            {/* Tombol ubah pembimbing */}
                            <button
                              onClick={() => handleOpenModal(item, true)}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1 transition"
                            >
                              <Users size={12} /> Ubah Pembimbing
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenModal(item, false)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <Users size={14} /> Atur Pembimbing
                          </button>
                        )}
                      </td>



                      {/* File Proposal */}
                      <td className="px-4 py-3 text-gray-700">
                        {item.proposal_file ? (
                          <button
                            onClick={() => handleDownloadBab(item.proposal_file)}
                            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 px-3 py-1 rounded-md transition"
                          >
                            <Download size={13} /> File
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Belum ada file
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal Assign Pembimbing */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-3 overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Users size={18} className="text-gray-600" />
                        Atur Dosen Pembimbing
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 leading-snug">
                        <span className="font-medium text-gray-700">
                          Mahasiswa:
                        </span>{" "}
                        {selectedPengajuan?.Mahasiswa?.nama_lengkap || "-"}
                        <br />
                        <span className="font-medium text-gray-700">Judul:</span>{" "}
                        {selectedPengajuan?.title || "-"}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Body */}
                <form onSubmit={handleAssignDosen} className="p-6 space-y-5">
                  <div className="space-y-4">
                    {[1, 2].map((num) => (
                      <div key={num}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dosen Pembimbing {num}
                        </label>
                        <select
                          value={form[`dosenId${num}`]}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const isDuplicate = Object.values(form).includes(
                              selectedId
                            );
                            if (isDuplicate && selectedId !== "") {
                              setMessage({
                                type: "error",
                                text: "Dosen ini sudah dipilih di slot lain!",
                              });
                            } else {
                              setForm({
                                ...form,
                                [`dosenId${num}`]: selectedId,
                              });
                              setMessage(null);
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                        >
                          <option value="">-- Pilih Dosen --</option>
                          {dosens.map((d) => (
                            <option
                              key={d.id_user}
                              value={d.Dosens?.[0]?.id_dosen}
                              disabled={Object.values(form).includes(
                                String(d.Dosens?.[0]?.id_dosen)
                              )}
                            >
                              {d.Dosens?.[0]?.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Pesan */}
                  {message && (
                    <div
                      className={`text-sm ${message.type === "error"
                        ? "text-red-600 bg-red-50 border border-red-200"
                        : "text-green-700 bg-green-50 border border-green-200"
                        } px-3 py-2 rounded-md`}
                    >
                      {message.text}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !form.dosenId1 && !form.dosenId2
                      }
                      className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default ListPengajuan;
