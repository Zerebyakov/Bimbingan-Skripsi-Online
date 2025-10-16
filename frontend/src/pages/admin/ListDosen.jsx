import React, { useEffect, useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { RefreshCw, Search, Plus } from "lucide-react";

const ListDosen = () => {
  const [dosens, setDosens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
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

  // Fetch all users
  const fetchDosens = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}admin/users`, {
        withCredentials: true,
      });
      const filtered = (res.data.data || []).filter(
        (user) => user.role === "dosen" && user.Dosens?.length > 0
      );
      setDosens(filtered);
    } catch (error) {
      console.error("Error fetching dosen:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDosens();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const payload = {
        email: form.email,
        password: form.password,
        role: "dosen",
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

      const res = await axios.post(`${baseUrl}admin/users`, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Dosen berhasil ditambahkan!" });
        setIsModalOpen(false);
        fetchDosens(); // refresh list
        setForm({
          email: "",
          password: "",
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
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Terjadi kesalahan saat menambahkan dosen.",
      });
    }
  };

  // Filter pencarian
  const filteredDosens = dosens.filter((item) => {
    const dosen = item.Dosens?.[0];
    if (!dosen) return false;
    const search = searchTerm.toLowerCase();
    return (
      dosen.nama.toLowerCase().includes(search) ||
      dosen.nidn.toLowerCase().includes(search) ||
      dosen.Prodi?.program_studi.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Daftar Dosen</h1>
            <p className="text-gray-500 text-sm">
              Menampilkan seluruh data dosen aktif di sistem.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Tambah Dosen
            </button>
            <button
              onClick={fetchDosens}
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
            placeholder="Cari nama, NIDN, atau program studi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-400 focus:outline-none"
          />
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
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">NIDN</th>
                  <th className="px-4 py-3 text-left">Program Studi</th>
                  <th className="px-4 py-3 text-left">Bidang Keahlian</th>
                  <th className="px-4 py-3 text-left">Kontak</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDosens.map((item, index) => {
                  const dosen = item.Dosens?.[0];
                  return (
                    <tr
                      key={dosen.id_dosen}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {dosen.nama}
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
                        <div className="text-xs text-gray-500">
                          {dosen.kontak}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${dosen.status_dosen === "tetap"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {dosen.status_dosen}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-3 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Plus size={18} className="text-gray-600" />
                  Tambah Dosen Baru
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
                {/* Informasi Akun */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 border-l-4 border-gray-400 pl-2">
                    Informasi Akun
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Email</label>
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
                      <label className="text-xs text-gray-600 font-medium">Password</label>
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="Kata sandi"
                        value={form.password}
                        onChange={handleChange}
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
                      <label className="text-xs text-gray-600 font-medium">Nama Lengkap</label>
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
                      <label className="text-xs text-gray-600 font-medium">Gelar Akademik</label>
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
                      <label className="text-xs text-gray-600 font-medium">Program Studi ID</label>
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
                      <label className="text-xs text-gray-600 font-medium">Fakultas</label>
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
                      <label className="text-xs text-gray-600 font-medium">Bidang Keahlian</label>
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
                      <label className="text-xs text-gray-600 font-medium">Jabatan Akademik</label>
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
                      <label className="text-xs text-gray-600 font-medium">Kontak</label>
                      <input
                        type="text"
                        name="kontak"
                        placeholder="Nomor telepon"
                        value={form.kontak}
                        onChange={handleChange}
                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Email Institusi</label>
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

export default ListDosen;
