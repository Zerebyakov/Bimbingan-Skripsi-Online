import React, { useEffect, useState } from "react";
import MahasiswaLayout from "./layout/MahasiswaLayout";
import { motion,AnimatePresence } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Lock,
  Loader2,
  Edit2,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  BookOpenText,
  CheckCircle,
} from "lucide-react";
import { baseUrl } from "../../components/api/myAPI";
import { useAuth } from "../../context/AuthContext";
import PageMeta from "../../components/PageMeta";

const ProfileMahasiswa = () => {
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mahasiswa, setMahasiswa] = useState(null);
  const [formData, setFormData] = useState({});
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal Update Password
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passErrors, setPassErrors] = useState({})
  const [updatingPass, setUpdatingPass] = useState(false)

  // 🔹 Ambil data profil
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}auth/profile`, { withCredentials: true });
      const data = res.data.data;
      const mhs = data.Mahasiswa;
      setMahasiswa(mhs);
      setFormData({
        email: data.email,
        nama_lengkap: mhs?.nama_lengkap,
        kontak: mhs?.kontak,
        email_kampus: mhs?.email_kampus,
      });
      setFotoPreview(mhs?.foto || "");
    } catch {
      Swal.fire("Gagal", "Tidak dapat memuat profil mahasiswa.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchProfile();
  }, [authLoading]);

  // 🔹 Ubah foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const valid = ["image/jpeg", "image/jpg", "image/png"];
    if (!valid.includes(file.type)) {
      Swal.fire("Format salah", "Gunakan JPG, JPEG, atau PNG", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire("Ukuran terlalu besar", "Maksimal 2MB", "error");
      return;
    }
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // 🔹 Simpan profil
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, val]) => form.append(key, val || ""));
      if (fotoFile) form.append("foto", fotoFile);

      const res = await axios.put(`${baseUrl}auth/profile`, form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        Swal.fire("Berhasil!", "Profil mahasiswa berhasil diperbarui.", "success");
        setEditing(false);
        setFotoFile(null);
        fetchProfile();
      }
    } catch (err) {
      Swal.fire("Gagal!", err.response?.data?.message || "Terjadi kesalahan.", "error");
    } finally {
      setSaving(false);
    }
  };
  const handleUpdatePassword = async () => {
    setUpdatingPass(true)
    setPassErrors({})

    try {
      const res = await axios.put(`${baseUrl}auth/password`, {
        oldPassword,
        newPassword
      }, {
        withCredentials: true
      });
      if (res.data.success) {
        Swal.fire("Berhasil", res.data.message, "success");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
      }
    } catch (error) {
      const backend = err.response?.data;

      if (backend?.errors) {
        let fieldErr = {};
        backend.errors.forEach((e) => {
          fieldErr[e.path] = e.msg;
        });
        setPassErrors(fieldErr);
      }

      Swal.fire("Gagal", backend?.message || "Terjadi kesalahan", "error");
    } finally {
      setUpdatingPass(false)
    }
  }

  if (loading)
    return (
      <MahasiswaLayout>
        <div className="flex justify-center items-center h-[70vh] text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Memuat profil mahasiswa...
        </div>
      </MahasiswaLayout>
    );

  return (
    <MahasiswaLayout>
      <PageMeta
        title="Profil Mahasiswa"
      />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              Profil Mahasiswa{" "}
              <CheckCircle size={18} className="text-green-500" title="Status Aktif" />
            </h1>
            <p className="text-gray-500 text-sm">
              Kelola data pribadi dan keamanan akun Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition w-full sm:w-auto justify-center"
            >
              {editing ? <X size={16} /> : <Edit2 size={16} />}
              {editing ? "Batal" : "Edit Profil"}
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition w-full sm:w-auto justify-center"
            >
              <Lock size={16} /> Ubah Password
            </button>
          </div>
        </div>

        {/* Kartu Profil */}
        <div className="bg-white shadow-md rounded-xl p-6 flex flex-col md:flex-row gap-8 border border-gray-100">
          {/* Foto */}
          <div className="flex flex-col items-center md:items-start w-full md:w-1/3">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border border-gray-200 shadow">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Foto Mahasiswa"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  Tidak ada foto
                </div>
              )}
              {editing && (
                <label className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" size={28} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                </label>
              )}
            </div>
            <div className="mt-4 text-center md:text-left">
              <h2 className="text-xl font-semibold text-gray-800">
                {formData.nama_lengkap}
              </h2>
              <p className="text-sm text-gray-500">{formData.email_kampus}</p>
              <p className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-md px-3 py-1 inline-block">
                Angkatan {mahasiswa?.angkatan} • Semester {mahasiswa?.semester}
              </p>
            </div>
          </div>

          {/* Informasi Mahasiswa */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ["NIM", mahasiswa?.nim],
              ["Program Studi", mahasiswa?.Prodi.program_studi],
              ["Email Akun", formData.email],
              ["Email Kampus", formData.email_kampus],
              ["Kontak", formData.kontak],
              ["Status Akademik", mahasiswa?.status_akademik],
            ].map(([label, value], i) => (
              <div key={i}>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  {label}
                </p>
                {editing && ["nama_lengkap", "kontak", "email_kampus", "email"].includes(
                  label.toLowerCase().replace(" ", "_")
                ) ? (
                  <input
                    type="text"
                    value={formData[label.toLowerCase().replace(" ", "_")] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [label.toLowerCase().replace(" ", "_")]: e.target.value,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-green-300"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{value || "-"}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Informasi Akun */}
        <div className="bg-gray-50 mt-6 rounded-xl border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpenText size={18} /> Informasi Akun
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-gray-500" />
              <p>Email: <span className="font-medium">{formData.email}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-500" />
              <p>Kontak: <span className="font-medium">{formData.kontak}</span></p>
            </div>
            <div>
              <p className="text-gray-500">Role:</p>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700 font-medium">
                Mahasiswa
              </span>
            </div>
            <div>
              <p className="text-gray-500">Status Akademik:</p>
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium ${mahasiswa?.status_akademik === "aktif"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
                  }`}
              >
                {mahasiswa?.status_akademik?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Tombol Simpan */}
        {editing && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-green-600 text-white flex items-center gap-2 px-5 py-2 rounded-md hover:bg-green-700 transition w-full sm:w-auto justify-center"
            >
              {saving && <Loader2 className="animate-spin" size={16} />}
              <Save size={16} /> Simpan Perubahan
            </button>
          </div>
        )}

        {/* MODAL UPDATE PASSWORD */}
        <AnimatePresence>
          {showPasswordModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <Lock size={18} /> Ubah Password
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Silahkan masukkan password lama dan password baru Anda.
                </p>

                {/* Old Password */}
                <label className="text-sm font-medium text-gray-700">Password Lama</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className={`w-full border px-3 py-2 rounded-lg mt-1 mb-3 text-sm ${passErrors.oldPassword ? "border-red-400" : ""
                    }`}
                />
                {passErrors.oldPassword && (
                  <p className="text-xs text-red-600 mb-2">{passErrors.oldPassword}</p>
                )}

                {/* New Password */}
                <label className="text-sm font-medium text-gray-700">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full border px-3 py-2 rounded-lg mt-1 mb-3 text-sm ${passErrors.newPassword ? "border-red-400" : ""
                    }`}
                />
                {passErrors.newPassword && (
                  <p className="text-xs text-red-600 mb-2">{passErrors.newPassword}</p>
                )}

                {/* Buttons */}
                <div className="flex justify-end mt-4 gap-3">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPassErrors({});
                      setOldPassword("");
                      setNewPassword("");
                    }}
                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleUpdatePassword}
                    disabled={updatingPass}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center gap-2"
                  >
                    {updatingPass && <Loader2 className="animate-spin" size={16} />}
                    Simpan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MahasiswaLayout>
  );
};

export default ProfileMahasiswa;
