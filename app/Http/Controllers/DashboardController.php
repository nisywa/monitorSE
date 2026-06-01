<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Pml;
use App\Models\Pcl;
use App\Models\Survei;
use App\Models\Laporan;

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
        $pcls = $pml->pcls()
            ->select('pcl.id', 'pcl.nama_pcl')
            ->get();

        // Untuk setiap PCL, hitung akumulasi laporan di survei dan PML ini
        $result = [];
        $kecamatanId = $request->query('kecamatan_id');
        $desaId = $request->query('desa_id');
        $slsId = $request->query('sls_id');

        foreach ($pcls as $pcl) {
            $laporanQuery = Laporan::where('survei_id', $surveiId)
                ->where('pml_id', $pmlId)
                ->where('pcl_id', $pcl->id);

            if ($kecamatanId) {
                $laporanQuery->where('kecamatan_id', $kecamatanId);
            }
            if ($desaId) {
                $laporanQuery->where('desa_id', $desaId);
            }
            if ($slsId) {
                $laporanQuery->where('sls_id', $slsId);
            }

            $result[] = [
                'id' => $pcl->id,
                'nama_pcl' => $pcl->nama_pcl,
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
}
