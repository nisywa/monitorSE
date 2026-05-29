import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Head, useForm, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Modal from '@/Components/Modal';

export default function ManajemenPCL({ pcls, pmls, surveis }) {
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedSurveiId, setSelectedSurveiId] = useState('');
    const [selectedPmlName, setSelectedPmlName] = useState('');
    const [importLoading, setImportLoading] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        email: '',
        pml_id: '',
        survei_id: '',
        tanggal_lahir: '',
        asal_kecamatan: '',
        desa: '',
        sls: '',
        sobat_id: '',
        no_telp: '',
    });

    const openAdd = () => {
        setEditData(null);
        reset();
        clearErrors();
        if (selectedSurveiId) {
            setData('survei_id', selectedSurveiId);
        }
        setShowModal(true);
    };

    const openEdit = async (pcl) => {
        setEditData(pcl);
        try {
            const response = await fetch(`/manajemen-pcl/${pcl.id}`);
            const pclData = await response.json();
            setData({
                nama: pclData.nama_pcl,
                email: pclData.email,
                pml_id: pclData.pml_id || '',
                survei_id: pclData.survei_id || '',
                tanggal_lahir: pclData.tanggal_lahir,
                asal_kecamatan: pclData.asal_kecamatan,
                desa: pclData.desa,
                sls: pclData.sls,
                sobat_id: pclData.sobat_id,
                no_telp: pclData.no_telp,
            });
            clearErrors();
            setShowModal(true);
        } catch (error) {
            console.error('Error loading PCL data:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editData) {
            put(`/manajemen-pcl/${editData.id}`, {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        } else {
            post('/manajemen-pcl', {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus data PCL ini?')) {
            router.delete(`/manajemen-pcl/${id}`);
        }
    };

    const handleExportExcel = async () => {
        if (!selectedSurveiId) return;
        try {
            const res = await fetch(`/manajemen-pcl/export/${selectedSurveiId}`, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('Failed to fetch export data');
            const json = await res.json();
            const data = json.data || [];
            const worksheet = XLSX.utils.json_to_sheet(data);
            worksheet['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 25 }];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, json.survei_name || 'PCL');
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            XLSX.writeFile(workbook, `PCL_${(json.survei_name || 'Survei')}_${today}.xlsx`);
        } catch (err) {
            console.error(err);
            alert('Gagal men-generate file export: ' + err.message);
        }
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Nama PCL': 'Contoh Nama',
                'Email': 'contoh@example.com',
                'Tanggal Lahir': '1990-05-15',
                'Asal Kecamatan': 'Kecamatan A',
                'Desa': 'Desa A',
                'SLS': '001.01.01',
                'Sobat ID': 'SOBAT0001',
                'No Telepon': '081234567890',
                'PML': 'Nama PML'
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        worksheet['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 25 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template PCL');
        XLSX.writeFile(workbook, 'Template_Import_PCL.xlsx');
    };

    const handleImportExcel = (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedSurveiId) {
            alert('Pilih file dan survei terlebih dahulu');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const workbook = XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                const payload = [];
                const errors = [];

                rows.forEach((row, idx) => {
                    const no = idx + 1;
                    const nama = (row['Nama PCL'] ?? '').toString().trim();
                    const email = (row['Email'] ?? '').toString().trim();
                    let tanggal = row['Tanggal Lahir'];
                    if (tanggal instanceof Date) {
                        tanggal = tanggal.toISOString().slice(0, 10);
                    } else if (typeof tanggal === 'number') {
                        const d = XLSX.SSF.parse_date_code(tanggal);
                        tanggal = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
                    } else if (typeof tanggal === 'string') {
                        const s = tanggal.trim();
                        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) tanggal = s;
                        else if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(s)) {
                            const parts = s.split(/[\/\-]/);
                            tanggal = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        } else tanggal = '';
                    }

                    const kec = (row['Asal Kecamatan'] ?? '').toString().trim();
                    const desa = (row['Desa'] ?? '').toString().trim();
                    const sls = (row['SLS'] ?? '').toString().trim();
                    const sobat = (row['Sobat ID'] ?? '').toString().trim();
                    const notelp = (row['No Telepon'] ?? '').toString().trim();
                    const pml = (row['PML'] ?? '').toString().trim();

                    if (!nama) errors.push(`Baris ${no}: Nama PCL wajib diisi.`);
                    if (!email) errors.push(`Baris ${no}: Email wajib diisi.`);
                    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(`Baris ${no}: Format email tidak valid.`);
                    if (!tanggal) errors.push(`Baris ${no}: Tanggal Lahir tidak valid.`);
                    if (!kec) errors.push(`Baris ${no}: Asal Kecamatan wajib diisi.`);
                    if (!desa) errors.push(`Baris ${no}: Desa wajib diisi.`);

                    payload.push({
                        nama_pcl: nama,
                        email: email,
                        tanggal_lahir: tanggal,
                        asal_kecamatan: kec,
                        desa: desa,
                        sls: sls || null,
                        sobat_id: sobat || null,
                        no_telepon: notelp || null,
                        pml: pml || null,
                    });
                });

                if (errors.length > 0) {
                    alert('Validasi gagal:\n' + errors.join('\n'));
                    setImportLoading(false);
                    e.target.value = '';
                    return;
                }

                // Send to backend
                const token = document.querySelector('meta[name="csrf-token"]')?.content || window.csrf_token || document.querySelector('input[name="_token"]')?.value;
                const res = await fetch('/manajemen-pcl/import', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ rows: payload, survei_id: selectedSurveiId }),
                });

                const contentType = res.headers.get('content-type') || '';
                let result;
                if (contentType.includes('application/json')) {
                    result = await res.json();
                } else {
                    const text = await res.text();
                    throw new Error('Server returned non-JSON response: ' + text.slice(0, 300));
                }

                setImportLoading(false);
                e.target.value = '';
                if (res.ok && result.success) {
                    alert('✓ ' + result.message);
                    setTimeout(() => window.location.reload(), 800);
                } else {
                    alert('✗ Error: ' + (result.message || 'Gagal import data'));
                }
            } catch (err) {
                console.error(err);
                setImportLoading(false);
                e.target.value = '';
                alert('Gagal membaca file: ' + err.message);
            }
        };
        reader.readAsBinaryString(file);
        setImportLoading(true);
    };

    useEffect(() => {
        setData('pml_id', '');
    }, [data.survei_id]);

    useEffect(() => {
        setSelectedPmlName('');
        setSearch('');
    }, [selectedSurveiId]);

    const filteredPmls = pmls?.filter(pml =>
        (!data.survei_id || (pml.survei_ids && pml.survei_ids.includes(parseInt(data.survei_id))))
    ) ?? [];

    const pclBySurvei = selectedSurveiId
        ? pcls?.filter(p => String(p.survei_id) === String(selectedSurveiId)) ?? []
        : [];

    const filtered = pclBySurvei.filter(p => {
        const query = search.toLowerCase();
        const matchesSearch =
            p.nama_PCL.toLowerCase().includes(query) ||
            p.email.toLowerCase().includes(query) ||
            p.asal_kecamatan.toLowerCase().includes(query);
        const matchesPml = !selectedPmlName || p.nama_pml === selectedPmlName;
        return matchesSearch && matchesPml;
    });

    const pmlOptions = selectedSurveiId
        ? pmls?.filter(pml => pml.survei_ids?.includes(parseInt(selectedSurveiId)))
             .map(pml => pml.nama_PML)
             .filter(Boolean)
             .sort()
        : [];

    const selectedSurveiLabel = surveis?.find(s => String(s.id) === String(selectedSurveiId))?.nama_survei ?? '';

    return (
        <MainLayout title="Manajemen PCL">
            <Head title="Manajemen PCL" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Daftar PCL</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {selectedSurveiId
                            ? `${filtered.length} PCL terdaftar di ${selectedSurveiLabel}`
                            : 'Pilih survei untuk melihat data PCL'}
                    </p>
                </div>
                {selectedSurveiId && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah PCL
                    </button>
                )}
            </div>

            {/* Pilih Survei */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Pilih Survei
                    <span className="font-normal text-gray-500 ml-1">(Wajib dipilih untuk melihat data PCL)</span>
                </label>
                <select
                    value={selectedSurveiId}
                    onChange={e => { setSelectedSurveiId(e.target.value); setSearch(''); }}
                    className="w-full md:w-xs border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- Pilih survei --</option>
                    {surveis?.map(s => (
                        <option key={s.id} value={s.id}>{s.nama_survei}</option>
                    ))}
                </select>
            </div>

            {/* Action Buttons - Export & Import */}
            {selectedSurveiId && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Export Excel
                        </button>

                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Template
                        </button>

                        <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {importLoading ? 'Importing...' : 'Import Excel'}
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleImportExcel}
                                disabled={importLoading}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Konten */}
            {!selectedSurveiId ? (
                <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-700 font-medium">Pilih survei terlebih dahulu</p>
                    <p className="text-gray-400 text-sm max-w-xs">
                        Data PCL akan ditampilkan setelah Anda memilih survei di atas.
                    </p>
                </div>
            ) : (
                <>
                    {/* Search + Filter PML */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="relative min-w-0 flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Cari nama, email atau kecamatan..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="min-w-0 md:max-w-xs">
                                <label className="sr-only">Filter PML</label>
                                <select
                                    value={selectedPmlName}
                                    onChange={e => setSelectedPmlName(e.target.value)}
                                    disabled={!selectedSurveiId}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                                >
                                    <option value="">{selectedSurveiId ? '-- Filter PML --' : 'Pilih survei terlebih dahulu'}</option>
                                    {selectedSurveiId && pmlOptions.map(pmlName => (
                                        <option key={pmlName} value={pmlName}>{pmlName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tabel */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama PCL</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PML</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kecamatan</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Desa</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SLS</th>
                                        {/* <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sobat ID</th> */}
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No Telp</th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="text-center py-12 text-gray-400 text-sm">
                                                {search
                                                    ? 'Tidak ada hasil pencarian.'
                                                    : `Belum ada PCL terdaftar di survei ${selectedSurveiLabel}.`}
                                            </td>
                                        </tr>
                                    ) : filtered.map((pcl, i) => (
                                        <tr key={pcl.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold shrink-0">
                                                        {pcl.nama_PCL.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{pcl.nama_PCL}</p>
                                                        <p className="text-xs text-gray-400">{pcl.tanggal_lahir_formatted}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600">{pcl.email}</td>
                                            <td className="px-5 py-3.5">
                                                {pcl.nama_pml && pcl.nama_pml !== '-' ? (
                                                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                                        {pcl.nama_pml}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600">{pcl.asal_kecamatan}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{pcl.desa}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{pcl.sls || '-'}</td>
                                            {/* <td className="px-5 py-3.5 text-gray-600">{pcl.sobat_id || '-'}</td> */}
                                            <td className="px-5 py-3.5 text-gray-600">{pcl.no_telp || '-'}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit({ id: pcl.pcl_id })}
                                                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(pcl.pcl_id)}
                                                        className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
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
                </>
            )}

            {/* Modal Tambah / Edit */}
            <Modal show={showModal} onClose={() => setShowModal(false)}
                title={editData ? 'Edit Data PCL' : 'Tambah PCL Baru'} maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Informasi Dasar */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700">Informasi Dasar</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input type="text" value={data.nama} onChange={e => setData('nama', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nama ? 'border-red-300' : 'border-gray-200'}`}
                                    placeholder="Nama lengkap PCL" />
                                {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                                    placeholder="Email" />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                                <input type="date" value={data.tanggal_lahir} onChange={e => setData('tanggal_lahir', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal_lahir ? 'border-red-300' : 'border-gray-200'}`} />
                                {errors.tanggal_lahir && <p className="text-red-500 text-xs mt-1">{errors.tanggal_lahir}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asal Kecamatan</label>
                                <input type="text" value={data.asal_kecamatan} onChange={e => setData('asal_kecamatan', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.asal_kecamatan ? 'border-red-300' : 'border-gray-200'}`}
                                    placeholder="Nama kecamatan" />
                                {errors.asal_kecamatan && <p className="text-red-500 text-xs mt-1">{errors.asal_kecamatan}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Desa</label>
                                <input type="text" value={data.desa} onChange={e => setData('desa', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.desa ? 'border-red-300' : 'border-gray-200'}`}
                                    placeholder="Nama desa" />
                                {errors.desa && <p className="text-red-500 text-xs mt-1">{errors.desa}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SLS</label>
                                <input type="text" value={data.sls} onChange={e => setData('sls', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.sls ? 'border-red-300' : 'border-gray-200'}`}
                                    placeholder="Kode SLS" />
                                {errors.sls && <p className="text-red-500 text-xs mt-1">{errors.sls}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sobat ID</label>
                                <input type="text" value={data.sobat_id} onChange={e => setData('sobat_id', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.sobat_id ? 'border-red-300' : 'border-gray-200'}`}
                                    placeholder="ID SOBAT" />
                                {errors.sobat_id && <p className="text-red-500 text-xs mt-1">{errors.sobat_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">No Telepon</label>
                                <input type="text" value={data.no_telp} onChange={e => setData('no_telp', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.no_telp ? 'border-red-300' : 'border-gray-200'}`}
                                    placeholder="Nomor telepon" />
                                {errors.no_telp && <p className="text-red-500 text-xs mt-1">{errors.no_telp}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Pilih Survei */}
                    <div className="space-y-3 border-t pt-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Survei</label>
                            {errors.survei_id && <p className="text-red-500 text-xs mb-2">{errors.survei_id}</p>}
                            <select
                                value={data.survei_id}
                                onChange={e => setData('survei_id', e.target.value)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.survei_id ? 'border-red-300' : 'border-gray-200'}`}
                            >
                                <option value="">Pilih Survei</option>
                                {surveis?.map(survei => (
                                    <option key={survei.id} value={survei.id}>{survei.nama_survei}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Pilih PML */}
                    {data.survei_id && (
                        <div className="space-y-3 border-t pt-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih PML</label>
                                {errors.pml_id && <p className="text-red-500 text-xs mb-2">{errors.pml_id}</p>}
                                <select
                                    value={data.pml_id}
                                    onChange={e => setData('pml_id', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.pml_id ? 'border-red-300' : 'border-gray-200'}`}
                                >
                                    <option value="">Pilih PML</option>
                                    {filteredPmls?.map(pml => (
                                        <option key={pml.id} value={pml.id}>{pml.nama_PML}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                        <button type="button" onClick={() => setShowModal(false)}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            Batal
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                            {processing ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah PCL'}
                        </button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}