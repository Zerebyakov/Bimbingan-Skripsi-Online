import React, { useEffect, useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import axios from "axios";
import { baseUrl, imageUrl } from "../../components/api/myAPI";
import { RefreshCw, Search, Plus, Edit, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

const ListMahasiswa = () => {
  const [mahasiswa, setMahasiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    email: "",
    password: "mahasiswa123",
    nim: "",
    nama_lengkap: "",
    prodi_id: "1",
    angkatan: "",
    semester: "",
    kontak: "",
    email_kampus: "",
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

  // GET MAHASISWA (ENDPOINT BARU)
  const fetchMahasiswa = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const searchParam = search.trim() !== "" ? `&search=${encodeURIComponent(search)}` : "";
      const res = await axios.get(
        `${baseUrl}admin/users/mahasiswa?page=${page}&limit=10${searchParam}`,
        {
          withCredentials: true,
        }
      );

      setMahasiswa(res.data.data || []);
      setPagination(res.data.pagination || {});
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching mahasiswa:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat data mahasiswa",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMahasiswa(currentPage, debouncedSearchTerm);
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
      fetchMahasiswa(1, debouncedSearchTerm); // Reset to page 1 when searching
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
        role: "mahasiswa",
        status: "aktif",
        profileData: {
          nim: form.nim,
          nama_lengkap: form.nama_lengkap,
          prodi_id: Number(form.prodi_id),
          angkatan: Number(form.angkatan),
          semester: Number(form.semester),
          kontak: form.kontak,
          email_kampus: form.email_kampus,
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
            ? "Data mahasiswa berhasil diperbarui!"
            : "Mahasiswa berhasil ditambahkan!",
          timer: 2000,
          showConfirmButton: false,
        });

        setIsModalOpen(false);
        fetchMahasiswa(currentPage, debouncedSearchTerm);
        resetForm();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text:
          error.response?.data?.message ||
          `Terjadi kesalahan saat ${isEditMode ? "memperbarui" : "menambahkan"
          } mahasiswa.`,
      });
    }
  };

  // RESET FORM
  const resetForm = () => {
    setForm({
      email: "",
      password: "mahasiswa123",
      nim: "",
      nama_lengkap: "",
      prodi_id: "1",
      angkatan: "",
      semester: "",
      kontak: "",
      email_kampus: "",
    });
    setIsEditMode(false);
    setEditingId(null);
    setMessage(null);
  };

  // HANDLE EDIT
  const handleEdit = (mhs) => {
    setIsEditMode(true);
    setEditingId(mhs.id_user);
    setForm({
      email: mhs.User.email,
      password: "", // kosongkan password saat edit
      nim: mhs.nim,
      nama_lengkap: mhs.nama_lengkap,
      prodi_id: mhs.prodi_id.toString(),
      angkatan: mhs.angkatan.toString(),
      semester: mhs.semester.toString(),
      kontak: mhs.kontak,
      email_kampus: mhs.email_kampus,
    });
    setIsModalOpen(true);
  };

  // HANDLE DELETE
  const handleDelete = async (mhs) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      html: `Apakah Anda yakin ingin menghapus mahasiswa:<br><strong>${mhs.nama_lengkap}</strong> (${mhs.nim})?`,
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
            `${baseUrl}admin/users/${mhs.id_user}`,
            {
              withCredentials: true,
            }
          );

          if (res.data.success) {
            Swal.fire({
              icon: "success",
              title: "Terhapus!",
              text: "Data mahasiswa berhasil dihapus.",
              timer: 2000,
              showConfirmButton: false,
            });
            fetchMahasiswa(currentPage, debouncedSearchTerm);
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Gagal Menghapus",
            text:
              error.response?.data?.message ||
              "Terjadi kesalahan saat menghapus data mahasiswa.",
          });
        }
      }
    });
  };

  // FILTER SEARCH - Removed client-side filtering since we're using backend search
  const filteredMahasiswa = mahasiswa;

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Daftar Mahasiswa
            </h1>
            <p className="text-gray-500 text-sm">
              Menampilkan seluruh mahasiswa aktif di sistem.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Tambah Mahasiswa
            </button>
            <button
              onClick={() => fetchMahasiswa(currentPage, debouncedSearchTerm)}
              className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Info & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-gray-600">
            Menampilkan {mahasiswa.length > 0 ? ((currentPage - 1) * pagination.limit) + 1 : 0} - {Math.min(currentPage * pagination.limit, pagination.total)} dari {pagination.total} data
          </div>

          <div className="relative w-full sm:w-96">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari nama, NIM, atau program studi..."
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
              <RefreshCw className="animate-spin mr-2" /> Memuat data mahasiswa...
            </div>
          ) : filteredMahasiswa.length === 0 ? (
            <p className="text-gray-500 text-center py-10 text-sm italic">
              Tidak ada data mahasiswa ditemukan.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">No</th>
                  <th className="px-4 py-3 text-left">Foto</th>
                  <th className="px-4 py-3 text-left">Nama Lengkap</th>
                  <th className="px-4 py-3 text-left">NIM</th>
                  <th className="px-4 py-3 text-left">Program Studi</th>
                  <th className="px-4 py-3 text-left">Angkatan</th>
                  <th className="px-4 py-3 text-left">Semester</th>
                  <th className="px-4 py-3 text-left">Kontak</th>
                  <th className="px-4 py-3 text-left">Status Akademik</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMahasiswa.map((mhs, index) => {
                  const fotoUrl = mhs.foto ? `${imageUrl}${mhs.foto}` : null;

                  return (
                    <tr
                      key={mhs.id_mahasiswa}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt={mhs.nama_lengkap}
                            className="w-10 h-10 rounded-full object-cover border border-gray-300"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold border border-gray-300">
                            {getInitials(mhs.nama_lengkap)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {mhs.nama_lengkap}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{mhs.nim}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {mhs.Prodi?.program_studi || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{mhs.angkatan}</td>
                      <td className="px-4 py-3 text-gray-700">{mhs.semester}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{mhs.email_kampus}</div>
                        <div className="text-xs text-gray-500">{mhs.kontak}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium capitalize ${mhs.status_akademik === "aktif"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {mhs.status_akademik}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(mhs)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="Edit Mahasiswa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(mhs)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                            title="Hapus Mahasiswa"
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
        {!loading && filteredMahasiswa.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white px-6 py-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">
              Halaman {pagination.page} dari {pagination.totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMahasiswa(1, debouncedSearchTerm)}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-2 text-sm rounded-md border transition ${pagination.hasPrevPage
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                First
              </button>

              <button
                onClick={() => fetchMahasiswa(currentPage - 1, debouncedSearchTerm)}
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
                        onClick={() => fetchMahasiswa(pageNumber, debouncedSearchTerm)}
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
                onClick={() => fetchMahasiswa(currentPage + 1, debouncedSearchTerm)}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-2 text-sm rounded-md border transition ${pagination.hasNextPage
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Next
              </button>

              <button
                onClick={() => fetchMahasiswa(pagination.totalPages, debouncedSearchTerm)}
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

        {/* ======= MODAL TAMBAH/EDIT MAHASISWA ======= */}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-3 overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-4 border-b border-gray-300 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Edit size={18} className="text-gray-600" />
                    Edit Mahasiswa
                  </>
                ) : (
                  <>
                    <Plus size={18} className="text-gray-600" />
                    Tambah Mahasiswa Baru
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
                      placeholder="Email akun mahasiswa"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      {isEditMode
                        ? "Password (kosongkan jika tidak diubah)"
                        : "Password (default: mahasiswa123)"}
                    </label>
                    <input
                      type="password"
                      name="password"
                      required={!isEditMode}
                      placeholder={
                        isEditMode
                          ? "Masukkan password baru"
                          : "Kata sandi akun"
                      }
                      value={form.password}
                      onChange={handleChange}
                      disabled={!isEditMode && form.password === "mahasiswa123"}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Profil */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 border-l-4 border-gray-400 pl-2">
                  Data Profil Mahasiswa
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      NIM
                    </label>
                    <input
                      type="text"
                      name="nim"
                      required
                      placeholder="Nomor Induk Mahasiswa"
                      value={form.nim}
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
                      name="nama_lengkap"
                      required
                      placeholder="Nama lengkap mahasiswa"
                      value={form.nama_lengkap}
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
                      disabled
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
                      Angkatan
                    </label>
                    <input
                      type="number"
                      name="angkatan"
                      required
                      placeholder="Contoh: 2022"
                      value={form.angkatan}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Semester
                    </label>
                    <input
                      type="number"
                      name="semester"
                      required
                      placeholder="Contoh: 7"
                      value={form.semester}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 font-medium">
                      Nomor Kontak
                    </label>
                    <input
                      type="text"
                      name="kontak"
                      placeholder="Nomor HP mahasiswa"
                      value={form.kontak}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-600 font-medium">
                      Email Kampus
                    </label>
                    <input
                      type="email"
                      name="email_kampus"
                      placeholder="Email institusi mahasiswa"
                      value={form.email_kampus}
                      onChange={handleChange}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
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

export default ListMahasiswa;