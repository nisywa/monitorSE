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
        $pclsBySurvei = [];

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
            
            // Ambil PCL untuk setiap survei
            foreach ($surveis as $survei) {
                $pclsBySurvei[$survei->id] = $survei->pcls()->select('pcl.id', 'pcl.nama_pcl')->get();
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
            
            // Ambil PCL untuk setiap survei
            foreach ($surveis as $survei) {
                $pclsBySurvei[$survei->id] = $survei->pcls()->select('pcl.id', 'pcl.nama_pcl')->get();
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
            'pclsBySurvei' => $pclsBySurvei,
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
}
