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

export default function Dashboard({ stats, chartData, role, surveis, pmlsBySurvei }) {
    const { auth } = usePage().props;
    
    // State untuk filter
    const [selectedSurvei, setSelectedSurvei] = useState(null);
    const [selectedPml, setSelectedPml] = useState(null);
    const [pmlOptions, setPmlOptions] = useState([]);
    const [pclChartData, setPclChartData] = useState([]);
    const [pmlName, setPmlName] = useState('');
    const [loading, setLoading] = useState(false);
    const [kecamatanList, setKecamatanList] = useState([]);
    const [desaList, setDesaList] = useState([]);
    const [slsList, setSlsList] = useState([]);
    const [selectedKecamatan, setSelectedKecamatan] = useState(null);
    const [selectedDesa, setSelectedDesa] = useState(null);
    const [selectedSls, setSelectedSls] = useState(null);
    const [locationStats, setLocationStats] = useState(null);
    const [loadingWilayah, setLoadingWilayah] = useState(false);
    const [loadingLocationStats, setLoadingLocationStats] = useState(false);

    // Effect untuk update PML options ketika survei berubah
    useEffect(() => {
        if (selectedSurvei && pmlsBySurvei && pmlsBySurvei[selectedSurvei]) {
            setPmlOptions(pmlsBySurvei[selectedSurvei]);
            setSelectedPml(null);
            setPclChartData([]);
            setPmlName('');
        } else {
            setPmlOptions([]);
            setSelectedPml(null);
            setPclChartData([]);
            setPmlName('');
        }
    }, [selectedSurvei]);

    // Effect untuk fetch chart data ketika survei, PML, atau filter lokasi berubah
    useEffect(() => {
        if (selectedSurvei && selectedPml) {
            setLoading(true);
            const params = new URLSearchParams({
                survei_id: selectedSurvei,
                pml_id: selectedPml,
            });

            if (selectedKecamatan) params.set('kecamatan_id', selectedKecamatan);
            if (selectedDesa) params.set('desa_id', selectedDesa);
            if (selectedSls) params.set('sls_id', selectedSls);

            fetch(`/api/dashboard/chart-data-by-pml?${params.toString()}`)
                .then(response => response.json())
                .then(data => {
                    setPclChartData(data.pcls || []);
                    setPmlName(data.pml_name || '');
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching chart data:', error);
                    setLoading(false);
                });
        } else {
            setPclChartData([]);
        }
    }, [selectedSurvei, selectedPml, selectedKecamatan, selectedDesa, selectedSls]);

    const displayStats = locationStats || stats;

    const fetchKecamatanList = async () => {
        setLoadingWilayah(true);
        try {
            const response = await fetch('/api/wilayah-kerja/kecamatan-list');
            const data = await response.json();
            setKecamatanList(data.data || []);
        } catch (error) {
            console.error('Error fetching kecamatan list:', error);
            setKecamatanList([]);
        } finally {
            setLoadingWilayah(false);
        }
    };

    const fetchDesaList = async (kecamatanId) => {
        setLoadingWilayah(true);
        try {
            const response = await fetch(`/api/wilayah-kerja/desa/${kecamatanId}`);
            const data = await response.json();
            setDesaList(data.data || []);
        } catch (error) {
            console.error('Error fetching desa list:', error);
            setDesaList([]);
        } finally {
            setLoadingWilayah(false);
        }
    };

    const fetchSlsList = async (desaId) => {
        setLoadingWilayah(true);
        try {
            const response = await fetch(`/api/wilayah-kerja/sls/${desaId}`);
            const data = await response.json();
            setSlsList(data.data || []);
        } catch (error) {
            console.error('Error fetching sls list:', error);
            setSlsList([]);
        } finally {
            setLoadingWilayah(false);
        }
    };

    const fetchLocationStats = async () => {
        if (!selectedSurvei || !selectedPml) {
            setLocationStats(null);
            return;
        }

        setLoadingLocationStats(true);
        const params = new URLSearchParams({
            survei_id: selectedSurvei,
            pml_id: selectedPml,
        });

        if (selectedKecamatan) params.set('kecamatan_id', selectedKecamatan);
        if (selectedDesa) params.set('desa_id', selectedDesa);
        if (selectedSls) params.set('sls_id', selectedSls);

        try {
            const response = await fetch(`/api/dashboard/stats-by-location?${params.toString()}`);
            const data = await response.json();
            setLocationStats(data);
        } catch (error) {
            console.error('Error fetching location stats:', error);
            setLocationStats(null);
        } finally {
            setLoadingLocationStats(false);
        }
    };

    useEffect(() => {
        fetchKecamatanList();
    }, []);

    useEffect(() => {
        if (selectedKecamatan) {
            setSelectedDesa(null);
            setSelectedSls(null);
            setDesaList([]);
            setSlsList([]);
            fetchDesaList(selectedKecamatan);
        } else {
            setDesaList([]);
            setSelectedDesa(null);
            setSlsList([]);
            setSelectedSls(null);
        }
    }, [selectedKecamatan]);

    useEffect(() => {
        if (selectedDesa) {
            setSelectedSls(null);
            setSlsList([]);
            fetchSlsList(selectedDesa);
        } else {
            setSlsList([]);
            setSelectedSls(null);
        }
    }, [selectedDesa]);

    useEffect(() => {
        fetchLocationStats();
    }, [selectedSurvei, selectedPml, selectedKecamatan, selectedDesa, selectedSls]);

    const adminStats = [
        {
            label: 'Total PML',
            value: displayStats?.total_pml,
            color: 'blue',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
        {
            label: 'Total PCL',
            value: displayStats?.total_pcl,
            color: 'green',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
        {
            label: 'Total Survei',
            value: displayStats?.total_survei,
            color: 'purple',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
        },
       
    ];

    const pmlStats = [
        { label: 'Total PCL Saya', value: displayStats?.total_pcl, color: 'green', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        { label: 'Total Survei Saya', value: displayStats?.total_survei, color: 'purple', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
        { label: 'Total Laporan', value: displayStats?.total_laporan, color: 'orange', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    ];

    const pclStats = [
        { label: 'Total Laporan Saya', value: stats?.total_laporan, color: 'blue', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { label: 'Laporan Tersubmit', value: stats?.laporan_submit, color: 'green', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    ];

    const statCards = role === 'admin' ? adminStats : role === 'PML' ? pmlStats : pclStats;

    const roleLabels = { admin: 'Administrator', PML: 'Petugas Manajemen Lapangan', PCL: 'Petugas Cacah Lapangan' };

    const totalDataUsahaByFilter = displayStats?.total_data_usaha ?? pclChartData.reduce((sum, pcl) => sum + (pcl.data_usaha || 0), 0);
    const totalDataKeluargaByFilter = displayStats?.total_data_keluarga ?? pclChartData.reduce((sum, pcl) => sum + (pcl.data_keluarga || 0), 0);
    const totalDataCacahByFilter = displayStats?.total_data_cacah ?? pclChartData.reduce((sum, pcl) => sum + (pcl.data_cacah || 0), 0);
    const totalDataSubmitByFilter = displayStats?.total_data_submit ?? pclChartData.reduce((sum, pcl) => sum + (pcl.data_submit || 0), 0);
    const totalLaporanByFilter = displayStats?.total_laporan ?? pclChartData.reduce((sum, pcl) => sum + (pcl.laporan_count || 0), 0);

    // Komponen untuk menampilkan chart PCL
    function PclChart({ pcl }) {
        const data = [
            {
                name: 'Data Usaha',
                value: pcl.data_usaha || 0,
                color: '#3B82F6',
                label: 'Data Usaha'
            },
            {
                name: 'Data Keluarga',
                value: pcl.data_keluarga || 0,
                color: '#10B981',
                label: 'Data Keluarga'
            },
            {
                name: 'Data Cacah',
                value: pcl.data_cacah || 0,
                color: '#6366F1',
                label: 'Data Cacah'
            },
            {
                name: 'Data Submit',
                value: pcl.data_submit || 0,
                color: '#F59E0B',
                label: 'Laporan Tersubmit'
            }
        ];

        return (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">PCL {pcl.nama_pcl}</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {statCards.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* Filter Section untuk Per Survei & PML */}
            {(role === 'admin' || role === 'PML') && surveis && surveis.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Data Per Survei dan PML</h3>
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

                        {/* Filter PML */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih PML</label>
                            <select
                                value={selectedPml || ''}
                                onChange={(e) => setSelectedPml(e.target.value ? parseInt(e.target.value) : null)}
                                disabled={!selectedSurvei || pmlOptions.length === 0}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!selectedSurvei || pmlOptions.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">-- Pilih PML --</option>
                                {pmlOptions.map((pml) => (
                                    <option key={pml.id} value={pml.id}>
                                        {pml.nama_pml}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kecamatan</label>
                            <select
                                value={selectedKecamatan || ''}
                                onChange={(e) => setSelectedKecamatan(e.target.value ? parseInt(e.target.value) : null)}
                                disabled={!selectedSurvei || !selectedPml || loadingWilayah}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!selectedSurvei || !selectedPml || loadingWilayah ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">-- Pilih Kecamatan --</option>
                                {kecamatanList.map((kecamatan) => (
                                    <option key={kecamatan.id} value={kecamatan.id}>
                                        {kecamatan.nama}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Desa</label>
                            <select
                                value={selectedDesa || ''}
                                onChange={(e) => setSelectedDesa(e.target.value ? parseInt(e.target.value) : null)}
                                disabled={!selectedKecamatan || loadingWilayah}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!selectedKecamatan || loadingWilayah ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">-- Pilih Desa --</option>
                                {desaList.map((desa) => (
                                    <option key={desa.id} value={desa.id}>
                                        {desa.nama}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih SLS</label>
                            <select
                                value={selectedSls || ''}
                                onChange={(e) => setSelectedSls(e.target.value ? parseInt(e.target.value) : null)}
                                disabled={!selectedDesa || loadingWilayah}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!selectedDesa || loadingWilayah ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">-- Pilih SLS --</option>
                                {slsList.map((sls) => (
                                    <option key={sls.id} value={sls.id}>
                                        {sls.nomor_sls}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Per Survei & PML */}
            {(role === 'admin' || role === 'PML') && selectedSurvei && selectedPml && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-600 mb-2">Total Data Usaha</p>
                            <p className="text-3xl font-bold text-blue-600">{totalDataUsahaByFilter.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-600 mb-2">Total Data Keluarga</p>
                            <p className="text-3xl font-bold text-green-600">{totalDataKeluargaByFilter.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-600 mb-2">Total Data Cacah</p>
                            <p className="text-3xl font-bold text-indigo-600">{totalDataCacahByFilter.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-600 mb-2">Total Data Submit</p>
                            <p className="text-3xl font-bold text-orange-600">{totalDataSubmitByFilter.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-600 mb-2">Total Laporan</p>
                            <p className="text-3xl font-bold text-purple-600">{totalLaporanByFilter.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div className="mb-6">
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mt-1">Menampilkan data usaha, data keluarga, dan data submit untuk setiap PCL yang bertanggung jawab terhadap PML yang dipilih</p>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-100">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Memuat data...</p>
                                </div>
                            </div>
                        ) : pclChartData.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {pclChartData.map((pcl) => (
                                    <PclChart key={pcl.id} pcl={pcl} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                                <p className="text-yellow-800">PML yang dipilih tidak memiliki PCL atau laporan pada survei ini.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Pesan ketika belum memilih survei */}
            {(role === 'admin' || role === 'PML') && !selectedSurvei && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <p className="text-blue-800">Silahkan pilih survei terlebih dahulu untuk melihat data per PML dan PCL.</p>
                </div>
            )}

            {/* Pesan ketika survei dipilih tapi PML tidak ada */}
            {(role === 'admin' || role === 'PML') && selectedSurvei && pmlOptions.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                    <p className="text-yellow-800">Survei yang dipilih tidak memiliki data PML atau laporan.</p>
                </div>
            )}
        </MainLayout>
    );
}
