import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

function StatCard({ label, value, color, icon }) {
    const colors = {
        blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500'   },
        green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500'  },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
    };
    const c = colors[color] || colors.blue;

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <span className={c.icon}>{icon}</span>
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-800">{value ?? 0}</p>
                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export default function Dashboard({ stats, role }) {
    const { auth } = usePage().props;

    const adminStats = [
        {
            label: 'Total PML',
            value: stats?.total_pml,
            color: 'blue',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
        {
            label: 'Total PCL',
            value: stats?.total_pcl,
            color: 'green',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
        {
            label: 'Total Survei',
            value: stats?.total_survei,
            color: 'purple',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
        },
        {
            label: 'Total Laporan',
            value: stats?.total_laporan,
            color: 'orange',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
    ];

    const pmlStats = [
        { label: 'Total PCL Saya', value: stats?.total_pcl, color: 'green', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        { label: 'Total Survei Saya', value: stats?.total_survei, color: 'purple', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
        { label: 'Total Laporan', value: stats?.total_laporan, color: 'orange', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    ];

    const pclStats = [
        { label: 'Total Laporan Saya', value: stats?.total_laporan, color: 'blue', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { label: 'Laporan Tersubmit', value: stats?.laporan_submit, color: 'green', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    ];

    const statCards = role === 'admin' ? adminStats : role === 'PML' ? pmlStats : pclStats;

    const roleLabels = { admin: 'Administrator', PML: 'Petugas Manajemen Lapangan', PCL: 'Petugas Cacah Lapangan' };

    return (
        <MainLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Welcome */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
                <p className="text-blue-100 text-sm mb-1">Selamat datang,</p>
                <h2 className="text-xl font-bold">{auth?.user?.nama}</h2>
                <p className="text-blue-200 text-sm mt-1">{roleLabels[role]}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Panduan Penggunaan</h3>
                <div className="space-y-2 text-sm text-gray-600">
                    {role === 'admin' && (
                        <>
                            <p>• Gunakan menu <strong>Manajemen PML</strong> untuk menambah dan mengelola akun PML.</p>
                            <p>• Gunakan menu <strong>Manajemen PCL</strong> untuk menambah dan mengelola akun PCL.</p>
                            <p>• Gunakan menu <strong>Manajemen Survei</strong> untuk membuat dan mengelola survei.</p>
                            <p>• Gunakan menu <strong>List Laporan</strong> untuk melihat semua laporan yang masuk.</p>
                        </>
                    )}
                    {role === 'PML' && (
                        <>
                            <p>• Anda dapat melihat, mengedit, dan menghapus laporan dari PCL yang berada di bawah tanggung jawab Anda.</p>
                            <p>• Gunakan menu <strong>Laporan</strong> untuk mengelola semua laporan.</p>
                        </>
                    )}
                    {role === 'PCL' && (
                        <>
                            <p>• Anda dapat menambahkan laporan baru melalui menu <strong>Laporan</strong>.</p>
                            <p>• Pastikan data laporan sudah benar sebelum menyimpan.</p>
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
