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

        if ($user->role === 'admin') {
            $stats = [
                'total_pml'     => Pml::count(),
                'total_pcl'     => Pcl::count(),
                'total_survei'  => Survei::count(),
                'total_laporan' => Laporan::count(),
            ];
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
        } elseif ($user->role === 'PCL') {
            $pcl = $user->pcl;
            $stats = [
                'total_laporan'  => Laporan::where('pcl_id', $pcl->id)->count(),
                'laporan_submit' => Laporan::where('pcl_id', $pcl->id)->where('data_submit', true)->count(),
            ];
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'role'  => $user->role,
        ]);
    }
}
