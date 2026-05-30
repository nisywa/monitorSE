import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ListDesa from './ListDesa';
import ListSls from './ListSls';
import FormModal from '@/Components/FormModal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import axios from 'axios';

export default function Index({ kecamatan: initialKecamatan }) {
    const [kecamatan, setKecamatan] = useState(initialKecamatan);
    const [selectedKecamatan, setSelectedKecamatan] = useState(null);
    const [selectedDesa, setSelectedDesa] = useState(null);
    
    const [formModal, setFormModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nama: '' });
    const [formLoading, setFormLoading] = useState(false);
    
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleLihatDesa = (k) => {
        setSelectedKecamatan(k);
        setSelectedDesa(null);
    };

    const handleBackFromDesa = () => {
        setSelectedKecamatan(null);
        setSelectedDesa(null);
    };

    const handleSelectDesa = (d) => {
        setSelectedDesa(d);
    };

    const handleBackFromSls = () => {
        setSelectedDesa(null);
    };

    const openAddForm = () => {
        setEditingId(null);
        setFormData({ nama: '' });
        setFormModal(true);
    };

    const openEditForm = (k) => {
        setEditingId(k.id);
        setFormData({ nama: k.nama });
        setFormModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const url = editingId 
                ? `/api/wilayah-kerja/kecamatan/${editingId}`
                : '/api/wilayah-kerja/kecamatan';
            const method = editingId ? 'put' : 'post';

            const response = await axios[method](url, formData);

            if (response.data.success) {
                // Refresh data
                const response = await axios.get('/wilayah-kerja');
                window.location.reload();
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
            const response = await axios.delete(`/api/wilayah-kerja/kecamatan/${deleteId}`);
            if (response.data.success) {
                window.location.reload();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menghapus data');
        } finally {
            setDeleteLoading(false);
            setDeleteConfirm(false);
        }
    };

    if (selectedDesa) {
        return (
            <AdminLayout>
                <Head title="Wilayah Kerja - SLS" />
                <ListSls 
                    desa={selectedDesa} 
                    onBack={handleBackFromSls}
                />
            </AdminLayout>
        );
    }

    if (selectedKecamatan) {
        return (
            <AdminLayout>
                <Head title="Wilayah Kerja - Desa" />
                <ListDesa 
                    kecamatan={selectedKecamatan} 
                    onBack={handleBackFromDesa}
                    onSelectDesa={handleSelectDesa}
                />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Wilayah Kerja" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Wilayah Kerja</h1>
                            <p className="mt-2 text-gray-600">Kabupaten Pinrang, Provinsi Sulawesi Selatan</p>
                        </div>
                        <button
                            onClick={openAddForm}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Kecamatan
                        </button>
                    </div>

                    <div className="bg-white overflow-hidden shadow-md rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-blue-600 text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">No</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Nama Kecamatan</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {kecamatan && kecamatan.length > 0 ? (
                                        kecamatan.map((k, index) => (
                                            <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{k.nama}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleLihatDesa(k)}
                                                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                                                        >
                                                            Lihat Desa
                                                        </button>
                                                        <button
                                                            onClick={() => openEditForm(k)}
                                                            className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(k.id)}
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
                                            <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                                Tidak ada data kecamatan
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <FormModal isOpen={formModal} title={editingId ? 'Edit Kecamatan' : 'Tambah Kecamatan'} onClose={() => setFormModal(false)}>
                <form onSubmit={handleFormSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kecamatan</label>
                        <input
                            type="text"
                            value={formData.nama}
                            onChange={(e) => setFormData({ nama: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
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
                title="Hapus Kecamatan"
                message="Apakah Anda yakin ingin menghapus kecamatan ini? Data desa dan SLS yang terkait juga akan dihapus."
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(false)}
                isLoading={deleteLoading}
            />
        </AdminLayout>
    );
}
