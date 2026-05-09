import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Modal from '@/Components/Modal';

const statusConfig = {
    'Berlangsung': 'bg-green-100 text-green-700',
    'Belum Mulai':  'bg-yellow-100 text-yellow-700',
    'Selesai':      'bg-gray-100 text-gray-600',
};

export default function ManajemenSurvei({ surveis, pmls }) {
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchPml, setSearchPml] = useState('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_survei: '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        pml_ids: [],
    });

    const openAdd = () => {
        setEditData(null);
        reset();
        clearErrors();
        setSearchPml('');
        setShowModal(true);
    };

    const openEdit = (survei) => {
        setEditData(survei);
        setData({
            nama_survei: survei.nama_survei,
            tanggal_mulai: survei.tanggal_mulai,
            tanggal_selesai: survei.tanggal_selesai,
            pml_ids: survei.pml_ids || [],
        });
        clearErrors();
        setSearchPml('');
        setShowModal(true);
    };

    const handlePmlChange = (pml_id) => {
        setData('pml_ids', 
            data.pml_ids.includes(pml_id)
                ? data.pml_ids.filter(id => id !== pml_id)
                : [...data.pml_ids, pml_id]
        );
    };

    const filteredPmls = pmls?.filter(pml =>
        pml.nama_PML.toLowerCase().includes(searchPml.toLowerCase())
    ) ?? [];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editData) {
            put(`/manajemen-survei/${editData.id}`, {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        } else {
            post('/manajemen-survei', {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus survei ini?')) {
            router.delete(`/manajemen-survei/${id}`);
        }
    };

    const filtered = surveis?.filter(s => {
        const matchSearch = s.nama_survei.toLowerCase().includes(search.toLowerCase()) ||
            s.nama_PML.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus ? s.status === filterStatus : true;
        return matchSearch && matchStatus;
    }) ?? [];

    return (
        <MainLayout title="Manajemen Survei">
            <Head title="Manajemen Survei" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Daftar Survei</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Total {surveis?.length ?? 0} survei</p>
                </div>
                <button onClick={openAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Survei
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input type="text" placeholder="Cari nama survei atau PML..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Semua Status</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Belum Mulai">Belum Mulai</option>
                    <option value="Selesai">Selesai</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Survei</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PML</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Selesai</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Laporan</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                                        {search || filterStatus ? 'Tidak ada hasil.' : 'Belum ada data survei.'}
                                    </td>
                                </tr>
                            ) : filtered.map((survei, i) => (
                                <tr key={survei.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                                    <td className="px-5 py-3.5 font-medium text-gray-800">{survei.nama_survei}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                            {survei.nama_PML}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">{survei.tanggal_mulai}</td>
                                    <td className="px-5 py-3.5 text-gray-600">{survei.tanggal_selesai}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[survei.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {survei.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">{survei.total_laporan}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(survei)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(survei.id)}
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
            <Modal show={showModal} onClose={() => setShowModal(false)} title={editData ? 'Edit Survei' : 'Tambah Survei Baru'} maxWidth="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Survei</label>
                        <input type="text" value={data.nama_survei} onChange={e => setData('nama_survei', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nama_survei ? 'border-red-300' : 'border-gray-200'}`}
                            placeholder="Nama survei" />
                        {errors.nama_survei && <p className="text-red-500 text-xs mt-1">{errors.nama_survei}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Pilih PML Penanggung Jawab</label>
                        
                        {/* Searchbar PML */}
                        <div className="mb-3 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Cari nama PML..."
                                value={searchPml}
                                onChange={e => setSearchPml(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Checkbox List */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                            {filteredPmls && filteredPmls.length > 0 ? (
                                filteredPmls.map(pml => (
                                    <label key={pml.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={data.pml_ids.includes(pml.id)}
                                            onChange={() => handlePmlChange(pml.id)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{pml.nama_PML}</span>
                                    </label>
                                ))
                            ) : pmls && pmls.length > 0 ? (
                                <p className="text-sm text-gray-500">Tidak ada PML yang cocok dengan pencarian</p>
                            ) : (
                                <p className="text-sm text-gray-500">Tidak ada data PML</p>
                            )}
                        </div>
                        {errors.pml_ids && <p className="text-red-500 text-xs mt-1">{errors.pml_ids}</p>}
                        {data.pml_ids.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                                Total PML dipilih: <strong>{data.pml_ids.length}</strong>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                            <input type="date" value={data.tanggal_mulai} onChange={e => setData('tanggal_mulai', e.target.value)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal_mulai ? 'border-red-300' : 'border-gray-200'}`} />
                            {errors.tanggal_mulai && <p className="text-red-500 text-xs mt-1">{errors.tanggal_mulai}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                            <input type="date" value={data.tanggal_selesai} onChange={e => setData('tanggal_selesai', e.target.value)}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal_selesai ? 'border-red-300' : 'border-gray-200'}`} />
                            {errors.tanggal_selesai && <p className="text-red-500 text-xs mt-1">{errors.tanggal_selesai}</p>}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            Batal
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                            {processing ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Survei'}
                        </button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}
