import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Modal from '@/Components/Modal';

export default function LaporanIndex({ laporans, surveis, role }) {
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        survei_id: '',
        tanggal: '',
        data_usaha: '',
        data_keluarga: '',
        data_submit: false,
    });

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
            tanggal: laporan.tanggal,
            data_usaha: String(laporan.data_usaha),
            data_keluarga: String(laporan.data_keluarga),
            data_submit: laporan.data_submit,
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

    const filtered = laporans?.filter(l =>
        l.nama_survei.toLowerCase().includes(search.toLowerCase()) ||
        l.nama_PCL.toLowerCase().includes(search.toLowerCase()) ||
        l.nama_PML.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    const pageTitle = role === 'admin' ? 'List Laporan' : 'Laporan Saya';

    return (
        <MainLayout title={pageTitle}>
            <Head title={pageTitle} />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">{pageTitle}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Total {laporans?.length ?? 0} laporan</p>
                </div>
                {/* Hanya PCL yang bisa tambah laporan */}
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

            {/* Role Info Banner */}
            <div className={`rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2 ${
                role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                role === 'PML'   ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                'bg-green-50 text-green-700 border border-green-100'
            }`}>
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {role === 'admin' && 'Anda login sebagai Admin — hanya bisa melihat laporan.'}
                {role === 'PML'   && 'Anda login sebagai PML — dapat mengedit dan menghapus laporan.'}
                {role === 'PCL'   && 'Anda login sebagai PCL — dapat menambahkan laporan baru.'}
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input type="text" placeholder="Cari survei, PCL, atau PML..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Survei</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PCL</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PML</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usaha</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Keluarga</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                {(role === 'PML') && (
                                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                                        {search ? 'Tidak ada hasil pencarian.' : 'Belum ada laporan.'}
                                    </td>
                                </tr>
                            ) : filtered.map((laporan, i) => (
                                <tr key={laporan.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                                    <td className="px-5 py-3.5 font-medium text-gray-800">{laporan.nama_survei}</td>
                                    <td className="px-5 py-3.5 text-gray-600">{laporan.nama_PCL}</td>
                                    <td className="px-5 py-3.5 text-gray-600">{laporan.nama_PML}</td>
                                    <td className="px-5 py-3.5 text-gray-600">{laporan.tanggal}</td>
                                    <td className="px-5 py-3.5 text-gray-600">{laporan.data_usaha}</td>
                                    <td className="px-5 py-3.5 text-gray-600">{laporan.data_keluarga}</td>
                                    <td className="px-5 py-3.5">
                                        {laporan.data_submit ? (
                                            <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Tersubmit</span>
                                        ) : (
                                            <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2.5 py-1 rounded-full">Draft</span>
                                        )}
                                    </td>
                                    {role === 'PML' && (
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(laporan)}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
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

            {/* Modal Tambah (PCL) / Edit (PML) */}
            <Modal show={showModal} onClose={() => setShowModal(false)}
                title={editData ? 'Edit Laporan' : 'Tambah Laporan Baru'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Survei - hanya saat tambah baru oleh PCL */}
                    {!editData && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Survei</label>
                            <select value={data.survei_id} onChange={e => setData('survei_id', e.target.value)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.survei_id ? 'border-red-300' : 'border-gray-200'}`}>
                                <option value="">Pilih Survei</option>
                                {surveis?.map(s => (
                                    <option key={s.id} value={s.id}>{s.nama_survei}</option>
                                ))}
                            </select>
                            {errors.survei_id && <p className="text-red-500 text-xs mt-1">{errors.survei_id}</p>}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input type="date" value={data.tanggal} onChange={e => setData('tanggal', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal ? 'border-red-300' : 'border-gray-200'}`} />
                        {errors.tanggal && <p className="text-red-500 text-xs mt-1">{errors.tanggal}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Usaha</label>
                            <input type="number" min="0" value={data.data_usaha} onChange={e => setData('data_usaha', e.target.value)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.data_usaha ? 'border-red-300' : 'border-gray-200'}`}
                                placeholder="0" />
                            {errors.data_usaha && <p className="text-red-500 text-xs mt-1">{errors.data_usaha}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Keluarga</label>
                            <input type="number" min="0" value={data.data_keluarga} onChange={e => setData('data_keluarga', e.target.value)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.data_keluarga ? 'border-red-300' : 'border-gray-200'}`}
                                placeholder="0" />
                            {errors.data_keluarga && <p className="text-red-500 text-xs mt-1">{errors.data_keluarga}</p>}
                        </div>
                    </div>

                    {/* Submit toggle - hanya PML saat edit */}
                    {editData && role === 'PML' && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <input type="checkbox" id="data_submit" checked={data.data_submit}
                                onChange={e => setData('data_submit', e.target.checked)}
                                className="w-4 h-4 accent-blue-600" />
                            <label htmlFor="data_submit" className="text-sm text-gray-700">
                                Tandai sebagai <strong>Tersubmit</strong>
                            </label>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            Batal
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                            {processing ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Laporan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}
