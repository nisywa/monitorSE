<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Survei;
use App\Models\Pml;
use App\Models\Pcl;

class SurveiController extends Controller
{
    /**
     * Tampilkan list semua survei
     */
    public function index()
    {
        $surveis = Survei::with(['pmls', 'laporan'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($survei) {
                return [
                    'id'               => $survei->id,
                    'nama_survei'      => $survei->nama_survei,
                    'tanggal_mulai'    => $survei->tanggal_mulai,
                    'tanggal_selesai'  => $survei->tanggal_selesai,
                    'nama_PML'         => $survei->pmls->pluck('nama_pml')->join(', ') ?? '-',
                    'pml_ids'          => $survei->pmls->pluck('id')->toArray(),
                    'total_laporan'    => $survei->laporan->count(),
                    'status'           => $this->getStatus($survei->tanggal_mulai, $survei->tanggal_selesai),
                ];
            });

        // Daftar PML untuk checkbox
        $pmls = Pml::select('id', 'nama_pml')
            ->orderBy('nama_pml')
            ->get()
            ->map(function ($pml) {
                return [
                    'id'        => $pml->id,
                    'nama_PML'  => $pml->nama_pml,
                ];
            });

        return Inertia::render('Admin/ManajemenSurvei', [
            'surveis' => $surveis,
            'pmls'    => $pmls,
        ]);
    }

    /**
     * Simpan data survei baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_survei'     => 'required|string|max:255',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'pml_ids'         => 'required|array|min:1',
            'pml_ids.*'       => 'required|exists:pml,id',
        ], [
            'nama_survei.required'     => 'Nama survei wajib diisi.',
            'tanggal_mulai.required'   => 'Tanggal mulai wajib diisi.',
            'tanggal_selesai.required' => 'Tanggal selesai wajib diisi.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai.',
            'pml_ids.required'         => 'Pilih minimal satu PML.',
            'pml_ids.min'              => 'Pilih minimal satu PML.',
            'pml_ids.*'                => 'PML tidak ditemukan.',
        ]);

        $survei = Survei::create([
            'nama_survei'     => $request->nama_survei,
            'tanggal_mulai'   => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
        ]);

        // Attach PML yang dipilih ke survei
        $survei->pmls()->attach($request->pml_ids);

        return redirect()->back()->with('success', 'Survei berhasil ditambahkan.');
    }

    /**
     * Tampilkan halaman detail survei
     */
    public function detail($id)
    {
        $survei = Survei::findOrFail($id);
        $pmls = $survei->pmls()->get();
        
        // Ambil semua PCL yang dimiliki oleh PML yang ditugaskan ke survei
        $pmlIds = $pmls->pluck('id')->toArray();
        $pcls = Pcl::whereIn('pml_id', $pmlIds)
            ->with('user', 'pml')
            ->get();
        
        $laporan = $survei->laporan()->get();

        return Inertia::render('Admin/DetailSurvei', [
            'survei' => [
                'id' => $survei->id,
                'nama_survei' => $survei->nama_survei,
                'tanggal_mulai' => $survei->tanggal_mulai,
                'tanggal_selesai' => $survei->tanggal_selesai,
                'status' => $this->getStatus($survei->tanggal_mulai, $survei->tanggal_selesai),
            ],
            'pmls' => $pmls->map(fn($pml) => [
                'id' => $pml->id,
                'nama_pml' => $pml->nama_pml,
                'user' => [
                    'email' => $pml->user->email,
                ],
            ]),
            'pcls' => $pcls->map(fn($pcl) => [
                'id' => $pcl->id,
                'nama_pcl' => $pcl->nama_pcl,
                'pml_id' => $pcl->pml_id,
                'user' => [
                    'email' => $pcl->user->email,
                ],
                'pml' => [
                    'id' => $pcl->pml->id,
                    'nama_pml' => $pcl->pml->nama_pml,
                ],
            ]),
            'laporan' => $laporan->map(fn($lap) => [
                'id' => $lap->id,
                'created_at' => $lap->created_at,
                'jumlah_data' => $lap->jumlah_data ?? '-',
            ]),
        ]);
    }

    /**
     * Tampilkan data survei tertentu (untuk form edit - API)
     */
    public function show($id)
    {
        $survei = Survei::with('pmls')->findOrFail($id);

        return response()->json([
            'id'              => $survei->id,
            'nama_survei'     => $survei->nama_survei,
            'tanggal_mulai'   => $survei->tanggal_mulai,
            'tanggal_selesai' => $survei->tanggal_selesai,
            'pml_ids'         => $survei->pmls->pluck('id')->toArray(),
        ]);
    }

    /**
     * Update data survei
     */
    public function update(Request $request, $id)
    {
        $survei = Survei::findOrFail($id);

        $request->validate([
            'nama_survei'     => 'required|string|max:255',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'pml_ids'         => 'required|array|min:1',
            'pml_ids.*'       => 'required|exists:pml,id',
        ], [
            'nama_survei.required'     => 'Nama survei wajib diisi.',
            'tanggal_mulai.required'   => 'Tanggal mulai wajib diisi.',
            'tanggal_selesai.required' => 'Tanggal selesai wajib diisi.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai.',
            'pml_ids.required'         => 'Pilih minimal satu PML.',
            'pml_ids.min'              => 'Pilih minimal satu PML.',
            'pml_ids.*'                => 'PML tidak ditemukan.',
        ]);

        $survei->update([
            'nama_survei'     => $request->nama_survei,
            'tanggal_mulai'   => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
        ]);

        // Update PML yang dipilih (sync = replace)
        $survei->pmls()->sync($request->pml_ids);

        return redirect()->back()->with('success', 'Survei berhasil diperbarui.');
    }

    /**
     * Hapus data survei
     */
    public function destroy($id)
    {
        $survei = Survei::findOrFail($id);

        // Cek apakah ada laporan yang terkait
        if ($survei->laporan()->count() > 0) {
            return redirect()->back()->withErrors([
                'error' => 'Survei tidak bisa dihapus karena masih memiliki laporan terkait.'
            ]);
        }

        // Detach semua PML (karena Many-to-Many)
        $survei->pmls()->detach();
        
        $survei->delete();

        return redirect()->back()->with('success', 'Survei berhasil dihapus.');
    }

    /**
     * Tampilkan laporan PCL untuk survei tertentu
     */
    public function laporanPcl($surveiId, $pclId)
    {
        $survei = Survei::findOrFail($surveiId);
        $pcl = Pcl::with('user', 'pml')->findOrFail($pclId);
        
        // Ambil laporan PCL untuk survei ini
        $laporan = $pcl->laporan()
            ->where('survei_id', $surveiId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/LaporanPcl', [
            'survei' => [
                'id' => $survei->id,
                'nama_survei' => $survei->nama_survei,
            ],
            'pcl' => [
                'id' => $pcl->id,
                'nama_pcl' => $pcl->nama_pcl,
                'user' => [
                    'email' => $pcl->user->email,
                ],
                'pml' => [
                    'nama_pml' => $pcl->pml->nama_pml,
                ],
            ],
            'laporan' => $laporan->map(fn($lap) => [
                'id' => $lap->id,
                'created_at' => $lap->created_at,
                'jumlah_data' => $lap->jumlah_data ?? '-',
                'catatan' => $lap->catatan ?? '-',
            ]),
        ]);
    }

    /**
     * Helper: Tentukan status survei berdasarkan tanggal
     */
    private function getStatus($tanggalMulai, $tanggalSelesai): string
    {
        $today = now()->toDateString();

        if ($today < $tanggalMulai) {
            return 'Belum Mulai';
        } elseif ($today > $tanggalSelesai) {
            return 'Selesai';
        } else {
            return 'Berlangsung';
        }
    }
}
