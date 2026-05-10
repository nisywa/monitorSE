import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

const statusConfig = {
    'Berlangsung': 'bg-green-100 text-green-700',
    'Belum Mulai': 'bg-yellow-100 text-yellow-700',
    'Selesai': 'bg-gray-100 text-gray-600',
};

export default function LaporanPcl({ pcl, survei, laporan }) {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <MainLayout title={`Laporan PCL - ${pcl.nama_pcl}`}>
            <Head title={`Laporan PCL - ${pcl.nama_pcl}`} />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href={`/manajemen-survei/${survei.id}/detail`}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Kembali
                        </Link>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">{pcl.nama_pcl}</h2>
                    <p className="text-sm text-gray-500 mt-1">Laporan untuk Survei: <strong>{survei.nama_survei}</strong></p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Email */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="text-xs text-gray-500 font-medium uppercase mb-2">Email</div>
                    <div className="text-sm font-semibold text-gray-800">{pcl.user?.email}</div>
                </div>

                {/* PML Penanggung Jawab */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="text-xs text-gray-500 font-medium uppercase mb-2">PML Penanggung Jawab</div>
                    {pcl.pmls && pcl.pmls.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {pcl.pmls.map(pml => (
                                <span key={pml.id} className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                    {pml.nama_pml}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">-</div>
                    )}
                </div>

                {/* Total Laporan */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="text-xs text-gray-500 font-medium uppercase mb-2">Total Laporan</div>
                    <div className="text-sm font-semibold text-blue-600">{laporan?.length ?? 0}</div>
                </div>
            </div>

            {/* Laporan Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Daftar Laporan</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Data</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catatan</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {laporan && laporan.length > 0 ? (
                                laporan.map((lap, i) => (
                                    <tr key={lap.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3.5 text-gray-400">{i + 1}</td>
                                        <td className="px-6 py-3.5 text-gray-600">{formatDate(lap.created_at)}</td>
                                        <td className="px-6 py-3.5 font-medium text-gray-800">{lap.jumlah_data || '-'}</td>
                                        <td className="px-6 py-3.5 text-gray-600 text-xs">{lap.catatan || '-'}</td>
                                        <td className="px-6 py-3.5">
                                            <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                                Tersimpan
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                                        Belum ada laporan untuk PCL ini
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
