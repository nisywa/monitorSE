<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Pml;
use App\Models\Pcl;
use App\Models\Survei;
use App\Models\Laporan;
use App\Models\Kecamatan;
use App\Models\Desa;
use App\Models\Sls;

class DashboardController extends Controller
{
    /**
     * Tampilkan dashboard berdasarkan role user
     */
    public function index()
    {
        $user = Auth::user();
        $stats = [];
        $surveis = [];
        $pmlsBySurvei = [];

        if ($user->role === 'admin') {
            $stats = [
                'total_pml'     => Pml::count(),
                'total_pcl'     => Pcl::count(),
                'total_survei'  => Survei::count(),
                'total_laporan' => Laporan::count(),
            ];
            
            // Data untuk chart: akumulasi dari semua laporan
            $chartData = [
                'data_usaha' => Laporan::sum('data_usaha'),
                'data_keluarga' => Laporan::sum('data_keluarga'),
                'data_submit' => Laporan::sum('data_submit'),
            ];

            // Ambil semua survei untuk dropdown
            $surveis = Survei::select('id', 'nama_survei')->get();
            
            // Ambil PML untuk setiap survei
            foreach ($surveis as $survei) {
                $pmlsBySurvei[$survei->id] = $survei->pmls()->select('pml.id', 'pml.nama_pml')->get();
            }
        } elseif ($user->role === 'PML') {
            $pml = $user->pml;
            // Hitung PCL yang terhubung dengan PML ini melalui relasi many-to-many
            $totalPcl = $pml->pcls()->count();
            // Hitung survei yang terhubung dengan PML ini melalui relasi many-to-many
            $totalSurvei = $pml->surveis()->count();
            // Hitung laporan milik PML ini
            $totalLaporan = Laporan::where('pml_id', $pml->id)->count();
            
            $stats = [
                'total_pcl'     => $totalPcl,
                'total_survei'  => $totalSurvei,
                'total_laporan' => $totalLaporan,
            ];
            
            // Data untuk chart: akumulasi dari laporan PML ini
            $chartData = [
                'data_usaha' => Laporan::where('pml_id', $pml->id)->sum('data_usaha'),
                'data_keluarga' => Laporan::where('pml_id', $pml->id)->sum('data_keluarga'),
                'data_submit' => Laporan::where('pml_id', $pml->id)->sum('data_submit'),
            ];

            // Ambil survei yang terhubung dengan PML ini
            $surveis = $pml->surveis()->select('survei.id', 'survei.nama_survei')->get();
            
            // Ambil PML hanya diri sendiri untuk setiap survei
            foreach ($surveis as $survei) {
                $pmlsBySurvei[$survei->id] = collect([$pml->only(['id', 'nama_pml'])]);
            }
        } elseif ($user->role === 'PCL') {
            $pcl = $user->pcl;
            $stats = [
                'total_laporan'  => Laporan::where('pcl_id', $pcl->id)->count(),
                'laporan_submit' => Laporan::where('pcl_id', $pcl->id)->sum('data_submit'),
            ];
            
            // Data untuk chart: akumulasi dari laporan PCL ini
            $chartData = [
                'data_usaha' => Laporan::where('pcl_id', $pcl->id)->sum('data_usaha'),
                'data_keluarga' => Laporan::where('pcl_id', $pcl->id)->sum('data_keluarga'),
                'data_submit' => Laporan::where('pcl_id', $pcl->id)->sum('data_submit'),
            ];
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'role'  => $user->role,
            'surveis' => $surveis,
            'pmlsBySurvei' => $pmlsBySurvei,
        ]);
    }

    /**
     * Ambil data laporan berdasarkan survei dan PCL yang dipilih
     */
    public function getChartData(Request $request)
    {
        $user = Auth::user();
        $surveiId = $request->query('survei_id');
        $pclId = $request->query('pcl_id');

        if (!$surveiId || !$pclId) {
            return response()->json([
                'data_usaha' => 0,
                'data_keluarga' => 0,
                'data_submit' => 0,
                'pcl_name' => 'N/A'
            ]);
        }

        // Validasi akses dan hitung akumulasi laporan
        $laporanQuery = Laporan::where('survei_id', $surveiId)
            ->where('pcl_id', $pclId);

        if ($user->role === 'PML') {
            $pml = $user->pml;
            // Validasi: PML harus memiliki akses ke survei ini
            $hasSurveiAccess = $pml->surveis()->where('survei_id', $surveiId)->exists();
            
            if (!$hasSurveiAccess) {
                return response()->json([
                    'data_usaha' => 0,
                    'data_keluarga' => 0,
                    'data_submit' => 0,
                    'pcl_name' => 'N/A'
                ]);
            }

            $laporanQuery->where('pml_id', $pml->id);
        }

        if ($user->role === 'PCL') {
            $pcl = $user->pcl;
            if ($pcl->id !== (int) $pclId) {
                return response()->json([
                    'data_usaha' => 0,
                    'data_keluarga' => 0,
                    'data_submit' => 0,
                    'pcl_name' => 'N/A'
                ]);
            }
        }

        // Cek apakah ada laporan untuk survei dan PCL ini
        $hasLaporan = $laporanQuery->exists();
        if (!$hasLaporan) {
            return response()->json([
                'data_usaha' => 0,
                'data_keluarga' => 0,
                'data_submit' => 0,
                'pcl_name' => 'N/A'
            ]);
        }

        $dataUsaha = $laporanQuery->sum('data_usaha');
        $dataKeluarga = $laporanQuery->sum('data_keluarga');
        $dataSubmit = $laporanQuery->sum('data_submit');

        $pcl = Pcl::find($pclId);
        return response()->json([
            'data_usaha' => $dataUsaha,
            'data_keluarga' => $dataKeluarga,
            'data_submit' => $dataSubmit,
            'pcl_name' => $pcl->nama_pcl ?? 'N/A'
        ]);
    }

    /**
     * Ambil data laporan untuk semua PCL yang terhubung dengan PML pada survei tertentu
     */
    public function getChartDataByPml(Request $request)
    {
        $user = Auth::user();
        $surveiId = $request->query('survei_id');
        $pmlId = $request->query('pml_id');

        if (!$surveiId || !$pmlId) {
            return response()->json([
                'pcls' => []
            ]);
        }

        // Validasi akses
        if ($user->role === 'PML') {
            $pml = $user->pml;
            if ((int)$pmlId !== $pml->id) {
                return response()->json([
                    'pcls' => []
                ]);
            }
            // Validasi: PML harus memiliki akses ke survei ini
            $hasSurveiAccess = $pml->surveis()->where('survei_id', $surveiId)->exists();
            if (!$hasSurveiAccess) {
                return response()->json([
                    'pcls' => []
                ]);
            }
        }

        // Ambil PML
        $pml = Pml::find($pmlId);
        if (!$pml) {
            return response()->json([
                'pcls' => []
            ]);
        }

        // Ambil semua PCL yang terhubung dengan PML ini melalui relasi many-to-many
        $kecamatanId = $request->query('kecamatan_id');
        $desaId = $request->query('desa_id');
        $kecamatanName = $kecamatanId ? Kecamatan::where('id', $kecamatanId)->value('nama') : null;
        $desaName = $desaId ? Desa::where('id', $desaId)->value('nama') : null;

        $pcls = $pml->pcls()
            ->select('pcl.id', 'pcl.nama_pcl', 'pcl.asal_kecamatan', 'pcl.desa', 'pcl.sls')
            ->whereHas('surveis', function ($query) use ($surveiId) {
                $query->where('survei.id', $surveiId);
            })
            ->when($kecamatanName, function ($query) use ($kecamatanName) {
                $query->whereRaw('LOWER(TRIM(asal_kecamatan)) = ?', [
                    $this->normalizeAssignmentValue($kecamatanName),
                ]);
            })
            ->when($desaName, function ($query) use ($desaName) {
                $query->whereRaw('LOWER(TRIM(desa)) = ?', [
                    $this->normalizeAssignmentValue($desaName),
                ]);
            })
            ->get();

        $hasAssignedSlsByPclAndDesa = $pcls
            ->filter(fn ($pcl) => $this->hasText($pcl->sls ?? null))
            ->groupBy(fn ($pcl) => $this->assignmentChartKey($pcl));

        // Untuk setiap PCL, hitung akumulasi laporan di survei dan PML ini
        $result = [];

        foreach ($pcls as $pcl) {
            if (!$this->hasText($pcl->sls ?? null) && $hasAssignedSlsByPclAndDesa->has($this->assignmentChartKey($pcl))) {
                continue;
            }

            $laporanQuery = Laporan::where('survei_id', $surveiId)
                ->where('pml_id', $pmlId)
                ->where('pcl_id', $pcl->id);

            if ($kecamatanId) {
                $laporanQuery->where('kecamatan_id', $kecamatanId);
            }
            if ($desaId) {
                $laporanQuery->where('desa_id', $desaId);
            }

            $locationLaporan = (clone $laporanQuery)
                ->with(['desa:id,nama', 'sls:id,nomor_sls'])
                ->latest('tanggal')
                ->first();
            $slsLabel = $this->resolvePclSlsLabel($pcl, (clone $laporanQuery), $surveiId, $pmlId, $desaId);

            $result[] = [
                'id' => $pcl->id,
                'nama_pcl' => $pcl->nama_pcl,
                'nama_desa' => $locationLaporan?->desa?->nama ?? $desaName ?? $pcl->desa ?? '-',
                'nomor_sls' => $slsLabel,
                'data_usaha' => $laporanQuery->sum('data_usaha'),
                'data_keluarga' => $laporanQuery->sum('data_keluarga'),
                'data_cacah' => $laporanQuery->sum('data_cacah'),
                'data_submit' => $laporanQuery->sum('data_submit'),
                'laporan_count' => $laporanQuery->count(),
            ];
        }

        return response()->json([
            'pcls' => $result,
        ]);
    }

    public function getFilterOptions(Request $request)
    {
        $user = Auth::user();
        $surveiId = $request->query('survei_id');
        $kecamatanId = $request->query('kecamatan_id');
        $pmlId = $request->query('pml_id');
        $desaId = $request->query('desa_id');

        $options = [
            'kecamatan' => collect(),
            'pml' => collect(),
            'desa' => collect(),
            'sls' => collect(),
        ];

        if (!$surveiId) {
            return response()->json($options);
        }

        if ($user->role === 'PML') {
            $loggedInPml = $user->pml;
            if (!$loggedInPml || !$loggedInPml->surveis()->where('survei.id', $surveiId)->exists()) {
                return response()->json($options);
            }
        }

        $kecamatanNames = Pcl::whereHas('surveis', function ($query) use ($surveiId) {
                $query->where('survei.id', $surveiId);
            })
            ->when($user->role === 'PML', function ($query) use ($user) {
                $query->whereHas('pmls', function ($query) use ($user) {
                    $query->where('pml.id', $user->pml?->id);
                });
            })
            ->pluck('asal_kecamatan')
            ->map(fn ($name) => $this->normalizeAssignmentValue($name))
            ->filter()
            ->unique()
            ->values();

        $options['kecamatan'] = Kecamatan::where('kabupaten', 'Pinrang')
            ->where('provinsi', 'Sulawesi Selatan')
            ->when($kecamatanNames->isNotEmpty(), function ($query) use ($kecamatanNames) {
                $query->whereIn(DB::raw('LOWER(TRIM(nama))'), $kecamatanNames->all());
            })
            ->orderBy('nama')
            ->get(['id', 'nama']);

        if ($kecamatanId) {
            $selectedKecamatanName = Kecamatan::where('id', $kecamatanId)->value('nama');

            $options['pml'] = Pml::select('pml.id', 'pml.nama_pml')
                ->whereHas('surveis', function ($query) use ($surveiId) {
                    $query->where('survei.id', $surveiId);
                })
                ->whereHas('pcls', function ($query) use ($surveiId, $selectedKecamatanName) {
                    $query->whereHas('surveis', function ($query) use ($surveiId) {
                        $query->where('survei.id', $surveiId);
                    });

                    if ($selectedKecamatanName) {
                        $query->whereRaw('LOWER(TRIM(asal_kecamatan)) = ?', [
                            $this->normalizeAssignmentValue($selectedKecamatanName),
                        ]);
                    }
                })
                ->when($user->role === 'PML', function ($query) use ($user) {
                    $query->where('pml.id', $user->pml?->id);
                })
                ->orderBy('pml.nama_pml')
                ->distinct()
                ->get()
                ->map(fn ($pml) => [
                    'id' => $pml->id,
                    'nama_pml' => $pml->nama_pml,
                ]);
        }

        if ($kecamatanId && $pmlId) {
            $selectedKecamatanName = Kecamatan::where('id', $kecamatanId)->value('nama');
            $desaNames = Pcl::whereHas('surveis', function ($query) use ($surveiId) {
                    $query->where('survei.id', $surveiId);
                })
                ->whereHas('pmls', function ($query) use ($pmlId) {
                    $query->where('pml.id', $pmlId);
                })
                ->when($selectedKecamatanName, function ($query) use ($selectedKecamatanName) {
                    $query->whereRaw('LOWER(TRIM(asal_kecamatan)) = ?', [
                        $this->normalizeAssignmentValue($selectedKecamatanName),
                    ]);
                })
                ->pluck('desa')
                ->map(fn ($name) => $this->normalizeAssignmentValue($name))
                ->filter()
                ->unique()
                ->values();

            $options['desa'] = Desa::where('kecamatan_id', $kecamatanId)
                ->when($desaNames->isNotEmpty(), function ($query) use ($desaNames) {
                    $query->whereIn(DB::raw('LOWER(TRIM(nama))'), $desaNames->all());
                })
                ->orderBy('nama')
                ->get(['id', 'nama']);
        }

        if ($kecamatanId && $pmlId && $desaId) {
            $selectedDesaName = Desa::where('id', $desaId)->value('nama');
            $slsNumbers = Pcl::whereHas('surveis', function ($query) use ($surveiId) {
                    $query->where('survei.id', $surveiId);
                })
                ->whereHas('pmls', function ($query) use ($pmlId) {
                    $query->where('pml.id', $pmlId);
                })
                ->when($selectedDesaName, function ($query) use ($selectedDesaName) {
                    $query->whereRaw('LOWER(TRIM(desa)) = ?', [
                        $this->normalizeAssignmentValue($selectedDesaName),
                    ]);
                })
                ->pluck('sls')
                ->map(fn ($number) => $this->normalizeAssignmentValue($number))
                ->filter()
                ->unique()
                ->values();

            $options['sls'] = Sls::where('desa_id', $desaId)
                ->when($slsNumbers->isNotEmpty(), function ($query) use ($slsNumbers) {
                    $query->whereIn(DB::raw('LOWER(TRIM(nomor_sls))'), $slsNumbers->all());
                })
                ->orderBy('nomor_sls')
                ->get(['id', 'nomor_sls']);
        }

        return response()->json($options);
    }

    /**
     * Ambil statistik lokasi untuk Survei dan PML tertentu
     */
    public function getStatsByLocation(Request $request)
    {
        $user = Auth::user();
        $surveiId = $request->query('survei_id');
        $pmlId = $request->query('pml_id');

        if (!$surveiId || !$pmlId) {
            return response()->json([
                'total_pml' => 0,
                'total_pcl' => 0,
                'total_survei' => 0,
                'total_laporan' => 0,
                'total_data_usaha' => 0,
                'total_data_keluarga' => 0,
                'total_data_cacah' => 0,
                'total_data_submit' => 0,
            ]);
        }

        if ($user->role === 'PML') {
            $pml = $user->pml;
            if (!$pml || (int) $pmlId !== $pml->id) {
                return response()->json([
                    'total_pml' => 0,
                    'total_pcl' => 0,
                    'total_survei' => 0,
                    'total_laporan' => 0,
                    'total_data_usaha' => 0,
                    'total_data_keluarga' => 0,
                    'total_data_cacah' => 0,
                    'total_data_submit' => 0,
                ]);
            }
        }

        $query = Laporan::where('survei_id', $surveiId)
            ->where('pml_id', $pmlId);

        if ($request->query('kecamatan_id')) {
            $query->where('kecamatan_id', $request->query('kecamatan_id'));
        }
        if ($request->query('desa_id')) {
            $query->where('desa_id', $request->query('desa_id'));
        }
        if ($request->query('sls_id')) {
            $query->where('sls_id', $request->query('sls_id'));
        }

        $totalLaporan = $query->count();
        $totalPml = (clone $query)->distinct()->count('pml_id');
        $totalPcl = (clone $query)->distinct()->count('pcl_id');
        $totalSurvei = (clone $query)->distinct()->count('survei_id');
        $totalDataUsaha = (clone $query)->sum('data_usaha');
        $totalDataKeluarga = (clone $query)->sum('data_keluarga');
        $totalDataCacah = (clone $query)->sum('data_cacah');
        $totalDataSubmit = (clone $query)->sum('data_submit');

        return response()->json([
            'total_pml' => $totalPml,
            'total_pcl' => $totalPcl,
            'total_survei' => $totalSurvei,
            'total_laporan' => $totalLaporan,
            'total_data_usaha' => $totalDataUsaha,
            'total_data_keluarga' => $totalDataKeluarga,
            'total_data_cacah' => $totalDataCacah,
            'total_data_submit' => $totalDataSubmit,
        ]);
    }

    private function normalizeAssignmentValue($value): string
    {
        return strtolower(trim((string) $value));
    }

    private function resolvePclSlsLabel($pcl, $laporanQuery, $surveiId, $pmlId, $desaId = null): string
    {
        $laporanSls = (clone $laporanQuery)
            ->with('sls:id,nomor_sls')
            ->whereNotNull('nomor_sls')
            ->get()
            ->map(fn ($laporan) => $laporan->nomor_sls ?: $laporan->sls?->nomor_sls)
            ->filter()
            ->unique()
            ->values();

        if ($laporanSls->isEmpty()) {
            $laporanSls = (clone $laporanQuery)
                ->with('sls:id,nomor_sls')
                ->whereNotNull('sls_id')
                ->get()
                ->map(fn ($laporan) => $laporan->sls?->nomor_sls)
                ->map(fn ($sls) => trim((string) $sls))
                ->filter()
                ->unique()
                ->values();
        }

        if ($laporanSls->isNotEmpty()) {
            return $laporanSls->join(', ');
        }

        if ($this->hasText($pcl->sls ?? null)) {
            return trim((string) $pcl->sls);
        }

        if ($desaId) {
            $matchingMasterSls = Sls::where('id', $pcl->id)
                ->where('desa_id', $desaId)
                ->value('nomor_sls');

            if ($this->hasText($matchingMasterSls)) {
                return trim((string) $matchingMasterSls);
            }
        }

        $slsFromSiblingAssignments = Pcl::where('nama_pcl', $pcl->nama_pcl)
            ->whereHas('surveis', function ($query) use ($surveiId) {
                $query->where('survei.id', $surveiId);
            })
            ->whereHas('pmls', function ($query) use ($pmlId) {
                $query->where('pml.id', $pmlId);
            })
            ->when($this->hasText($pcl->desa ?? null), function ($query) use ($pcl) {
                $query->whereRaw('LOWER(TRIM(desa)) = ?', [
                    $this->normalizeAssignmentValue($pcl->desa),
                ]);
            })
            ->whereNotNull('sls')
            ->pluck('sls')
            ->map(fn ($sls) => trim((string) $sls))
            ->filter()
            ->unique()
            ->values();

        if ($slsFromSiblingAssignments->count() === 1) {
            return $slsFromSiblingAssignments->first();
        }

        return '-';
    }

    private function assignmentChartKey($pcl): string
    {
        return implode('|', [
            $this->normalizeAssignmentValue($pcl->nama_pcl ?? ''),
            $this->normalizeAssignmentValue($pcl->desa ?? ''),
        ]);
    }

    private function hasText($value): bool
    {
        return trim((string) $value) !== '';
    }
}
