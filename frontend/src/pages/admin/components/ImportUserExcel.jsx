import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Download, Upload, X } from "lucide-react";
import { baseUrl } from "../../../components/api/myAPI";

const ImportUserExcel = ({ type = "mahasiswa", onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const label = type === "dosen" ? "Dosen" : "Mahasiswa";

  const resetImport = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    resetImport();
  };

  const handleDownloadTemplate = () => {
    window.open(`${baseUrl}admin/import/template/${type}`, "_blank");
  };

  const handleImport = async () => {
    if (!file) {
      Swal.fire({
        icon: "warning",
        title: "File belum dipilih",
        text: "Pilih file Excel terlebih dahulu.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(`${baseUrl}admin/import/${type}`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(res.data);

      Swal.fire({
        icon: "success",
        title: "Import selesai",
        text: `${res.data.summary.success} data berhasil, ${res.data.summary.failed} gagal.`,
      });

      setFile(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Import gagal",
        text:
          error.response?.data?.message ||
          "Terjadi kesalahan saat import data.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-md hover:bg-gray-50 transition whitespace-nowrap w-full sm:w-auto"
      >
        <Upload size={16} />
        Import Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-3 py-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 sm:px-6 py-4 border-b border-gray-300 flex justify-between items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  Import Data {label}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Upload file Excel sesuai template yang disediakan.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition w-full sm:w-auto whitespace-nowrap"
                >
                  <Download size={16} />
                  Download Template
                </button>

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md transition w-full sm:w-auto"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition w-full sm:w-auto ${
                    loading
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Upload size={16} />
                  {loading ? "Mengimport..." : "Import"}
                </button>
              </div>

              {result && (
                <div className="border rounded-lg p-3 bg-gray-50 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <p>
                      Total: <strong>{result.summary.total}</strong>
                    </p>
                    <p className="text-green-700">
                      Berhasil: <strong>{result.summary.success}</strong>
                    </p>
                    <p className="text-red-700">
                      Gagal: <strong>{result.summary.failed}</strong>
                    </p>
                  </div>

                  {result.data.failedRows?.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-gray-700 mb-2">
                        Data gagal:
                      </p>

                      <div className="overflow-x-auto border rounded bg-white">
                        <table className="min-w-[520px] w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Baris</th>
                              <th className="p-2 text-left">Email</th>
                              <th className="p-2 text-left">Alasan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.data.failedRows.map((item, index) => (
                              <tr key={index} className="border-t">
                                <td className="p-2">{item.row}</td>
                                <td className="p-2 break-all">{item.email}</td>
                                <td className="p-2">{item.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportUserExcel;