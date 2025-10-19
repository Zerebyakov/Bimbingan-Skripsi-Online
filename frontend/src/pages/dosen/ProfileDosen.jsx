import React, { useState } from "react";
import DosenLayout from "./layout/DosenLayout";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Mail,
  Phone,
  BookOpenText,
  Lock,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { baseUrl } from "../../components/api/myAPI";

const ProfileDosen = () => {
  const { user, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [strength, setStrength] = useState({ label: "", color: "", value: 0 });

  // Toggle visibility
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (loading) {
    return (
      <DosenLayout>
        <div className="flex justify-center items-center h-80 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700 mr-2" />
          Memuat profil dosen...
        </div>
      </DosenLayout>
    );
  }

  const dosen = user?.Dosens?.[0];
  if (!dosen) {
    return (
      <DosenLayout>
        <div className="text-center text-gray-500 py-20">
          Data dosen tidak ditemukan.
        </div>
      </DosenLayout>
    );
  }

  // 💪 Cek kekuatan password
  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 1:
        setStrength({ label: "Lemah", color: "bg-red-500", value: 25 });
        break;
      case 2:
        setStrength({ label: "Sedang", color: "bg-yellow-500", value: 50 });
        break;
      case 3:
        setStrength({ label: "Kuat", color: "bg-green-500", value: 75 });
        break;
      case 4:
        setStrength({ label: "Sangat Kuat", color: "bg-emerald-600", value: 100 });
        break;
      default:
        setStrength({ label: "", color: "", value: 0 });
    }
  };

  // 🔐 Ubah password
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Swal.fire("Lengkapi semua kolom!", "", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire("Konfirmasi password tidak cocok!", "", "warning");
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire("Password baru minimal 6 karakter!", "", "warning");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        `${baseUrl}auth/password`,
        { oldPassword, newPassword },
        { withCredentials: true }
      );

      // ✅ Toast notification sukses
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Password berhasil diperbarui!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      setIsModalOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStrength({ label: "", color: "", value: 0 });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text:
          err.response?.data?.message ||
          "Terjadi kesalahan saat memperbarui password.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DosenLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Profil Dosen
            </h1>
            <p className="text-gray-500">
              Informasi lengkap dan keamanan akun Anda.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <Lock size={16} /> Ubah Password
          </button>
        </div>

        {/* Informasi Profil */}
        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200 flex flex-col md:flex-row gap-6">
          {/* Foto */}
          <div className="flex flex-col items-center md:items-start w-full md:w-1/3">
            <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-sm">
              {dosen.foto ? (
                <img
                  src={dosen.foto}
                  alt={dosen.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
                  No Photo
                </div>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mt-4 text-center md:text-left">
              {dosen.nama}
            </h2>
            <p className="text-sm text-gray-500">
              {dosen.jabatan_akademik} • {dosen.gelar}
            </p>
            <span
              className={`mt-3 px-3 py-1 text-xs rounded-full font-medium ${dosen.status_dosen === "tetap"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                }`}
            >
              {dosen.status_dosen?.toUpperCase()}
            </span>
          </div>

          {/* Detail */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ["NIDN", dosen.nidn],
              ["Fakultas", dosen.fakultas],
              ["Program Studi", dosen.Prodi?.program_studi],
              ["Bidang Keahlian", dosen.bidang_keahlian],
            ].map(([label, value], i) => (
              <div
                key={i}
                className="bg-gray-50 p-4 rounded-lg border border-gray-100"
              >
                <p className="text-gray-500 text-xs uppercase font-medium mb-1">
                  {label}
                </p>
                <p className="text-gray-800 font-medium">{value}</p>
              </div>
            ))}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center gap-2">
              <Mail size={16} className="text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-medium">
                  Email Institusi
                </p>
                <p className="text-gray-800 font-medium">
                  {dosen.email_institusi}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center gap-2">
              <Phone size={16} className="text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-medium">
                  Kontak
                </p>
                <p className="text-gray-800 font-medium">{dosen.kontak}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informasi Akun */}
        <div className="bg-gray-50 mt-6 rounded-xl border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpenText size={18} /> Informasi Akun
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email Akun</p>
              <p className="text-gray-800 font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status Akun</p>
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium ${user.status === "aktif"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                  }`}
              >
                {user.status?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-gray-800 font-medium capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🔐 Modal Ubah Password */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <KeyRound size={18} /> Ubah Password
              </h2>

              <div className="space-y-3">
                {/* Password Lama */}
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    placeholder="Password Lama"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Baru */}
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Password Baru"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      checkPasswordStrength(e.target.value);
                    }}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-2 ${strength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${strength.value}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <p
                      className={`text-xs mt-1 ${strength.color.includes("red")
                          ? "text-red-500"
                          : strength.color.includes("yellow")
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                    >
                      Kekuatan: {strength.label}
                    </p>
                  </div>
                )}

                {/* Konfirmasi */}
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Konfirmasi Password Baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Batal
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DosenLayout>
  );
};

export default ProfileDosen;
