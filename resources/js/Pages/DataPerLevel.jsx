import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';

export default function DataPerLevel({ surveis, laporans, filterOptions, selectedSurvei, selectedKecamatan, selectedPml, selectedDesa, selectedSls, selectedTanggal }) {
    const [kecamatan, setKecamatan] = useState(selectedKecamatan ?? '');
    const [pml, setPml] = useState(selectedPml ?? '');
    const [desa, setDesa] = useState(selectedDesa ?? '');
    const [sls, setSls] = useState(selectedSls ?? '');
    const [tanggal, setTanggal] = useState(selectedTanggal ?? '');

    const kecamatanList = filterOptions?.kecamatan ?? [];
    const pmlList = filterOptions?.pml ?? [];
    const desaList = filterOptions?.desa ?? [];
    const slsList = filterOptions?.sls ?? [];

    useEffect(() => {
        setKecamatan(selectedKecamatan ?? '');
        setPml(selectedPml ?? '');
        setDesa(selectedDesa ?? '');
        setSls(selectedSls ?? '');
        setTanggal(selectedTanggal ?? '');
    }, [selectedKecamatan, selectedPml, selectedDesa, selectedSls, selectedTanggal]);

    const handleSurveiChange = (value) => {
        setKecamatan('');
        setPml('');
        setDesa('');
        setSls('');
        router.get('/data-per-level', {
            survei_id: value,
            tanggal: tanggal || undefined,
        });
    };

    const handleKecamatanChange = (value) => {
        setKecamatan(value);
        setPml('');
        setDesa('');
        setSls('');
        router.get('/data-per-level', {
            survei_id: selectedSurvei,
            kecamatan_id: value,
            pml_id: undefined,
            desa_id: undefined,
            sls_id: undefined,
            tanggal: tanggal || undefined,
        });
    };

    const handlePmlChange = (value) => {
        setPml(value);
        setDesa('');
        setSls('');
        router.get('/data-per-level', {
            survei_id: selectedSurvei,
            kecamatan_id: kecamatan,
            pml_id: value,
            desa_id: undefined,
            sls_id: undefined,
            tanggal: tanggal || undefined,
        });
    };

    const handleDesaChange = (value) => {
        setDesa(value);
        setSls('');
        router.get('/data-per-level', {
            survei_id: selectedSurvei,
            kecamatan_id: kecamatan,
            pml_id: pml,
            desa_id: value,
            sls_id: undefined,
            tanggal: tanggal || undefined,
        });
    };

    const handleSlsChange = (value) => {
        setSls(value);
        router.get('/data-per-level', {
            survei_id: selectedSurvei,
            kecamatan_id: kecamatan,
            pml_id: pml,
            desa_id: desa,
            sls_id: value,
            tanggal: tanggal || undefined,
        });
    };

    const handleTanggalChange = (value) => {
        setTanggal(value);
        router.get('/data-per-level', {
            survei_id: selectedSurvei,
            kecamatan_id: kecamatan || undefined,
            pml_id: pml || undefined,
            desa_id: desa || undefined,
            sls_id: sls || undefined,
            tanggal: value || undefined,
        });
    };

    const totalLaporan = laporans.length;
    const totalDataUsaha = laporans.reduce((sum, laporan) => sum + (Number(laporan.data_usaha) || 0), 0);
    const totalDataKeluarga = laporans.reduce((sum, laporan) => sum + (Number(laporan.data_keluarga) || 0), 0);
    const totalDataSubmit = laporans.reduce((sum, laporan) => sum + (Number(laporan.data_submit) || 0), 0);
    const totalDataCacah = laporans.reduce((sum, laporan) => sum + (Number(laporan.data_cacah) || 0), 0);

    return (
        <MainLayout title="Data per level">
            <Head title="Data per level" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Data per level</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Pilih survei terlebih dahulu untuk menampilkan daftar laporan PCL. Gunakan filter kecamatan, PML, desa, dan SLS untuk mempersempit hasil.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <div className="grid gap-4">
                    <div className="md:max-w-xl">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Survei</label>
                        <select
                            value={selectedSurvei || ''}
                            onChange={(e) => handleSurveiChange(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Pilih survei --</option>
                            {surveis.map((survei) => (
                                <option key={survei.id} value={survei.id}>{survei.nama_survei}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kecamatan</label>
                            <select
                                value={kecamatan || ''}
                                onChange={(e) => handleKecamatanChange(e.target.value)}
                                disabled={!selectedSurvei}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Semua Kecamatan</option>
                                {kecamatanList.map((kecamatanItem) => (
                                    <option key={kecamatanItem.id} value={kecamatanItem.id}>{kecamatanItem.nama}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">PML</label>
                            <select
                                value={pml || ''}
                                onChange={(e) => handlePmlChange(e.target.value)}
                                disabled={!kecamatan || !selectedSurvei}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Semua PML</option>
                                {pmlList.map((pmlItem) => (
                                    <option key={pmlItem.id} value={pmlItem.id}>{pmlItem.nama_pml}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Desa</label>
                            <select
                                value={desa || ''}
                                onChange={(e) => handleDesaChange(e.target.value)}
                                disabled={!pml || !kecamatan || !selectedSurvei}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Semua Desa</option>
                                {desaList.map((desaItem) => (
                                    <option key={desaItem.id} value={desaItem.id}>{desaItem.nama}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SLS</label>
                            <select
                                value={sls || ''}
                                onChange={(e) => handleSlsChange(e.target.value)}
                                disabled={!desa || !pml || !selectedSurvei}
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">Semua SLS</option>
                                {slsList.map((slsItem) => (
                                    <option key={slsItem.id} value={slsItem.id}>{slsItem.nomor_sls}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {!selectedSurvei ? (
                <div className="bg-white rounded-xl border border-gray-100 p-16 text-center text-gray-500">
                    Pilih survei terlebih dahulu untuk menampilkan data laporan.
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Survei terpilih: <span className="font-medium text-gray-800">{surveis.find((s) => String(s.id) === String(selectedSurvei))?.nama_survei || '-'}</span></p>
                        </div>
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                            <input
                                type="date"
                                value={tanggal}
                                onChange={(e) => handleTanggalChange(e.target.value)}
                                className="w-full md:w-56 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mb-4 text-sm text-gray-500">
                        {tanggal ? `Menampilkan laporan untuk tanggal ${tanggal}.` : 'Pilih tanggal untuk membatasi laporan per level.'}
                    </div>

                    <div className="grid gap-4 mb-6 md:grid-cols-5">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Total Laporan</p>
                            <p className="mt-3 text-2xl font-semibold text-blue-900">{totalLaporan}</p>
                        </div>
                        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Total Data Usaha</p>
                            <p className="mt-3 text-2xl font-semibold text-green-900">{totalDataUsaha}</p>
                        </div>
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Total Data Cacah</p>
                            <p className="mt-3 text-2xl font-semibold text-indigo-900">{totalDataCacah}</p>
                        </div>
                        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Total Data Keluarga</p>
                            <p className="mt-3 text-2xl font-semibold text-yellow-900">{totalDataKeluarga}</p>
                        </div>
                        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Total Data Submit</p>
                            <p className="mt-3 text-2xl font-semibold text-purple-900">{totalDataSubmit}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama PCL</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama PML</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kecamatan</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Desa</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SLS</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Usaha</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Cacah</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Keluarga</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Submit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {laporans.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="text-center py-12 text-gray-400">Tidak ada laporan untuk filter saat ini.</td>
                                    </tr>
                                ) : laporans.map((laporan, index) => (
                                    <tr key={laporan.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                                        <td className="px-4 py-3 text-gray-700">{laporan.nama_pcl}</td>
                                        <td className="px-4 py-3 text-gray-700">{laporan.nama_pml}</td>
                                        <td className="px-4 py-3 text-gray-600">{laporan.tanggal}</td>
                                        <td className="px-4 py-3 text-gray-600">{laporan.nama_kecamatan}</td>
                                        <td className="px-4 py-3 text-gray-600">{laporan.nama_desa}</td>
                                        <td className="px-4 py-3 text-gray-600">{laporan.nomor_sls}</td>
                                        <td className="px-4 py-3 text-gray-600">{laporan.data_usaha}</td>
                                        <td className="px-4 py-3 text-gray-600">{laporan.data_cacah ?? 0}</td>
                                        <td className="px-4 py-3 text-gray-600">{laporan.data_keluarga}</td>
                                        <td className="px-4 py-3 text-gray-600">{laporan.data_submit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
