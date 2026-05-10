import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Modal from '@/Components/Modal';

export default function ManajemenPCL({ pcls, pmls, surveis }) {
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState('');
    const [searchPml, setSearchPml] = useState('');
    const [searchSurvei, setSearchSurvei] = useState('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        email: '',
        pml_ids: [],
        survei_ids: [],
        tanggal_lahir: '',
        asal_kecamatan: '',
        blok_sensus: '',
    });

    const openAdd = () => {
        setEditData(null);
        reset();
        clearErrors();
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
                pml_ids: pclData.pml_ids || [],
                survei_ids: pclData.survei_ids || [],
                tanggal_lahir: pclData.tanggal_lahir,
                asal_kecamatan: pclData.asal_kecamatan,
                blok_sensus: pclData.blok_sensus,
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

    const handlePmlChange = (pmlId) => {
        const pmlIds = data.pml_ids.includes(pmlId)
            ? data.pml_ids.filter(id => id !== pmlId)
            : [...data.pml_ids, pmlId];
        setData('pml_ids', pmlIds);
    };

    const handleSurveiChange = (surveiId) => {
        const surveiIds = data.survei_ids.includes(surveiId)
            ? data.survei_ids.filter(id => id !== surveiId)
            : [...data.survei_ids, surveiId];
        setData('survei_ids', surveiIds);
    };

    const filteredPmls = pmls?.filter(pml =>
        pml.nama_PML.toLowerCase().includes(searchPml.toLowerCase())
    ) ?? [];

    const filteredSurveis = surveis?.filter(s =>
        s.nama_survei.toLowerCase().includes(searchSurvei.toLowerCase())
    ) ?? [];

    const filtered = pcls?.filter(p =>
        p.nama_PCL.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.asal_kecamatan.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    return (
        <MainLayout title="Manajemen PCL">
            <Head title="Manajemen PCL" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Daftar PCL</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Total {pcls?.length ?? 0} PCL terdaftar</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah PCL
                </button>
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
                        placeholder="Cari nama, email, atau kecamatan..."
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
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama PCL</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PML</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Survei</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kecamatan</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                                        {search ? 'Tidak ada hasil pencarian.' : 'Belum ada data PCL.'}
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
                                                <p className="text-xs text-gray-400">{pcl.tanggal_lahir}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">{pcl.email}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-wrap gap-1">
                                            {pcl.pmls?.length > 0 ? (
                                                pcl.pmls.map(pml => (
                                                    <span key={pml.id} className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                                        {pml.nama_pml}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-wrap gap-1">
                                            {pcl.surveis?.length > 0 ? (
                                                pcl.surveis.map(s => (
                                                    <span key={s.id} className="bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                                        {s.nama_survei}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">{pcl.asal_kecamatan}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(pcl)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(pcl.id)}
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

            {/* Modal */}
            <Modal show={showModal} onClose={() => setShowModal(false)} title={editData ? 'Edit Data PCL' : 'Tambah PCL Baru'} maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Basic Info */}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Blok Sensus</label>
                                <input type="text" value={data.blok_sensus} onChange={e => setData('blok_sensus', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.blok_sensus ? 'border-red-300' : 'border-gray-200'}`}
                                    placeholder="Kode blok sensus" />
                                {errors.blok_sensus && <p className="text-red-500 text-xs mt-1">{errors.blok_sensus}</p>}
                            </div>
                        </div>
                    </div>

                    {/* PML Selection */}
                    <div className="space-y-3 border-t pt-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih PML (Multiple)</label>
                            {errors.pml_ids && <p className="text-red-500 text-xs mb-2">{errors.pml_ids}</p>}
                            
                            {/* Search PML */}
                            <div className="mb-3 relative">
                                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari PML..."
                                    value={searchPml}
                                    onChange={(e) => setSearchPml(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {searchPml && (
                                    <button
                                        onClick={() => setSearchPml('')}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {filteredPmls?.length > 0 ? (
                                    filteredPmls.map(pml => (
                                        <label key={pml.id} className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={data.pml_ids.includes(pml.id)}
                                                onChange={() => handlePmlChange(pml.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{pml.nama_PML}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="col-span-2 text-center text-gray-400 text-xs py-4">
                                        {searchPml ? 'Tidak ada PML yang cocok' : 'Tidak ada PML tersedia'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Survei Selection */}
                    <div className="space-y-3 border-t pt-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih Survei (Multiple)</label>
                            {errors.survei_ids && <p className="text-red-500 text-xs mb-2">{errors.survei_ids}</p>}
                            
                            {/* Search Survei */}
                            <div className="mb-3 relative">
                                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari Survei..."
                                    value={searchSurvei}
                                    onChange={(e) => setSearchSurvei(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                {searchSurvei && (
                                    <button
                                        onClick={() => setSearchSurvei('')}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {filteredSurveis?.length > 0 ? (
                                    filteredSurveis.map(survei => (
                                        <label key={survei.id} className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={data.survei_ids.includes(survei.id)}
                                                onChange={() => handleSurveiChange(survei.id)}
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-700">{survei.nama_survei}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="col-span-2 text-center text-gray-400 text-xs py-4">
                                        {searchSurvei ? 'Tidak ada Survei yang cocok' : 'Tidak ada Survei tersedia'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

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
