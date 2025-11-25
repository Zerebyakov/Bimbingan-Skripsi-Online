import React, { useEffect, useState } from "react";
import AdminLayout from "./layout/AdminLayout";
import axios from "axios";
import { baseUrl } from "../../components/api/myAPI";
import {
    Settings,
    Edit3,
    Save,
    Calendar,
    Plus,
    Trash2,
    ToggleRight,
    ToggleLeft,
} from "lucide-react";
import Swal from "sweetalert2";
import PageMeta from "../../components/PageMeta";

const KonfigurasiSistem = () => {
    const [config, setConfig] = useState(null);
    const [periode, setPeriode] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prodi, setProdi] = useState([]);
    const [formProdi, setFormProdi] = useState({
        kode_prodi: '',
        program_studi: ''
    });
    const [showModalProdi, setShowModalProdi] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formConfig, setFormConfig] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedPeriode, setSelectedPeriode] = useState(null);
    const [formPeriode, setFormPeriode] = useState({
        tahun_akademik: "",
        semester: "",
        isActive: false,
    });

    const fetchProdi = async () => {
        try {
            const res = await axios.get(`${baseUrl}prodi`, {
                withCredentials: true
            });
            setProdi(res.data.data);
        } catch (error) {
            console.log(error.message);
        }
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const konfigRes = await axios.get(`${baseUrl}admin/konfigurasi`, {
                withCredentials: true,
            });
            const periodeRes = await axios.get(`${baseUrl}admin/periode`, {
                withCredentials: true,
            });
            const statsRes = await axios.get(`${baseUrl}admin/periode/statistics`, {
                withCredentials: true,
            });
            setConfig(konfigRes.data.data);
            setFormConfig(konfigRes.data.data);
            setPeriode(periodeRes.data.data.periode);
            setStats(statsRes.data.data);
        } catch (err) {
            console.error("Fetch error:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
        fetchProdi();
    }, []);

    const saveKonfigurasi = async () => {
        Swal.fire({
            title: "Menyimpan...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        try {
            const res = await axios.put(`${baseUrl}admin/konfigurasi`, formConfig, {
                withCredentials: true,
            });
            Swal.fire({
                icon: "success",
                title: "Berhasil!",
                text: "Konfigurasi diperbarui",
                timer: 1500,
                showConfirmButton: false,
            });
            setEditMode(false);
            setConfig(res.data.data);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Tidak dapat menyimpan perubahan.",
            });
        }
    };

    const toggleStatus = async (id) => {
        Swal.fire({
            title: "Mengubah Status...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        try {
            await axios.patch(
                `${baseUrl}admin/periode/${id}/toggle-status`,
                {},
                { withCredentials: true }
            );
            Swal.fire({
                icon: "success",
                title: "Status diperbarui",
                timer: 1200,
                showConfirmButton: false,
            });
            fetchAll();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Tidak dapat mengubah status periode",
            });
        }
    };

    const deletePeriode = async (id) => {
        const confirm = await Swal.fire({
            title: "Hapus Periode?",
            text: "Data tidak bisa dikembalikan setelah dihapus.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Hapus",
            cancelButtonText: "Batal",
            confirmButtonColor: "#d33",
        });
        if (!confirm.isConfirmed) return;
        try {
            await axios.delete(`${baseUrl}admin/periode/${id}`, {
                withCredentials: true,
            });
            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Periode dihapus",
                timer: 1400,
                showConfirmButton: false,
            });
            fetchAll();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Gagal menghapus periode",
            });
        }
    };

    const openCreateModal = () => {
        setModalMode("create");
        setFormPeriode({
            tahun_akademik: "",
            semester: "ganjil",
            isActive: false,
        });
        setShowModal(true);
    };

    const openEditModal = (data) => {
        setModalMode("edit");
        setSelectedPeriode(data);
        setFormPeriode({
            tahun_akademik: data.tahun_akademik,
            semester: data.semester,
            isActive: data.isActive,
        });
        setShowModal(true);
    };

    const openCreateModalProdi = async () => {
        setModalMode("create");
        setFormProdi({
            kode_prodi: '',
            program_studi: ''
        });
        setShowModalProdi(true);
    };

    const saveProgramStudi = async () => {
        Swal.fire({
            title: "Menyimpan...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        try {
            if (modalMode === 'create') {
                await axios.post(`${baseUrl}prodi`, formProdi, {
                    withCredentials: true
                });
            }
            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Prodi berhasil disimpan",
                timer: 1500,
                showConfirmButton: false,
            });
            setShowModalProdi(false);
            fetchProdi();
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Tidak dapat menyimpan prodi",
            });
        }
    };

    const deleteProdi = async (id) => {
        const confirm = await Swal.fire({
            title: "Hapus Program Studi?",
            text: "Data tidak bisa dikembalikan setelah dihapus.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Hapus",
            cancelButtonText: "Batal",
            confirmButtonColor: "#d33",
        });
        if (!confirm.isConfirmed) return;
        try {
            await axios.delete(`${baseUrl}prodi/${id}`, {
                withCredentials: true,
            });
            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Program Studi dihapus",
                timer: 1400,
                showConfirmButton: false,
            });
            fetchProdi();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Gagal menghapus program studi",
                text: err.response?.data?.message || "Terjadi kesalahan",
            });
        }
    };

    const savePeriode = async () => {
        Swal.fire({
            title: "Menyimpan...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        try {
            if (modalMode === "create") {
                await axios.post(`${baseUrl}admin/periode`, formPeriode, {
                    withCredentials: true,
                });
            } else {
                await axios.put(
                    `${baseUrl}admin/periode/${selectedPeriode.id_periode}`,
                    formPeriode,
                    { withCredentials: true }
                );
            }
            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Periode berhasil disimpan",
                timer: 1500,
                showConfirmButton: false,
            });
            setShowModal(false);
            fetchAll();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Tidak dapat menyimpan periode",
            });
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="text-center text-gray-500 py-10">Memuat...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <PageMeta
                title="Konfigurasi Sistem"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 bg-white border rounded-xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Settings size={18} /> Konfigurasi Sistem Aktif
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600">Tahun Akademik</p>
                            <input
                                disabled={!editMode}
                                value={formConfig.tahun_akademik || ""}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        tahun_akademik: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-md mt-1"
                            />
                        </div>
                        <div>
                            <p className="text-gray-600">Semester</p>
                            <select
                                disabled={!editMode}
                                value={formConfig.semester}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        semester: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-md mt-1"
                            >
                                <option value="ganjil">Ganjil</option>
                                <option value="genap">Genap</option>
                            </select>
                        </div>
                        <div>
                            <p className="text-gray-600">Kuota per Dosen</p>
                            <input
                                disabled={!editMode}
                                value={formConfig.kuotaPerDosen}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        kuotaPerDosen: e.target.value,
                                    })
                                }
                                type="number"
                                className="w-full px-3 py-2 border rounded-md mt-1"
                            />
                        </div>
                        <div>
                            <p className="text-gray-600">Format Nomor Kartu</p>
                            <input
                                disabled={!editMode}
                                value={formConfig.formatNomorKartu || ""}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        formatNomorKartu: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-md mt-1"
                            />
                        </div>
                        <div>
                            <p className="text-gray-600 flex items-center gap-1">
                                <Calendar size={14} /> Mulai Bimbingan
                            </p>
                            <input
                                type="date"
                                disabled={!editMode}
                                value={formConfig.tanggalMulaiBimbingan?.substring(0, 10)}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        tanggalMulaiBimbingan: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-md mt-1"
                            />
                        </div>
                        <div>
                            <p className="text-gray-600 flex items-center gap-1">
                                <Calendar size={14} /> Selesai Bimbingan
                            </p>
                            <input
                                type="date"
                                disabled={!editMode}
                                value={formConfig.tanggalSelesaiBimbingan?.substring(0, 10)}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        tanggalSelesaiBimbingan: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-md mt-1"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t pt-3 text-sm">
                        {editMode ? (
                            <>
                                <button
                                    onClick={() => {
                                        setFormConfig(config);
                                        setEditMode(false);
                                    }}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={saveKonfigurasi}
                                    className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
                                >
                                    Simpan
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition"
                            >
                                <Edit3 size={15} /> Edit
                            </button>
                        )}
                    </div>
                </div>
                <div className="bg-white border rounded-xl p-5 h-fit">
                    <h2 className="text-lg font-semibold mb-3">Statistik Periode</h2>
                    <div className="space-y-3">
                        {stats.map((s) => (
                            <div
                                key={s.id_periode}
                                className="border rounded-lg p-4 hover:bg-gray-50"
                            >
                                <div className="flex justify-between font-medium">
                                    <p>
                                        {s.tahun_akademik} — {s.semester.toUpperCase()}
                                    </p>
                                    <p
                                        className={`${s.isActive ? "text-green-600" : "text-gray-500"
                                            } text-sm`}
                                    >
                                        {s.isActive ? "Aktif" : "Tidak Aktif"}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 text-xs mt-2 text-gray-600">
                                    <p>Total: {s.totalPengajuan}</p>
                                    <p>Diterima: {s.pengajuanDiterima}</p>
                                    <p>Ditolak: {s.pengajuanDitolak}</p>
                                    <p>Menunggu: {s.pengajuanMenunggu}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="bg-white border rounded-xl p-6 mt-6">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">Manajemen Periode</h2>
                    <button
                        className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition"
                        onClick={openCreateModal}
                    >
                        <Plus size={16} /> Tambah Periode
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="px-4 py-3 text-left">No</th>
                                <th className="px-4 py-3 text-left">Tahun Akademik</th>
                                <th className="px-4 py-3 text-left">Semester</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Mulai</th>
                                <th className="px-4 py-3 text-left">Selesai</th>
                                <th className="px-4 py-3 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periode.map((p, i) => (
                                <tr key={p.id_periode} className="border-b">
                                    <td className="px-4 py-3 font-medium text-gray-800">{i + 1}</td>
                                    <td className="px-4 py-3 text-gray-700">{p.tahun_akademik}</td>
                                    <td className="px-4 py-3 text-gray-700">{p.semester}</td>
                                    <td className="px-4 py-3 text-gray-700">{p.isActive ? "Aktif" : "Nonaktif"}</td>
                                    <td className="px-4 py-3 text-gray-700">{p.tanggalMulaiBimbingan?.substring(0, 10)}</td>
                                    <td className="px-4 py-3 text-gray-700">{p.tanggalSelesaiBimbingan?.substring(0, 10)}</td>
                                    <td className="py-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(p)}
                                                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                                                title="Edit Periode"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(p.id_periode)}
                                                className={`p-2 rounded-md transition ${p.isActive
                                                    ? "bg-green-100 hover:bg-green-200 text-green-700"
                                                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                                                    }`}
                                                title="Ubah Status"
                                            >
                                                {p.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            </button>
                                            <button
                                                onClick={() => deletePeriode(p.id_periode)}
                                                className="p-2 rounded-md bg-red-100 hover:bg-red-200 text-red-600 transition"
                                                title="Hapus Periode"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-white border rounded-xl p-6 mt-6">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">Manajemen Program Studi</h2>
                    <button
                        className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition"
                        onClick={openCreateModalProdi}
                    >
                        <Plus size={16} /> Tambah Program Studi
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="px-4 py-3 text-left">No</th>
                                <th className="px-4 py-3 text-left">Kode</th>
                                <th className="px-4 py-3 text-left">Program Studi</th>
                                <th className="px-4 py-3 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prodi.map((pd, index) => (
                                <tr key={pd.prodi_id} className="border-b">
                                    <td className="px-4 py-3 font-medium text-gray-800">{index + 1}</td>
                                    <td className="px-4 py-3 text-gray-700">{pd.kode_prodi}</td>
                                    <td className="px-4 py-3 text-gray-700">{pd.program_studi.toUpperCase()}</td>
                                    <td className="py-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => deleteProdi(pd.prodi_id)}
                                                className="p-2 rounded-md bg-red-100 hover:bg-red-200 text-red-600 transition"
                                                title="Hapus Program Studi"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-3 overflow-hidden animate-fade-in">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                {modalMode === "create" ? "Tambah Periode Baru" : "Edit Periode"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
                            <div>
                                <label className="text-gray-600 font-medium">Tahun Akademik</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                                    value={formPeriode.tahun_akademik}
                                    onChange={(e) =>
                                        setFormPeriode({ ...formPeriode, tahun_akademik: e.target.value })
                                    }
                                    placeholder="2024/2025"
                                />
                            </div>
                            <div>
                                <label className="text-gray-600 font-medium">Semester</label>
                                <select
                                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                                    value={formPeriode.semester}
                                    onChange={(e) =>
                                        setFormPeriode({ ...formPeriode, semester: e.target.value })
                                    }
                                >
                                    <option value="ganjil">Ganjil</option>
                                    <option value="genap">Genap</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    checked={formPeriode.isActive}
                                    onChange={(e) =>
                                        setFormPeriode({ ...formPeriode, isActive: e.target.checked })
                                    }
                                />
                                <span className="text-gray-700">Aktifkan Periode</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={savePeriode}
                                className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showModalProdi && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-3 overflow-hidden animate-fade-in">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                {modalMode === "create" ? "Tambah Prodi Baru" : null}
                            </h2>
                            <button
                                onClick={() => setShowModalProdi(false)}
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
                            <div>
                                <label className="text-gray-600 font-medium">Kode Prodi</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                                    value={formProdi.kode_prodi}
                                    onChange={(e) =>
                                        setFormProdi({ ...formProdi, kode_prodi: e.target.value })
                                    }
                                    placeholder="TI"
                                />
                            </div>
                            <div>
                                <label className="text-gray-600 font-medium">Program Studi</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                                    value={formProdi.program_studi}
                                    onChange={(e) =>
                                        setFormProdi({ ...formProdi, program_studi: e.target.value })
                                    }
                                    placeholder="INFORMATIKA"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 bg-gray-50">
                            <button
                                onClick={() => setShowModalProdi(false)}
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={saveProgramStudi}
                                className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default KonfigurasiSistem;