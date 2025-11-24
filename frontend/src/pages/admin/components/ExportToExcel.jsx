import React, { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import axios from "axios";

/**
 * Komponen Export to Excel yang Reusable
 * 
 * @param {string} endpoint - URL endpoint API untuk fetch data
 * @param {string} filename - Nama file excel yang akan didownload
 * @param {function} dataFormatter - Function untuk format data sebelum export
 * @param {string} buttonText - Text untuk button (default: "Export to Excel")
 * @param {string} buttonClassName - Custom className untuk styling button
 * @param {boolean} fetchAllPages - Fetch semua halaman pagination (default: true)
 */
const ExportToExcel = ({
    endpoint,
    filename = "export_data",
    dataFormatter,
    buttonText = "Export to Excel",
    buttonClassName = "",
    fetchAllPages = true,
    additionalParams = {},
}) => {
    const [isExporting, setIsExporting] = useState(false);

    /**
     * Fetch data dari API dengan pagination
     */
    const fetchData = async () => {
        try {
            let allData = [];
            let page = 1;
            let hasMore = true;

            // Jika fetchAllPages true, ambil semua data dari semua halaman
            if (fetchAllPages) {
                while (hasMore) {
                    const response = await axios.get(endpoint, {
                        params: {
                            page: page,
                            limit: 100, // Ambil banyak data per request
                            ...additionalParams,
                        },
                        withCredentials: true,
                    });

                    if (response.data.success) {
                        // Handle nested response structure
                        let fetchedData = [];

                        if (Array.isArray(response.data.data)) {
                            // Direct array: data: [...]
                            fetchedData = response.data.data;
                        } else if (response.data.data?.pengajuan) {
                            // Nested pengajuan: data: { pengajuan: [...] }
                            fetchedData = response.data.data.pengajuan;
                        } else if (response.data.data?.arsip) {
                            // Nested arsip: data: { arsip: [...] }
                            fetchedData = response.data.data.arsip;
                        } else if (typeof response.data.data === 'object') {
                            // Object with possible nested array
                            const dataKeys = Object.keys(response.data.data);
                            const arrayKey = dataKeys.find(key => Array.isArray(response.data.data[key]));
                            if (arrayKey) {
                                fetchedData = response.data.data[arrayKey];
                            }
                        }

                        allData = [...allData, ...fetchedData];

                        // Check pagination - support both structures
                        const pagination = response.data.pagination || response.data.data?.pagination;
                        hasMore = pagination?.hasNextPage || false;
                        page++;
                    } else {
                        hasMore = false;
                    }
                }
            } else {
                // Ambil hanya halaman pertama
                const response = await axios.get(endpoint, {
                    params: {
                        limit: 1000,
                        ...additionalParams,
                    },
                    withCredentials: true,
                });

                if (response.data.success) {
                    // Handle nested response structure
                    if (Array.isArray(response.data.data)) {
                        allData = response.data.data;
                    } else if (response.data.data?.pengajuan) {
                        allData = response.data.data.pengajuan;
                    } else if (response.data.data?.arsip) {
                        allData = response.data.data.arsip;
                    } else if (typeof response.data.data === 'object') {
                        const dataKeys = Object.keys(response.data.data);
                        const arrayKey = dataKeys.find(key => Array.isArray(response.data.data[key]));
                        if (arrayKey) {
                            allData = response.data.data[arrayKey];
                        }
                    }
                }
            }

            return allData;
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    };

    /**
     * Export data ke Excel
     */
    const handleExport = async () => {
        setIsExporting(true);

        try {
            // 1. Fetch data dari API
            const rawData = await fetchData();

            if (!rawData || rawData.length === 0) {
                alert("Tidak ada data untuk di-export");
                setIsExporting(false);
                return;
            }

            // 2. Format data menggunakan dataFormatter function
            const formattedData = dataFormatter ? dataFormatter(rawData) : rawData;

            // 3. Buat worksheet dari data
            const worksheet = XLSX.utils.json_to_sheet(formattedData);

            // 4. Auto-size columns (opsional, untuk tampilan lebih baik)
            const maxWidth = 50;
            const colWidths = [];

            // Hitung lebar kolom berdasarkan header
            const headers = Object.keys(formattedData[0] || {});
            headers.forEach((header) => {
                let maxLen = header.length;
                formattedData.forEach((row) => {
                    const cellValue = String(row[header] || "");
                    if (cellValue.length > maxLen) {
                        maxLen = cellValue.length;
                    }
                });
                colWidths.push({ wch: Math.min(maxLen + 2, maxWidth) });
            });

            worksheet["!cols"] = colWidths;

            // 5. Buat workbook dan tambahkan worksheet
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

            // 6. Generate nama file dengan timestamp
            const timestamp = new Date().toISOString().split("T")[0];
            const fileName = `${filename}_${timestamp}.xlsx`;

            // 7. Download file
            XLSX.writeFile(workbook, fileName);

            setIsExporting(false);
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal export data ke Excel. Silakan coba lagi.");
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={
                buttonClassName ||
                `flex items-center gap-2 bg-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed`
            }
        >
            {isExporting ? (
                <>
                    <Loader2 size={16} className="animate-spin" />
                    Exporting...
                </>
            ) : (
                <>
                    <FileDown size={16} />
                    {buttonText}
                </>
            )}
        </button>
    );
};

export default ExportToExcel;