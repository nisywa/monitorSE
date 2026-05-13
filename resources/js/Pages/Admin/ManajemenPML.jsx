import { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Modal from '@/Components/Modal';
import Alert from '@/Components/Alert';
import PopupWarning from '@/Components/PopupWarning';
import * as XLSX from 'xlsx';

export default function ManajemenPML({ pmls }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    // State untuk import
    const [showImportModal, setShowImportModal] = useState(false);
    const [importPreview, setImportPreview] = useState([]);
    const [importErrors, setImportErrors] = useState([]);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        email: '',
        tanggal_lahir: '',
    });

    const openAdd = () => {
        setEditData(null);
        reset();
        clearErrors();
        setShowModal(true);
    };

    const openEdit = (pml) => {
        setEditData(pml);
        setData({ nama: pml.nama_PML, email: pml.email, tanggal_lahir: pml.tanggal_lahir });
        clearErrors();
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editData) {
            put(`/manajemen-pml/${editData.id}`, {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        } else {
            post('/manajemen-pml', {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (pml) => {
        if (pml.total_pcl > 0) {
            setWarningMessage(
                `Anda tidak bisa menghapus data PML karena saat ini PML memiliki tanggung jawab terhadap ${pml.total_pcl} PCL.\n\nSilakan pindahkan semua PCL ke PML lain terlebih dahulu.`
            );
            setShowWarning(true);
            return;
        }
        if (confirm('Yakin ingin menghapus data PML ini?')) {
            router.delete(`/manajemen-pml/${pml.id}`);
        }
    };

    // ── Export Excel ──────────────────────────────────────────────────────────
    const handleExportExcel = () => {
        const exportData = filtered.map((pml, i) => ({
            'No': i + 1,
            'Nama PML': pml.nama_PML,
            'Email': pml.email,
            'Tanggal Lahir': pml.tanggal_lahir,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 35 }, { wch: 18 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar PML');
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        XLSX.writeFile(workbook, `Daftar_PML_${today}.xlsx`);
    };

    // ── Download Template Import ──────────────────────────────────────────────
    const handleDownloadTemplate = () => {
        const templateData = [
            { 'Nama PML': 'Contoh Nama', 'Email': 'contoh@email.com', 'Tanggal Lahir': '1990-05-20' },
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        worksheet['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 18 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template PML');
        XLSX.writeFile(workbook, 'Template_Import_PML.xlsx');
    };

    // ── Baca & validasi file Excel ────────────────────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const workbook = XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            const errs = [];
            const preview = rows.map((row, i) => {
                const no = i + 1;
                const nama = (row['Nama PML'] ?? '').toString().trim();
                const email = (row['Email'] ?? '').toString().trim();

                // Normalisasi tanggal lahir (handle Date object, string, Excel serial)
                let tanggal_lahir = '';
                const raw = row['Tanggal Lahir'];
                if (raw instanceof Date) {
                    tanggal_lahir = raw.toISOString().slice(0, 10);
                } else if (typeof raw === 'string' && raw) {
                    const cleaned = raw.trim();
                    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
                        tanggal_lahir = cleaned;
                    } else if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(cleaned)) {
                        const parts = cleaned.split(/[\/\-]/);
                        tanggal_lahir = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                } else if (typeof raw === 'number') {
                    const d = XLSX.SSF.parse_date_code(raw);
                    tanggal_lahir = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
                }

                // Validasi per baris
                if (!nama) errs.push(`Baris ${no}: Nama PML wajib diisi.`);
                if (!email) errs.push(`Baris ${no}: Email wajib diisi.`);
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push(`Baris ${no}: Format email tidak valid.`);
                if (!tanggal_lahir) errs.push(`Baris ${no}: Tanggal Lahir tidak valid (gunakan YYYY-MM-DD atau DD/MM/YYYY).`);

                return { no, nama, email, tanggal_lahir };
            });

            setImportErrors(errs);
            setImportPreview(preview);
        };
        reader.readAsBinaryString(file);
    };

    // ── Kirim data import ke backend ──────────────────────────────────────────
    const handleImportSubmit = () => {
        if (importErrors.length > 0) return;

        setImporting(true);
        const payload = importPreview.map(r => ({
            nama: r.nama,
            email: r.email,
            tanggal_lahir: r.tanggal_lahir,
        }));

        router.post('/manajemen-pml/import', { rows: payload }, {
            onSuccess: () => {
                setShowImportModal(false);
                setImportPreview([]);
                setImportErrors([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setImporting(false);
            },
            onError: () => setImporting(false),
        });
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setImportPreview([]);
        setImportErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Filter ────────────────────────────────────────────────────────────────
    const filtered = pmls?.filter(p =>
        p.nama_PML.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    return (
        <MainLayout title="Manajemen PML">
            <Head title="Manajemen PML" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Daftar PML</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Total {pmls?.length ?? 0} PML terdaftar</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Export Excel */}
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Excel
                    </button>

                    {/* Import Excel */}
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        Import Excel
                    </button>

                    {/* Tambah PML */}
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah PML
                    </button>
                </div>
            </div>

            {/* Alert Messages */}
            {flash?.success && <Alert type="success" message={flash.success} />}
            {flash?.error && <Alert type="error" message={flash.error} />}

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama PML</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Lahir</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                                        {search ? 'Tidak ada hasil pencarian.' : 'Belum ada data PML.'}
                                    </td>
                                </tr>
                            ) : filtered.map((pml, i) => (
                                <tr key={pml.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                                                {pml.nama_PML.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-800">{pml.nama_PML}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">{pml.email}</td>
                                    <td className="px-5 py-3.5 text-gray-600">{pml.tanggal_lahir}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-start gap-2">
                                            <button
                                                onClick={() => openEdit(pml)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pml)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal Tambah / Edit ── */}
            <Modal show={showModal} onClose={() => setShowModal(false)} title={editData ? 'Edit Data PML' : 'Tambah PML Baru'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input type="text" value={data.nama} onChange={e => setData('nama', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nama ? 'border-red-300' : 'border-gray-200'}`}
                            placeholder="Masukkan nama lengkap" />
                        {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                            placeholder="Masukkan email" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                        <input type="date" value={data.tanggal_lahir} onChange={e => setData('tanggal_lahir', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal_lahir ? 'border-red-300' : 'border-gray-200'}`} />
                        {errors.tanggal_lahir && <p className="text-red-500 text-xs mt-1">{errors.tanggal_lahir}</p>}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            Batal
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                            {processing ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah PML'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Modal Import Excel ── */}
            <Modal show={showImportModal} onClose={closeImportModal} title="Import Data PML dari Excel">
                <div className="space-y-4">

                    {/* Panduan & Download Template */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 space-y-1">
                        <p className="font-medium">Format kolom Excel yang diperlukan:</p>
                        <ul className="list-disc list-inside text-xs space-y-0.5 text-blue-600">
                            <li><strong>Nama PML</strong> — nama lengkap</li>
                            <li><strong>Email</strong> — alamat email unik</li>
                            <li><strong>Tanggal Lahir</strong> — format YYYY-MM-DD atau DD/MM/YYYY</li>
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
                                            <th className="px-3 py-2 text-left text-gray-500">Nama PML</th>
                                            <th className="px-3 py-2 text-left text-gray-500">Email</th>
                                            <th className="px-3 py-2 text-left text-gray-500">Tanggal Lahir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {importPreview.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 text-gray-400">{row.no}</td>
                                                <td className="px-3 py-2 text-gray-700">{row.nama}</td>
                                                <td className="px-3 py-2 text-gray-700">{row.email}</td>
                                                <td className="px-3 py-2 text-gray-700">{row.tanggal_lahir}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                                Password otomatis dibuat dari tanggal lahir (format: DDMMYYYY).
                            </p>
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
            </Modal>

            {/* Popup Warning untuk PML dengan PCL */}
            <PopupWarning
                show={showWarning}
                type="warning"
                title="Tidak Bisa Menghapus PML"
                message={warningMessage}
                onClose={() => setShowWarning(false)}
            />
        </MainLayout>
    );
}
