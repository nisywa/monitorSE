import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useState } from 'react';

const statusConfig = {
    'Berlangsung': 'bg-green-100 text-green-700',
    'Belum Mulai': 'bg-yellow-100 text-yellow-700',
    'Selesai': 'bg-gray-100 text-gray-600',
};

export default function DetailSurvei({ survei, pmls, pcls, laporan }) {
    const [showModalPml, setShowModalPml] = useState(false);
    const [selectedPml, setSelectedPml] = useState(null);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Filter PCL berdasarkan PML yang dipilih
    const pclBySelectedPml = selectedPml 
        ? pcls?.filter(pcl => pcl.pml_id === selectedPml.id) ?? []
        : [];

    const openPmlDetail = (pml) => {
        setSelectedPml(pml);
        setShowModalPml(true);
    };

    const closePmlModal = () => {
        setShowModalPml(false);
        setSelectedPml(null);
    };

    return (
        <MainLayout title={`Detail Survei - ${survei.nama_survei}`}>
            <Head title={`Detail Survei - ${survei.nama_survei}`} />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/manajemen-survei"
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Kembali
                        </Link>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">{survei.nama_survei}</h2>
                </div>
                <Link href={`/manajemen-survei/${survei.id}/edit`}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                </Link>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Status Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="text-xs text-gray-500 font-medium uppercase mb-2">Status</div>
                    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full inline-block ${statusConfig[survei.status] || 'bg-gray-100 text-gray-600'}`}>
                        {survei.status}
                    </span>
                </div>

                {/* Tanggal Mulai */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="text-xs text-gray-500 font-medium uppercase mb-2">Tanggal Mulai</div>
                    <div className="text-sm font-semibold text-gray-800">{formatDate(survei.tanggal_mulai)}</div>
                </div>

                {/* Tanggal Selesai */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="text-xs text-gray-500 font-medium uppercase mb-2">Tanggal Selesai</div>
                    <div className="text-sm font-semibold text-gray-800">{formatDate(survei.tanggal_selesai)}</div>
                </div>
            </div>

            {/* PML & PCL Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PML Section (Left) */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">PML Penanggung Jawab</h3>
                    <div className="space-y-2">
                        {pmls && pmls.length > 0 ? (
                            pmls.map(pml => (
                                <button
                                    key={pml.id}
                                    onClick={() => openPmlDetail(pml)}
                                    className="w-full text-left bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer group"
                                >
                                    <div className="font-medium text-blue-900 group-hover:text-blue-800 flex items-center justify-between">
                                        <span>{pml.nama_pml}</span>
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="text-xs text-blue-600 mt-1">{pml.user?.email}</div>
                                </button>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm py-4">Tidak ada PML yang ditugaskan</p>
                        )}
                    </div>
                </div>

                {/* PCL Section (Right) */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        PCL (Petugas Koleksi Lapangan)
                        {selectedPml && pclBySelectedPml.length > 0 && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({pclBySelectedPml.length}) - Dari: {selectedPml.nama_pml}
                            </span>
                        )}
                    </h3>
                    {pcls && pcls.length > 0 ? (
                        <>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {(selectedPml && pclBySelectedPml.length > 0 ? pclBySelectedPml : pcls).map(pcl => (
                                    <Link
                                        key={pcl.id}
                                        href={`/manajemen-survei/${survei.id}/pcl/${pcl.id}/laporan`}
                                        className={`block rounded-lg px-4 py-3 transition-colors cursor-pointer ${
                                            selectedPml && selectedPml.id === pcl.pml_id
                                                ? 'bg-purple-100 border border-purple-400 hover:bg-purple-200'
                                                : 'bg-purple-50 border border-purple-200 hover:bg-purple-100 hover:border-purple-300'
                                        }`}
                                    >
                                        <div className="font-medium text-purple-900">{pcl.nama_pcl}</div>
                                        <div className="text-xs text-purple-600 mt-1">{pcl.user?.email}</div>
                                        <div className="text-xs text-purple-500 mt-1">
                                            PML: <span className="font-medium">{pcl.pml?.nama_pml}</span>
                                        </div>
                                        <div className="text-xs text-purple-500 mt-2 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            Lihat Laporan
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {selectedPml && pclBySelectedPml.length > 0 && (
                                <button
                                    onClick={closePmlModal}
                                    className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    Tampilkan Semua PCL
                                </button>
                            )}
                            {selectedPml && pclBySelectedPml.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-sm">
                                        Tidak ada PCL yang ditugaskan untuk <strong>{selectedPml.nama_pml}</strong>
                                    </p>
                                    <button
                                        onClick={closePmlModal}
                                        className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        Tampilkan Semua PCL
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-500 text-sm py-4">Tidak ada PCL yang ditugaskan untuk survei ini</p>
                    )}
                </div>
            </div>

            {/* Laporan Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Laporan Survei</h3>
                {laporan && laporan.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">No</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Data</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {laporan.map((lap, i) => (
                                    <tr key={lap.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-3 text-gray-600">{new Date(lap.created_at).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{lap.jumlah_data || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                                Tersimpan
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">Belum ada laporan untuk survei ini</p>
                )}
            </div>

            {/* Modal Daftar PCL untuk PML */}
            {showModalPml && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">PCL dari {selectedPml?.nama_pml}</h3>
                                <p className="text-xs text-gray-500 mt-1">{selectedPml?.user?.email}</p>
                            </div>
                            <button
                                onClick={closePmlModal}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-6 py-4 max-h-96 overflow-y-auto">
                            {pclBySelectedPml && pclBySelectedPml.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 mb-3">
                                        Ditemukan {pclBySelectedPml.length} PCL
                                    </p>
                                    {pclBySelectedPml.map(pcl => (
                                        <div key={pcl.id} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                            <div className="font-medium text-purple-900">{pcl.nama_pcl}</div>
                                            <div className="text-xs text-purple-600 mt-1">{pcl.user?.email}</div>
                                            <Link
                                                href={`/manajemen-survei/${survei.id}/pcl/${pcl.id}/laporan`}
                                                className="text-xs text-purple-500 hover:text-purple-700 mt-2 flex items-center gap-1 font-medium"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                Lihat Laporan
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    Tidak ada PCL yang ditugaskan untuk PML ini
                                </p>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={closePmlModal}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium py-2 rounded-lg transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
