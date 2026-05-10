import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useState } from 'react';

const statusConfig = {
    'Berlangsung': 'bg-green-100 text-green-700',
    'Belum Mulai': 'bg-yellow-100 text-yellow-700',
    'Selesai': 'bg-gray-100 text-gray-600',
};

export default function DetailSurvei({ survei, pmls, pcls, laporan }) {
    const [selectedPml, setSelectedPml] = useState(null);
    const [searchPml, setSearchPml] = useState('');
    const [searchPcl, setSearchPcl] = useState('');

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Filter PML berdasarkan search
    const filteredPmls = pmls?.filter(pml =>
        pml.nama_pml.toLowerCase().includes(searchPml.toLowerCase()) ||
        pml.user?.email.toLowerCase().includes(searchPml.toLowerCase())
    ) ?? [];

    // Filter PCL berdasarkan PML yang dipilih
    const pclBySelectedPml = selectedPml 
        ? pcls?.filter(pcl => pcl.pml_id === selectedPml.id) ?? []
        : [];

    // Filter PCL berdasarkan search
    const filteredPcls = pclBySelectedPml.filter(pcl =>
        pcl.nama_pcl.toLowerCase().includes(searchPcl.toLowerCase()) ||
        pcl.user?.email.toLowerCase().includes(searchPcl.toLowerCase())
    );

    const selectPml = (pml) => {
        setSelectedPml(pml);
        setSearchPcl(''); // Reset PCL search ketika ganti PML
    };

    const clearSelection = () => {
        setSelectedPml(null);
        setSearchPcl('');
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
                    
                    {/* Search PML */}
                    <div className="mb-4 relative">
                        <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari PML..."
                            value={searchPml}
                            onChange={(e) => setSearchPml(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                    <div className="space-y-2">
                        {filteredPmls && filteredPmls.length > 0 ? (
                            filteredPmls.map(pml => (
                                <button
                                    key={pml.id}
                                    onClick={() => selectPml(pml)}
                                    className={`w-full text-left rounded-lg px-4 py-3 transition-colors cursor-pointer group ${
                                        selectedPml?.id === pml.id
                                            ? 'bg-blue-200 border-2 border-blue-500'
                                            : 'bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                                    }`}
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
                            <p className="text-gray-500 text-sm py-4 text-center">
                                {searchPml ? 'Tidak ada PML yang cocok' : 'Tidak ada PML yang ditugaskan'}
                            </p>
                        )}
                    </div>
                </div>

                {/* PCL Section (Right) */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        PCL (Petugas Koleksi Lapangan)
                        {selectedPml && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                - Dari: {selectedPml.nama_pml}
                            </span>
                        )}
                    </h3>
                    
                    {!selectedPml ? (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500 text-sm">
                                Silakan memilih PML terlebih dahulu
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Search PCL */}
                            <div className="mb-4 relative">
                                <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari PCL..."
                                    value={searchPcl}
                                    onChange={(e) => setSearchPcl(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                {searchPcl && (
                                    <button
                                        onClick={() => setSearchPcl('')}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {pclBySelectedPml.length > 0 ? (
                                filteredPcls.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 mb-3">
                                            Ditemukan {filteredPcls.length} dari {pclBySelectedPml.length} PCL
                                        </p>
                                        {filteredPcls.map(pcl => (
                                            <Link
                                                key={pcl.id}
                                                href={`/manajemen-survei/${survei.id}/pcl/${pcl.id}/laporan`}
                                                className="block bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 hover:bg-purple-100 hover:border-purple-300 transition-colors cursor-pointer"
                                            >
                                                <div className="font-medium text-purple-900">{pcl.nama_pcl}</div>
                                                <div className="text-xs text-purple-600 mt-1">{pcl.user?.email}</div>
                                                <div className="text-xs text-purple-500 mt-2 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    Lihat Laporan
                                                </div>
                                            </Link>
                                        ))}
                                        <button
                                            onClick={clearSelection}
                                            className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                        >
                                            Bersihkan Pilihan
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <p className="text-gray-500 text-sm mb-3">
                                            Tidak ada PCL yang cocok dengan "{searchPcl}"
                                        </p>
                                        <button
                                            onClick={() => setSearchPcl('')}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Hapus filter pencarian
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-gray-500 text-sm mb-3">
                                        Tidak ada PCL untuk PML <strong>{selectedPml.nama_pml}</strong>
                                    </p>
                                    <button
                                        onClick={clearSelection}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Pilih PML lain
                                    </button>
                                </div>
                            )}
                        </>
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

        </MainLayout>
    );
}
