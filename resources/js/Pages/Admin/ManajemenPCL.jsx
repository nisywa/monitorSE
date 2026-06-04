import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Head, useForm, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Modal from '@/Components/Modal';
import axios from 'axios';

export default function ManajemenPCL({ pcls, pmls, surveis }) {
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedSurveiId, setSelectedSurveiId] = useState('');
    const [selectedPmlName, setSelectedPmlName] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [blastLoading, setBlastLoading] = useState(false);
    const [detailGroup, setDetailGroup] = useState(null);
    
    // State untuk cascading dropdown
    const [kecamatanList, setKecamatanList] = useState([]);
    const [desaList, setDesaList] = useState([]);
    const [slsList, setSlsList] = useState([]);
    const [loadingKecamatan, setLoadingKecamatan] = useState(false);
    const [loadingDesa, setLoadingDesa] = useState(false);
    const [loadingSls, setLoadingSls] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        email: '',
        pml_id: '',
        survei_id: '',
        tanggal_lahir: '',
        asal_kecamatan: '',
        desa: '',
        sls: [],
        sobat_id: '',
        no_telp: '',
    });

    const openAdd = () => {
        setEditData(null);
        reset();
        clearErrors();
        setDesaList([]);
        setSlsList([]);
        setData('sls', []);
        if (selectedSurveiId) {
            setData('survei_id', selectedSurveiId);
        }
        setShowModal(true);
    };

    const openEdit = async (pcl) => {
        clearErrors();

        try {
            const kecList = kecamatanList.length === 0 ? await fetchKecamatan() : kecamatanList;
            const isGroup = pcl && Array.isArray(pcl.entries);
            const row = isGroup ? pcl.entries[0] : pcl;
            const pclId = row?.id || row?.pcl_id;
            const selectedKecamatan = row?.asal_kecamatan || row?.kecamatan || '';
            const selectedDesa = row?.desa || '';

            let pclData = null;
            if (isGroup) {
                pclData = {
                    ...row,
                    nama_pcl: row?.nama_pcl ?? row?.nama_PCL,
                };
            } else if (row && (row.nama_pcl || row.nama_PCL)) {
                pclData = {
                    ...row,
                    nama_pcl: row.nama_pcl ?? row.nama_PCL,
                };
            } else if (pclId) {
                const response = await fetch(`/manajemen-pcl/${pclId}`);
                pclData = await response.json();
            } else {
                throw new Error('PCL id tidak ditemukan untuk edit');
            }

            const slsValues = isGroup
                ? Array.from(new Set(pcl.entries
                    .filter(entry => (entry.asal_kecamatan || entry.kecamatan) === selectedKecamatan && entry.desa === selectedDesa)
                    .map(entry => entry.sls)
                    .filter(Boolean)))
                : pclData.sls
                    ? Array.isArray(pclData.sls)
                        ? pclData.sls
                        : [pclData.sls]
                    : [];

            const editRowData = {
                nama: pclData.nama_pcl || pclData.nama_PCL || '',
                email: pclData.email || '',
                pml_id: pclData.pml_id || pclData.pmlId || '',
                survei_id: pclData.survei_id || pclData.surveiId || selectedSurveiId || '',
                tanggal_lahir: pclData.tanggal_lahir || pclData.tgl_lahir || '',
                asal_kecamatan: selectedKecamatan,
                desa: selectedDesa,
                sls: slsValues,
                sobat_id: pclData.sobat_id || pclData.sobatID || '',
                no_telp: pclData.no_telp || pclData.no_telepon || pclData.noTelp || '',
            };

            setEditData({ id: pclId, ...editRowData });
            setData(editRowData);

            if (selectedKecamatan) {
                const kecSelected = kecList.find(k => k.nama === selectedKecamatan);
                if (kecSelected) {
                    await fetchDesaByKecamatan(kecSelected.id, selectedDesa, slsValues);
                }
            }

            setShowModal(true);
        } catch (error) {
            console.error('Error loading PCL data:', error);
        }
    };

    // Fetch kecamatan saat modal dibuka
    useEffect(() => {
        if (showModal && kecamatanList.length === 0) {
            fetchKecamatan();
        }
    }, [showModal]);

    // Fetch desa saat asal_kecamatan berubah
    useEffect(() => {
        if (data.asal_kecamatan) {
            const kecSelected = kecamatanList.find(k => k.nama === data.asal_kecamatan);
            if (kecSelected) {
                fetchDesaByKecamatan(kecSelected.id);
            }
        } else {
            setDesaList([]);
            setSlsList([]);
            setData('desa', '');
            setData('sls', []);
        }
    }, [data.asal_kecamatan, kecamatanList]);

    // Fetch sls saat desa berubah
    useEffect(() => {
        if (data.desa) {
            const desaSelected = desaList.find(d => d.nama === data.desa);
            if (desaSelected) {
                fetchSlsByDesa(desaSelected.id);
            }
        } else {
            setSlsList([]);
            setData('sls', []);
        }
    }, [data.desa, desaList]);

    const fetchKecamatan = async () => {
        try {
            setLoadingKecamatan(true);
            const response = await axios.get('/api/wilayah-kerja/kecamatan-list');
            const list = response.data.data || [];
            setKecamatanList(list);
            return list;
        } catch (error) {
            console.error('Error fetching kecamatan:', error);
            alert('Gagal memuat data kecamatan');
            return [];
        } finally {
            setLoadingKecamatan(false);
        }
    };

    const fetchDesaByKecamatan = async (kecamatanId, selectedDesaNama = null, selectedSlsNama = null) => {
        try {
            setLoadingDesa(true);
            const response = await axios.get(`/api/wilayah-kerja/desa/${kecamatanId}`);
            setDesaList(response.data.data || []);
            
            // Set selected desa if provided (during edit)
            if (selectedDesaNama) {
                setData('desa', selectedDesaNama);
                const desaSelected = response.data.data?.find(d => d.nama === selectedDesaNama);
                if (desaSelected && selectedSlsNama) {
                    await fetchSlsByDesa(desaSelected.id, selectedSlsNama);
                }
            }
        } catch (error) {
            console.error('Error fetching desa:', error);
            setDesaList([]);
        } finally {
            setLoadingDesa(false);
        }
    };

    const fetchSlsByDesa = async (desaId, selectedSlsNama = null) => {
        try {
            setLoadingSls(true);
            const response = await axios.get(`/api/wilayah-kerja/sls/${desaId}`);
            setSlsList(response.data.data || []);
            
            // Set selected sls if provided (during edit)
            if (selectedSlsNama) {
                setData('sls', Array.isArray(selectedSlsNama) ? selectedSlsNama : [selectedSlsNama]);
            }
        } catch (error) {
            console.error('Error fetching sls:', error);
            setSlsList([]);
        } finally {
            setLoadingSls(false);
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

    const handleDeleteAndClose = (id) => {
        if (confirm('Yakin ingin menghapus data PCL ini?')) {
            setDetailGroup(null);
            router.delete(`/manajemen-pcl/${id}`);
        }
    };

    const handleToggleSls = (value) => {
        const current = Array.isArray(data.sls) ? data.sls : [];
        if (current.includes(value)) {
            setData('sls', current.filter(item => item !== value));
        } else {
            setData('sls', [...current, value]);
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

    const handleBlastWhatsApp = async () => {
        if (!confirm('Kirim reminder WhatsApp ke semua PCL yang belum submit laporan hari ini (WIB)?')) return;

        try {
            setBlastLoading(true);
            const response = await axios.post('/manajemen-pcl/blast-whatsapp-reminder', null, {
                headers: { Accept: 'application/json' },
            });
            const message = response?.data?.message || 'Blast WhatsApp selesai.';
            alert(message);
        } catch (err) {
            console.error(err);
            const errorMessage = err?.response?.data?.message || err.message || 'Gagal mengirim blast WhatsApp.';
            alert(errorMessage);
        } finally {
            setBlastLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Nama PCL': 'Contoh Nama',
                'Email': 'contoh@example.com',
                'Tanggal Lahir': '1990-05-15',
                'Kecamatan': 'Kecamatan A',
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

                    const kec = ((row['Asal Kecamatan'] ?? row['Kecamatan']) ?? '').toString().trim();
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
                if (!token) {
                    alert('CSRF token tidak ditemukan. Silakan muat ulang halaman dan coba lagi.');
                    setImportLoading(false);
                    e.target.value = '';
                    return;
                }

                const res = await axios.post('/manajemen-pcl/import', {
                    rows: payload,
                    survei_id: selectedSurveiId,
                }, {
                    headers: {
                        'X-CSRF-TOKEN': token,
                        'Accept': 'application/json',
                    },
                    withCredentials: true,
                });

                const result = res.data;

                setImportLoading(false);
                e.target.value = '';
                if (result.success) {
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

    const groupedFiltered = Object.values(filtered.reduce((groups, item) => {
        const key = item.nama_PCL?.trim().toLowerCase() || item.pcl_id || item.id;
        if (!groups[key]) {
            groups[key] = {
                name: item.nama_PCL,
                emails: new Set(),
                pmls: new Set(),
                kecamatans: new Set(),
                desas: new Set(),
                noTelps: new Set(),
                entries: [],
            };
        }
        const group = groups[key];
        group.emails.add(item.email || '-');
        group.pmls.add(item.nama_pml || '-');
        group.kecamatans.add(item.asal_kecamatan || '-');
        group.desas.add(item.desa || '-');
        group.noTelps.add(item.no_telp || '-');
        group.entries.push(item);
        return groups;
    }, {})).map(group => ({
        ...group,
        email: Array.from(group.emails).join(', '),
        pmlLabel: Array.from(group.pmls).filter(v => v && v !== '-').join(', ') || '-',
        kecamatanLabel: Array.from(group.kecamatans).filter(v => v && v !== '-').join(', '),
        desaLabel: Array.from(group.desas).filter(v => v && v !== '-').join(', '),
        noTelpLabel: Array.from(group.noTelps).filter(v => v && v !== '-').join(', '),
    }));

    const pmlOptions = selectedSurveiId
        ? pmls?.filter(pml => pml.survei_ids?.includes(parseInt(selectedSurveiId)))
             .map(pml => pml.nama_PML)
             .filter(Boolean)
             .sort()
        : [];

    const selectedSurvei = surveis?.find(s => String(s.id) === String(selectedSurveiId));
    const selectedSurveiLabel = selectedSurvei?.nama_survei ?? '';
    const selectedSurveiStatus = selectedSurvei?.status ?? '';

    return (
        <MainLayout title="Manajemen PCL">
            <Head title="Manajemen PCL" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Daftar PCL</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {selectedSurveiId
                            ? `${groupedFiltered.length} PCL terdaftar di ${selectedSurveiLabel}`
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

                        {selectedSurveiId && selectedSurveiStatus === 'Berlangsung' && (
                            <button
                                onClick={handleBlastWhatsApp}
                                disabled={blastLoading}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8l7.89-5.26a2 2 0 012.22 0L21 16" />
                                </svg>
                                {blastLoading ? 'Mengirim...' : 'Blast WA Reminder'}
                            </button>
                        )}

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
                                        {/* <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SLS</th> */}
                                        {/* <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sobat ID</th> */}
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No Telp</th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {groupedFiltered.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                                                {search
                                                    ? 'Tidak ada hasil pencarian.'
                                                    : `Belum ada PCL terdaftar di survei ${selectedSurveiLabel}.`}
                                            </td>
                                        </tr>
                                    ) : groupedFiltered.map((group, i) => (
                                        <tr key={`${group.name}-${i}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold shrink-0">
                                                        {group.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{group.name}</p>
                                                        <p className="text-xs text-gray-400">{group.entries.length} lokasi</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600">{group.email}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{group.pmlLabel}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{group.kecamatanLabel}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{group.desaLabel}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{group.noTelpLabel || '-'}</td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-2 justify-end">
                                                    <button onClick={() => openEdit(group)}
                                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => setDetailGroup(group)}
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                        Detail
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

            {/* Modal Detail PCL */}
            <Modal show={!!detailGroup} onClose={() => setDetailGroup(null)}
                title={detailGroup ? `Detail PCL: ${detailGroup.name}` : ''} maxWidth="2xl">
                {detailGroup && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Nama PCL</p>
                                <p className="mt-2 font-semibold text-gray-800">{detailGroup.name}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                                <p className="mt-2 text-gray-800">{detailGroup.email}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Total Lokasi</p>
                                <p className="mt-2 text-gray-800">{detailGroup.entries.length}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Desa</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SLS</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {detailGroup.entries.map((entry, idx) => (
                                        <tr key={`${entry.pcl_id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                                            <td className="px-4 py-3 text-gray-600">{entry.desa}</td>
                                            <td className="px-4 py-3 text-gray-600">{entry.sls || '-'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-2 justify-end">
                                                    <button type="button" onClick={() => handleDeleteAndClose(entry.pcl_id)}
                                                        className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={() => setDetailGroup(null)}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

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
                                <select
                                    value={data.asal_kecamatan}
                                    onChange={e => {
                                        setData('asal_kecamatan', e.target.value);
                                        setData('desa', '');
                                        setData('sls', []);
                                    }}
                                    disabled={loadingKecamatan}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.asal_kecamatan ? 'border-red-300' : 'border-gray-200'} ${loadingKecamatan ? 'bg-gray-100' : ''}`}
                                >
                                    <option value="">Pilih Kecamatan</option>
                                    {kecamatanList.map(k => (
                                        <option key={k.id} value={k.nama}>{k.nama}</option>
                                    ))}
                                </select>
                                {errors.asal_kecamatan && <p className="text-red-500 text-xs mt-1">{errors.asal_kecamatan}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Desa</label>
                                <select
                                    value={data.desa}
                                    onChange={e => {
                                        setData('desa', e.target.value);
                                        setData('sls', []);
                                    }}
                                    disabled={loadingDesa || !data.asal_kecamatan}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.desa ? 'border-red-300' : 'border-gray-200'} ${loadingDesa ? 'bg-gray-100' : ''}`}
                                >
                                    <option value="">Pilih Desa</option>
                                    {desaList.map(d => (
                                        <option key={d.id} value={d.nama}>{d.nama}</option>
                                    ))}
                                </select>
                                {errors.desa && <p className="text-red-500 text-xs mt-1">{errors.desa}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SLS</label>
                                <div className={`grid gap-2 max-h-48 overflow-y-auto rounded-lg border ${errors.sls ? 'border-red-300' : 'border-gray-200'} p-3 ${loadingSls ? 'bg-gray-100' : 'bg-white'}`}>
                                    {slsList.length === 0 ? (
                                        <p className="text-sm text-gray-400">Pilih desa untuk memuat daftar SLS.</p>
                                    ) : slsList.map(s => {
                                        const value = s.nomor_sls ?? s.nama ?? '';
                                        const checked = Array.isArray(data.sls) && data.sls.includes(value);
                                        return (
                                            <label key={s.id} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    value={value}
                                                    checked={checked}
                                                    disabled={loadingSls || !data.desa}
                                                    onChange={() => handleToggleSls(value)}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>{value}</span>
                                            </label>
                                        );
                                    })}
                                </div>
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

