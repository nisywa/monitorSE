import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

const statusConfig = {
    'Berlangsung': 'bg-green-100 text-green-700',
    'Belum Mulai': 'bg-yellow-100 text-yellow-700',
    'Selesai': 'bg-gray-100 text-gray-600',
};

export default function DetailSurvei({ survei, pmls, pcls, laporan }) {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
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

            {/* PML Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">PML Penanggung Jawab</h3>
                <div className="flex flex-wrap gap-2">
                    {pmls && pmls.length > 0 ? (
                        pmls.map(pml => (
                            <div key={pml.id} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                                <div className="font-medium text-blue-900">{pml.nama_pml}</div>
                                <div className="text-xs text-blue-600">{pml.user?.email}</div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">Tidak ada PML yang ditugaskan</p>
                    )}
                </div>
            </div>

            {/* PCL Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">PCL (Petugas Koleksi Lapangan)</h3>
                {pcls && pcls.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">No</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nama PCL</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">PML</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pcls.map((pcl, i) => (
                                    <tr key={pcl.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{pcl.nama_pcl}</td>
                                        <td className="px-4 py-3 text-gray-600">{pcl.user?.email}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                                {pcl.pml?.nama_pml}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">Tidak ada PCL yang ditugaskan untuk survei ini</p>
                )}
            </div>

            {/* Laporan Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Laporan ({laporan?.length ?? 0})</h3>
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
