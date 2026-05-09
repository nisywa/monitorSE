import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Modal from '@/Components/Modal';
import Alert from '@/Components/Alert';
import PopupWarning from '@/Components/PopupWarning';

export default function ManajemenPML({ pmls }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

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
        // Cek apakah PML memiliki PCL
        if (pml.total_pcl > 0) {
            setWarningMessage(
                `Anda tidak bisa menghapus data PML karena saat ini PML memiliki tanggung jawab terhadap ${pml.total_pcl} PCL.\n\nSilakan pindahkan semua PCL ke PML lain terlebih dahulu.`
            );
            setShowWarning(true);
            return;
        }

        // Jika tidak ada PCL, tampilkan konfirmasi delete
        if (confirm('Yakin ingin menghapus data PML ini?')) {
            router.delete(`/manajemen-pml/${pml.id}`);
        }
    };

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
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total PCL</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
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
                                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                            {pml.total_pcl} PCL
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
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

            {/* Modal Tambah / Edit */}
            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                title={editData ? 'Edit Data PML' : 'Tambah PML Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            value={data.nama}
                            onChange={e => setData('nama', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nama ? 'border-red-300' : 'border-gray-200'}`}
                            placeholder="Masukkan nama lengkap"
                        />
                        {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                            placeholder="Masukkan email"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                        <input
                            type="date"
                            value={data.tanggal_lahir}
                            onChange={e => setData('tanggal_lahir', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal_lahir ? 'border-red-300' : 'border-gray-200'}`}
                        />
                        {errors.tanggal_lahir && <p className="text-red-500 text-xs mt-1">{errors.tanggal_lahir}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            Batal
                        </button>

                        {/* Info password otomatis — letakkan sebelum tombol submit */}
                        {/* {data.tanggal_lahir && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-start gap-2">
                                <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                </svg>
                                <div className="text-sm text-blue-700">
                                    Password otomatis:{' '}
                                    <strong className="font-mono tracking-wider">
                                        {data.tanggal_lahir.replace(/-/g, '')}
                                    </strong>
                                </div>
                            </div>
                        )} */}
                        <button type="submit" disabled={processing}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                            {processing ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah PML'}
                        </button>
                    </div>
                </form>
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
