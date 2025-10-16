import React, { useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { User, Lock, Save } from "lucide-react";

const ProfileAdmin = () => {
    const { user } = useAuth();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Konfirmasi password tidak cocok!" });
            return;
        }

        try {
            setLoading(true);
            const res = await axios.put(
                `${baseUrl}auth/password`,
                {
                    oldPassword,
                    newPassword,
                },
                {
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (res.data.success) {
                setMessage({
                    type: "success",
                    text: "Password berhasil diperbarui!",
                });
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Gagal memperbarui password. Periksa kembali password lama Anda.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Profil Admin
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Informasi akun administrator sistem dan pengaturan keamanan.
                    </p>
                </div>

                {/* Profile Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full border border-gray-300 shadow-inner">
                            <User size={40} className="text-gray-500" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    {user?.email || "admin@bimbingan.ac.id"}
                                </h2>
                                <p className="text-gray-500 text-sm capitalize">
                                    Role: {user?.role || "admin"}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wide">
                                        Status
                                    </label>
                                    <p
                                        className={`mt-1 text-sm font-medium ${user?.status === "aktif"
                                                ? "text-green-600"
                                                : "text-gray-500"
                                            }`}
                                    >
                                        {user?.status || "-"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wide">
                                        ID Pengguna
                                    </label>
                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                        {user?.id_user || "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 mt-6 pt-6 text-sm text-gray-500">
                        <p>
                            <span className="font-medium text-gray-700">Terakhir login:</span>{" "}
                            baru saja
                        </p>
                        <p>
                            <span className="font-medium text-gray-700">Email aktif:</span>{" "}
                            {user?.email || "Tidak tersedia"}
                        </p>
                    </div>
                </div>

                {/* Change Password */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock size={20} className="text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-800">
                            Ubah Password
                        </h2>
                    </div>

                    <form
                        onSubmit={handlePasswordChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        <div>
                            <label className="text-sm text-gray-600 font-medium">
                                Password Lama
                            </label>
                            <input
                                type="password"
                                required
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Masukkan password lama"
                                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 font-medium">
                                Password Baru
                            </label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Masukkan password baru"
                                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="text-sm text-gray-600 font-medium">
                                Konfirmasi Password Baru
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi password baru"
                                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                            />
                        </div>

                        {message && (
                            <div
                                className={`sm:col-span-2 text-sm mt-2 ${message.type === "error"
                                        ? "text-red-600 bg-red-50 border border-red-200"
                                        : "text-green-700 bg-green-50 border border-green-200"
                                    } px-3 py-2 rounded-md`}
                            >
                                {message.text}
                            </div>
                        )}

                        <div className="sm:col-span-2 flex justify-end border-t border-gray-200 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition disabled:opacity-50"
                            >
                                <Save size={16} />
                                {loading ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ProfileAdmin;
