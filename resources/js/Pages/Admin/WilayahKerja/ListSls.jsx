import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FormModal from '@/Components/FormModal';
import ConfirmDialog from '@/Components/ConfirmDialog';

export default function ListSls({ desa, onBack }) {
    const [sls, setSls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [formModal, setFormModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nomor_sls: '', jumlah_rumah_tangga: '' });
    const [formLoading, setFormLoading] = useState(false);
    
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchSls();
    }, [desa.id]);

    const fetchSls = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/wilayah-kerja/sls/${desa.id}`);
            setSls(response.data.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching sls:', err);
            setError('Gagal memuat data SLS');
            setSls([]);
        } finally {
            setLoading(false);
        }
    };

    const openAddForm = () => {
        setEditingId(null);
        setFormData({ nomor_sls: '', jumlah_rumah_tangga: '' });
        setFormModal(true);
    };

    const openEditForm = (s) => {
        setEditingId(s.id);
        setFormData({ 
            nomor_sls: s.nomor_sls, 
            jumlah_rumah_tangga: s.jumlah_rumah_tangga || '' 
        });
        setFormModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const data = editingId 
                ? { 
                    nomor_sls: formData.nomor_sls,
                    jumlah_rumah_tangga: formData.jumlah_rumah_tangga ? parseInt(formData.jumlah_rumah_tangga) : null
                  }
                : { 
                    desa_id: desa.id, 
                    nomor_sls: formData.nomor_sls,
                    jumlah_rumah_tangga: formData.jumlah_rumah_tangga ? parseInt(formData.jumlah_rumah_tangga) : null
                  };
            
            const url = editingId 
                ? `/api/wilayah-kerja/sls/${editingId}`
                : '/api/wilayah-kerja/sls';
            const method = editingId ? 'put' : 'post';

            const response = await axios[method](url, data);

            if (response.data.success) {
                setFormModal(false);
                fetchSls();
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
            const response = await axios.delete(`/api/wilayah-kerja/sls/${deleteId}`);
            if (response.data.success) {
                setDeleteConfirm(false);
                fetchSls();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menghapus data');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={onBack}
                        className="mb-6 inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                        ← Kembali
                    </button>
                    <div className="text-center">
                        <p className="text-gray-500">Memuat data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                    onClick={onBack}
                    className="mb-6 inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                    ← Kembali
                </button>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Daftar SLS</h1>
                        <p className="mt-2 text-gray-600">Desa: {desa.nama}</p>
                    </div>
                    <button
                        onClick={openAddForm}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah SLS
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <div className="bg-white overflow-hidden shadow-md rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-blue-600 text-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">No</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Nomor SLS</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Jumlah Rumah Tangga</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sls && sls.length > 0 ? (
                                    sls.map((s, index) => (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{s.nomor_sls}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{s.jumlah_rumah_tangga || '-'}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditForm(s)}
                                                        className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(s.id)}
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
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data SLS
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <FormModal isOpen={formModal} title={editingId ? 'Edit SLS' : 'Tambah SLS'} onClose={() => setFormModal(false)}>
                <form onSubmit={handleFormSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor SLS</label>
                        <input
                            type="text"
                            value={formData.nomor_sls}
                            onChange={(e) => setFormData({ ...formData, nomor_sls: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Rumah Tangga</label>
                        <input
                            type="number"
                            value={formData.jumlah_rumah_tangga}
                            onChange={(e) => setFormData({ ...formData, jumlah_rumah_tangga: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
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
                title="Hapus SLS"
                message="Apakah Anda yakin ingin menghapus SLS ini?"
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(false)}
                isLoading={deleteLoading}
            />
        </div>
    );
}
