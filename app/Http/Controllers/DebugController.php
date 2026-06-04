<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Laporan;

class DebugController extends Controller
{
    /**
     * Debug relasi user-pcl dan data laporan
     * Akses: /debug-pcl-laporan
     */
    public function debugPclLaporan()
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'PCL') {
            return response()->json(['error' => 'Hanya PCL yang bisa akses halaman ini'], 403);
        }

        $debugData = [
            'user_info' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'pcl_relation' => [
                'pcl_exists' => (bool) $user->pcl,
                'pcl_id' => $user->pcl?->id,
                'pcl_nama' => $user->pcl?->nama_pcl,
            ],
            'laporan_count' => [
                'total_di_db' => Laporan::count(),
                'milik_pcl_ini' => Laporan::where('pcl_id', $user->pcl?->id)->count(),
                'dengan_pcl_id_null' => Laporan::whereNull('pcl_id')->count(),
            ],
            'laporan_terakhir_5' => Laporan::where('pcl_id', $user->pcl?->id ?? -1)
                ->latest('created_at')
                ->limit(5)
                ->get(['id', 'survei_id', 'pcl_id', 'tanggal', 'created_at'])
                ->toArray(),
            'raw_sql_check' => [
                'user_pcl_table' => DB::table('pcl')->where('user_id', $user->id)->first(),
                'laporan_null_check' => DB::table('laporan')->whereNull('pcl_id')->limit(3)->get(),
            ],
        ];

        return response()->json($debugData, 200);
    }

    /**
     * List semua laporan dengan pcl info (untuk admin debug)
     * Akses: /debug-all-laporan
     */
    public function debugAllLaporan()
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'admin') {
            return response()->json(['error' => 'Hanya admin yang bisa akses'], 403);
        }

        $laporans = Laporan::with(['pcl', 'survei'])
            ->latest('created_at')
            ->limit(20)
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'pcl_id' => $l->pcl_id,
                'pcl_nama' => $l->pcl?->nama_pcl ?? '(null)',
                'survei_id' => $l->survei_id,
                'survei_nama' => $l->survei?->nama_survei ?? '(null)',
                'tanggal' => $l->tanggal,
                'created_at' => $l->created_at,
            ]);

        return response()->json(['laporan' => $laporans], 200);
    }
}
