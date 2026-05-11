import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { useState, useEffect } from 'react';

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

export default function Dashboard({ stats, chartData, role, surveis, pclsBySurvei }) {
    const { auth } = usePage().props;
    
    // State untuk filter
    const [selectedSurvei, setSelectedSurvei] = useState(null);
    const [selectedPcl, setSelectedPcl] = useState(null);
    const [pclOptions, setPclOptions] = useState([]);
    const [filteredChartData, setFilteredChartData] = useState({
        data_usaha: 0,
        data_keluarga: 0,
        data_submit: 0,
        pcl_name: 'N/A'
    });
    const [loading, setLoading] = useState(false);

    // Effect untuk update PCL options ketika survei berubah
    useEffect(() => {
        if (selectedSurvei && pclsBySurvei && pclsBySurvei[selectedSurvei]) {
            setPclOptions(pclsBySurvei[selectedSurvei]);
            setSelectedPcl(null);
            setFilteredChartData({
                data_usaha: 0,
                data_keluarga: 0,
                data_submit: 0,
                pcl_name: 'N/A'
            });
        } else {
            setPclOptions([]);
            setSelectedPcl(null);
        }
    }, [selectedSurvei]);

    // Effect untuk fetch chart data ketika survei atau PCL berubah
    useEffect(() => {
        if (selectedSurvei && selectedPcl) {
            setLoading(true);
            fetch(`/api/dashboard/chart-data?survei_id=${selectedSurvei}&pcl_id=${selectedPcl}`)
                .then(response => response.json())
                .then(data => {
                    setFilteredChartData(data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching chart data:', error);
                    setLoading(false);
                });
        }
    }, [selectedSurvei, selectedPcl]);

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

    // Data untuk chart bar laporan (difilter)
    const filteredBarChartData = [
        {
            name: 'Data Usaha',
            value: filteredChartData?.data_usaha || 0,
            color: '#3B82F6',
            label: 'Data Usaha'
        },
        {
            name: 'Data Keluarga',
            value: filteredChartData?.data_keluarga || 0,
            color: '#10B981',
            label: 'Data Keluarga'
        },
        {
            name: 'Data Submit',
            value: filteredChartData?.data_submit || 0,
            color: '#F59E0B',
            label: 'Laporan Tersubmit'
        }
    ];

    // Data untuk chart bar laporan
    const chartDataFormatted = [
        {
            name: 'Data Usaha',
            value: chartData?.data_usaha || 0,
            color: '#3B82F6',
            label: 'Total Data Usaha'
        },
        {
            name: 'Data Keluarga',
            value: chartData?.data_keluarga || 0,
            color: '#10B981',
            label: 'Total Data Keluarga'
        },
        {
            name: 'Data Submit',
            value: chartData?.data_submit || 0,
            color: '#F59E0B',
            label: 'Laporan Tersubmit'
        }
    ];

    // Data untuk chart statistik utama (hanya untuk admin)
    const statsChartData = role === 'admin' ? [
        {
            name: 'PML',
            value: stats?.total_pml || 0,
            color: '#8B5CF6',
            label: 'Total Petugas Manajemen Lapangan'
        },
        {
            name: 'PCL',
            value: stats?.total_pcl || 0,
            color: '#06B6D4',
            label: 'Total Petugas Cacah Lapangan'
        },
        {
            name: 'Survei',
            value: stats?.total_survei || 0,
            color: '#F97316',
            label: 'Total Survei'
        },
        {
            name: 'Laporan',
            value: stats?.total_laporan || 0,
            color: '#EF4444',
            label: 'Total Laporan'
        }
    ] : [];

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

            {/* Filter Section untuk Per Survei & PCL */}
            {(role === 'admin' || role === 'PML') && surveis && surveis.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Data Per Survei dan PCL</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Filter Survei */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Survei</label>
                            <select
                                value={selectedSurvei || ''}
                                onChange={(e) => setSelectedSurvei(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">-- Pilih Survei --</option>
                                {surveis.map((survei) => (
                                    <option key={survei.id} value={survei.id}>
                                        {survei.nama_survei}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter PCL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih PCL</label>
                            <select
                                value={selectedPcl || ''}
                                onChange={(e) => setSelectedPcl(e.target.value ? parseInt(e.target.value) : null)}
                                disabled={!selectedSurvei || pclOptions.length === 0}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!selectedSurvei || pclOptions.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">-- Pilih PCL --</option>
                                {pclOptions.map((pcl) => (
                                    <option key={pcl.id} value={pcl.id}>
                                        {pcl.nama_pcl}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart Per Survei & PCL */}
            {(role === 'admin' || role === 'PML') && selectedSurvei && selectedPcl && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Per PCL: {filteredChartData.pcl_name}</h3>
                    <p className="text-sm text-gray-600 mb-4">Menampilkan data usaha dan data keluarga untuk PCL yang dipilih</p>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Memuat data...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredBarChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#d1d5db' }}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#d1d5db' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value, name, props) => [
                                            `${value}`,
                                            props.payload.label
                                        ]}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {filteredBarChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Pesan ketika PCL belum dipilih */}
            {(role === 'admin' || role === 'PML') && selectedSurvei && !selectedPcl && pclOptions.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                    <p className="text-yellow-800">Survei yang dipilih tidak memiliki data PCL atau laporan.</p>
                </div>
            )}

            {/* Pesan ketika belum memilih survei */}
            {(role === 'admin' || role === 'PML') && !selectedSurvei && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <p className="text-blue-800">Silahkan pilih survei terlebih dahulu untuk melihat data per PCL.</p>
                </div>
            )}

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Chart Data Laporan */}
                {/* <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Data Laporan</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataFormatted} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value, name, props) => [
                                        `${value}`,
                                        props.payload.label
                                    ]}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartDataFormatted.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        <p>Grafik menampilkan jumlah akumulatif data usaha, data keluarga, dan jumlah laporan yang sudah tersubmit.</p>
                    </div>
                </div> */}

                {/* Chart Statistik Utama (hanya untuk admin) */}
                {/* {role === 'admin' && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Data Survei Dan Laporan</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statsChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#d1d5db' }}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#d1d5db' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value, name, props) => [
                                            `${value}`,
                                            props.payload.label
                                        ]}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {statsChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                            <p>Statistik keseluruhan sistem monitoring SE.</p>
                        </div>
                    </div>
                )} */}
            </div>
        </MainLayout>
    );
}
