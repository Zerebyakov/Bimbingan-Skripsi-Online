import React, { useEffect, useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import { RefreshCw, Search, Plus, Edit, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import ExportToExcel from "./components/ExportToExcel";
import PageMeta from "../../components/PageMeta";

const ListDosen = () => {
  const [dosens, setDosens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    email: "",
    password: "dosen123",
    nidn: "",
    nama: "",
    gelar: "",
    prodi_id: "",
    fakultas: "",
    bidang_keahlian: "",
    jabatan_akademik: "",
    kontak: "",
    email_institusi: "",
  });
  const [message, setMessage] = useState(null);
  const [listProdi, setListProdi] = useState([]);

  // Pagination State
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");


  const formatDosenForExcel = (data) => {
    return data.map((dosen, index) => ({
      No: index + 1,
      NIDN: dosen.nidn,
      "Nama Lengkap": dosen.nama,
      Gelar: dosen.gelar,
      "Program Studi": dosen.Prodi?.program_studi || "-",
      "Kode Prodi": dosen.Prodi?.kode_prodi || "-",
      Fakultas: dosen.fakultas,
      "Bidang Keahlian": dosen.bidang_keahlian || "-",
      "Jabatan Akademik": dosen.jabatan_akademik || "-",
      Status: dosen.status_dosen,
      Kontak: dosen.kontak,
      "Email Institusi": dosen.email_institusi,
      "Email Login": dosen.User?.email || "-",
      "Status Akun": dosen.User?.status || "-",
    }));
  };

  // GET LIST PRODI
  const fetchListProdi = async () => {
    try {
      const response = await axios.get(`${baseUrl}prodi`, {
        withCredentials: true,
      });
      setListProdi(response.data.data);
    } catch (error) {
      console.log(error.message);
    }
  };

  // GET DOSEN (ENDPOINT BARU)
  const fetchDosens = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const searchParam = search.trim() !== "" ? `&search=${encodeURIComponent(search)}` : "";
      const res = await axios.get(
        `${baseUrl}admin/users/dosen?page=${page}&limit=10${searchParam}`,
        {
          withCredentials: true,
        }
      );

      setDosens(res.data.data || []);
      setPagination(res.data.pagination || {});
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching dosen:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat data dosen",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDosens(currentPage, debouncedSearchTerm);
    fetchListProdi();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      fetchDosens(1, debouncedSearchTerm); // Reset to page 1 when searching
    }
  }, [debouncedSearchTerm]);

  // HANDLE INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // HANDLE SUBMIT (CREATE OR UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const payload = {
        email: form.email,
        password: form.password,
        role: "dosen",
        status: "aktif",
        profileData: {
          nidn: form.nidn,
          nama: form.nama,
          gelar: form.gelar,
          prodi_id: Number(form.prodi_id),
          fakultas: form.fakultas,
          bidang_keahlian: form.bidang_keahlian,
          jabatan_akademik: form.jabatan_akademik,
          kontak: form.kontak,
          email_institusi: form.email_institusi,
        },
      };

      let res;
      if (isEditMode) {
        // UPDATE
        res = await axios.put(`${baseUrl}admin/users/${editingId}`, payload, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // CREATE
        res = await axios.post(`${baseUrl}admin/users`, payload, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: isEditMode
            ? "Data dosen berhasil diperbarui!"
            : "Dosen berhasil ditambahkan!",
          timer: 2000,
          showConfirmButton: false,
        });

        setIsModalOpen(false);
        fetchDosens(currentPage, debouncedSearchTerm);
        resetForm();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text:
          error.response?.data?.message ||
          `Terjadi kesalahan saat ${isEditMode ? "memperbarui" : "menambahkan"
          } dosen.`,
      });
    }
  };

  // RESET FORM
  const resetForm = () => {
    setForm({
      email: "",
      password: "dosen123",
      nidn: "",
      nama: "",
      gelar: "",
      prodi_id: "",
      fakultas: "",
      bidang_keahlian: "",
      jabatan_akademik: "",
      kontak: "",
      email_institusi: "",
    });
    setIsEditMode(false);
    setEditingId(null);
    setMessage(null);
  };

  // HANDLE EDIT
  const handleEdit = (dosen) => {
    setIsEditMode(true);
    setEditingId(dosen.id_user);
    setForm({
      email: dosen.User.email,
      password: "", // kosongkan password saat edit
      nidn: dosen.nidn,
      nama: dosen.nama,
      gelar: dosen.gelar,
      prodi_id: dosen.prodi_id.toString(),
      fakultas: dosen.fakultas,
      bidang_keahlian: dosen.bidang_keahlian,
      jabatan_akademik: dosen.jabatan_akademik,
      kontak: dosen.kontak,
      email_institusi: dosen.email_institusi,
    });
    setIsModalOpen(true);
  };

  // HANDLE DELETE
  const handleDelete = async (dosen) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      html: `Apakah Anda yakin ingin menghapus dosen:<br><strong>${dosen.nama}</strong> (${dosen.nidn})?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(
            `${baseUrl}admin/users/${dosen.id_user}`,
            {
              withCredentials: true,
            }
          );

          if (res.data.success) {
            Swal.fire({
              icon: "success",
              title: "Terhapus!",
              text: "Data dosen berhasil dihapus.",
              timer: 2000,
              showConfirmButton: false,
            });
            fetchDosens(currentPage, debouncedSearchTerm);
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Gagal Menghapus",
            text:
              error.response?.data?.message ||
              "Terjadi kesalahan saat menghapus data dosen.",
          });
        }
      }
    });
  };

  // FILTER SEARCH - Removed client-side filtering since we're using backend search
  const filteredDosens = dosens;

  // AVATAR
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <AdminLayout>
      <PageMeta
        title="Kelola Dosen"
      />
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Daftar Dosen
            </h1>
            <p className="text-gray-500 text-sm">
              Menampilkan seluruh data dosen aktif di sistem.
            </p>
          </div>

          <div className="flex gap-2">
            <ExportToExcel
              endpoint={`${baseUrl}admin/users/dosen`}
              filename="Data_Dosen"
              dataFormatter={formatDosenForExcel}
              buttonText="Export to Excel"
            />
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Tambah Dosen
            </button>
            <button
              onClick={() => fetchDosens(currentPage, debouncedSearchTerm)}
              className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Info & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-gray-600">
            Menampilkan {dosens.length > 0 ? ((currentPage - 1) * pagination.limit) + 1 : 0} - {Math.min(currentPage * pagination.limit, pagination.total)} dari {pagination.total} data
          </div>

          <div className="relative w-full sm:w-96">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari nama, NIDN, atau program studi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-600">
              <RefreshCw className="animate-spin mr-2" /> Memuat data dosen...
            </div>
          ) : filteredDosens.length === 0 ? (
            <p className="text-gray-500 text-center py-10 text-sm italic">
              Tidak ada data dosen ditemukan.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">No</th>
                  <th className="px-4 py-3 text-left">Foto</th>
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">NIDN</th>
                  <th className="px-4 py-3 text-left">Program Studi</th>
                  <th className="px-4 py-3 text-left">Bidang Keahlian</th>
                  <th className="px-4 py-3 text-left">Kontak</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDosens.map((dosen, index) => {
                  const fotoUrl = dosen.foto ? `${imageUrl}${dosen.foto}` : null;

                  return (
                    <tr
                      key={dosen.id_dosen}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {((currentPage - 1) * pagination.limit) + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt={dosen.nama}
                            className="w-10 h-10 rounded-full object-cover border border-gray-300"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold border border-gray-300">
                            {getInitials(dosen.nama)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {dosen.nama}, {dosen.gelar}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{dosen.nidn}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {dosen.Prodi?.program_studi || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {dosen.bidang_keahlian || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{dosen.email_institusi}</div>
                        <div className="text-xs text-gray-500">{dosen.kontak}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium capitalize ${dosen.status_dosen === "tetap"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {dosen.status_dosen}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(dosen)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="Edit Dosen"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(dosen)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                            title="Hapus Dosen"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredDosens.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white px-6 py-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">
              Halaman {pagination.page} dari {pagination.totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDosens(1, debouncedSearchTerm)}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-2 text-sm rounded-md border transition ${pagination.hasPrevPage
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                First
              </button>

              <button
                onClick={() => fetchDosens(currentPage - 1, debouncedSearchTerm)}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-2 text-sm rounded-md border transition ${pagination.hasPrevPage
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show only 5 pages at a time
                  if (
                    pageNumber === 1 ||
                    pageNumber === pagination.totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => fetchDosens(pageNumber, debouncedSearchTerm)}
                        className={`px-3 py-2 text-sm rounded-md border transition ${currentPage === pageNumber
                          ? "bg-gray-800 text-white border-gray-800"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span key={pageNumber} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => fetchDosens(currentPage + 1, debouncedSearchTerm)}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-2 text-sm rounded-md border transition ${pagination.hasNextPage
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Next
              </button>

              <button
                onClick={() => fetchDosens(pagination.totalPages, debouncedSearchTerm)}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-2 text-sm rounded-md border transition ${pagination.hasNextPage
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Last
              </button>
            </div>
          </div>
        )}

        {/* ======= MODAL TAMBAH/EDIT DOSEN ======= */}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-3 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-4 border-b border-gray-300 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Edit size={18} className="text-gray-600" />
                    Edit Dosen
                  </>
                ) : (
                  <>
                    <Plus size={18} className="text-gray-600" />
                    Tambah Dosen Baru
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 max-h-[75vh] overflow-y-auto"
            >
              {/* Informasi Akun */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 border-l-4 border-gray-400 pl-2">
                  Informasi Akun
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Email Login
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Email akun dosen"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      {isEditMode
                        ? "Password (kosongkan jika tidak diubah)"
                        : "Password (default: dosen123)"}
                    </label>
                    <input
                      type="password"
                      name="password"
                      required={!isEditMode}
                      placeholder={
                        isEditMode ? "Masukkan password baru" : "Kata sandi"
                      }
                      value={form.password}
                      onChange={handleChange}
                      disabled={!isEditMode && form.password === "dosen123"}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Informasi Dosen */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 border-l-4 border-gray-400 pl-2">
                  Data Profil Dosen
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 font-medium">NIDN</label>
                    <input
                      type="text"
                      name="nidn"
                      required
                      placeholder="NIDN"
                      value={form.nidn}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="nama"
                      required
                      placeholder="Nama lengkap"
                      value={form.nama}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Gelar Akademik
                    </label>
                    <input
                      type="text"
                      name="gelar"
                      placeholder="Contoh: M.Kom"
                      value={form.gelar}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Program Studi
                    </label>
                    <select
                      name="prodi_id"
                      required
                      value={form.prodi_id}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    >
                      <option value="">-- Pilih Program Studi --</option>
                      {listProdi.map((p) => (
                        <option key={p.prodi_id} value={p.prodi_id}>
                          {p.program_studi} ({p.kode_prodi})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Fakultas
                    </label>
                    <input
                      type="text"
                      name="fakultas"
                      placeholder="Nama fakultas"
                      value={form.fakultas}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Bidang Keahlian
                    </label>
                    <input
                      type="text"
                      name="bidang_keahlian"
                      placeholder="Contoh: Web Development"
                      value={form.bidang_keahlian}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Jabatan Akademik
                    </label>
                    <input
                      type="text"
                      name="jabatan_akademik"
                      placeholder="Contoh: Lektor"
                      value={form.jabatan_akademik}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Kontak
                    </label>
                    <input
                      type="text"
                      name="kontak"
                      placeholder="Nomor telepon"
                      value={form.kontak}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-600 font-medium">
                      Email Institusi
                    </label>
                    <input
                      type="email"
                      name="email_institusi"
                      placeholder="Email institusi"
                      value={form.email_institusi}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pesan */}
              {message && (
                <div
                  className={`text-sm ${message.type === "error"
                    ? "text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-md"
                    : "text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-md"
                    }`}
                >
                  {message.text}
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
                >
                  {isEditMode ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ListDosen;