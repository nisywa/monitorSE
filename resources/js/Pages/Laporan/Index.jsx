import { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Modal from '@/Components/Modal';

export default function LaporanIndex({ laporans, surveis, pmlBySurvei, role }) {
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedSurveiId, setSelectedSurveiId] = useState('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        survei_id: '',
        pml_id: '',
        tanggal: '',
        data_usaha: '',
        data_keluarga: '',
        data_submit: '',
    });

    const isReadOnlyMode = editData && role === 'PML';

    const openAdd = () => {
        setEditData(null);
        reset();
        clearErrors();
        setShowModal(true);
    };

    const openEdit = (laporan) => {
        setEditData(laporan);
        setData({
            survei_id: String(laporan.survei_id),
            pml_id: String(laporan.pml_id),
            tanggal: laporan.tanggal,
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

    const pageTitle = role === 'admin' ? 'List Laporan' : 'Laporan Saya';

    // Jika belum memilih survei, data kosong
    const laporanBySurvei = selectedSurveiId
        ? laporans?.filter(l => l.survei_id === parseInt(selectedSurveiId)) ?? []
        : [];

    // Hitung total dari laporan yang ditampilkan
    const totalDataUsaha = laporanBySurvei.reduce((sum, l) => sum + (l.data_usaha || 0), 0);
    const totalDataKeluarga = laporanBySurvei.reduce((sum, l) => sum + (l.data_keluarga || 0), 0);
    const totalDataSubmit = laporanBySurvei.reduce((sum, l) => sum + (l.data_submit || 0), 0);

    const filtered = laporanBySurvei.filter(l => {
        const searchTerm = search.toLowerCase();
        const pclOrPmlName = role === 'PCL' ? l.nama_pml : l.nama_pcl;
        return l.nama_survei.toLowerCase().includes(searchTerm) ||
            pclOrPmlName.toLowerCase().includes(searchTerm);
    });

    const selectedPml = data.survei_id ? pmlBySurvei?.[data.survei_id] ?? null : null;

    useEffect(() => {
        if (data.survei_id) {
            setData('pml_id', selectedPml?.id ?? '');
        } else {
            setData('pml_id', '');
        }
    }, [data.survei_id, selectedPml]);

    return (
        <MainLayout title={pageTitle}>
            <Head title={pageTitle} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">{pageTitle}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {selectedSurveiId
                            ? `Total ${laporanBySurvei.length} laporan`
                            : 'Pilih survei untuk melihat laporan'}
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

            {/* Pilih Survei */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Pilih Survei
                    <span className="font-normal text-gray-500 ml-1">(Wajib dipilih untuk melihat data)</span>
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

            {/* Role Info Banner */}
            <div className={`rounded-xl px-4 py-3 mb-6 text-sm flex items-center gap-2 ${
                role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                role === 'PML'   ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                'bg-green-50 text-green-700 border border-green-100'
            }`}>
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {role === 'admin' && 'Anda login sebagai Admin — hanya bisa melihat laporan.'}
                {role === 'PML'   && 'Anda login sebagai PML — dapat melihat data laporan yang diinput PCL dan menghapus jika perlu.'}
                {role === 'PCL'   && 'Anda login sebagai PCL — dapat menambahkan laporan baru.'}
            </div>

            {/* Konten utama: tampil hanya setelah survei dipilih */}
            {!selectedSurveiId ? (
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                                    <p className="text-3xl font-bold text-purple-600">{laporanBySurvei.length.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                placeholder={`Cari nama ${role === 'PCL' ? 'PML' : 'PCL'}...`}
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
                                        {/* <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Survei</th> */}
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {role === 'PCL' ? 'PML' : 'PCL'}
                                        </th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usaha</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Keluarga</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submit</th>
                                        {(role === 'PML' || role === 'PCL') && (
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
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
                                            <td className="px-5 py-3.5 text-gray-600">{laporan.data_usaha}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{laporan.data_keluarga}</td>
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
                            <select value={data.survei_id} onChange={e => setData('survei_id', e.target.value)}
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
                                placeholder={data.survei_id ? 'Memilih PML...' : 'Pilih survei terlebih dahulu'}
                                className={`w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.pml_id ? 'border-red-300' : 'border-gray-200'}`} />
                            {errors.pml_id && <p className="text-red-500 text-xs mt-1">{errors.pml_id}</p>}
                        </div>
                    )}

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Submit</label>
                        <input type="number" min="0" value={data.data_submit} onChange={e => setData('data_submit', e.target.value)}
                            disabled={isReadOnlyMode}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.data_submit ? 'border-red-300' : 'border-gray-200'} ${isReadOnlyMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="0" />
                        {errors.data_submit && <p className="text-red-500 text-xs mt-1">{errors.data_submit}</p>}
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
                            <button type="submit" disabled={processing}
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
