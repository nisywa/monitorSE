import React, { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ListDesa from './ListDesa';
import ListSls from './ListSls';
import FormModal from '@/Components/FormModal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function Index({ kecamatan: initialKecamatan }) {
    const [kecamatan, setKecamatan] = useState(initialKecamatan);
    const [selectedKecamatan, setSelectedKecamatan] = useState(null);
    const [selectedDesa, setSelectedDesa] = useState(null);
    
    const [formModal, setFormModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nama: '' });
    const [formLoading, setFormLoading] = useState(false);
    
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // State untuk import
    const [showImportModal, setShowImportModal] = useState(false);
    const [importPreview, setImportPreview] = useState([]);
    const [importErrors, setImportErrors] = useState([]);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    const handleLihatDesa = (k) => {
        setSelectedKecamatan(k);
        setSelectedDesa(null);
    };

    const handleBackFromDesa = () => {
        setSelectedKecamatan(null);
        setSelectedDesa(null);
    };

    const handleSelectDesa = (d) => {
        setSelectedDesa(d);
    };

    const handleBackFromSls = () => {
        setSelectedDesa(null);
    };

    const openAddForm = () => {
        setEditingId(null);
        setFormData({ nama: '' });
        setFormModal(true);
    };

    const openEditForm = (k) => {
        setEditingId(k.id);
        setFormData({ nama: k.nama });
        setFormModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const url = editingId 
                ? `/api/wilayah-kerja/kecamatan/${editingId}`
                : '/api/wilayah-kerja/kecamatan';
            const method = editingId ? 'put' : 'post';

            const response = await axios[method](url, formData);

            if (response.data.success) {
                // Refresh data
                const response = await axios.get('/wilayah-kerja');
                window.location.reload();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menyimpan data');
        } finally {
            setFormLoading(false);
        }
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setDeleteConfirm(true);
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const response = await axios.delete(`/api/wilayah-kerja/kecamatan/${deleteId}`);
            if (response.data.success) {
                window.location.reload();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menghapus data');
        } finally {
            setDeleteLoading(false);
            setDeleteConfirm(false);
        }
    };

    // ── Download Template Import ──────────────────────────────────────────────
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Kecamatan': 'Contoh Kecamatan',
                'Desa': 'Contoh Desa',
                'SLS': '001.01.01',
            },
            {
                'Kecamatan': 'Kecamatan Lainnya',
                'Desa': 'Desa Lainnya',
                'SLS': '001.01.02',
            },
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        worksheet['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 20 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Wilayah');
        XLSX.writeFile(workbook, 'Template_Import_Wilayah_Kerja.xlsx');
    };

    // ── Baca & validasi file Excel ────────────────────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const workbook = XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                const errs = [];
                const preview = rows.map((row, i) => {
                    const no = i + 1;
                    const kecamatan = (row['Kecamatan'] ?? '').toString().trim();
                    const desa = (row['Desa'] ?? '').toString().trim();
                    const sls = (row['SLS'] ?? '').toString().trim();

                    // Validasi
                    if (!kecamatan) errs.push(`Baris ${no}: Kecamatan wajib diisi`);
                    if (!desa) errs.push(`Baris ${no}: Desa wajib diisi`);
                    if (!sls) errs.push(`Baris ${no}: SLS wajib diisi`);

                    return { no, kecamatan, desa, sls };
                });

                setImportErrors(errs);
                setImportPreview(preview);
            } catch (error) {
                setImportErrors(['Gagal membaca file Excel: ' + error.message]);
                setImportPreview([]);
            }
        };
        reader.readAsBinaryString(file);
    };

    // ── Kirim data import ke backend ──────────────────────────────────────────
    const handleImportSubmit = async () => {
        if (importErrors.length > 0) return;

        setImporting(true);
        const payload = importPreview.map(r => ({
            kecamatan: r.kecamatan,
            desa: r.desa,
            sls: r.sls,
        }));

        try {
            // Try to extract CSRF token from meta tag or window variable
            const token = document.querySelector('meta[name="csrf-token"]')?.content || window.csrf_token || document.querySelector('input[name="_token"]')?.value || (() => {
                // Fallback: read XSRF-TOKEN cookie
                const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
                return match ? decodeURIComponent(match[2]) : null;
            })();

            // Configure axios to include credentials (cookies) for session-based CSRF
            axios.defaults.withCredentials = true;
            axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };
            if (token) headers['X-CSRF-TOKEN'] = token;

            const res = await axios.post('/wilayah-kerja/import', { rows: payload }, { headers });

            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';

            if (res.status === 200 && res.data && res.data.success) {
                alert('✓ ' + res.data.message);
                setTimeout(() => window.location.reload(), 800);
            } else if (res.status === 200 && res.data && !res.data.success) {
                alert('✗ Error: ' + (res.data.message || 'Gagal import data'));
            } else {
                alert('✗ Error: Server returned unexpected response');
            }
        } catch (err) {
            console.error(err);
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';

            // Detect Laravel CSRF (status 419) or token mismatch message
            if (err.response) {
                const status = err.response.status;
                const msg = err.response.data?.message || err.response.data || err.message;
                if (status === 419 || (typeof msg === 'string' && msg.toLowerCase().includes('csrf'))) {
                    alert('✗ Error: CSRF token mismatch. Silakan muat ulang halaman dan coba lagi.');
                    return;
                }
                alert('✗ Error: ' + (msg || 'Gagal import data'));
            } else {
                alert('Gagal membaca file: ' + err.message);
            }
        }
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setImportPreview([]);
        setImportErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (selectedDesa) {
        return (
            <AdminLayout>
                <Head title="Wilayah Kerja - SLS" />
                <ListSls 
                    desa={selectedDesa} 
                    onBack={handleBackFromSls}
                />
            </AdminLayout>
        );
    }

    if (selectedKecamatan) {
        return (
            <AdminLayout>
                <Head title="Wilayah Kerja - Desa" />
                <ListDesa 
                    kecamatan={selectedKecamatan} 
                    onBack={handleBackFromDesa}
                    onSelectDesa={handleSelectDesa}
                />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Wilayah Kerja" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Wilayah Kerja</h1>
                            <p className="mt-2 text-gray-600">Kabupaten Pinrang, Provinsi Sulawesi Selatan</p>
                        </div>
                        <button
                            onClick={openAddForm}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Kecamatan
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            Import Excel
                        </button>
                    </div>

                    <div className="bg-white overflow-hidden shadow-md rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-600 text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">No</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Nama Kecamatan</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {kecamatan && kecamatan.length > 0 ? (
                                        kecamatan.map((k, index) => (
                                            <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{k.nama}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleLihatDesa(k)}
                                                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                                                        >
                                                            Lihat Desa
                                                        </button>
                                                        <button
                                                            onClick={() => openEditForm(k)}
                                                            className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(k.id)}
                                                            className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                                Tidak ada data kecamatan
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <FormModal isOpen={formModal} title={editingId ? 'Edit Kecamatan' : 'Tambah Kecamatan'} onClose={() => setFormModal(false)}>
                <form onSubmit={handleFormSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kecamatan</label>
                        <input
                            type="text"
                            value={formData.nama}
                            onChange={(e) => setFormData({ nama: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={() => setFormModal(false)}
                            disabled={formLoading}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {formLoading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </FormModal>

            <ConfirmDialog
                isOpen={deleteConfirm}
                title="Hapus Kecamatan"
                message="Apakah Anda yakin ingin menghapus kecamatan ini? Data desa dan SLS yang terkait juga akan dihapus."
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(false)}
                isLoading={deleteLoading}
            />

            {/* ── Modal Import Excel ── */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">Import Data Wilayah Kerja dari Excel</h2>
                            <button
                                onClick={closeImportModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Panduan & Download Template */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 space-y-1">
                                <p className="font-medium">Format kolom Excel yang diperlukan:</p>
                                <ul className="list-disc list-inside text-xs space-y-0.5 text-blue-600">
                                    <li><strong>Kecamatan</strong> — nama kecamatan</li>
                                    <li><strong>Desa</strong> — nama desa</li>
                                    <li><strong>SLS</strong> — nomor SLS (cth: 001.01.01)</li>
                                </ul>
                                <button onClick={handleDownloadTemplate}
                                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 underline hover:text-blue-900">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download template Excel
                                </button>
                            </div>

                            {/* Input file */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih File Excel (.xlsx / .xls)</label>
                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange}
                                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 border border-gray-200 rounded-lg cursor-pointer" />
                            </div>

                            {/* Errors validasi */}
                            {importErrors.length > 0 && (
                                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 space-y-1">
                                    <p className="text-xs font-semibold text-red-700">Ditemukan {importErrors.length} kesalahan:</p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {importErrors.map((err, i) => (
                                            <li key={i} className="text-xs text-red-600">{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Preview tabel */}
                            {importPreview.length > 0 && importErrors.length === 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                        Preview data ({importPreview.length} baris):
                                    </p>
                                    <div className="overflow-x-auto rounded-lg border border-gray-100 max-h-52 overflow-y-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-gray-500">No</th>
                                                    <th className="px-3 py-2 text-left text-gray-500">Kecamatan</th>
                                                    <th className="px-3 py-2 text-left text-gray-500">Desa</th>
                                                    <th className="px-3 py-2 text-left text-gray-500">SLS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {importPreview.map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 text-gray-400">{row.no}</td>
                                                        <td className="px-3 py-2 text-gray-700">{row.kecamatan}</td>
                                                        <td className="px-3 py-2 text-gray-700">{row.desa}</td>
                                                        <td className="px-3 py-2 text-gray-700">{row.sls}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Tombol aksi */}
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={closeImportModal}
                                    className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                    Batal
                                </button>
                                <button type="button" onClick={handleImportSubmit}
                                    disabled={importPreview.length === 0 || importErrors.length > 0 || importing}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                                    {importing ? 'Mengimpor...' : `Import ${importPreview.length > 0 ? importPreview.length + ' Data' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
