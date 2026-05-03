import Sidebar from '../Components/Sidebar';
import Alert from '../Components/Alert';

export default function Dashboard({ stats, role }) {
    const statCards = {
        admin: [
            { label: 'Total PML', value: stats.total_pml, icon: '👤', color: 'bg-blue-500' },
            { label: 'Total PCL', value: stats.total_pcl, icon: '👥', color: 'bg-green-500' },
            { label: 'Total Survei', value: stats.total_survei, icon: '📋', color: 'bg-yellow-500' },
            { label: 'Total Laporan', value: stats.total_laporan, icon: '📄', color: 'bg-purple-500' },
        ],
        PML: [
            { label: 'PCL Saya', value: stats.total_pcl, icon: '👥', color: 'bg-blue-500' },
            { label: 'Survei Saya', value: stats.total_survei, icon: '📋', color: 'bg-green-500' },
            { label: 'Total Laporan', value: stats.total_laporan, icon: '📄', color: 'bg-yellow-500' },
        ],
        PCL: [
            { label: 'Total Laporan', value: stats.total_laporan, icon: '📄', color: 'bg-blue-500' },
            { label: 'Laporan Submit', value: stats.laporan_submit, icon: '✅', color: 'bg-green-500' },
        ],
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-8">
                <Alert />
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                    <p className="text-gray-500 text-sm mt-1">Selamat datang di Sistem Monitoring</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {(statCards[role] || []).map((card, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
                            <div className={`${card.color} text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center`}>
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">{card.label}</p>
                                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}