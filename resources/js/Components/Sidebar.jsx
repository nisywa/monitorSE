import { Link, usePage } from '@inertiajs/react';

export default function Sidebar() {
    const { auth } = usePage().props;
    const role = auth.user.role;
    const currentUrl = window.location.pathname;

    const linkClass = (path) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
            currentUrl.startsWith(path)
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-100 hover:bg-blue-700'
        }`;

    return (
        <aside className="w-64 min-h-screen bg-blue-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-blue-700">
                <h1 className="text-white text-xl font-bold">📊 Monitoring</h1>
                <p className="text-blue-300 text-xs mt-1">Sistem Pengawasan</p>
            </div>

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-1">
                {role === 'admin' && (
                    <>
                        <Link href="/manajemen-survei" className={linkClass('/manajemen-survei')}>
                            📋 Manajemen Survei
                        </Link>
                        <Link href="/manajemen-pml" className={linkClass('/manajemen-pml')}>
                            👤 Manajemen PML
                        </Link>
                        <Link href="/manajemen-pcl" className={linkClass('/manajemen-pcl')}>
                            👥 Manajemen PCL
                        </Link>
                        <Link href="/laporan" className={linkClass('/laporan')}>
                            📄 List Laporan
                        </Link>
                    </>
                )}

                {(role === 'PML' || role === 'PCL') && (
                    <Link href="/laporan" className={linkClass('/laporan')}>
                        📄 Laporan
                    </Link>
                )}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-blue-700">
                <p className="text-white text-sm font-medium">{auth.user.nama}</p>
                <p className="text-blue-300 text-xs">{role}</p>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="mt-2 text-xs text-red-300 hover:text-red-100 transition"
                >
                    → Logout
                </Link>
            </div>
        </aside>
    );
}