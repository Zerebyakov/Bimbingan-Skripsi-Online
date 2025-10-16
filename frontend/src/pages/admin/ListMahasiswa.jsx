import React, { useEffect, useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { RefreshCw, Search, Plus } from "lucide-react";

const ListMahasiswa = () => {
  const [mahasiswa, setMahasiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    nim: "",
    nama_lengkap: "",
    prodi_id: "",
    angkatan: "",
    semester: "",
    kontak: "",
    email_kampus: "",
  });
  const [message, setMessage] = useState(null);

  const fetchMahasiswa = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}admin/users`, {
        withCredentials: true,
      });
      const filtered = (res.data.data || []).filter(
        (user) => user.role === "mahasiswa" && user.Mahasiswa
      );
      setMahasiswa(filtered);
    } catch (error) {
      console.error("Error fetching mahasiswa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMahasiswa();
  }, []);

  // handle input form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handle submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const payload = {
        email: form.email,
        password: form.password,
        role: "mahasiswa",
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

      const res = await axios.post(`${baseUrl}admin/users`, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Mahasiswa berhasil ditambahkan!" });
        setIsModalOpen(false);
        fetchMahasiswa();
        setForm({
          email: "",
          password: "",
          nim: "",
          nama_lengkap: "",
          prodi_id: "",
          angkatan: "",
          semester: "",
          kontak: "",
          email_kampus: "",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Terjadi kesalahan saat menambahkan mahasiswa.",
      });
    }
  };

  // filter pencarian
  const filteredMahasiswa = mahasiswa.filter((item) => {
    const mhs = item.Mahasiswa;
    if (!mhs) return false;
    const search = searchTerm.toLowerCase();
    return (
      mhs.nama_lengkap.toLowerCase().includes(search) ||
      mhs.nim.toLowerCase().includes(search) ||
      mhs.Prodis?.[0]?.program_studi.toLowerCase().includes(search)
    );
  });

  // avatar inisial jika tidak ada foto
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
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Tambah Mahasiswa
            </button>
            <button
              onClick={fetchMahasiswa}
              className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-1/2">
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
                </tr>
              </thead>
              <tbody>
                {filteredMahasiswa.map((item,index) => {
                  const mhs = item.Mahasiswa;
                  const fotoUrl = mhs.foto ? `${baseUrl}${mhs.foto}` : null;

                  return (
                    <tr
                      key={mhs.id_mahasiswa}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {index+1}
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
                        {mhs.Prodis?.[0]?.program_studi || "-"}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Tambah Mahasiswa */}
        {/* Modal Tambah Mahasiswa */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-3 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Plus size={18} className="text-gray-600" />
                  Tambah Mahasiswa Baru
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
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
                {/* Bagian Akun */}
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
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="Kata sandi akun"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian Profil Mahasiswa */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 border-l-4 border-gray-400 pl-2">
                    Data Profil Mahasiswa
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 font-medium">NIM</label>
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
                        Program Studi ID
                      </label>
                      <input
                        type="number"
                        name="prodi_id"
                        required
                        placeholder="Contoh: 1"
                        value={form.prodi_id}
                        onChange={handleChange}
                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                      />
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

                {/* Pesan sukses/error */}
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
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default ListMahasiswa;
