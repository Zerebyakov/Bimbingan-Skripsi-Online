import React, { useEffect, useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import { RefreshCw, Save } from "lucide-react";

const KonfigurasiSistem = () => {
    const [konfig, setKonfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({});
    const [message, setMessage] = useState(null);

    // Ambil data konfigurasi
    const fetchKonfig = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}admin/konfigurasi`, {
                withCredentials: true,
            });
            setKonfig(res.data.data);
            setForm(res.data.data);
        } catch (error) {
            console.error("Error fetching konfigurasi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKonfig();
    }, []);

    // Handle input
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Simpan perubahan konfigurasi
    const handleSave = async (e) => {
        e.preventDefault();
        setMessage(null);
        try {
            const res = await axios.put(`${baseUrl}admin/konfigurasi`, form, {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
            });
            if (res.data.success) {
                setKonfig(form);
                setEditMode(false);
                setMessage({ type: "success", text: "Konfigurasi berhasil diperbarui!" });
            }
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error.response?.data?.message ||
                    "Terjadi kesalahan saat memperbarui konfigurasi.",
            });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Konfigurasi Sistem
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Kelola pengaturan utama sistem bimbingan online.
                        </p>
                    </div>

                    <button
                        onClick={fetchKonfig}
                        className="flex items-center gap-2 bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>

                {/* Konten */}
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-gray-600">
                        <RefreshCw className="animate-spin mr-2" /> Memuat konfigurasi...
                    </div>
                ) : (
                    konfig && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
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

                            <form
                                onSubmit={handleSave}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                            >
                                <div>
                                    <label className="text-sm text-gray-600 font-medium">
                                        Tahun Akademik Aktif
                                    </label>
                                    <input
                                        type="text"
                                        name="tahunAkademikAktif"
                                        disabled={!editMode}
                                        value={form.tahunAkademikAktif || ""}
                                        onChange={handleChange}
                                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 font-medium">
                                        Semester Aktif
                                    </label>
                                    <select
                                        name="semesterAktif"
                                        disabled={!editMode}
                                        value={form.semesterAktif || ""}
                                        onChange={handleChange}
                                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
                                    >
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 font-medium">
                                        Kuota Bimbingan per Dosen
                                    </label>
                                    <input
                                        type="number"
                                        name="kuotaPerDosen"
                                        disabled={!editMode}
                                        value={form.kuotaPerDosen || ""}
                                        onChange={handleChange}
                                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 font-medium">
                                        Format Nomor Kartu Bimbingan
                                    </label>
                                    <input
                                        type="text"
                                        name="formatNomorKartu"
                                        disabled={!editMode}
                                        value={form.formatNomorKartu || ""}
                                        onChange={handleChange}
                                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 font-medium">
                                        Tanggal Mulai Bimbingan
                                    </label>
                                    <input
                                        type="date"
                                        name="tanggalMulaiBimbingan"
                                        disabled={!editMode}
                                        value={
                                            form.tanggalMulaiBimbingan
                                                ? form.tanggalMulaiBimbingan.substring(0, 10)
                                                : ""
                                        }
                                        onChange={handleChange}
                                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 font-medium">
                                        Tanggal Selesai Bimbingan
                                    </label>
                                    <input
                                        type="date"
                                        name="tanggalSelesaiBimbingan"
                                        disabled={!editMode}
                                        value={
                                            form.tanggalSelesaiBimbingan
                                                ? form.tanggalSelesaiBimbingan.substring(0, 10)
                                                : ""
                                        }
                                        onChange={handleChange}
                                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none disabled:bg-gray-100"
                                    />
                                </div>

                                {/* Tombol Aksi */}
                                <div className="sm:col-span-2 flex justify-end gap-2 mt-4 border-t border-gray-200 pt-4">
                                    {editMode ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditMode(false);
                                                    setForm(konfig);
                                                }}
                                                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
                                            >
                                                <Save size={16} /> Simpan
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setEditMode(true)}
                                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                        >
                                            Edit Konfigurasi
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )
                )}
            </div>
        </AdminLayout>
    );
};

export default KonfigurasiSistem;
