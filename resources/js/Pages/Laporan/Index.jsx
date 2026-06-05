import { useState, useEffect } from 'react';
import axios from 'axios';
import { Head, useForm, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Modal from '@/Components/Modal';

export default function LaporanIndex({ laporans, surveis, pmlBySurvei, pclsBySurvei, wilayahBySurvei = {}, pclsBelumKirim, role, selectedSurvei, selectedDate, initialTab }) {
    const [activeTab, setActiveTab] = useState(initialTab ?? 'laporan');
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState('');
    const [filterPclId, setFilterPclId] = useState('');
    const [selectedSurveiId, setSelectedSurveiId] = useState(selectedSurvei ? String(selectedSurvei) : '');
    const [selectedFilterDate, setSelectedFilterDate] = useState(selectedDate ?? new Date().toISOString().slice(0, 10));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [kecamatanList, setKecamatanList] = useState([]);
    const [formKecamatanList, setFormKecamatanList] = useState([]);
    const [desaList, setDesaList] = useState([]);
    const [slsList, setSlsList] = useState([]);
    const [filterKecamatanId, setFilterKecamatanId] = useState('');
    const [filterDesaId, setFilterDesaId] = useState('');
    const [filterSlsId, setFilterSlsId] = useState('');
    const [filterDesaList, setFilterDesaList] = useState([]);
    const [filterSlsList, setFilterSlsList] = useState([]);
    const [loadingKecamatan, setLoadingKecamatan] = useState(false);
    const [loadingDesa, setLoadingDesa] = useState(false);
    const [loadingSls, setLoadingSls] = useState(false);
    const [loadingFilterDesa, setLoadingFilterDesa] = useState(false);
    const [loadingFilterSls, setLoadingFilterSls] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        survei_id: '',
        pml_id: '',
        kecamatan_id: '',
        desa_id: '',
        sls_id: '',
        tanggal: '',
        data_usaha: '',
        data_cacah: '',
        data_keluarga: '',
        data_submit: '',
    });

    const isReadOnlyMode = editData && role === 'PML';

    // Sync selectedSurveiId when selectedSurvei prop changes (e.g., on page reload)
    useEffect(() => {
        if (selectedSurvei) {
            setSelectedSurveiId(String(selectedSurvei));
        } else if ((role === 'PCL' || role === 'PML') && surveis?.length > 0 && !selectedSurveiId) {
            setSelectedSurveiId(String(surveis[0]?.id || ''));
        }
    }, [selectedSurvei, surveis, role]);

    const openAdd = () => {
        setEditData(null);
        reset();
        clearErrors();
        setFormKecamatanList([]);
        setDesaList([]);
        setSlsList([]);
        setShowModal(true);
    };

    const openEdit = (laporan) => {
        setEditData(laporan);
        setData({
            survei_id: String(laporan.survei_id),
            pml_id: String(laporan.pml_id),
            kecamatan_id: String(laporan.kecamatan_id || ''),
            desa_id: String(laporan.desa_id || ''),
            sls_id: String(laporan.sls_id || ''),
            tanggal: laporan.tanggal,
            data_cacah: String(laporan.data_cacah ?? ''),
            data_usaha: String(laporan.data_usaha),
            data_keluarga: String(laporan.data_keluarga),
            data_submit: String(laporan.data_submit ?? 0),
        });
        clearErrors();
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editData) {
            put(`/laporan/${editData.id}`, {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        } else {
            post('/laporan', {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus laporan ini?')) {
            router.delete(`/laporan/${id}`);
        }
    };

    // Utility function to safely normalize and compare IDs (string or number)
    const normalizeId = (id) => {
        if (id === null || id === undefined || id === '') return null;
        const parsed = parseInt(id, 10);
        return isNaN(parsed) ? null : parsed;
    };

    // Utility function to get normalized ID from laporan record
    const getLaporanId = (laporan, field) => {
        return normalizeId(laporan[field]);
    };

    const pageTitle = role === 'admin' ? 'List Laporan' : 'Laporan Saya';

    // For PCL/PML: always show all data. For admin: only show if survey selected.
    const effectiveSurveiId = normalizeId(selectedSurveiId);
    
    // DEBUG: Log data structure for troubleshooting
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        console.log('[LaporanIndex] role:', role, 'selectedSurveiId:', selectedSurveiId, 'effectiveSurveiId:', effectiveSurveiId);
        console.log('[LaporanIndex] laporans count:', laporans?.length, 'surveis count:', surveis?.length);
        if (laporans && laporans.length > 0) {
            console.log('[LaporanIndex] First laporan:', JSON.stringify(laporans[0]));
        }
    }
    
    const laporanBySurvei = effectiveSurveiId
        ? (laporans?.filter(l => {
            const lapId = normalizeId(l.survei_id);
            return lapId === effectiveSurveiId;
        }) ?? [])
        : (role === 'PCL' || role === 'PML')
            ? (laporans ?? [])
            : [];

    const filtered = (activeTab === 'belumKirim' ? [] : laporanBySurvei).filter(l => {
        const searchTerm = search.toLowerCase();
        const pclOrPmlName = role === 'PCL' ? l.nama_pml : l.nama_pcl;
        const matchesSearch = role === 'PML'
            ? true
            : (l.nama_survei?.toLowerCase().includes(searchTerm) || pclOrPmlName?.toLowerCase().includes(searchTerm));
        const matchesFromDate = !startDate || (l.tanggal && l.tanggal >= startDate);
        const matchesToDate = !endDate || (l.tanggal && l.tanggal <= endDate);
        
        // Safe comparison for location filters - normalize all IDs before comparison
        const laporanKecId = getLaporanId(l, 'kecamatan_id');
        const laporanDesId = getLaporanId(l, 'desa_id');
        const laporanSlsId = getLaporanId(l, 'sls_id');
        const filterKecId = normalizeId(filterKecamatanId);
        const filterDesId = normalizeId(filterDesaId);
        const filterSls = normalizeId(filterSlsId);
        
        const matchesKecamatan = !filterKecId || laporanKecId === filterKecId;
        const matchesDesa = !filterDesId || laporanDesId === filterDesId;
        const matchesSls = !filterSls || laporanSlsId === filterSls;
        const matchesPcl = role === 'PML' ? (!normalizeId(filterPclId) || normalizeId(l.pcl_id) === normalizeId(filterPclId)) : true;
        return matchesSearch && matchesFromDate && matchesToDate && matchesKecamatan && matchesDesa && matchesSls && matchesPcl;
    });

    // Convert string values to numbers to prevent string concatenation
    const totalDataUsaha = filtered.reduce((sum, l) => sum + (Number(l.data_usaha) || 0), 0);
    const totalDataKeluarga = filtered.reduce((sum, l) => sum + (Number(l.data_keluarga) || 0), 0);
    const totalDataSubmit = filtered.reduce((sum, l) => sum + (Number(l.data_submit) || 0), 0);
    const totalDataCacah = filtered.reduce((sum, l) => sum + (Number(l.data_cacah) || 0), 0);
    const jmlLaporan = filtered.length;

    const selectedPml = data.survei_id ? pmlBySurvei?.[data.survei_id] ?? null : null;

    const availablePclsForSelectedSurvei = selectedSurveiId
        ? (pclsBySurvei?.[selectedSurveiId] ??
            Array.from(new Map(laporanBySurvei.map(l => [l.pcl_id, { id: l.pcl_id, nama_pcl: l.nama_pcl }])).values()))
        : [];

    const getWilayahForSurvei = (surveiId) => {
        if (!surveiId) {
            return { kecamatan: [], desa: [], sls: [] };
        }

        return wilayahBySurvei?.[surveiId] ?? { kecamatan: [], desa: [], sls: [] };
    };

    const filterPclDesaByKecamatan = (surveiId, kecamatanId) => {
        const wilayah = getWilayahForSurvei(surveiId);
        return (wilayah.desa || []).filter(d => String(d.kecamatan_id) === String(kecamatanId));
    };

    const filterPclSlsByDesa = (surveiId, desaId) => {
        const wilayah = getWilayahForSurvei(surveiId);
        return (wilayah.sls || []).filter(s => String(s.desa_id) === String(desaId));
    };

    const fetchKecamatanList = async () => {
        if (role === 'PCL') {
            const wilayah = getWilayahForSurvei(selectedSurveiId);
            setKecamatanList(wilayah.kecamatan || []);
            return;
        }

        setLoadingKecamatan(true);
        try {
            const response = await axios.get('/api/wilayah-kerja/kecamatan-list');
            setKecamatanList(response.data.data || []);
        } catch (error) {
            console.error('Error fetching kecamatan list:', error);
            setKecamatanList([]);
        } finally {
            setLoadingKecamatan(false);
        }
    };

    const fetchDesaByKecamatan = async (kecamatanId, selectedDesaId = null, selectedSlsId = null) => {
        if (role === 'PCL') {
            const desaData = filterPclDesaByKecamatan(data.survei_id, kecamatanId);
            setDesaList(desaData);
            if (selectedDesaId) {
                setData('desa_id', String(selectedDesaId));
                if (selectedSlsId) {
                    fetchSlsByDesa(selectedDesaId, selectedSlsId);
                }
            } else {
                setData('desa_id', '');
                setData('sls_id', '');
                setSlsList([]);
            }
            return;
        }

        setLoadingDesa(true);
        try {
            const response = await axios.get(`/api/wilayah-kerja/desa/${kecamatanId}`);
            const desaData = response.data.data || [];
            setDesaList(desaData);
            if (selectedDesaId) {
                setData('desa_id', String(selectedDesaId));
                if (selectedSlsId) {
                    await fetchSlsByDesa(selectedDesaId, selectedSlsId);
                }
            } else {
                setData('desa_id', '');
                setData('sls_id', '');
                setSlsList([]);
            }
        } catch (error) {
            console.error('Error fetching desa:', error);
            setDesaList([]);
            setSlsList([]);
            setData('desa_id', '');
            setData('sls_id', '');
        } finally {
            setLoadingDesa(false);
        }
    };

    const fetchSlsByDesa = async (desaId, selectedSlsId = null) => {
        if (role === 'PCL') {
            const slsData = filterPclSlsByDesa(data.survei_id, desaId);
            setSlsList(slsData);
            setData('sls_id', selectedSlsId ? String(selectedSlsId) : '');
            return;
        }

        setLoadingSls(true);
        try {
            const response = await axios.get(`/api/wilayah-kerja/sls/${desaId}`);
            const slsData = response.data.data || [];
            setSlsList(slsData);
            if (selectedSlsId) {
                setData('sls_id', String(selectedSlsId));
            } else {
                setData('sls_id', '');
            }
        } catch (error) {
            console.error('Error fetching sls:', error);
            setSlsList([]);
            setData('sls_id', '');
        } finally {
            setLoadingSls(false);
        }
    };

    const fetchFilterDesaByKecamatan = async (kecamatanId) => {
        if (role === 'PCL') {
            setFilterDesaList(filterPclDesaByKecamatan(selectedSurveiId, kecamatanId));
            return;
        }

        setLoadingFilterDesa(true);
        try {
            const response = await axios.get(`/api/wilayah-kerja/desa/${kecamatanId}`);
            setFilterDesaList(response.data.data || []);
        } catch (error) {
            console.error('Error fetching filter desa:', error);
            setFilterDesaList([]);
        } finally {
            setLoadingFilterDesa(false);
        }
    };

    const fetchFilterSlsByDesa = async (desaId) => {
        if (role === 'PCL') {
            setFilterSlsList(filterPclSlsByDesa(selectedSurveiId, desaId));
            return;
        }

        setLoadingFilterSls(true);
        try {
            const response = await axios.get(`/api/wilayah-kerja/sls/${desaId}`);
            setFilterSlsList(response.data.data || []);
        } catch (error) {
            console.error('Error fetching filter sls:', error);
            setFilterSlsList([]);
        } finally {
            setLoadingFilterSls(false);
        }
    };

    useEffect(() => {
        fetchKecamatanList();
    }, [role, selectedSurveiId]);

    useEffect(() => {
        if (filterKecamatanId) {
            setFilterDesaId('');
            setFilterSlsId('');
            setFilterSlsList([]);
            fetchFilterDesaByKecamatan(filterKecamatanId);
        } else {
            setFilterDesaList([]);
            setFilterDesaId('');
            setFilterSlsList([]);
            setFilterSlsId('');
        }
    }, [filterKecamatanId]);

    useEffect(() => {
        if (filterDesaId) {
            setFilterSlsId('');
            fetchFilterSlsByDesa(filterDesaId);
        } else {
            setFilterSlsList([]);
            setFilterSlsId('');
        }
    }, [filterDesaId]);

    useEffect(() => {
        if (data.kecamatan_id) {
            fetchDesaByKecamatan(data.kecamatan_id, data.desa_id, data.sls_id);
        } else {
            setDesaList([]);
            setSlsList([]);
            setData('desa_id', '');
            setData('sls_id', '');
        }
    }, [data.kecamatan_id]);

    useEffect(() => {
        if (data.desa_id) {
            fetchSlsByDesa(data.desa_id, data.sls_id);
        } else {
            setSlsList([]);
            setData('sls_id', '');
        }
    }, [data.desa_id]);

    useEffect(() => {
        if (data.survei_id) {
            if (!editData) {
                setData('pml_id', selectedPml?.id ?? '');
            }

            if (role === 'PCL') {
                const wilayah = getWilayahForSurvei(data.survei_id);
                setFormKecamatanList(wilayah.kecamatan || []);
            }
        } else {
            if (!editData) {
                setData('pml_id', '');
            }
            if (role === 'PCL') {
                setFormKecamatanList([]);
                setDesaList([]);
                setSlsList([]);
            }
        }
    }, [data.survei_id, selectedPml, role, editData]);

    useEffect(() => {
        setFilterPclId('');
        setFilterKecamatanId('');
        setFilterDesaId('');
        setFilterSlsId('');
        setFilterDesaList([]);
        setFilterSlsList([]);
    }, [selectedSurveiId]);

    return (
        <MainLayout title={pageTitle}>
            <Head title={pageTitle} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        {activeTab === 'belumKirim' ? 'PCL Belum Kirim Laporan' : pageTitle}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {activeTab === 'belumKirim' 
                            ? `Menampilkan ${pclsBelumKirim?.length ?? 0} PCL belum submit laporan hari ini`
                            : (selectedSurveiId
                                ? `Menampilkan ${filtered.length.toLocaleString('id-ID')} laporan`
                                : 'Pilih survei untuk melihat laporan')}
                    </p>
                </div>
                {role === 'PCL' && (
                    <button onClick={openAdd}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Laporan
                    </button>
                )}
            </div>

            {/* Tab Menu - Hanya untuk role PML */}
            {role === 'PML' && (
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('laporan')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'laporan'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-600 border-transparent hover:text-gray-800'
                        }`}
                    >
                        Laporan
                    </button>
                    <button
                        onClick={() => setActiveTab('belumKirim')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === 'belumKirim'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-600 border-transparent hover:text-gray-800'
                        }`}
                    >
                        Belum Kirim Laporan
                        {pclsBelumKirim && pclsBelumKirim.length > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                                {pclsBelumKirim.length}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Pilih Survei - Hanya tampil di tab Laporan atau Belum Kirim (PML harus memilih survei dulu) */}
            {activeTab === 'laporan' && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Pilih Survei
                    <span className="font-normal text-gray-500 ml-1">(Wajib dipilih untuk melihat data)</span>
                </label>
                <select
                    value={selectedSurveiId}
                    onChange={e => {
                        setSelectedSurveiId(e.target.value);
                        setSearch('');
                        setStartDate('');
                        setEndDate('');
                        setFilterKecamatanId('');
                        setFilterDesaId('');
                        setFilterSlsId('');
                    }}
                    className="w-full md:w-xs border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- Pilih survei --</option>
                    {surveis?.map(s => (
                        <option key={s.id} value={s.id}>{s.nama_survei}</option>
                    ))}
                </select>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter Kecamatan</label>
                        <select
                            value={filterKecamatanId}
                            onChange={e => setFilterKecamatanId(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Kecamatan</option>
                            {kecamatanList.map(k => (
                                <option key={k.id} value={k.id}>{k.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter Desa</label>
                        <select
                            value={filterDesaId}
                            onChange={e => setFilterDesaId(e.target.value)}
                            disabled={!filterKecamatanId || loadingFilterDesa}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Semua Desa</option>
                            {filterDesaList.map(d => (
                                <option key={d.id} value={d.id}>{d.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter SLS</label>
                        <select
                            value={filterSlsId}
                            onChange={e => setFilterSlsId(e.target.value)}
                            disabled={!filterDesaId || loadingFilterSls}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Semua SLS</option>
                            {filterSlsList.map(s => (
                                <option key={s.id} value={s.id}>{s.nomor_sls}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            )}

            {/* Jika PML dan tab Belum Kirim: tunjukkan selector survei sebelum menampilkan data */}
            {role === 'PML' && activeTab === 'belumKirim' && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                    <div className="grid gap-4 md:grid-cols-2 items-end">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Pilih Survei untuk melihat PCL yang belum kirim
                            </label>
                            <select
                                value={selectedSurveiId}
                                onChange={e => {
                                    const val = e.target.value;
                                    setSelectedSurveiId(val);
                                    router.get(window.location.pathname, { tab: 'belumKirim', survei_id: val, tanggal: selectedFilterDate });
                                }}
                                className="w-full md:w-xs border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Pilih survei --</option>
                                {surveis?.map(s => (
                                    <option key={s.id} value={s.id}>{s.nama_survei}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Filter Tanggal
                            </label>
                            <input
                                type="date"
                                value={selectedFilterDate}
                                onChange={e => {
                                    const val = e.target.value;
                                    setSelectedFilterDate(val);
                                    if (selectedSurveiId) {
                                        router.get(window.location.pathname, { tab: 'belumKirim', survei_id: selectedSurveiId, tanggal: val });
                                    }
                                }}
                                className="w-full md:w-xs border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Role Info Banner */}
            <div className={`rounded-xl px-4 py-3 mb-6 text-sm flex items-center gap-2 ${
                role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                role === 'PML'   ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                'bg-green-50 text-green-700 border border-green-100'
            }`}>
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {role === 'admin' && 'Anda login sebagai Admin dan hanya bisa melihat laporan.'}
                {role === 'PML'   && 'Anda login sebagai PML dan dapat melihat data laporan yang diinput PCL dan menghapus jika perlu.'}
                {role === 'PCL'   && 'Anda login sebagai PCL dan dapat menambahkan laporan baru.'}
            </div>

            {/* Konten utama: tampil hanya setelah survei dipilih (untuk tab laporan) atau langsung (untuk tab belumKirim) */}
            {activeTab === 'belumKirim' ? (
                selectedSurveiId ? (
                <>
                    {/* Ringkasan Card untuk Belum Kirim */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total PCL Belum Kirim Laporan</p>
                                    <p className="text-3xl font-bold text-red-600">{(pclsBelumKirim?.length ?? 0).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                                    <p className="text-lg font-bold text-blue-600">{selectedFilterDate === new Date().toISOString().slice(0, 10) ? 'Hari Ini' : selectedFilterDate}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table PCL Belum Kirim Laporan */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama PCL</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kecamatan</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Desa</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SLS</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No. Telp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {!pclsBelumKirim || pclsBelumKirim.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                                                Semua PCL sudah submit laporan hari ini! ðŸŽ‰
                                            </td>
                                        </tr>
                                    ) : pclsBelumKirim.map((pcl, i) => (
                                        <tr key={pcl.pcl_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                                            <td className="px-5 py-3.5 font-medium text-gray-800">{pcl.nama_pcl}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{pcl.asal_kecamatan || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{pcl.desa || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{pcl.sls || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{pcl.no_telp || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
                ) : (
                    /* Placeholder sebelum pilih survei di tab Belum Kirim */
                    <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center gap-3">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-700 font-medium">Pilih survei terlebih dahulu</p>
                        <p className="text-gray-400 text-sm max-w-xs">
                            Pilih survei di atas untuk menampilkan daftar PCL yang belum mengirim laporan hari ini.
                        </p>
                    </div>
                )
            ) : (!selectedSurveiId && role === 'admin') ? (
                /* Placeholder sebelum pilih survei */
                <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-700 font-medium">Pilih survei terlebih dahulu</p>
                    <p className="text-gray-400 text-sm max-w-xs">
                        Data laporan, ringkasan, dan tabel akan ditampilkan setelah Anda memilih survei di atas.
                    </p>
                </div>
            ) : (
                <>
                    {/* Ringkasan Card */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Data Usaha</p>
                                    <p className="text-3xl font-bold text-blue-600">{totalDataUsaha.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Data Cacah</p>
                                    <p className="text-3xl font-bold text-indigo-600">{totalDataCacah.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h4l3 8 4-16 3 8h4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Data Keluarga</p>
                                    <p className="text-3xl font-bold text-green-600">{totalDataKeluarga.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Data Submit</p>
                                    <p className="text-3xl font-bold text-orange-600">{totalDataSubmit.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Jumlah Laporan</p>
                                    <p className="text-3xl font-bold text-purple-600">{filtered.length.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter periode + Search (Search hanya untuk role PML) */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <div className={`grid gap-3 ${role === 'PML' ? 'lg:grid-cols-[1.4fr_1.4fr_1fr] xl:grid-cols-[1.2fr_1.2fr_1.6fr]' : 'lg:grid-cols-2'} items-end`}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mulai tanggal</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sampai tanggal</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {role === 'PML' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter PCL</label>
                                    <select
                                        value={filterPclId}
                                        onChange={e => setFilterPclId(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Semua PCL</option>
                                        {availablePclsForSelectedSurvei.map(pcl => (
                                            <option key={pcl.id} value={pcl.id}>{pcl.nama_pcl}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="relative min-w-0">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </span>
                                    {/* <input
                                        type="text"
                                        placeholder={`Cari nama ${role === 'PCL' ? 'PML' : 'PCL'}...`}
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    /> */}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                        {/* <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Survei</th> */}
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {role === 'PCL' ? 'PML' : 'PCL'}
                                        </th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kecamatan</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Desa</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SLS</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usaha</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Keluarga</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cacah</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submit</th>
                                        {(role === 'PML' || role === 'PCL') && (
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={role === 'PML' || role === 'PCL' ? 10 : 9} className="text-center py-12 text-gray-400 text-sm">
                                                {search ? 'Tidak ada hasil pencarian.' : 'Belum ada laporan untuk survei ini.'}
                                            </td>
                                        </tr>
                                    ) : filtered.map((laporan, i) => (
                                        <tr key={laporan.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                                            {/* <td className="px-5 py-3.5 font-medium text-gray-800">{laporan.nama_survei}</td> */}
                                            <td className="px-5 py-3.5 text-gray-600">
                                                {role === 'PCL' ? laporan.nama_pml : laporan.nama_pcl}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600">{laporan.tanggal}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{laporan.nama_kecamatan || laporan.nama_kecamatan || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{laporan.nama_desa || laporan.nama_desa || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{laporan.nomor_sls || laporan.nomor_sls || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{laporan.data_usaha}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{laporan.data_keluarga}</td>
                                                <td className="px-5 py-3.5 text-gray-600">{laporan.data_cacah ?? 0}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{laporan.data_submit ?? 0}</td>
                                            {(role === 'PML' || role === 'PCL') && (
                                              <td className="px-5 py-3.5 text-center">
                                                 <div className="flex items-start justify-start gap-2">
                                                        <button onClick={() => openEdit(laporan)}
                                                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            {role === 'PCL' ? 'Edit' : 'Lihat'}
                                                        </button>
                                                        <button onClick={() => handleDelete(laporan.id)}
                                                            className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modal Tambah (PCL) / Lihat (PML) */}
            <Modal show={showModal} onClose={() => setShowModal(false)}
                title={editData ? (isReadOnlyMode ? 'Detail Laporan' : 'Edit Laporan') : 'Tambah Laporan Baru'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!editData && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Survei</label>
                            <select value={data.survei_id} onChange={e => {
                                    setData({
                                        ...data,
                                        survei_id: e.target.value,
                                        pml_id: '',
                                        kecamatan_id: '',
                                        desa_id: '',
                                        sls_id: '',
                                    });
                                    setDesaList([]);
                                    setSlsList([]);
                                }}
                                disabled={isReadOnlyMode}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.survei_id ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                                <option value="">Pilih Survei</option>
                                {surveis?.map(s => (
                                    <option key={s.id} value={s.id}>{s.nama_survei}</option>
                                ))}
                            </select>
                            {errors.survei_id && <p className="text-red-500 text-xs mt-1">{errors.survei_id}</p>}
                        </div>
                    )}

                    {!editData && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PML</label>
                            <input type="text" value={selectedPml ? selectedPml.nama_pml : ''}
                                readOnly
                                placeholder={data.survei_id ? 'PML belum tersedia untuk survei ini' : 'Pilih survei terlebih dahulu'}
                                className={`w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.pml_id ? 'border-red-300' : 'border-gray-200'}`} />
                            {errors.pml_id && <p className="text-red-500 text-xs mt-1">{errors.pml_id}</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                            <select value={data.kecamatan_id} onChange={e => {
                                    setData('kecamatan_id', e.target.value);
                                    setData('desa_id', '');
                                    setData('sls_id', '');
                                }}
                                disabled={isReadOnlyMode || loadingKecamatan || (role === 'PCL' && (!data.survei_id || !selectedPml))}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.kecamatan_id ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode || loadingKecamatan || (role === 'PCL' && (!data.survei_id || !selectedPml)) ? 'bg-gray-100' : ''}`}>
                                <option value="">Pilih Kecamatan</option>
                                {(role === 'PCL' ? formKecamatanList : kecamatanList).map(k => (
                                    <option key={k.id} value={k.id}>{k.nama}</option>
                                ))}
                            </select>
                            {errors.kecamatan_id && <p className="text-red-500 text-xs mt-1">{errors.kecamatan_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Desa</label>
                            <select value={data.desa_id} onChange={e => {
                                    setData('desa_id', e.target.value);
                                    setData('sls_id', '');
                                }}
                                disabled={isReadOnlyMode || loadingDesa || !data.kecamatan_id || (role === 'PCL' && (!data.survei_id || !selectedPml))}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.desa_id ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode || loadingDesa || (role === 'PCL' && (!data.survei_id || !selectedPml)) ? 'bg-gray-100' : ''}`}>
                                <option value="">Pilih Desa</option>
                                {desaList.map(d => (
                                    <option key={d.id} value={d.id}>{d.nama}</option>
                                ))}
                            </select>
                            {errors.desa_id && <p className="text-red-500 text-xs mt-1">{errors.desa_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SLS</label>
                            <select value={data.sls_id} onChange={e => setData('sls_id', e.target.value)}
                                disabled={isReadOnlyMode || loadingSls || !data.desa_id || (role === 'PCL' && (!data.survei_id || !selectedPml))}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.sls_id ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode || loadingSls || (role === 'PCL' && (!data.survei_id || !selectedPml)) ? 'bg-gray-100' : ''}`}>
                                <option value="">Pilih SLS</option>
                                {slsList.map(s => (
                                    <option key={s.id} value={s.id}>{s.nomor_sls}</option>
                                ))}
                            </select>
                            {errors.sls_id && <p className="text-red-500 text-xs mt-1">{errors.sls_id}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input type="date" value={data.tanggal} onChange={e => setData('tanggal', e.target.value)}
                            disabled={isReadOnlyMode}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                        {errors.tanggal && <p className="text-red-500 text-xs mt-1">{errors.tanggal}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Usaha</label>
                            <input type="number" min="0" value={data.data_usaha} onChange={e => setData('data_usaha', e.target.value)}
                                disabled={isReadOnlyMode}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.data_usaha ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="0" />
                            {errors.data_usaha && <p className="text-red-500 text-xs mt-1">{errors.data_usaha}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Keluarga</label>
                            <input type="number" min="0" value={data.data_keluarga} onChange={e => setData('data_keluarga', e.target.value)}
                                disabled={isReadOnlyMode}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.data_keluarga ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="0" />
                            {errors.data_keluarga && <p className="text-red-500 text-xs mt-1">{errors.data_keluarga}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Cacah</label>
                            <input type="number" min="0" value={data.data_cacah} onChange={e => setData('data_cacah', e.target.value)}
                                disabled={isReadOnlyMode}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.data_cacah ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="0" />
                            {errors.data_cacah && <p className="text-red-500 text-xs mt-1">{errors.data_cacah}</p>}
                        </div>
                        <div>

                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Submit</label>
                        <input type="number" min="0" value={data.data_submit} onChange={e => setData('data_submit', e.target.value)}
                            disabled={isReadOnlyMode}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.data_submit ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="0" />
                        {errors.data_submit && <p className="text-red-500 text-xs mt-1">{errors.data_submit}</p>}
                            </div>
                    </div>

                    {isReadOnlyMode && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                            Anda hanya dapat melihat data laporan yang telah diinput oleh PCL.
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            Batal
                        </button>
                        {!isReadOnlyMode && (
                            <button type="submit" disabled={processing || (!editData && role === 'PCL' && (!data.survei_id || !selectedPml))}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                                {processing ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Laporan'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}
